import { z } from 'zod/mini'

export * from 'zod/mini'

/** Numeric string (base unit amount). */
export function amount() {
  return z.string().check(z.regex(/^\d+$/, 'Invalid amount'))
}

/** ISO 8601 datetime string (e.g., "2025-01-06T12:00:00Z"). */
export function datetime() {
  return z
    .string()
    .check(
      z.regex(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/,
        'Invalid ISO 8601 datetime',
      ),
    )
}

/** Hex-encoded hash string (0x-prefixed, 64 hex chars). */
export function hash() {
  return z.string().check(z.regex(/^0x[0-9a-fA-F]{64}$/, 'Invalid hash'))
}

/** Billing period: "day", "week", "month", "year", or seconds as string. */
export function period() {
  return z.string().check(z.regex(/^(day|week|month|year|\d+)$/, 'Invalid period'))
}

/** Hex-encoded signature string (0x-prefixed). */
export function signature() {
  return z.string().check(z.regex(/^0x[0-9a-fA-F]+$/, 'Invalid signature'))
}
