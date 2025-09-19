import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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
        { error: 'Only admins can send upgrade invitations' },
        { status: 403 }
      )
    }

    const { id: targetUserId } = await params
    const { message = 'The admin has invited you to consider upgrading to Pro for unlimited notes!' } = await request.json()

    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      include: { tenant: true }
    })

    if (!targetUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    if (targetUser.tenantId !== user.tenantId) {
      return NextResponse.json(
        { error: 'You can only send invitations to users in your own tenant' },
        { status: 403 }
      )
    }

    return NextResponse.json({
      message: 'Upgrade invitation sent successfully',
      invitation: {
        id: 'simulated-' + Date.now(),
        targetUser: targetUser.email,
        message: message,
        sentAt: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('Send upgrade invitation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 