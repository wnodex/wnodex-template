import '@dotenvx/dotenvx/config';

import { PrismaPg } from '@prisma/adapter-pg';

// @ts-expect-error tun prisma generate to generate the client
import { PrismaClient } from './prisma/client';

const connectionString = `${process.env.DATABASE_URL}`;

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

export { prisma };
