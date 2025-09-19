import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth'

// GET /api/upgrade-invitations - Get upgrade invitations for the current user
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Simulate upgrade invitations for demo purposes
    // In production, this would query the actual UpgradeInvitation table
    const mockInvitations = []
    
    // Check if user is on a free plan and show a mock invitation
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

// POST /api/upgrade-invitations - Respond to an upgrade invitation
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
      // If user accepts, trigger the upgrade process
      if (user.role !== 'admin') {
        return NextResponse.json(
          { error: 'Only admins can upgrade subscriptions. Please contact your admin.' },
          { status: 403 }
        )
      }

      // Upgrade the tenant
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
      // User declined the invitation
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