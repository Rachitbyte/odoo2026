import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const badgeId = Number(id);
    if (isNaN(badgeId)) {
      return Response.json({ error: "Invalid ID" }, { status: 400 });
    }

    const data = await request.json();
    const { name, description, unlockRule, icon } = data;

    const badge = await prisma.badge.update({
      where: { id: badgeId },
      data: {
        name,
        description,
        unlockRule,
        icon,
      },
    });

    return Response.json(badge);
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
    const badgeId = Number(id);
    if (isNaN(badgeId)) {
      return Response.json({ error: "Invalid ID" }, { status: 400 });
    }

    const badge = await prisma.badge.delete({
      where: { id: badgeId },
    });

    return Response.json({ message: "Badge deleted", badge });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
