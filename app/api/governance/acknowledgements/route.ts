import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const acks = await prisma.policyAcknowledgement.findMany({
      include: { policy: true },
      orderBy: { acknowledgedAt: "desc" },
    });
    return Response.json(acks);
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { policyId, employeeName } = data;

    if (!policyId || !employeeName) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }

    const ack = await prisma.policyAcknowledgement.create({
      data: {
        policyId: Number(policyId),
        employeeName,
        acknowledgedAt: new Date(),
      },
      include: { policy: true },
    });

    return Response.json(ack, { status: 201 });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
