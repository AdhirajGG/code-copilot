import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = 5;
  const skip = (page - 1) * limit;

  try {
    //paginated [cite: 10, 19]
    const history = await prisma.generation.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    });

    const total = await prisma.generation.count();

    return NextResponse.json({
      data: history,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Fetch failed' }, { status: 500 });
  }
}