import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

const UPGRADE_COSTS: Record<string, Record<string, number>> = {
  ECONOMY: { ECONOMY: 0, BUSINESS: 60, FIRST_CLASS: 90 },
  BUSINESS: { ECONOMY: 0, BUSINESS: 0, FIRST_CLASS: 90 },
  FIRST_CLASS: { ECONOMY: 0, BUSINESS: 0, FIRST_CLASS: 0 },
};

export async function GET(req: Request) {
  const session = await getServerSession(authOptions) as any;
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const flightId = searchParams.get("flightId");

  if (flightId) {
    const tickets = await prisma.ticket.findMany({
      where: { flightId },
      include: { user: true },
    });
    return NextResponse.json(tickets);
  }

  const tickets = await prisma.ticket.findMany({
    where: { userId: session.user.id },
    include: { flight: { include: { host: true } } },
    orderBy: { bookedAt: "desc" },
  });

  return NextResponse.json(tickets);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions) as any;
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { flightId, ticketClass } = await req.json();

  if (!flightId || !ticketClass) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const existing = await prisma.ticket.findUnique({
    where: { flightId_userId: { flightId, userId: session.user.id } },
  });
  if (existing) {
    return NextResponse.json({ error: "Already booked" }, { status: 400 });
  }

  const flight = await prisma.flight.findUnique({
    where: { id: flightId },
    include: { tickets: true },
  });
  if (!flight) return NextResponse.json({ error: "Flight not found" }, { status: 404 });
  if (!["UPCOMING", "BOARDING"].includes(flight.status)) {
    return NextResponse.json({ error: "Booking closed" }, { status: 400 });
  }

  const bookedInClass = flight.tickets.filter((t) => t.class === ticketClass).length;
  const seatLimit =
    ticketClass === "ECONOMY" ? flight.economySeats :
    ticketClass === "BUSINESS" ? flight.businessSeats :
    flight.firstClassSeats;

  if (bookedInClass >= seatLimit) {
    return NextResponse.json({ error: "No seats available" }, { status: 400 });
  }

  const userTicketClass = session.user.ticketClass;
  const cost = UPGRADE_COSTS[userTicketClass]?.[ticketClass] ?? 0;

  if (cost > 0) {
    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!user || user.baMiles < cost) {
      return NextResponse.json({ error: `Not enough BA Miles. Need ${cost} miles.` }, { status: 400 });
    }
    await prisma.user.update({
      where: { id: session.user.id },
      data: { baMiles: { decrement: cost } },
    });
  }

  const ticket = await prisma.ticket.create({
    data: {
      flightId,
      userId: session.user.id,
      class: ticketClass,
    },
  });

  return NextResponse.json(ticket);
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions) as any;
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { flightId } = await req.json();

  const ticket = await prisma.ticket.findUnique({
    where: { flightId_userId: { flightId, userId: session.user.id } },
  });
  if (!ticket) return NextResponse.json({ error: "No booking found" }, { status: 404 });

  const flight = await prisma.flight.findUnique({ where: { id: flightId } });
  if (flight?.status !== "UPCOMING") {
    return NextResponse.json({ error: "Cannot cancel after boarding" }, { status: 400 });
  }

  await prisma.ticket.delete({
    where: { flightId_userId: { flightId, userId: session.user.id } },
  });

  return NextResponse.json({ success: true });
}
