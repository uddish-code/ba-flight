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
      flight: true,
      user: true,
    },
    orderBy: { loggedAt: "desc" },
  });

  return NextResponse.json(logs);
}
