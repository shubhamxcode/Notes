import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth'

export async function GET(
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

    const { slug } = await params

    if (user.tenantSlug !== slug) {
      return NextResponse.json(
        { error: 'You can only view your own tenant' },
        { status: 403 }
      )
    }

    const tenant = await prisma.tenant.findUnique({
      where: { slug },
      include: {
        _count: {
          select: { notes: true }
        }
      }
    })

    if (!tenant) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      tenant: {
        id: tenant.id,
        slug: tenant.slug,
        name: tenant.name,
        subscription: tenant.subscription,
        noteCount: tenant._count.notes,
        noteLimit: tenant.subscription === 'free' ? 3 : null,
        isAtLimit: tenant.subscription === 'free' && tenant._count.notes >= 3
      }
    })
  } catch (error) {
    console.error('Get tenant error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
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
        { error: 'Only admins can update tenant settings' },
        { status: 403 }
      )
    }

    const { slug } = await params

    if (user.tenantSlug !== slug) {
      return NextResponse.json(
        { error: 'You can only update your own tenant' },
        { status: 403 }
      )
    }

    const { subscription } = await request.json()

    if (!subscription || !['free', 'pro'].includes(subscription)) {
      return NextResponse.json(
        { error: 'Invalid subscription type. Must be "free" or "pro"' },
        { status: 400 }
      )
    }

    const tenant = await prisma.tenant.update({
      where: { slug },
      data: { subscription }
    })

    return NextResponse.json({
      message: 'Tenant subscription updated successfully',
      tenant: {
        id: tenant.id,
        slug: tenant.slug,
        name: tenant.name,
        subscription: tenant.subscription
      }
    })
  } catch (error) {
    console.error('Update tenant error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 