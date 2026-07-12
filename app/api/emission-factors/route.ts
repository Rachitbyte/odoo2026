import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const emissionFactors = await prisma.emissionFactor.findMany({
      orderBy: { id: "desc" },
    });
    return NextResponse.json(emissionFactors);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, source, factorValue, unit } = body;

    if (!name || !source || factorValue === undefined || !unit) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const newFactor = await prisma.emissionFactor.create({
      data: {
        name,
        source,
        factorValue: Number(factorValue),
        unit,
      },
    });

    return NextResponse.json(newFactor, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
