import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { nanoid } from 'nanoid';

function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url, customSlug } = body;

    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    if (!isValidUrl(url)) {
      return NextResponse.json({ error: 'Invalid URL. Must start with http:// or https://' }, { status: 400 });
    }

    const slug = customSlug?.trim()
      ? customSlug.trim().toLowerCase().replace(/[^a-z0-9-_]/g, '')
      : nanoid(7);

    if (!slug) {
      return NextResponse.json({ error: 'Invalid custom slug' }, { status: 400 });
    }

    // Check for existing slug
    const existing = await prisma.link.findUnique({ where: { slug } });
    if (existing) {
      return NextResponse.json({ error: 'Slug already taken' }, { status: 409 });
    }

    const link = await prisma.link.create({
      data: { slug, url },
    });

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || `${request.nextUrl.protocol}//${request.nextUrl.host}`;

    return NextResponse.json({
      id: link.id,
      slug: link.slug,
      url: link.url,
      shortUrl: `${baseUrl}/r/${link.slug}`,
      clicks: link.clicks,
      createdAt: link.createdAt,
    }, { status: 201 });
  } catch (error) {
    console.error('Shorten error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const links = await prisma.link.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
    return NextResponse.json(links);
  } catch (error) {
    console.error('List error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
