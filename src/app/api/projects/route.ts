import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/projects — list all projects for the authenticated user
export async function GET() {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const projects = await prisma.project.findMany({
    where: { userId: session.userId },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      name: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return NextResponse.json(projects);
}

// POST /api/projects — create a new project
export async function POST(req: Request) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const { name, messages = [], data = {} } = await req.json();

  if (!name || typeof name !== "string") {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }

  const project = await prisma.project.create({
    data: {
      name,
      userId: session.userId,
      messages: JSON.stringify(messages),
      data: JSON.stringify(data),
    },
    select: {
      id: true,
      name: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return NextResponse.json(project, { status: 201 });
}
