import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const catId = Number(id);
    if (isNaN(catId)) {
      return Response.json({ error: "Invalid ID" }, { status: 400 });
    }

    const data = await request.json();
    const { name, type, status } = data;

    const category = await prisma.category.update({
      where: { id: catId },
      data: {
        name,
        type,
        status,
      },
    });

    return Response.json(category);
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
    const catId = Number(id);
    if (isNaN(catId)) {
      return Response.json({ error: "Invalid ID" }, { status: 400 });
    }

    const category = await prisma.category.delete({
      where: { id: catId },
    });

    return Response.json({ message: "Category deleted", category });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
