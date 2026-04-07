import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const projects = await prisma.project.findMany({
    where: { userId: session.userId },
    orderBy: { updatedAt: "desc" },
    select: { id: true, name: true, createdAt: true, updatedAt: true },
  });

  return NextResponse.json(projects);
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const body = await req.json();
  const { name, messages = [], data = {} } = body;

  if (!name || typeof name !== "string" || name.trim() === "") {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }

  const project = await prisma.project.create({
    data: {
      name: name.trim(),
      userId: session.userId,
      messages: JSON.stringify(messages),
      data: JSON.stringify(data),
    },
  });

  return NextResponse.json(
    {
      id: project.id,
      name: project.name,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
    },
    { status: 201 }
  );
}
