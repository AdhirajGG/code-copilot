// import { NextResponse } from 'next/server';
// import { prisma } from '@/lib/prisma';

// export async function GET(request: Request) {
//   const { searchParams } = new URL(request.url);
//   const page = parseInt(searchParams.get('page') || '1');
//   const limit = 5;
//   const skip = (page - 1) * limit;

//   try {
//     //paginated [cite: 10, 19]
//     const history = await prisma.generation.findMany({
//       skip,
//       take: limit,
//       orderBy: { createdAt: 'desc' },
//     });

//     const total = await prisma.generation.count();

//     return NextResponse.json({
//       data: history,
//       totalPages: Math.ceil(total / limit),
//       currentPage: page,
//     });
//   } catch (error) {
//     return NextResponse.json({ error: 'Fetch failed' }, { status: 500 });
//   }
// }

// Frontend/app/api/history/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";


export async function GET(request: Request) {
  try {
    // Get current user via Clerk
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Find our app user
    const appUser = await prisma.user.findUnique({ where: { clerkId: userId } });
    if (!appUser) {
      // No rows yet for this user -> empty result
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
