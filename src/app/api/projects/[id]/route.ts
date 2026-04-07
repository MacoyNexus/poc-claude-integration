import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

  return NextResponse.json({
    id: project.id,
    name: project.name,
    messages: JSON.parse(project.messages),
    data: JSON.parse(project.data),
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
  const body = await req.json();
  const { name, messages, data } = body;

  const updateData: Record<string, string> = {};
  if (name !== undefined) {
    if (typeof name !== "string" || name.trim() === "") {
      return NextResponse.json({ error: "name must be a non-empty string" }, { status: 400 });
    }
    updateData.name = name.trim();
  }
  if (messages !== undefined) updateData.messages = JSON.stringify(messages);
  if (data !== undefined) updateData.data = JSON.stringify(data);

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
  } catch {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
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
  } catch {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }
}
