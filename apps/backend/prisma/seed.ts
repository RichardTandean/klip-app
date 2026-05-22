import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('password123', 12);

  const user = await prisma.user.upsert({
    where: { email: 'test@klip.app' },
    update: {},
    create: {
      email: 'test@klip.app',
      passwordHash,
      name: 'Test User',
    },
  });

  console.log('Seeded user:', user.email);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
