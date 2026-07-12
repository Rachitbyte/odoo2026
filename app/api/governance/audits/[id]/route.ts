import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await request.json();
    const { title, deptId, auditor, date, findings, status } = data;

    const audit = await prisma.audit.update({
      where: { id: Number(id) },
      data: {
        title,
        deptId: deptId ? Number(deptId) : undefined,
        auditor,
        date: date ? new Date(date) : undefined,
        findings: findings ?? undefined,
        status,
      },
      include: { dept: true },
    });

    return Response.json(audit);
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

    // Remove compliance issues first
    await prisma.complianceIssue.deleteMany({ where: { auditId: Number(id) } });
    await prisma.audit.delete({ where: { id: Number(id) } });

    return Response.json({ success: true });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
