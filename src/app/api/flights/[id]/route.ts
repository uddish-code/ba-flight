import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

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

  if (status === "LANDED") {
    const users = await prisma.user.findMany();
    for (const user of users) {
      const existing = await prisma.flightLog.findFirst({
        where: { flightId: flight.id, userId: user.id },
      });
      if (!existing) {
        await prisma.flightLog.create({
          data: {
            flightId: flight.id,
            userId: user.id,
          },
        });
      }
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

  await prisma.flight.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
