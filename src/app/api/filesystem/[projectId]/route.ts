import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const { projectId } = await params;

  const project = await prisma.project.findUnique({
    where: { id: projectId, userId: session.userId },
    select: { id: true, data: true },
  });

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  return NextResponse.json({ projectId: project.id, data: JSON.parse(project.data) });
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const { projectId } = await params;
  const body = await request.json();
  const { data } = body;

  if (data === undefined) {
    return NextResponse.json({ error: "data is required" }, { status: 400 });
  }

  const existing = await prisma.project.findUnique({
    where: { id: projectId, userId: session.userId },
  });

  if (!existing) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const updated = await prisma.project.update({
    where: { id: projectId, userId: session.userId },
    data: { data: JSON.stringify(data) },
    select: { id: true, data: true },
  });

  return NextResponse.json({ projectId: updated.id, data: JSON.parse(updated.data) });
}
