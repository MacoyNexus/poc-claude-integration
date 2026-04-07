import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId");

  if (!projectId) {
    return NextResponse.json({ error: "projectId query parameter is required" }, { status: 400 });
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId, userId: session.userId },
    select: { id: true, data: true },
  });

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  return NextResponse.json({ projectId: project.id, data: JSON.parse(project.data) });
}

export async function PUT(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId");

  if (!projectId) {
    return NextResponse.json({ error: "projectId query parameter is required" }, { status: 400 });
  }

  const body = await req.json();
  const { data } = body;

  if (data === undefined) {
    return NextResponse.json({ error: "data is required" }, { status: 400 });
  }

  try {
    const project = await prisma.project.update({
      where: { id: projectId, userId: session.userId },
      data: { data: JSON.stringify(data) },
      select: { id: true, data: true },
    });

    return NextResponse.json({ projectId: project.id, data: JSON.parse(project.data) });
  } catch {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }
}
