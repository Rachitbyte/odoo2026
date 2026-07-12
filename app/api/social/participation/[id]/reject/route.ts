import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const updated = await prisma.employeeParticipation.update({
      where: { id: Number(id) },
      data: { approvalStatus: "Rejected" },
    });

    return Response.json(updated);
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
