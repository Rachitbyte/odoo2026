import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const goals = await prisma.environmentalGoal.findMany({
      include: {
        dept: true,
      },
      orderBy: { id: "desc" },
    });
    return NextResponse.json(goals);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, deptId, targetCo2, deadline, status } = body;

    if (!name || !deptId || targetCo2 === undefined || !deadline) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const newGoal = await prisma.environmentalGoal.create({
      data: {
        name,
        deptId: Number(deptId),
        targetCo2: Number(targetCo2),
        deadline: new Date(deadline),
        status: status || "Active",
      },
      include: {
        dept: true,
      }
    });

    return NextResponse.json(newGoal, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
