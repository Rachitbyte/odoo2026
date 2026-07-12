import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { items } = body;

    if (!items || !Array.isArray(items)) {
      return NextResponse.json({ error: "Missing or invalid items array" }, { status: 400 });
    }

    const results = [];
    const goalUpdates: Record<number, number> = {};

    for (const item of items) {
      const { source, refId, deptId, emissionFactorId, quantity, transactionDate } = item;

      if (!source || !deptId || !emissionFactorId || quantity === undefined) {
        continue;
      }

      const emissionFactor = await prisma.emissionFactor.findUnique({
        where: { id: Number(emissionFactorId) },
      });

      if (!emissionFactor) continue;

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
        }
      });
      results.push(transaction);

      if (!goalUpdates[Number(deptId)]) {
        goalUpdates[Number(deptId)] = 0;
      }
      goalUpdates[Number(deptId)] += co2Amount;
    }

    // Bulk update goals (sequentially for simplicity)
    for (const [deptIdStr, addedCo2] of Object.entries(goalUpdates)) {
      const deptId = Number(deptIdStr);
      const activeGoal = await prisma.environmentalGoal.findFirst({
        where: { deptId, status: "Active" },
      });
      if (activeGoal) {
        await prisma.environmentalGoal.update({
          where: { id: activeGoal.id },
          data: { currentCo2: activeGoal.currentCo2 + addedCo2 },
        });
      }
    }

    return NextResponse.json({ success: true, processed: results.length, results }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
