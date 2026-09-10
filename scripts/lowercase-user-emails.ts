/**
 * One-off migration: normalize existing `users.email` values to lowercase.
 *
 * Background: `register/actions.ts` now stores lowercase emails, but older rows
 * may contain uppercase characters. Since Postgres `findUnique` is
 * case-sensitive, those rows are missed by exact-match lookups
 * (e.g. password reset). Run this once to fix existing data.
 *
 * Safety:
 * - Default mode is DRY-RUN: only prints what would change, writes nothing.
 * - Real run requires an explicit `--confirm` flag.
 * - Before writing, the script prints the (masked) target database host.
 * - Rows that would collide on the unique `email` constraint (two accounts
 *   whose emails differ only by case) are REPORTED ONLY and never merged.
 *
 * Usage (same runner convention as scripts/clean-users.ts):
 *   node -r dotenv/config -r ts-node/register scripts/lowercase-user-emails.ts
 *   node -r dotenv/config -r ts-node/register scripts/lowercase-user-emails.ts --confirm
 */
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

function maskDbHost(url: string | undefined): string {
  if (!url) return '(DATABASE_URL not set)';
  try {
    const parsed = new URL(url)
    return `${parsed.protocol}//${parsed.host}${parsed.pathname}`
  } catch {
    return '(unparsable DATABASE_URL)'
  }
}

function maskEmail(email: string): string {
  const [local, domain] = email.split('@')
  if (!domain) return '***'
  const head = local.length > 0 ? local[0] : '*'
  return `${head}***@${domain}`
}

async function main() {
  const confirm = process.argv.includes('--confirm')

  const users = await prisma.user.findMany({
    select: { id: true, email: true },
  })
  console.log(`Found total ${users.length} user(s) in prisma.users`)
  console.log(`Target database: ${maskDbHost(process.env.DATABASE_URL)}`)

  // Group every row by its normalized email to detect unique collisions.
  const byLower = new Map<string, { id: string; email: string }[]>()
  for (const u of users) {
    const lower = u.email.trim().toLowerCase()
    const group = byLower.get(lower) ?? []
    group.push({ id: u.id, email: u.email })
    byLower.set(lower, group)
  }

  const toUpdate: { id: string; from: string; to: string }[] = []
  const collisions: { lower: string; rows: { id: string; email: string }[] }[] = []

  for (const [lower, rows] of byLower) {
    if (rows.length > 1) {
      // Two+ accounts map to the same lowercase email: unique constraint
      // would break. Report only, never auto-merge.
      collisions.push({ lower, rows })
      continue
    }
    const row = rows[0]
    if (row.email !== lower) {
      toUpdate.push({ id: row.id, from: row.email, to: lower })
    }
  }

  if (collisions.length > 0) {
    console.log(`\nCOLLISIONS (${collisions.length} group(s)) — manual review required, skipping:`)
    for (const c of collisions) {
      console.log(` - "${c.lower}" claimed by:`)
      for (const r of c.rows) {
        console.log(`     id=${r.id} email=${maskEmail(r.email)}`)
      }
    }
  }

  if (toUpdate.length === 0) {
    console.log('\nNothing to update: all emails already lowercase (excluding collisions above).')
  } else {
    console.log(`\nPlanned updates (${toUpdate.length}):`)
    for (const u of toUpdate) {
      console.log(` - id=${u.id}: ${maskEmail(u.from)} -> ${maskEmail(u.to)}`)
    }
  }

  if (!confirm) {
    console.log('\nDRY-RUN only: no changes written. Re-run with --confirm to apply.')
    await prisma.$disconnect()
    return
  }

  let ok = 0
  for (const u of toUpdate) {
    await prisma.user.update({
      where: { id: u.id },
      data: { email: u.to },
    })
    ok += 1
  }
  console.log(`\nUpdated ${ok}/${toUpdate.length} row(s). Collisions skipped: ${collisions.length} group(s).`)

  await prisma.$disconnect()
}

main().catch(async (err) => {
  console.error('Migration failed:', err)
  await prisma.$disconnect()
  process.exit(1)
})
