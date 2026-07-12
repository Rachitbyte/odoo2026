import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const transactions = await prisma.carbonTransaction.findMany({
      include: {
        dept: true,
        emissionFactor: true,
      },
      orderBy: { transactionDate: "desc" },
    });
    return NextResponse.json(transactions);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { source, refId, deptId, emissionFactorId, quantity, transactionDate } = body;

    if (!source || !deptId || !emissionFactorId || quantity === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const emissionFactor = await prisma.emissionFactor.findUnique({
      where: { id: Number(emissionFactorId) },
    });

    if (!emissionFactor) {
      return NextResponse.json({ error: "Emission factor not found" }, { status: 404 });
    }

    const co2Amount = emissionFactor.factorValue * Number(quantity);

    const transaction = await prisma.carbonTransaction.create({
      data: {
        source,
        refId,
        deptId: Number(deptId),
        emissionFactorId: Number(emissionFactorId),
        quantity: Number(quantity),
        co2Amount,
        transactionDate: transactionDate ? new Date(transactionDate) : new Date(),
      },
      include: {
        dept: true,
        emissionFactor: true,
      }
    });

    // Optionally update currentCo2 of an active goal for this department
    const activeGoal = await prisma.environmentalGoal.findFirst({
      where: { deptId: Number(deptId), status: "Active" },
    });

    if (activeGoal) {
      await prisma.environmentalGoal.update({
        where: { id: activeGoal.id },
        data: { currentCo2: activeGoal.currentCo2 + co2Amount },
      });
    }

    return NextResponse.json(transaction, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
