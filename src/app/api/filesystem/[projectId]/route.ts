import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const MAX_PAYLOAD_BYTES = 10 * 1024 * 1024; // 10 MB

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

  try {
    return NextResponse.json({ projectId: project.id, data: JSON.parse(project.data) });
  } catch {
    return NextResponse.json({ error: "Failed to parse stored filesystem data" }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
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

  const { data } = body;

  if (data === undefined) {
    return NextResponse.json({ error: "data is required" }, { status: 400 });
  }

  const { projectId } = await params;

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

  try {
    return NextResponse.json({ projectId: updated.id, data: JSON.parse(updated.data) });
  } catch {
    return NextResponse.json({ error: "Failed to parse stored filesystem data" }, { status: 500 });
  }
}
