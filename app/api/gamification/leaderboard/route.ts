import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const view = searchParams.get("view") || "employee";

    if (view === "department") {
      const config = (await prisma.eSGConfig.findFirst()) || {
        envWeight: 0.4,
        socialWeight: 0.3,
        govWeight: 0.3,
      };

      const deptScores = await prisma.departmentScore.findMany({
        include: {
          dept: true,
        },
      });

      const formatted = deptScores.map((ds: any) => {
        const total =
          ds.environmentalScore * config.envWeight +
          ds.socialScore * config.socialWeight +
          ds.governanceScore * config.govWeight;
        return {
          id: ds.id,
          deptName: ds.dept?.name || "Unknown Department",
          environmentalScore: ds.environmentalScore,
          socialScore: ds.socialScore,
          governanceScore: ds.governanceScore,
          totalScore: parseFloat(total.toFixed(1)),
        };
      });

      formatted.sort((a: any, b: any) => b.totalScore - a.totalScore);
      return Response.json(formatted);
    } else {
      // Employee View
      const challengeParts = await prisma.challengeParticipation.findMany({
        where: { approvalStatus: "Approved" },
      });

      const csrParts = await prisma.employeeParticipation.findMany({
        where: { approvalStatus: "Approved" },
      });

      // Aggregate in memory
      const employeeMap: Record<string, { employeeName: string; totalXP: number; completedChallenges: number; csrPoints: number }> = {};

      challengeParts.forEach((cp: any) => {
        const name = cp.employeeName;
        if (!employeeMap[name]) {
          employeeMap[name] = { employeeName: name, totalXP: 0, completedChallenges: 0, csrPoints: 0 };
        }
        employeeMap[name].totalXP += cp.xpAwarded;
        employeeMap[name].completedChallenges += 1;
      });

      csrParts.forEach((ep: any) => {
        const name = ep.employeeName;
        if (!employeeMap[name]) {
          employeeMap[name] = { employeeName: name, totalXP: 0, completedChallenges: 0, csrPoints: 0 };
        }
        employeeMap[name].csrPoints += ep.pointsEarned;
      });

      const list = Object.values(employeeMap);
      list.sort((a: any, b: any) => b.totalXP - a.totalXP);

      return Response.json(list);
    }
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
