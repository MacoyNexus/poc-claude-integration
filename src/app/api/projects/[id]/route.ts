import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const MAX_DATA_SIZE = 1_000_000; // 1 MB

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const { id } = await params;
  const project = await prisma.project.findUnique({
    where: { id, userId: session.userId },
  });

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  let messages: unknown;
  let data: unknown;
  try {
    messages = JSON.parse(project.messages);
    data = JSON.parse(project.data);
  } catch {
    console.error("Corrupt messages or data field for project", id);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }

  return NextResponse.json({
    id: project.id,
    name: project.name,
    messages,
    data,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
  });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const { id } = await params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { name, messages, data } = body as Record<string, unknown>;

  const updateData: Record<string, string> = {};
  if (name !== undefined) {
    if (typeof name !== "string" || name.trim() === "") {
      return NextResponse.json({ error: "name must be a non-empty string" }, { status: 400 });
    }
    updateData.name = name.trim();
  }
  if (messages !== undefined) updateData.messages = JSON.stringify(messages);
  if (data !== undefined) {
    const serializedData = JSON.stringify(data);
    if (serializedData.length > MAX_DATA_SIZE) {
      return NextResponse.json({ error: "data payload too large" }, { status: 413 });
    }
    updateData.data = serializedData;
  }

  try {
    const project = await prisma.project.update({
      where: { id, userId: session.userId },
      data: updateData,
    });

    return NextResponse.json({
      id: project.id,
      name: project.name,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const { id } = await params;

  try {
    await prisma.project.delete({
      where: { id, userId: session.userId },
    });
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
