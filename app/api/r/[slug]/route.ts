import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

export async function GET(
  _request: NextRequest,
  { params }: { params: { slug: string } }
) {
  const { slug } = params;

  try {
    const link = await prisma.link.findUnique({ where: { slug } });

    if (!link) {
      return NextResponse.redirect(new URL('/?error=not_found', _request.url));
    }

    // Increment click count (fire and forget)
    prisma.link.update({
      where: { slug },
      data: { clicks: { increment: 1 } },
    }).catch(console.error);

    return NextResponse.redirect(link.url, { status: 302 });
  } catch (error) {
    console.error('Redirect error:', error);
    return NextResponse.redirect(new URL('/?error=server_error', _request.url));
  }
}
