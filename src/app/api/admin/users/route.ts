import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await getServerSession(authOptions) as any;
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(users);
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions) as any;
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { userId, role } = await req.json();

  if (!userId || !role) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: { role },
  });

  return NextResponse.json(user);
}
