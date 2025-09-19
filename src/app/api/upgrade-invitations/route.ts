import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const mockInvitations = []
    
    const tenant = await prisma.tenant.findUnique({
      where: { id: user.tenantId }
    })
    
    if (tenant?.subscription === 'free') {
      mockInvitations.push({
        id: 'mock-invitation',
        message: 'Your admin suggests upgrading to Pro for unlimited notes!',
        fromUser: { email: 'admin@' + user.tenantSlug + '.test' },
        createdAt: new Date().toISOString(),
        status: 'pending'
      })
    }
    
    return NextResponse.json({ invitations: mockInvitations })
  } catch (error) {
    console.error('Get upgrade invitations error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { invitationId, action } = await request.json()
    
    if (!invitationId || !action || !['accept', 'decline'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid request. Action must be "accept" or "decline"' },
        { status: 400 }
      )
    }

    if (action === 'accept') {
      if (user.role !== 'admin') {
        return NextResponse.json(
          { error: 'Only admins can upgrade subscriptions. Please contact your admin to complete the upgrade.' },
          { status: 403 }
        )
      }

      const tenant = await prisma.tenant.update({
        where: { id: user.tenantId },
        data: { subscription: 'pro' }
      })

      return NextResponse.json({
        message: 'Subscription upgraded successfully!',
        tenant: {
          id: tenant.id,
          slug: tenant.slug,
          name: tenant.name,
          subscription: tenant.subscription
        }
      })
    } else {
      return NextResponse.json({
        message: 'Upgrade invitation declined'
      })
    }
  } catch (error) {
    console.error('Respond to upgrade invitation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 