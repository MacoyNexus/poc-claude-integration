import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const MAX_PAYLOAD_BYTES = 10 * 1024 * 1024; // 10 MB

export async function GET(
  _request: Request,
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

  try {
    return NextResponse.json({
      id: project.id,
      name: project.name,
      messages: JSON.parse(project.messages),
      data: JSON.parse(project.data),
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
    });
  } catch {
    return NextResponse.json({ error: "Failed to parse stored project data" }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > MAX_PAYLOAD_BYTES) {
    return NextResponse.json({ error: "Payload too large" }, { status: 413 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { name, messages, data } = body;

  if (name === undefined && messages === undefined && data === undefined) {
    return NextResponse.json(
      { error: "At least one of name, messages, or data is required" },
      { status: 400 }
    );
  }

  const { id } = await params;

  const existing = await prisma.project.findUnique({
    where: { id, userId: session.userId },
  });

  if (!existing) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const updated = await prisma.project.update({
    where: { id, userId: session.userId },
    data: {
      ...(name !== undefined && { name: (name as string).trim() }),
      ...(messages !== undefined && { messages: JSON.stringify(messages) }),
      ...(data !== undefined && { data: JSON.stringify(data) }),
    },
  });

  try {
    return NextResponse.json({
      id: updated.id,
      name: updated.name,
      messages: JSON.parse(updated.messages),
      data: JSON.parse(updated.data),
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    });
  } catch {
    return NextResponse.json({ error: "Failed to parse stored project data" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const { id } = await params;

  const existing = await prisma.project.findUnique({
    where: { id, userId: session.userId },
  });

  if (!existing) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  await prisma.project.delete({
    where: { id, userId: session.userId },
  });

  return new NextResponse(null, { status: 204 });
}
