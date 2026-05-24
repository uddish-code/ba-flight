import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const flights = await prisma.flight.findMany({
    include: { host: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(flights);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions) as any;
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["HOST", "ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { flightNumber, departure, arrival, departureTime } = await req.json();

  if (!flightNumber || !departure || !arrival || !departureTime) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const flight = await prisma.flight.create({
    data: {
      flightNumber,
      route: `${departure} → ${arrival}`,
      departure,
      arrival,
      departureTime: new Date(departureTime),
      hostId: session.user.id,
      status: "UPCOMING",
    },
  });

  return NextResponse.json(flight);
}
