import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const participations = await prisma.challengeParticipation.findMany({
      include: {
        challenge: {
          include: {
            category: true,
          },
        },
      },
      orderBy: {
        id: "asc",
      },
    });
    return Response.json(participations);
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { employeeName, challengeId, progress, proofUrl } = data;

    if (!employeeName || !challengeId) {
      return Response.json({ error: "Missing required fields: employeeName, challengeId" }, { status: 400 });
    }

    const participation = await prisma.challengeParticipation.create({
      data: {
        employeeName,
        challengeId: Number(challengeId),
        progress: progress !== undefined ? Number(progress) : 0,
        proofUrl: proofUrl || null,
        approvalStatus: "Pending",
        xpAwarded: 0,
      },
    });

    return Response.json(participation, { status: 201 });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
