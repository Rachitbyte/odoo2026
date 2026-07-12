import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await request.json();
    const { title, description, version, effectiveDate, deptId, status } = data;

    const policy = await prisma.eSGPolicy.update({
      where: { id: Number(id) },
      data: {
        title,
        description,
        version,
        effectiveDate: effectiveDate ? new Date(effectiveDate) : undefined,
        deptId: deptId ? Number(deptId) : null,
        status,
      },
      include: { dept: true },
    });

    return Response.json(policy);
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Remove acknowledgements first
    await prisma.policyAcknowledgement.deleteMany({ where: { policyId: Number(id) } });
    await prisma.eSGPolicy.delete({ where: { id: Number(id) } });

    return Response.json({ success: true });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
