import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await request.json();
    const { title, categoryId, description, deptId, date, open } = data;

    const activity = await prisma.cSRActivity.update({
      where: { id: Number(id) },
      data: {
        title,
        categoryId: categoryId ? Number(categoryId) : undefined,
        description,
        deptId: deptId ? Number(deptId) : undefined,
        date: date ? new Date(date) : undefined,
        open: open !== undefined ? Boolean(open) : undefined,
      },
      include: { category: true, dept: true },
    });

    return Response.json(activity);
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Delete participations first to avoid FK constraint
    await prisma.employeeParticipation.deleteMany({
      where: { activityId: Number(id) },
    });

    await prisma.cSRActivity.delete({
      where: { id: Number(id) },
    });

    return Response.json({ success: true });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
