import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const user = await getUserFromRequest(request)
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    if (user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only admins can upgrade subscriptions' },
        { status: 403 }
      )
    }

    const { slug } = await params

    if (user.tenantSlug !== slug) {
      return NextResponse.json(
        { error: 'You can only upgrade your own tenant' },
        { status: 403 }
      )
    }

    const tenant = await prisma.tenant.update({
      where: { slug },
      data: { subscription: 'pro' }
    })

    return NextResponse.json({
      message: 'Subscription upgraded successfully',
      tenant: {
        id: tenant.id,
        slug: tenant.slug,
        name: tenant.name,
        subscription: tenant.subscription
      }
    })
  } catch (error) {
    console.error('Upgrade tenant error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 