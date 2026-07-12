import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get("type");

    const categories = await prisma.category.findMany({
      where: type ? { type } : {},
      orderBy: {
        id: "asc",
      },
    });

    return Response.json(categories);
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { name, type, status } = data;

    if (!name || !type) {
      return Response.json({ error: "Missing required fields: name, type" }, { status: 400 });
    }

    if (type !== "CSR_ACTIVITY" && type !== "CHALLENGE") {
      return Response.json({ error: "Invalid category type" }, { status: 400 });
    }

    const category = await prisma.category.create({
      data: {
        name,
        type,
        status: status || "Active",
      },
    });

    return Response.json(category, { status: 201 });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
