import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const partId = Number(id);
    if (isNaN(partId)) {
      return Response.json({ error: "Invalid ID" }, { status: 400 });
    }

    const participation = await prisma.challengeParticipation.findUnique({
      where: { id: partId },
      include: { challenge: true },
    });

    if (!participation) {
      return Response.json({ error: "Participation not found" }, { status: 404 });
    }

    const xpToAward = participation.challenge?.xp || 100;

    // Update participation status and XP
    const updatedParticipation = await prisma.challengeParticipation.update({
      where: { id: partId },
      data: {
        approvalStatus: "Approved",
        xpAwarded: xpToAward,
      },
    });

    // Check if auto badge award is enabled
    const config = await prisma.eSGConfig.findFirst();
    const autoBadgeAward = config?.autoBadgeAward || false;
    let unlockedBadges: any[] = [];

    if (autoBadgeAward) {
      const employeeName = participation.employeeName;

      // Sum all approved challenge XP
      const cpApproved = await prisma.challengeParticipation.findMany({
        where: { employeeName, approvalStatus: "Approved" },
      });
      const totalXP = cpApproved.reduce((sum: number, cp: any) => sum + cp.xpAwarded, 0);
      const completedChallenges = cpApproved.length;

      // Count CSR approved activities
      const csrCount = await prisma.employeeParticipation.count({
        where: { employeeName, approvalStatus: "Approved" },
      });

      // Get all badges
      const badges = await prisma.badge.findMany();
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
    }

    return Response.json({
      participation: updatedParticipation,
      unlockedBadges,
      autoBadgeAward,
    });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
export const POST = PUT; // Support both POST and PUT
