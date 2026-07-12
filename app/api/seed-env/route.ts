import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Get Departments
    const logDept = await prisma.department.findUnique({ where: { code: "LOG" } });
    const mfgDept = await prisma.department.findUnique({ where: { code: "MFC" } });
    const corDept = await prisma.department.findUnique({ where: { code: "COR" } });

    if (!logDept || !mfgDept || !corDept) {
      return NextResponse.json({ error: "Departments not found. Run main /api/seed first." }, { status: 400 });
    }

    // Get Emission Factors
    const dieselFactor = await prisma.emissionFactor.findFirst({ where: { name: "Diesel Fleet" } });
    const gridFactor = await prisma.emissionFactor.findFirst({ where: { name: "Grid Electricity" } });
    const airFactor = await prisma.emissionFactor.findFirst({ where: { name: "Air Travel" } });

    if (!dieselFactor || !gridFactor || !airFactor) {
      return NextResponse.json({ error: "Emission factors not found. Run main /api/seed first." }, { status: 400 });
    }

    // Seed Environmental Goals
    const goalCount = await prisma.environmentalGoal.count();
    if (goalCount === 0) {
      await prisma.environmentalGoal.createMany({
        data: [
          { name: "Reduce Fleet Emissions", deptId: logDept.id, targetCo2: 500, currentCo2: 380, deadline: new Date("2025-12-31"), status: "Active" },
          { name: "Cut Packaging Waste", deptId: mfgDept.id, targetCo2: 120, currentCo2: 86, deadline: new Date("2026-06-30"), status: "Active" },
          { name: "Office Energy Cut", deptId: corDept.id, targetCo2: 80, currentCo2: 80, deadline: new Date("2026-06-30"), status: "Completed" },
        ]
      });
    }

    // Seed Carbon Transactions
    const txCount = await prisma.carbonTransaction.count();
    if (txCount === 0) {
      await prisma.carbonTransaction.createMany({
        data: [
          { source: "Fleet", refId: "REF-001", deptId: logDept.id, emissionFactorId: dieselFactor.id, quantity: 200, co2Amount: 200 * dieselFactor.factorValue, transactionDate: new Date("2025-11-01") },
          { source: "Manufacturing", refId: "REF-002", deptId: mfgDept.id, emissionFactorId: gridFactor.id, quantity: 150, co2Amount: 150 * gridFactor.factorValue, transactionDate: new Date("2025-11-15") },
          { source: "Expense", refId: "REF-003", deptId: corDept.id, emissionFactorId: airFactor.id, quantity: 300, co2Amount: 300 * airFactor.factorValue, transactionDate: new Date("2025-12-01") },
          { source: "Fleet", refId: "REF-004", deptId: logDept.id, emissionFactorId: dieselFactor.id, quantity: 180, co2Amount: 180 * dieselFactor.factorValue, transactionDate: new Date("2025-12-10") },
          { source: "Manufacturing", refId: "REF-005", deptId: mfgDept.id, emissionFactorId: gridFactor.id, quantity: 220, co2Amount: 220 * gridFactor.factorValue, transactionDate: new Date("2026-01-05") },
        ]
      });
    }

    // Seed Product ESG Profiles
    const prodCount = await prisma.productESGProfile.count();
    if (prodCount === 0) {
      await prisma.productESGProfile.createMany({
        data: [
          { productName: "Office Paper", productCode: "OFC-001", deptId: corDept.id, carbonFootprint: 2.4, recyclable: true, notes: "" },
          { productName: "Steel Frame", productCode: "STL-002", deptId: mfgDept.id, carbonFootprint: 18.6, recyclable: false, notes: "" },
          { productName: "Diesel Can", productCode: "DSL-003", deptId: logDept.id, carbonFootprint: 9.1, recyclable: false, notes: "" },
        ]
      });
    }

    return NextResponse.json({ message: "Environmental module seeded successfully", status: "success" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
