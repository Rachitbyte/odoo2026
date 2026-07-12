import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const products = await prisma.productESGProfile.findMany({
      include: {
        dept: true,
      },
      orderBy: { id: "desc" },
    });
    return NextResponse.json(products);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { productName, productCode, deptId, carbonFootprint, recyclable, notes } = body;

    if (!productName || !productCode || !deptId || carbonFootprint === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const newProduct = await prisma.productESGProfile.create({
      data: {
        productName,
        productCode,
        deptId: Number(deptId),
        carbonFootprint: Number(carbonFootprint),
        recyclable: Boolean(recyclable),
        notes,
      },
      include: {
        dept: true,
      }
    });

    return NextResponse.json(newProduct, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
