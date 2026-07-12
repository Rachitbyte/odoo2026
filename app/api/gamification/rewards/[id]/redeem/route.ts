import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const rewardId = Number(id);
    if (isNaN(rewardId)) {
      return Response.json({ error: "Invalid ID" }, { status: 400 });
    }

    const reward = await prisma.reward.findUnique({
      where: { id: rewardId },
    });

    if (!reward) {
      return Response.json({ error: "Reward not found" }, { status: 404 });
    }

    if (reward.stock <= 0) {
      return Response.json({ error: "Reward is out of stock" }, { status: 400 });
    }

    const updatedReward = await prisma.reward.update({
      where: { id: rewardId },
      data: {
        stock: reward.stock - 1,
      },
    });

    return Response.json(updatedReward);
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
export const PUT = POST; // Support both POST and PUT
