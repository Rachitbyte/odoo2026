import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
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
    return Response.json(config);
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const data = await request.json();
    const {
      autoEmissionCalc,
      requireCsrEvidence,
      autoBadgeAward,
      emailAlerts,
      envWeight,
      socialWeight,
      govWeight,
    } = data;

    let config = await prisma.eSGConfig.findFirst();

    if (!config) {
      config = await prisma.eSGConfig.create({
        data: {
          autoEmissionCalc: !!autoEmissionCalc,
          requireCsrEvidence: !!requireCsrEvidence,
          autoBadgeAward: !!autoBadgeAward,
          emailAlerts: !!emailAlerts,
          envWeight: envWeight !== undefined ? Number(envWeight) : 0.4,
          socialWeight: socialWeight !== undefined ? Number(socialWeight) : 0.3,
          govWeight: govWeight !== undefined ? Number(govWeight) : 0.3,
        },
      });
    } else {
      config = await prisma.eSGConfig.update({
        where: { id: config.id },
        data: {
          autoEmissionCalc: autoEmissionCalc !== undefined ? !!autoEmissionCalc : undefined,
          requireCsrEvidence: requireCsrEvidence !== undefined ? !!requireCsrEvidence : undefined,
          autoBadgeAward: autoBadgeAward !== undefined ? !!autoBadgeAward : undefined,
          emailAlerts: emailAlerts !== undefined ? !!emailAlerts : undefined,
          envWeight: envWeight !== undefined ? Number(envWeight) : undefined,
          socialWeight: socialWeight !== undefined ? Number(socialWeight) : undefined,
          govWeight: govWeight !== undefined ? Number(govWeight) : undefined,
        },
      });
    }

    return Response.json(config);
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
