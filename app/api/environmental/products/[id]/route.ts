import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { productName, productCode, deptId, carbonFootprint, recyclable, notes } = body;

    const updatedProduct = await prisma.productESGProfile.update({
      where: { id: Number(id) },
      data: {
        ...(productName && { productName }),
        ...(productCode && { productCode }),
        ...(deptId && { deptId: Number(deptId) }),
        ...(carbonFootprint !== undefined && { carbonFootprint: Number(carbonFootprint) }),
        ...(recyclable !== undefined && { recyclable: Boolean(recyclable) }),
        ...(notes !== undefined && { notes }),
      },
      include: {
        dept: true,
      }
    });

    return NextResponse.json(updatedProduct);
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
    await prisma.productESGProfile.delete({
      where: { id: Number(id) },
    });
    return new NextResponse(null, { status: 204 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
