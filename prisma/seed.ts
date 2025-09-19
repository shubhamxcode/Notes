import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  const acmeTenant = await prisma.tenant.upsert({
    where: { slug: 'acme' },
    update: {},
    create: {
      slug: 'acme',
      name: 'Acme Corp',
      subscription: 'free',
    },
  })

  const globexTenant = await prisma.tenant.upsert({
    where: { slug: 'globex' },
    update: {},
    create: {
      slug: 'globex',
      name: 'Globex Corporation',
      subscription: 'free',
    },
  })

  const hashedPassword = await bcrypt.hash('password', 12)

  const users = [
    {
      email: 'admin@acme.test',
      password: hashedPassword,
      role: 'admin',
      tenantId: acmeTenant.id,
    },
    {
      email: 'user@acme.test',
      password: hashedPassword,
      role: 'member',
      tenantId: acmeTenant.id,
    },
    {
      email: 'admin@globex.test',
      password: hashedPassword,
      role: 'admin',
      tenantId: globexTenant.id,
    },
    {
      email: 'user@globex.test',
      password: hashedPassword,
      role: 'member',
      tenantId: globexTenant.id,
    },
  ]

  for (const user of users) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {},
      create: user,
    })
    console.log(`Created user: ${user.email}`)
  }

  console.log('Seeding completed!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 