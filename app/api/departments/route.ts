import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const departments = await prisma.department.findMany({
      include: {
        parentDept: true,
      },
      orderBy: {
        id: "asc",
      },
    });
    return Response.json(departments);
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { name, code, head, parentDeptId, employeeCount, status } = data;

    if (!name || !code || !head) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }

    const department = await prisma.department.create({
      data: {
        name,
        code,
        head,
        parentDeptId: parentDeptId ? Number(parentDeptId) : null,
        employeeCount: employeeCount ? Number(employeeCount) : 0,
        status: status || "Active",
      },
    });

    return Response.json(department, { status: 201 });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
