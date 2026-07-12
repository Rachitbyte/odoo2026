import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // 1. Seed ESGConfig
    let config = await prisma.eSGConfig.findFirst();
    if (!config) {
      config = await prisma.eSGConfig.create({
        data: {
          autoEmissionCalc: false,
          requireCsrEvidence: false,
          autoBadgeAward: false,
          emailAlerts: false,
          envWeight: 0.4,
          socialWeight: 0.3,
          govWeight: 0.3,
        },
      });
    }

    // 2. Seed Departments
    const deptCount = await prisma.department.count();
    let mfgDept, logDept, corDept;
    if (deptCount === 0) {
      mfgDept = await prisma.department.create({
        data: {
          name: "Manufacturing",
          code: "MFC",
          head: "S. Nair",
          employeeCount: 134,
          status: "Active",
        },
      });

      logDept = await prisma.department.create({
        data: {
          name: "Logistics",
          code: "LOG",
          head: "R. Iyer",
          employeeCount: 58,
          status: "Active",
          parentDeptId: mfgDept.id,
        },
      });

      corDept = await prisma.department.create({
        data: {
          name: "Corporate",
          code: "COR",
          head: "A. Mehta",
          employeeCount: 41,
          status: "Active",
        },
      });
    } else {
      mfgDept = await prisma.department.findUnique({ where: { code: "MFC" } });
      logDept = await prisma.department.findUnique({ where: { code: "LOG" } });
      corDept = await prisma.department.findUnique({ where: { code: "COR" } });
    }

    // 3. Seed Categories
    const categoryCount = await prisma.category.count();
    if (categoryCount === 0) {
      const categoriesData = [
        { name: "Tree Plantation", type: "CSR_ACTIVITY" },
        { name: "Blood Donation", type: "CSR_ACTIVITY" },
        { name: "Beach Cleanup", type: "CSR_ACTIVITY" },
        { name: "ESG Workshop", type: "CSR_ACTIVITY" },
        { name: "Sustainability Sprint", type: "CHALLENGE" },
        { name: "Recycle Challenge", type: "CHALLENGE" },
        { name: "Commute Green", type: "CHALLENGE" },
      ];
      await prisma.category.createMany({
        data: categoriesData.map((c) => ({ ...c, status: "Active" })),
      });
    }

    // 4. Seed DepartmentScores
    const scoreCount = await prisma.departmentScore.count();
    if (scoreCount === 0) {
      if (mfgDept) {
        await prisma.departmentScore.create({
          data: {
            deptId: mfgDept.id,
            environmentalScore: 75,
            socialScore: 80,
            governanceScore: 70,
            totalScore: 75 * 0.4 + 80 * 0.3 + 70 * 0.3,
          },
        });
      }
      if (logDept) {
        await prisma.departmentScore.create({
          data: {
            deptId: logDept.id,
            environmentalScore: 60,
            socialScore: 88,
            governanceScore: 82,
            totalScore: 60 * 0.4 + 88 * 0.3 + 82 * 0.3,
          },
        });
      }
      if (corDept) {
        await prisma.departmentScore.create({
          data: {
            deptId: corDept.id,
            environmentalScore: 82,
            socialScore: 74,
            governanceScore: 88,
            totalScore: 82 * 0.4 + 74 * 0.3 + 88 * 0.3,
          },
        });
      }
    }

    // 5. Seed EmissionFactors
    const factorCount = await prisma.emissionFactor.count();
    if (factorCount === 0) {
      await prisma.emissionFactor.createMany({
        data: [
          { name: "Diesel Fleet", source: "Fleet", factorValue: 2.68, unit: "kg CO2/L" },
          { name: "Grid Electricity", source: "Manufacturing", factorValue: 0.82, unit: "kg CO2/kWh" },
          { name: "Air Travel", source: "Expense", factorValue: 0.255, unit: "kg CO2/km" },
        ],
      });
    }

    // 6. Seed Badges
    const badgeCount = await prisma.badge.count();
    if (badgeCount === 0) {
      await prisma.badge.createMany({
        data: [
          { name: "Green Beginner", description: "Getting started with sustainability", unlockRule: "XP >= 100", icon: "🌱" },
          { name: "Carbon Saver", description: "Actively reducing emissions footprint", unlockRule: "XP >= 500", icon: "♻️" },
          { name: "Sustainability Champion", description: "Complete multiple challenges", unlockRule: "Completed Challenges >= 3", icon: "🏆" },
          { name: "Team Player", description: "Participate in several CSR activities", unlockRule: "CSR Activities >= 2", icon: "🤝" },
        ],
      });
    }

    return Response.json({
      message: "Database seeded successfully",
      status: "success",
    });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
