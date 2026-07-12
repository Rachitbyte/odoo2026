import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const audits = await prisma.audit.findMany({
      include: { dept: true, complianceIssues: true },
      orderBy: { date: "desc" },
    });
    return Response.json(audits);
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { title, deptId, auditor, date, findings, status } = data;

    if (!title || !deptId || !auditor || !date) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }

    const audit = await prisma.audit.create({
      data: {
        title,
        deptId: Number(deptId),
        auditor,
        date: new Date(date),
        findings: findings || null,
        status: status || "Planned",
      },
      include: { dept: true },
    });

    return Response.json(audit, { status: 201 });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
