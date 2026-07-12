import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, deptId, targetCo2, currentCo2, deadline, status } = body;

    const updatedGoal = await prisma.environmentalGoal.update({
      where: { id: Number(id) },
      data: {
        ...(name && { name }),
        ...(deptId && { deptId: Number(deptId) }),
        ...(targetCo2 !== undefined && { targetCo2: Number(targetCo2) }),
        ...(currentCo2 !== undefined && { currentCo2: Number(currentCo2) }),
        ...(deadline && { deadline: new Date(deadline) }),
        ...(status && { status }),
      },
      include: {
        dept: true,
      }
    });

    return NextResponse.json(updatedGoal);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.environmentalGoal.delete({
      where: { id: Number(id) },
    });
    return new NextResponse(null, { status: 204 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
