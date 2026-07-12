import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, source, factorValue, unit } = body;

    const updatedFactor = await prisma.emissionFactor.update({
      where: { id: Number(id) },
      data: {
        ...(name && { name }),
        ...(source && { source }),
        ...(factorValue !== undefined && { factorValue: Number(factorValue) }),
        ...(unit && { unit }),
      },
    });

    return NextResponse.json(updatedFactor);
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
    await prisma.emissionFactor.delete({
      where: { id: Number(id) },
    });
    return new NextResponse(null, { status: 204 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
