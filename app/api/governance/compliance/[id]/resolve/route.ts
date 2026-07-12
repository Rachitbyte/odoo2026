import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const issue = await prisma.complianceIssue.update({
      where: { id: Number(id) },
      data: { status: "Resolved" },
    });

    return Response.json(issue);
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
