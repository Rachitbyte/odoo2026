import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const challenges = await prisma.challenge.findMany({
      include: {
        category: true,
      },
      orderBy: {
        id: "asc",
      },
    });
    return Response.json(challenges);
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { title, categoryId, description, xp, difficulty, evidenceRequired, deadline, status } = data;

    if (!title || !categoryId || !deadline) {
      return Response.json({ error: "Missing required fields: title, categoryId, deadline" }, { status: 400 });
    }

    const challenge = await prisma.challenge.create({
      data: {
        title,
        categoryId: Number(categoryId),
        description: description || null,
        xp: xp !== undefined ? Number(xp) : 100,
        difficulty: difficulty || "Medium",
        evidenceRequired: !!evidenceRequired,
        deadline: new Date(deadline),
        status: status || "Draft",
      },
    });

    return Response.json(challenge, { status: 201 });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
