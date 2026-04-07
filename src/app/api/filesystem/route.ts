import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const MAX_DATA_SIZE = 1_000_000; // 1 MB

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

  let parsedData: unknown;
  try {
    parsedData = JSON.parse(project.data);
  } catch {
    console.error("Corrupt data field for project", projectId);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }

  return NextResponse.json({ projectId: project.id, data: parsedData });
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

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { data } = body as Record<string, unknown>;

  if (data === undefined) {
    return NextResponse.json({ error: "data is required" }, { status: 400 });
  }

  const serialized = JSON.stringify(data);
  if (serialized.length > MAX_DATA_SIZE) {
    return NextResponse.json({ error: "data payload too large" }, { status: 413 });
  }

  try {
    const project = await prisma.project.update({
      where: { id: projectId, userId: session.userId },
      data: { data: serialized },
      select: { id: true },
    });

    return NextResponse.json({ projectId: project.id, data });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
