import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";


export async function GET(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const appUser = await prisma.user.findUnique({ where: { clerkId: userId } });
    if (!appUser) {
      return NextResponse.json({
        data: [],
        totalPages: 0,
        currentPage: 1,
      });
    }

    const url = new URL(request.url);
    const page = Math.max(parseInt(url.searchParams.get("page") || "1", 10), 1);
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "5", 10), 50);
    const skip = (page - 1) * limit;

    const [total, items] = await Promise.all([
      prisma.generation.count({ where: { userId: appUser.id } }),
      prisma.generation.findMany({
        where: { userId: appUser.id },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
    ]);

    return NextResponse.json({
      data: items,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
    });
  } catch (error) {
    console.error("[History] Error:", error);
    return NextResponse.json({ error: "Fetch failed" }, { status: 500 });
  }
}
