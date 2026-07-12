import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const badges = await prisma.badge.findMany({
      orderBy: {
        id: "asc",
      },
    });
    return Response.json(badges);
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { name, description, unlockRule, icon } = data;

    if (!name || !unlockRule) {
      return Response.json({ error: "Missing required fields: name, unlockRule" }, { status: 400 });
    }

    const badge = await prisma.badge.create({
      data: {
        name,
        description: description || "",
        unlockRule,
        icon: icon || "🏆",
      },
    });

    return Response.json(badge, { status: 201 });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
