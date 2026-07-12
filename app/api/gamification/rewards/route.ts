import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const rewards = await prisma.reward.findMany({
      orderBy: {
        id: "asc",
      },
    });
    return Response.json(rewards);
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { name, description, pointsRequired, stock, status } = data;

    if (!name || pointsRequired === undefined) {
      return Response.json({ error: "Missing required fields: name, pointsRequired" }, { status: 400 });
    }

    const reward = await prisma.reward.create({
      data: {
        name,
        description: description || "",
        pointsRequired: Number(pointsRequired),
        stock: stock !== undefined ? Number(stock) : 0,
        status: status || "Active",
      },
    });

    return Response.json(reward, { status: 201 });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
