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

    const notes = await prisma.note.findMany({
      where: { 
        tenantId: user.tenantId,
        userId: user.userId
      },
      include: {
        user: {
          select: { email: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ notes })
  } catch (error) {
    console.error('Get notes error:', error)
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

    const { title, content } = await request.json()

    if (!title || !content) {
      return NextResponse.json(
        { error: 'Title and content are required' },
        { status: 400 }
      )
    }

    const userNotesCount = await prisma.note.count({
      where: { 
        tenantId: user.tenantId,
        userId: user.userId
      }
    })

    const tenant = await prisma.tenant.findUnique({
      where: { id: user.tenantId }
    })

    if (!tenant) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      )
    }

    if (tenant.subscription === 'free' && userNotesCount >= 3) {
      return NextResponse.json(
        { error: 'Free plan is limited to 3 notes per user. Upgrade to Pro for unlimited notes.' },
        { status: 402 }
      )
    }

    const note = await prisma.note.create({
      data: {
        title,
        content,
        tenantId: user.tenantId,
        userId: user.userId
      },
      include: {
        user: {
          select: { email: true }
        }
      }
    })

    return NextResponse.json({ note }, { status: 201 })
  } catch (error) {
    console.error('Create note error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 