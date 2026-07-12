import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const startDateStr = searchParams.get("startDate");
    const endDateStr = searchParams.get("endDate");
    const deptIdStr = searchParams.get("deptId");
    const module = searchParams.get("module");
    const employeeName = searchParams.get("employeeName");
    const categoryIdStr = searchParams.get("categoryId");

    const startDate = startDateStr ? new Date(startDateStr) : null;
    const endDate = endDateStr ? new Date(endDateStr) : null;
    const deptId = deptIdStr ? Number(deptIdStr) : null;
    const categoryId = categoryIdStr ? Number(categoryIdStr) : null;

    const results: any[] = [];

    // --- 1. ENVIRONMENTAL ---
    if (!module || module === "Environmental") {
      // Carbon Transactions
      const txns = await prisma.carbonTransaction.findMany({
        where: {
          deptId: deptId || undefined,
          transactionDate: {
            gte: startDate || undefined,
            lte: endDate || undefined,
          },
        },
        include: { dept: true, emissionFactor: true },
      });

      txns.forEach((t: any) => {
        results.push({
          id: `env-txn-${t.id}`,
          date: t.transactionDate || t.createdAt,
          module: "Environmental",
          departmentName: t.dept?.name || "N/A",
          title: `Emissions logged: ${t.source}`,
          details: `${t.quantity} unit(s) via ${t.emissionFactor?.name} (${t.emissionFactor?.factorValue} ${t.emissionFactor?.unit})`,
          status: `${t.co2Amount} kg CO2`,
        });
      });

      // Goals
      const goals = await prisma.environmentalGoal.findMany({
        where: {
          deptId: deptId || undefined,
          createdAt: {
            gte: startDate || undefined,
            lte: endDate || undefined,
          },
        },
        include: { dept: true },
      });

      goals.forEach((g: any) => {
        results.push({
          id: `env-goal-${g.id}`,
          date: g.createdAt,
          module: "Environmental",
          departmentName: g.dept?.name || "N/A",
          title: `Goal: ${g.name}`,
          details: `Target: ${g.targetCo2} kg CO2 | Current: ${g.currentCo2} kg CO2`,
          status: g.status,
        });
      });
    }

    // --- 2. SOCIAL ---
    if (!module || module === "Social") {
      // CSR activities
      const activities = await prisma.cSRActivity.findMany({
        where: {
          deptId: deptId || undefined,
          categoryId: categoryId || undefined,
          date: {
            gte: startDate || undefined,
            lte: endDate || undefined,
          },
        },
        include: { dept: true, category: true },
      });

      activities.forEach((act: any) => {
        results.push({
          id: `soc-act-${act.id}`,
          date: act.date,
          module: "Social",
          departmentName: act.dept?.name || "N/A",
          title: `CSR Activity: ${act.title}`,
          details: `Category: ${act.category?.name || "N/A"} | ${act.description || ""}`,
          status: act.open ? "Open" : "Closed",
        });
      });

      // Employee Participation
      const participations = await prisma.employeeParticipation.findMany({
        where: {
          employeeName: employeeName ? { contains: employeeName, mode: "insensitive" } : undefined,
          createdAt: {
            gte: startDate || undefined,
            lte: endDate || undefined,
          },
        },
        include: { activity: { include: { dept: true } } },
      });

      participations.forEach((p: any) => {
        if (deptId && p.activity?.deptId !== deptId) return;
        results.push({
          id: `soc-part-${p.id}`,
          date: p.completionDate || p.createdAt,
          module: "Social",
          departmentName: p.activity?.dept?.name || "N/A",
          title: `${p.employeeName} - CSR Participation`,
          details: `Activity: "${p.activity?.title}" | Proof: ${p.proofUrl || "None"}`,
          status: `${p.approvalStatus} (+${p.pointsEarned} pts)`,
        });
      });
    }

    // --- 3. GOVERNANCE ---
    if (!module || module === "Governance") {
      // Audits
      const audits = await prisma.audit.findMany({
        where: {
          deptId: deptId || undefined,
          date: {
            gte: startDate || undefined,
            lte: endDate || undefined,
          },
        },
        include: { dept: true },
      });

      audits.forEach((a: any) => {
        results.push({
          id: `gov-aud-${a.id}`,
          date: a.date,
          module: "Governance",
          departmentName: a.dept?.name || "N/A",
          title: `Audit: ${a.title}`,
          details: `Auditor: ${a.auditor} | Findings: ${a.findings || "None"}`,
          status: a.status,
        });
      });

      // Compliance Issues
      const compliance = await prisma.complianceIssue.findMany({
        where: {
          owner: employeeName ? { contains: employeeName, mode: "insensitive" } : undefined,
          createdAt: {
            gte: startDate || undefined,
            lte: endDate || undefined,
          },
        },
        include: { audit: { include: { dept: true } } },
      });

      compliance.forEach((c: any) => {
        if (deptId && c.audit?.deptId !== deptId) return;
        results.push({
          id: `gov-comp-${c.id}`,
          date: c.dueDate || c.createdAt,
          module: "Governance",
          departmentName: c.audit?.dept?.name || "N/A",
          title: `Compliance Issue: ${c.description}`,
          details: `Severity: ${c.severity} | Owner: ${c.owner} | Audit Ref: "${c.audit?.title}"`,
          status: c.status,
        });
      });
    }

    // --- 4. GAMIFICATION ---
    if (!module || module === "Gamification") {
      // Challenge Participation
      const cp = await prisma.challengeParticipation.findMany({
        where: {
          employeeName: employeeName ? { contains: employeeName, mode: "insensitive" } : undefined,
          createdAt: {
            gte: startDate || undefined,
            lte: endDate || undefined,
          },
        },
        include: { challenge: { include: { category: true } } },
      });

      cp.forEach((p: any) => {
        results.push({
          id: `gam-part-${p.id}`,
          date: p.createdAt,
          module: "Gamification",
          departmentName: "N/A",
          title: `${p.employeeName} - Challenge Participation`,
          details: `Challenge: "${p.challenge?.title}" | Progress: ${p.progress}%`,
          status: `${p.approvalStatus} (+${p.xpAwarded} XP)`,
        });
      });
    }

    // Sort results by date descending
    results.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return Response.json(results);
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
