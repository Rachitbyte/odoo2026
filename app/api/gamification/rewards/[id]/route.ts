import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const rewardId = Number(id);
    if (isNaN(rewardId)) {
      return Response.json({ error: "Invalid ID" }, { status: 400 });
    }

    const data = await request.json();
    const { name, description, pointsRequired, stock, status } = data;

    const reward = await prisma.reward.update({
      where: { id: rewardId },
      data: {
        name,
        description,
        pointsRequired: pointsRequired !== undefined ? Number(pointsRequired) : undefined,
        stock: stock !== undefined ? Number(stock) : undefined,
        status,
      },
    });

    return Response.json(reward);
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
    const rewardId = Number(id);
    if (isNaN(rewardId)) {
      return Response.json({ error: "Invalid ID" }, { status: 400 });
    }

    const reward = await prisma.reward.delete({
      where: { id: rewardId },
    });

    return Response.json({ message: "Reward deleted", reward });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
