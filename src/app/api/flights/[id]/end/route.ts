import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

const MILES_PER_CLASS: Record<string, number> = {
  ECONOMY: 30,
  BUSINESS: 50,
  FIRST_CLASS: 70,
};

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions) as any;
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["HOST", "ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { attendedUserIds } = await req.json();

  if (!Array.isArray(attendedUserIds)) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }

  const flight = await prisma.flight.findUnique({
    where: { id: params.id },
    include: { tickets: true },
  });

  if (!flight) {
    return NextResponse.json({ error: "Flight not found" }, { status: 404 });
  }

  if (flight.status !== "PARKED") {
    return NextResponse.json({ error: "Flight must be parked first" }, { status: 400 });
  }

  await prisma.flight.update({
    where: { id: params.id },
    data: { status: "ENDED" as any },
  });

  const attendedTickets = flight.tickets.filter((t) =>
    attendedUserIds.includes(t.userId)
  );

  for (const ticket of attendedTickets) {
    const miles = MILES_PER_CLASS[ticket.class] ?? 30;

    const existing = await prisma.flightLog.findFirst({
      where: { flightId: flight.id, userId: ticket.userId },
    });

    if (!existing) {
      await prisma.flightLog.create({
        data: {
          flightId: flight.id,
          userId: ticket.userId,
        },
      });
    }

    await prisma.user.update({
      where: { id: ticket.userId },
      data: { baMiles: { increment: miles } },
    });
  }

  console.log(`Flight ${flight.flightNumber} ended. Logged ${attendedTickets.length} passengers.`);

  return NextResponse.json({ success: true, logged: attendedTickets.length });
}
