import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const deptId = Number(id);
    if (isNaN(deptId)) {
      return Response.json({ error: "Invalid ID" }, { status: 400 });
    }

    const data = await request.json();
    const { name, code, head, parentDeptId, employeeCount, status } = data;

    const department = await prisma.department.update({
      where: { id: deptId },
      data: {
        name,
        code,
        head,
        parentDeptId: parentDeptId !== undefined ? (parentDeptId ? Number(parentDeptId) : null) : undefined,
        employeeCount: employeeCount !== undefined ? Number(employeeCount) : undefined,
        status,
      },
    });

    return Response.json(department);
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const deptId = Number(id);
    if (isNaN(deptId)) {
      return Response.json({ error: "Invalid ID" }, { status: 400 });
    }

    // Set children's parentDeptId to null or handle it
    await prisma.department.updateMany({
      where: { parentDeptId: deptId },
      data: { parentDeptId: null },
    });

    const department = await prisma.department.delete({
      where: { id: deptId },
    });

    return Response.json({ message: "Department deleted", department });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
