import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const policies = await prisma.eSGPolicy.findMany({
      include: { dept: true, acknowledgements: true },
      orderBy: { createdAt: "desc" },
    });
    return Response.json(policies);
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { title, description, version, effectiveDate, deptId, status } = data;

    if (!title || !version || !effectiveDate) {
      return Response.json({ error: "Missing required fields: title, version, effectiveDate" }, { status: 400 });
    }

    const policy = await prisma.eSGPolicy.create({
      data: {
        title,
        description: description || "",
        version,
        effectiveDate: new Date(effectiveDate),
        deptId: deptId ? Number(deptId) : null,
        status: status || "Active",
      },
      include: { dept: true },
    });

    return Response.json(policy, { status: 201 });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
