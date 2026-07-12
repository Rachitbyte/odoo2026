import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const deptId = searchParams.get("deptId");
    const module = searchParams.get("module");
    const employeeName = searchParams.get("employeeName");
    const categoryId = searchParams.get("categoryId");

    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate + "T23:59:59") : undefined;
    const deptIdNum = deptId ? Number(deptId) : undefined;
    const catIdNum = categoryId ? Number(categoryId) : undefined;

    const results: any[] = [];

    // ── Environmental: Carbon Transactions ──────────────────────────
    if (!module || module === "Environmental") {
      const txns = await prisma.carbonTransaction.findMany({
        where: {
          ...(deptIdNum ? { deptId: deptIdNum } : {}),
          ...(start || end
            ? {
                transactionDate: {
                  ...(start ? { gte: start } : {}),
                  ...(end ? { lte: end } : {}),
                },
              }
            : {}),
        },
        include: { dept: true, emissionFactor: true },
        orderBy: { transactionDate: "desc" },
      });

      txns.forEach((t: any) => {
        results.push({
          id: `env-ct-${t.id}`,
          date: t.transactionDate || t.createdAt,
          module: "Environmental",
          departmentName: t.dept?.name || "—",
          title: `Carbon Transaction: ${t.source}`,
          details: `Factor: ${t.emissionFactor?.name || "—"} | Qty: ${t.quantity} | CO2: ${t.co2Amount} kg`,
          status: `${t.co2Amount} kg CO₂`,
        });
      });

      // Environmental Goals
      const goals = await prisma.environmentalGoal.findMany({
        where: {
          ...(deptIdNum ? { deptId: deptIdNum } : {}),
          ...(start || end
            ? {
                createdAt: {
                  ...(start ? { gte: start } : {}),
                  ...(end ? { lte: end } : {}),
                },
              }
            : {}),
        },
        include: { dept: true },
        orderBy: { createdAt: "desc" },
      });

      goals.forEach((g: any) => {
        results.push({
          id: `env-goal-${g.id}`,
          date: g.createdAt,
          module: "Environmental",
          departmentName: g.dept?.name || "—",
          title: `Goal: ${g.name}`,
          details: `Target: ${g.targetCo2} kg | Current: ${g.currentCo2} kg | Deadline: ${new Date(g.deadline).toLocaleDateString()}`,
          status: g.status,
        });
      });
    }

    // ── Social: CSR Activities ───────────────────────────────────────
    if (!module || module === "Social") {
      const activities = await prisma.cSRActivity.findMany({
        where: {
          ...(deptIdNum ? { deptId: deptIdNum } : {}),
          ...(catIdNum ? { categoryId: catIdNum } : {}),
          ...(start || end
            ? {
                date: {
                  ...(start ? { gte: start } : {}),
                  ...(end ? { lte: end } : {}),
                },
              }
            : {}),
        },
        include: { dept: true, category: true },
        orderBy: { date: "desc" },
      });

      activities.forEach((a: any) => {
        results.push({
          id: `social-act-${a.id}`,
          date: a.date,
          module: "Social",
          departmentName: a.dept?.name || "—",
          title: `CSR Activity: ${a.title}`,
          details: `Category: ${a.category?.name || "—"} | ${a.description || "No description"}`,
          status: a.open ? "Open" : "Closed",
        });
      });

      // Social: Employee Participation
      const parts = await prisma.employeeParticipation.findMany({
        where: {
          ...(employeeName
            ? { employeeName: { contains: employeeName, mode: "insensitive" as const } }
            : {}),
          ...(start || end
            ? {
                createdAt: {
                  ...(start ? { gte: start } : {}),
                  ...(end ? { lte: end } : {}),
                },
              }
            : {}),
          ...(deptIdNum
            ? { activity: { deptId: deptIdNum } }
            : {}),
        },
        include: { activity: { include: { dept: true } } },
        orderBy: { createdAt: "desc" },
      });

      parts.forEach((p: any) => {
        results.push({
          id: `social-part-${p.id}`,
          date: p.createdAt,
          module: "Social",
          departmentName: p.activity?.dept?.name || "—",
          title: `Participation: ${p.employeeName}`,
          details: `Activity: ${p.activity?.title || "—"} | Points: ${p.pointsEarned}`,
          status: p.approvalStatus,
        });
      });
    }

    // ── Governance: Audits ───────────────────────────────────────────
    if (!module || module === "Governance") {
      const audits = await prisma.audit.findMany({
        where: {
          ...(deptIdNum ? { deptId: deptIdNum } : {}),
          ...(start || end
            ? {
                date: {
                  ...(start ? { gte: start } : {}),
                  ...(end ? { lte: end } : {}),
                },
              }
            : {}),
        },
        include: { dept: true },
        orderBy: { date: "desc" },
      });

      audits.forEach((a: any) => {
        results.push({
          id: `gov-audit-${a.id}`,
          date: a.date,
          module: "Governance",
          departmentName: a.dept?.name || "—",
          title: `Audit: ${a.title}`,
          details: `Auditor: ${a.auditor} | ${a.findings ? a.findings.slice(0, 80) : "No findings"}`,
          status: a.status,
        });
      });

      // Governance: Compliance Issues
      const issues = await prisma.complianceIssue.findMany({
        where: {
          ...(start || end
            ? {
                createdAt: {
                  ...(start ? { gte: start } : {}),
                  ...(end ? { lte: end } : {}),
                },
              }
            : {}),
          ...(deptIdNum
            ? { audit: { deptId: deptIdNum } }
            : {}),
        },
        include: { audit: { include: { dept: true } } },
        orderBy: { dueDate: "asc" },
      });

      issues.forEach((i: any) => {
        results.push({
          id: `gov-issue-${i.id}`,
          date: i.createdAt,
          module: "Governance",
          departmentName: i.audit?.dept?.name || "—",
          title: `Compliance Issue: ${i.description.slice(0, 50)}`,
          details: `Severity: ${i.severity} | Owner: ${i.owner} | Due: ${new Date(i.dueDate).toLocaleDateString()}`,
          status: i.status,
        });
      });

      // Governance: Policies
      const policies = await prisma.eSGPolicy.findMany({
        where: {
          ...(deptIdNum ? { deptId: deptIdNum } : {}),
          ...(start || end
            ? {
                effectiveDate: {
                  ...(start ? { gte: start } : {}),
                  ...(end ? { lte: end } : {}),
                },
              }
            : {}),
        },
        include: { dept: true },
        orderBy: { effectiveDate: "desc" },
      });

      policies.forEach((p: any) => {
        results.push({
          id: `gov-policy-${p.id}`,
          date: p.effectiveDate,
          module: "Governance",
          departmentName: p.dept?.name || "All Departments",
          title: `Policy: ${p.title}`,
          details: `Version: ${p.version} | ${p.description.slice(0, 60)}`,
          status: p.status,
        });
      });
    }

    // ── Gamification: Challenge Participations ───────────────────────
    if (!module || module === "Gamification") {
      const challengeParts = await prisma.challengeParticipation.findMany({
        where: {
          ...(employeeName
            ? { employeeName: { contains: employeeName, mode: "insensitive" as const } }
            : {}),
          ...(start || end
            ? {
                createdAt: {
                  ...(start ? { gte: start } : {}),
                  ...(end ? { lte: end } : {}),
                },
              }
            : {}),
          ...(catIdNum
            ? { challenge: { categoryId: catIdNum } }
            : {}),
        },
        include: { challenge: { include: { category: true } } },
        orderBy: { createdAt: "desc" },
      });

      challengeParts.forEach((cp: any) => {
        results.push({
          id: `gam-cp-${cp.id}`,
          date: cp.createdAt,
          module: "Gamification",
          departmentName: "—",
          title: `Challenge: ${cp.challenge?.title || "—"}`,
          details: `Employee: ${cp.employeeName} | XP: ${cp.xpAwarded} | Progress: ${cp.progress}%`,
          status: cp.approvalStatus,
        });
      });
    }

    // Sort combined results by date descending
    results.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    return Response.json(results);
  } catch (error: any) {
    console.error("Custom report error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
