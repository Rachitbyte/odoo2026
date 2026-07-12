import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const challengeId = Number(id);
    if (isNaN(challengeId)) {
      return Response.json({ error: "Invalid ID" }, { status: 400 });
    }

    const data = await request.json();
    const { title, categoryId, description, xp, difficulty, evidenceRequired, deadline, status } = data;

    const challenge = await prisma.challenge.update({
      where: { id: challengeId },
      data: {
        title,
        categoryId: categoryId !== undefined ? Number(categoryId) : undefined,
        description,
        xp: xp !== undefined ? Number(xp) : undefined,
        difficulty,
        evidenceRequired: evidenceRequired !== undefined ? !!evidenceRequired : undefined,
        deadline: deadline ? new Date(deadline) : undefined,
        status,
      },
    });

    return Response.json(challenge);
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const challengeId = Number(id);
    if (isNaN(challengeId)) {
      return Response.json({ error: "Invalid ID" }, { status: 400 });
    }

    // Delete related participations first
    await prisma.challengeParticipation.deleteMany({
      where: { challengeId },
    });

    const challenge = await prisma.challenge.delete({
      where: { id: challengeId },
    });

    return Response.json({ message: "Challenge deleted", challenge });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
