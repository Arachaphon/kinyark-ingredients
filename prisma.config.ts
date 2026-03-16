import type { PrismaConfig } from 'prisma'

export default {
  earlyAccess: true,
  schema: 'prisma/schema.prisma',
  migrate: {
    async adapter(env: Record<string, string | undefined>) {
      const { PrismaNeon } = await import('@prisma/adapter-neon')
      return new PrismaNeon({ connectionString: env.DIRECT_URL })
    },
  },
} satisfies PrismaConfig