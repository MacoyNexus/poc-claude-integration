import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

  return NextResponse.json({
    id: project.id,
    name: project.name,
    messages: JSON.parse(project.messages),
    data: JSON.parse(project.data),
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
  });
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const { name, messages, data } = body;

  const existing = await prisma.project.findUnique({
    where: { id, userId: session.userId },
  });

  if (!existing) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const updated = await prisma.project.update({
    where: { id, userId: session.userId },
    data: {
      ...(name !== undefined && { name: name.trim() }),
      ...(messages !== undefined && { messages: JSON.stringify(messages) }),
      ...(data !== undefined && { data: JSON.stringify(data) }),
    },
  });

  return NextResponse.json({
    id: updated.id,
    name: updated.name,
    messages: JSON.parse(updated.messages),
    data: JSON.parse(updated.data),
    createdAt: updated.createdAt,
    updatedAt: updated.updatedAt,
  });
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
