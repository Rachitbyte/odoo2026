import { prisma } from "../lib/prisma";

async function main() {
  console.log("Cleaning existing database...");
  await prisma.departmentScore.deleteMany({});
  await prisma.complianceIssue.deleteMany({});
  await prisma.audit.deleteMany({});
  await prisma.policyAcknowledgement.deleteMany({});
  await prisma.eSGPolicy.deleteMany({});
  
  await prisma.challengeParticipation.deleteMany({});
  await prisma.challenge.deleteMany({});
  
  await prisma.employeeParticipation.deleteMany({});
  await prisma.cSRActivity.deleteMany({});
  
  await prisma.carbonTransaction.deleteMany({});
  await prisma.environmentalGoal.deleteMany({});
  await prisma.productESGProfile.deleteMany({});
  
  await prisma.emissionFactor.deleteMany({});
  await prisma.category.deleteMany({});
  await prisma.badge.deleteMany({});
  await prisma.reward.deleteMany({});
  await prisma.department.deleteMany({});
  await prisma.eSGConfig.deleteMany({});

  console.log("Seeding base configurations...");
  await prisma.eSGConfig.create({
    data: {
      autoEmissionCalc: true,
      requireCsrEvidence: true,
      autoBadgeAward: true,
      emailAlerts: false,
      envWeight: 0.4,
      socialWeight: 0.3,
      govWeight: 0.3,
    },
  });

  console.log("Seeding departments...");
  const hr = await prisma.department.create({ data: { name: "Human Resources", code: "HR-001", head: "Sarah Jenkins", employeeCount: 15 }});
  const it = await prisma.department.create({ data: { name: "Information Technology", code: "IT-001", head: "David Chen", employeeCount: 45 }});
  const mfg = await prisma.department.create({ data: { name: "Manufacturing", code: "MFG-001", head: "Marcus Wright", employeeCount: 120 }});
  const sales = await prisma.department.create({ data: { name: "Sales & Marketing", code: "SLS-001", head: "Elena Rodriguez", employeeCount: 35 }});

  console.log("Seeding categories...");
  const catPlantation = await prisma.category.create({ data: { name: "Tree Plantation", type: "CSR_ACTIVITY" } });
  const catEdu = await prisma.category.create({ data: { name: "Education & Mentorship", type: "CSR_ACTIVITY" } });
  const catCleanup = await prisma.category.create({ data: { name: "Beach Cleanup", type: "CSR_ACTIVITY" } });
  
  const chalCommute = await prisma.category.create({ data: { name: "Green Commute", type: "CHALLENGE" } });
  const chalEnergy = await prisma.category.create({ data: { name: "Energy Saving", type: "CHALLENGE" } });

  console.log("Seeding emission factors...");
  const efGrid = await prisma.emissionFactor.create({ data: { name: "Electricity (Grid)", source: "Purchase", factorValue: 0.85, unit: "kgCO2e/kWh" }});
  const efDiesel = await prisma.emissionFactor.create({ data: { name: "Diesel Fuel (Generators)", source: "Manufacturing", factorValue: 2.68, unit: "kgCO2e/liter" }});
  const efFlight = await prisma.emissionFactor.create({ data: { name: "Air Travel (Short Haul)", source: "Fleet", factorValue: 0.25, unit: "kgCO2e/km" }});

  console.log("Seeding Product ESG Profiles...");
  await prisma.productESGProfile.create({ data: { productName: "EcoPack 500", productCode: "EP-500", deptId: mfg.id, carbonFootprint: 12.5, recyclable: true, notes: "Fully biodegradable packaging line." }});
  await prisma.productESGProfile.create({ data: { productName: "Smart Widget v2", productCode: "SW-v2", deptId: mfg.id, carbonFootprint: 45.2, recyclable: false, notes: "Contains rare earth metals; recycling program in development." }});

  console.log("Seeding Environmental Goals...");
  await prisma.environmentalGoal.create({ data: { name: "Reduce HQ Energy by 15%", deptId: it.id, targetCo2: 5000, currentCo2: 2100, deadline: new Date("2026-12-31T00:00:00Z") }});
  await prisma.environmentalGoal.create({ data: { name: "Zero Waste to Landfill", deptId: mfg.id, targetCo2: 15000, currentCo2: 12500, deadline: new Date("2027-12-31T00:00:00Z") }});

  console.log("Seeding Carbon Transactions...");
  await prisma.carbonTransaction.create({ data: { source: "Q1 Office Electricity", refId: "INV-2026-001", deptId: it.id, emissionFactorId: efGrid.id, quantity: 15000, co2Amount: 15000 * efGrid.factorValue, transactionDate: new Date("2026-03-31T00:00:00Z") }});
  await prisma.carbonTransaction.create({ data: { source: "Factory Generators (Jan)", refId: "FUEL-001", deptId: mfg.id, emissionFactorId: efDiesel.id, quantity: 4500, co2Amount: 4500 * efDiesel.factorValue, transactionDate: new Date("2026-01-31T00:00:00Z") }});
  await prisma.carbonTransaction.create({ data: { source: "Sales Team Flights (Q1)", refId: "TRV-001", deptId: sales.id, emissionFactorId: efFlight.id, quantity: 12000, co2Amount: 12000 * efFlight.factorValue, transactionDate: new Date("2026-03-15T00:00:00Z") }});

  console.log("Seeding CSR Activities...");
  const act1 = await prisma.cSRActivity.create({ data: { title: "Spring Coastal Cleanup", categoryId: catCleanup.id, description: "Clearing plastic waste from the north beach.", deptId: hr.id, date: new Date("2026-04-15T09:00:00Z"), open: false }});
  const act2 = await prisma.cSRActivity.create({ data: { title: "Local School STEM Mentorship", categoryId: catEdu.id, description: "Teaching basics of coding to middle schoolers.", deptId: it.id, date: new Date("2026-05-20T14:00:00Z"), open: true }});
  const act3 = await prisma.cSRActivity.create({ data: { title: "Urban Reforestation Drive", categoryId: catPlantation.id, description: "Planting 500 saplings in the downtown park.", deptId: mfg.id, date: new Date("2026-06-05T08:00:00Z"), open: true }});

  console.log("Seeding Employee Participations...");
  await prisma.employeeParticipation.create({ data: { employeeName: "Alice Walker", activityId: act1.id, approvalStatus: "Approved", pointsEarned: 50, completionDate: new Date("2026-04-16T00:00:00Z") }});
  await prisma.employeeParticipation.create({ data: { employeeName: "Bob Smith", activityId: act1.id, approvalStatus: "Approved", pointsEarned: 50, completionDate: new Date("2026-04-16T00:00:00Z") }});
  await prisma.employeeParticipation.create({ data: { employeeName: "Charlie Davis", activityId: act2.id, approvalStatus: "Pending", pointsEarned: 0 }});
  await prisma.employeeParticipation.create({ data: { employeeName: "Diana Prince", activityId: act3.id, approvalStatus: "Pending", pointsEarned: 0 }});

  console.log("Seeding ESG Policies...");
  const pol1 = await prisma.eSGPolicy.create({ data: { title: "Code of Conduct v2", description: "Updated global code of conduct covering anti-corruption and diversity.", version: "2.0.1", effectiveDate: new Date("2026-01-01T00:00:00Z"), deptId: hr.id, status: "Active" }});
  const pol2 = await prisma.eSGPolicy.create({ data: { title: "Supplier Sustainability Code", description: "Requirements for tier 1 and 2 suppliers regarding carbon emissions.", version: "1.0.0", effectiveDate: new Date("2025-10-15T00:00:00Z"), deptId: mfg.id, status: "Active" }});
  const pol3 = await prisma.eSGPolicy.create({ data: { title: "Data Privacy & Protection", description: "Internal policy for handling employee and customer data.", version: "3.2.0", effectiveDate: new Date("2026-03-01T00:00:00Z"), deptId: it.id, status: "Under Review" }});

  console.log("Seeding Policy Acknowledgements...");
  await prisma.policyAcknowledgement.create({ data: { policyId: pol1.id, employeeName: "Bob Smith", acknowledgedAt: new Date("2026-01-05T10:00:00Z") }});
  await prisma.policyAcknowledgement.create({ data: { policyId: pol1.id, employeeName: "Charlie Davis", acknowledgedAt: new Date("2026-01-06T11:20:00Z") }});
  await prisma.policyAcknowledgement.create({ data: { policyId: pol2.id, employeeName: "Alice Walker", acknowledgedAt: new Date("2025-10-20T09:15:00Z") }});

  console.log("Seeding Audits & Compliance Issues...");
  const audit1 = await prisma.audit.create({ data: { title: "ISO 14001 Annual Recertification", deptId: mfg.id, auditor: "EcoGuard Auditing LLC", date: new Date("2026-02-10T00:00:00Z"), findings: "Minor non-conformities found in waste segregation logs.", status: "Completed" }});
  const audit2 = await prisma.audit.create({ data: { title: "Q3 Internal IT Security Audit", deptId: it.id, auditor: "Internal Audit Team", date: new Date("2026-07-15T00:00:00Z"), status: "Planned" }});

  await prisma.complianceIssue.create({ data: { auditId: audit1.id, severity: "Medium", description: "Missing hazardous waste disposal logs for January.", owner: "Marcus Wright", dueDate: new Date("2026-03-10T00:00:00Z"), status: "Resolved" }});
  await prisma.complianceIssue.create({ data: { auditId: audit1.id, severity: "High", description: "Cooling system leak not reported within 24h SLA.", owner: "Facility Manager", dueDate: new Date("2026-02-25T00:00:00Z"), status: "Resolved" }});
  // Creating an overdue issue for demonstration
  await prisma.complianceIssue.create({ data: { auditId: audit1.id, severity: "High", description: "Update emergency response protocols on shop floor.", owner: "Safety Officer", dueDate: new Date("2026-03-01T00:00:00Z"), status: "Open" }});
  
  console.log("Seeding Department Scores...");
  await prisma.departmentScore.create({ data: { deptId: mfg.id, environmentalScore: 65.5, socialScore: 82.0, governanceScore: 78.5, totalScore: 75.3 }});
  await prisma.departmentScore.create({ data: { deptId: it.id, environmentalScore: 88.0, socialScore: 75.5, governanceScore: 92.0, totalScore: 85.1 }});
  await prisma.departmentScore.create({ data: { deptId: hr.id, environmentalScore: 90.0, socialScore: 95.0, governanceScore: 88.0, totalScore: 91.0 }});

  console.log("Seeding Gamification Challenges & Participations...");
  const challenge1 = await prisma.challenge.create({ data: { title: "Sustainability Sprint", categoryId: chalEnergy.id, description: "Focus on reducing overall energy consumption.", xp: 200, difficulty: "Hard", evidenceRequired: true, deadline: new Date("2026-07-20T00:00:00Z"), status: "Active" }});
  const challenge2 = await prisma.challenge.create({ data: { title: "Recycle Challenge", categoryId: chalEnergy.id, description: "Properly separate and recycle all daily office waste.", xp: 80, difficulty: "Easy", evidenceRequired: false, deadline: new Date("2026-07-15T00:00:00Z"), status: "Active" }});
  const challenge3 = await prisma.challenge.create({ data: { title: "Commute Green Week", categoryId: chalCommute.id, description: "Commute using public transit, biking, or carpooling.", xp: 120, difficulty: "Medium", evidenceRequired: true, deadline: new Date("2026-07-25T00:00:00Z"), status: "Draft" }});

  await prisma.challengeParticipation.create({ data: { challengeId: challenge1.id, employeeName: "Sarah Jenkins", progress: 100, proofUrl: "https://example.com/proof/sarah", approvalStatus: "Approved", xpAwarded: 200 }});
  await prisma.challengeParticipation.create({ data: { challengeId: challenge1.id, employeeName: "David Chen", progress: 50, approvalStatus: "Pending", xpAwarded: 0 }});
  await prisma.challengeParticipation.create({ data: { challengeId: challenge2.id, employeeName: "Marcus Wright", progress: 100, proofUrl: "https://example.com/proof/marcus", approvalStatus: "Approved", xpAwarded: 150 }});
  await prisma.challengeParticipation.create({ data: { challengeId: challenge3.id, employeeName: "Elena Rodriguez", progress: 100, approvalStatus: "Pending", xpAwarded: 0 }});

  console.log("Seeding Badges and Rewards...");
  await prisma.badge.create({ data: { name: "Green Beginner", description: "Started your sustainability journey.", unlockRule: "start_journey", icon: "🌱" }});
  await prisma.badge.create({ data: { name: "Carbon Saver", description: "Logged 5 carbon-reducing activities.", unlockRule: "save_carbon_5", icon: "♻️" }});
  await prisma.badge.create({ data: { name: "Sustainability Champion", description: "Completed 10 environmental challenges.", unlockRule: "complete_10_env", icon: "🌍" }});
  await prisma.badge.create({ data: { name: "Team Player", description: "Collaborated on a team ESG goal.", unlockRule: "team_goal", icon: "⭐" }});

  await prisma.reward.create({ data: { name: "$50 Amazon Gift Card", description: "Digital voucher for Amazon.com", pointsRequired: 500, stock: 20 }});
  await prisma.reward.create({ data: { name: "Extra Vacation Day", description: "One paid day off", pointsRequired: 1500, stock: 5 }});

  console.log("Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
