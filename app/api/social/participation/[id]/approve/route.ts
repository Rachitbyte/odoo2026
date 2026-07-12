import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check ESGConfig for requireCsrEvidence
    const config = await prisma.eSGConfig.findFirst();
    const requireEvidence = config?.requireCsrEvidence ?? false;

    const participation = await prisma.employeeParticipation.findUnique({
      where: { id: Number(id) },
    });

    if (!participation) {
      return Response.json({ error: "Participation not found" }, { status: 404 });
    }

    if (requireEvidence && !participation.proofUrl) {
      return Response.json(
        { error: "Proof file required before approval" },
        { status: 422 }
      );
    }

    const updated = await prisma.employeeParticipation.update({
      where: { id: Number(id) },
      data: {
        approvalStatus: "Approved",
        pointsEarned: 50,
        completionDate: new Date(),
      },
    });

    return Response.json(updated);
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
