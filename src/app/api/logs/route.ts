import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await getServerSession(authOptions) as any;
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const isAdmin = session.user.role === "ADMIN";

  const logs = await prisma.flightLog.findMany({
    where: isAdmin ? {} : { userId: session.user.id },
    include: {
      flight: {
        include: { host: true },
      },
      user: true,
    },
    orderBy: { loggedAt: "desc" },
  });

  return NextResponse.json(logs);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions) as any;
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { flightId } = await req.json();

  if (!flightId) {
    return NextResponse.json({ error: "Missing flightId" }, { status: 400 });
  }

  const existing = await prisma.flightLog.findFirst({
    where: { flightId, userId: session.user.id },
  });

  if (existing) {
    return NextResponse.json({ error: "Already logged" }, { status: 400 });
  }

  const log = await prisma.flightLog.create({
    data: {
      flightId,
      userId: session.user.id,
    },
  });

  return NextResponse.json(log);
}
