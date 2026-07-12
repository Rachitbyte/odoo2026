import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const activities = await prisma.cSRActivity.findMany({
      include: {
        category: true,
        dept: true,
        participations: true,
      },
      orderBy: { date: "desc" },
    });
    return Response.json(activities);
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { title, categoryId, description, deptId, date, open } = data;

    if (!title || !categoryId || !deptId || !date) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }

    const activity = await prisma.cSRActivity.create({
      data: {
        title,
        categoryId: Number(categoryId),
        description: description || null,
        deptId: Number(deptId),
        date: new Date(date),
        open: open !== undefined ? Boolean(open) : true,
      },
      include: { category: true, dept: true },
    });

    return Response.json(activity, { status: 201 });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
