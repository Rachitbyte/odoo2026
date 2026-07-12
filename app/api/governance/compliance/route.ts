import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const issues = await prisma.complianceIssue.findMany({
      include: {
        audit: { include: { dept: true } },
      },
      orderBy: { dueDate: "asc" },
    });
    return Response.json(issues);
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { auditId, severity, description, owner, dueDate, status } = data;

    if (!auditId || !severity || !description || !owner || !dueDate) {
      return Response.json({ error: "All fields are required" }, { status: 400 });
    }

    const issue = await prisma.complianceIssue.create({
      data: {
        auditId: Number(auditId),
        severity,
        description,
        owner,
        dueDate: new Date(dueDate),
        status: status || "Open",
      },
      include: { audit: { include: { dept: true } } },
    });

    return Response.json(issue, { status: 201 });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
