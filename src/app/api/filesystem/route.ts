import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/filesystem?projectId=xxx — get the virtual filesystem for a project
export async function GET(req: NextRequest) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const projectId = req.nextUrl.searchParams.get("projectId");

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

  return NextResponse.json({ data: JSON.parse(project.data) });
}

// PUT /api/filesystem?projectId=xxx — replace the virtual filesystem for a project
export async function PUT(req: NextRequest) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const projectId = req.nextUrl.searchParams.get("projectId");

  if (!projectId) {
    return NextResponse.json({ error: "projectId query parameter is required" }, { status: 400 });
  }

  const body = await req.json();
  const { data } = body;

  if (!data || typeof data !== "object") {
    return NextResponse.json({ error: "data field is required and must be an object" }, { status: 400 });
  }

  const existing = await prisma.project.findUnique({
    where: { id: projectId, userId: session.userId },
  });

  if (!existing) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  await prisma.project.update({
    where: { id: projectId, userId: session.userId },
    data: { data: JSON.stringify(data) },
  });

  return NextResponse.json({ success: true });
}
