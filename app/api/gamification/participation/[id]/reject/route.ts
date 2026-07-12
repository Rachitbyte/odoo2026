import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const partId = Number(id);
    if (isNaN(partId)) {
      return Response.json({ error: "Invalid ID" }, { status: 400 });
    }

    const updatedParticipation = await prisma.challengeParticipation.update({
      where: { id: partId },
      data: {
        approvalStatus: "Rejected",
        xpAwarded: 0,
      },
    });

    return Response.json({
      participation: updatedParticipation,
    });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
export const POST = PUT; // Support both POST and PUT
