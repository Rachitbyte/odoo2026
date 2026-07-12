import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const scores = await prisma.departmentScore.findMany({
      include: { dept: true },
    });

    if (scores.length === 0) {
      return Response.json([
        { deptName: "Corporate", envScore: 82, socialScore: 74, govScore: 88, totalScore: 81.4, fill: "#3B82F6" },
        { deptName: "Manufacturing", envScore: 75, socialScore: 80, govScore: 70, totalScore: 75.5, fill: "#22C55E" },
        { deptName: "Logistics", envScore: 60, socialScore: 88, govScore: 82, totalScore: 75.0, fill: "#F97316" },
      ]);
    }

    const config = (await prisma.eSGConfig.findFirst()) || {
      envWeight: 0.4,
      socialWeight: 0.3,
      govWeight: 0.3,
    };
    const envWeight = config.envWeight;
    const socialWeight = config.socialWeight;
    const govWeight = config.govWeight;

    const colors = ["#22C55E", "#F97316", "#3B82F6", "#A855F7", "#06B6D4"];

    const formatted = scores.map((s: any, index: number) => {
      const totalScore =
        s.environmentalScore * envWeight +
        s.socialScore * socialWeight +
        s.governanceScore * govWeight;
      return {
        deptName: s.dept?.name || "Unknown Dept",
        envScore: s.environmentalScore,
        socialScore: s.socialScore,
        govScore: s.governanceScore,
        totalScore: parseFloat(totalScore.toFixed(1)),
        fill: colors[index % colors.length],
      };
    });

    formatted.sort((a: any, b: any) => b.totalScore - a.totalScore);

    return Response.json(formatted);
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
