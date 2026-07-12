import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { employeeName } = data;

    if (!employeeName) {
      return Response.json({ error: "Missing required field: employeeName" }, { status: 400 });
    }

    // 1. Sum all xpAwarded
    const cpApproved = await prisma.challengeParticipation.findMany({
      where: { employeeName, approvalStatus: "Approved" },
    });
    const totalXP = cpApproved.reduce((sum: number, cp: any) => sum + cp.xpAwarded, 0);
    const completedChallenges = cpApproved.length;

    // 2. Count CSR participations
    const csrCount = await prisma.employeeParticipation.count({
      where: { employeeName, approvalStatus: "Approved" },
    });

    // 3. Fetch all Badges
    const badges = await prisma.badge.findMany();
    const unlockedBadges: any[] = [];

    // 4. Parse unlock rules
    badges.forEach((badge: any) => {
      const rule = badge.unlockRule;
      let qualified = false;

      if (rule.includes("XP >= ")) {
        const val = Number(rule.split("XP >= ")[1]);
        if (!isNaN(val) && totalXP >= val) qualified = true;
      } else if (rule.includes("Completed Challenges >= ")) {
        const val = Number(rule.split("Completed Challenges >= ")[1]);
        if (!isNaN(val) && completedChallenges >= val) qualified = true;
      } else if (rule.includes("CSR Activities >= ")) {
        const val = Number(rule.split("CSR Activities >= ")[1]);
        if (!isNaN(val) && csrCount >= val) qualified = true;
      }

      if (qualified) {
        unlockedBadges.push({
          name: badge.name,
          icon: badge.icon,
        });
      }
    });

    return Response.json({ unlockedBadges });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
