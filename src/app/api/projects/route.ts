import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const MAX_DATA_SIZE = 1_000_000; // 1 MB

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

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { name, messages = [], data = {} } = body as Record<string, unknown>;

  if (!name || typeof name !== "string" || name.trim() === "") {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }

  const serializedData = JSON.stringify(data);
  if (serializedData.length > MAX_DATA_SIZE) {
    return NextResponse.json({ error: "data payload too large" }, { status: 413 });
  }

  const project = await prisma.project.create({
    data: {
      name: name.trim(),
      userId: session.userId,
      messages: JSON.stringify(messages),
      data: serializedData,
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
