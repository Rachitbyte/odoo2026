import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const activities: any[] = [];

    // Fetch carbon transactions
    const carbonTxns = await prisma.carbonTransaction.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { dept: true },
    });
    carbonTxns.forEach((t: any) => {
      activities.push({
        id: `carbon-${t.id}`,
        title: `Logged carbon data for ${t.source}`,
        description: `${t.quantity} unit(s) generated ${t.co2Amount} kg CO2 in ${t.dept.name}`,
        date: t.transactionDate || t.createdAt,
        type: "environmental",
        bulletColor: "#22C55E",
      });
    });

    // Fetch CSR participations
    const participations = await prisma.employeeParticipation.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { activity: { include: { dept: true } } },
    });
    participations.forEach((p: any) => {
      activities.push({
        id: `csr-${p.id}`,
        title: `${p.employeeName} applied for CSR activity`,
        description: `Activity: "${p.activity.title}" (${p.activity.dept.name}) - Status: ${p.approvalStatus}`,
        date: p.completionDate || p.createdAt,
        type: "social",
        bulletColor: "#F97316",
      });
    });

    // Fetch Policy acknowledgements
    const acks = await prisma.policyAcknowledgement.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { policy: true },
    });
    acks.forEach((a: any) => {
      activities.push({
        id: `policy-${a.id}`,
        title: `${a.employeeName} acknowledged ESG Policy`,
        description: `Acknowledged policy: "${a.policy.title}" v${a.policy.version}`,
        date: a.acknowledgedAt || a.createdAt,
        type: "governance",
        bulletColor: "#3B82F6",
      });
    });

    // Fetch Audits
    const audits = await prisma.audit.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { dept: true },
    });
    audits.forEach((a: any) => {
      activities.push({
        id: `audit-${a.id}`,
        title: `Audit "${a.title}" logged`,
        description: `Auditor: ${a.auditor} for ${a.dept.name} - Status: ${a.status}`,
        date: a.date || a.createdAt,
        type: "governance",
        bulletColor: "#3B82F6",
      });
    });

    // Sort all combined activities by date descending
    activities.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Slice to top 5
    const topActivities = activities.slice(0, 5);

    // Fallback static activities if DB is completely empty (for nice UI initially)
    if (topActivities.length === 0) {
      return Response.json([
        {
          id: "fallback-1",
          title: "System Initialized",
          description: "EcoSphere ESG Management platform setup completed.",
          date: new Date(),
          type: "governance",
          bulletColor: "#3B82F6",
        },
        {
          id: "fallback-2",
          title: "Setup Department Settings",
          description: "Configure your organization divisions on the Settings page.",
          date: new Date(Date.now() - 5 * 60 * 1000),
          type: "social",
          bulletColor: "#F97316",
        },
      ]);
    }

    return Response.json(topActivities);
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
