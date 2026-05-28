import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

const MILES_PER_CLASS: Record<string, number> = {
  ECONOMY: 30,
  BUSINESS: 50,
  FIRST_CLASS: 70,
};

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions) as any;
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["HOST", "ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { status } = await req.json();

  const flight = await prisma.flight.update({
    where: { id: params.id },
    data: { status },
  });

  if (status === "PARKED") {
    try {
      const tickets = await prisma.ticket.findMany({
        where: { flightId: flight.id },
        include: { user: true },
      });

      console.log(`Completing flight for ${tickets.length} booked passengers`);

      for (const ticket of tickets) {
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

        console.log(`Awarded ${miles} BA Miles to ${ticket.user.username}`);
      }
    } catch (e) {
      console.error("Error completing flight:", e);
    }
  }

  return NextResponse.json(flight);
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions) as any;
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.ticket.deleteMany({ where: { flightId: params.id } });
  await prisma.flightLog.deleteMany({ where: { flightId: params.id } });
  await prisma.flight.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
