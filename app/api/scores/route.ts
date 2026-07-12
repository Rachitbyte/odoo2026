import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const departmentScores = await prisma.departmentScore.findMany({
      include: {
        dept: true,
      },
    });

    let config = await prisma.eSGConfig.findFirst();
    if (!config) {
      config = {
        id: 1,
        autoEmissionCalc: false,
        requireCsrEvidence: false,
        autoBadgeAward: false,
        emailAlerts: false,
        envWeight: 0.4,
        socialWeight: 0.3,
        govWeight: 0.3,
      };
    }

    const envWeight = config.envWeight;
    const socialWeight = config.socialWeight;
    const govWeight = config.govWeight;

    if (departmentScores.length === 0) {
      return Response.json({
        overallScore: 0,
        envScore: 0,
        socialScore: 0,
        govScore: 0,
        departmentScores: [],
      });
    }

    let sumEnv = 0;
    let sumSocial = 0;
    let sumGov = 0;
    let sumTotal = 0;

    const mappedDeptScores = departmentScores.map((ds: any) => {
      const totalScore =
        ds.environmentalScore * envWeight +
        ds.socialScore * socialWeight +
        ds.governanceScore * govWeight;

      sumEnv += ds.environmentalScore;
      sumSocial += ds.socialScore;
      sumGov += ds.governanceScore;
      sumTotal += totalScore;

      return {
        id: ds.id,
        deptName: ds.dept?.name || "Unknown Dept",
        deptCode: ds.dept?.code || "N/A",
        environmentalScore: ds.environmentalScore,
        socialScore: ds.socialScore,
        governanceScore: ds.governanceScore,
        totalScore: parseFloat(totalScore.toFixed(1)),
      };
    });

    const count = departmentScores.length;
    const overallScore = parseFloat((sumTotal / count).toFixed(1));
    const envScore = parseFloat((sumEnv / count).toFixed(1));
    const socialScore = parseFloat((sumSocial / count).toFixed(1));
    const govScore = parseFloat((sumGov / count).toFixed(1));

    return Response.json({
      overallScore,
      envScore,
      socialScore,
      govScore,
      departmentScores: mappedDeptScores,
    });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
