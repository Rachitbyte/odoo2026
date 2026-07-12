import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const participations = await prisma.employeeParticipation.findMany({
      include: {
        activity: { include: { category: true, dept: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return Response.json(participations);
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { employeeName, activityId, proofUrl, completionDate } = data;

    if (!employeeName || !activityId) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }

    const participation = await prisma.employeeParticipation.create({
      data: {
        employeeName,
        activityId: Number(activityId),
        proofUrl: proofUrl || null,
        completionDate: completionDate ? new Date(completionDate) : null,
      },
      include: { activity: true },
    });

    return Response.json(participation, { status: 201 });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
