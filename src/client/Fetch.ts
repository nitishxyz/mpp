import * as Challenge from '../Challenge.js'
import type * as Method from '../Method.js'

let originalFetch: typeof globalThis.fetch | undefined

/**
 * Creates a fetch wrapper that automatically handles 402 Payment Required responses.
 *
 * @example
 * ```ts
 * import { Fetch, tempo } from 'mpay/client'
 * import { privateKeyToAccount } from 'viem/accounts'
 *
 * const fetch = Fetch.from({
 *   methods: [
 *     tempo({
 *       account: privateKeyToAccount('0x...'),
 *       rpcUrl: 'https://rpc.tempo.xyz',
 *     }),
 *   ],
 * })
 *
 * // Use the wrapped fetch — handles 402 automatically
 * const res = await fetch('https://api.example.com/resource')
 * ```
 */
export function from<const methods extends readonly Method.AnyClient[]>(
  config: from.Config<methods>,
): typeof globalThis.fetch {
  const { fetch = globalThis.fetch, methods } = config

  return async (input, init) => {
    const response = await fetch(input, init)

    if (response.status !== 402) return response

    const credential = await createCredential(response, { methods })

    return fetch(input, {
      ...init,
      headers: {
        ...init?.headers,
        Authorization: credential,
      },
    })
  }
}

export declare namespace from {
  type Config<methods extends readonly Method.AnyClient[] = readonly Method.AnyClient[]> = {
    /** Custom fetch function to wrap. Defaults to `globalThis.fetch`. */
    fetch?: typeof globalThis.fetch
    /** Array of payment methods to use. */
    methods: methods
  }
}

/**
 * Replaces the global `fetch` with a payment-aware wrapper.
 *
 * @example
 * ```ts
 * import { Fetch, tempo } from 'mpay/client'
 * import { privateKeyToAccount } from 'viem/accounts'
 *
 * Fetch.polyfill({
 *   methods: [
 *     tempo({
 *       account: privateKeyToAccount('0x...'),
 *       rpcUrl: 'https://rpc.tempo.xyz',
 *     }),
 *   ],
 * })
 *
 * // Global fetch now handles 402 automatically
 * const res = await fetch('https://api.example.com/resource')
 * ```
 */
export function polyfill<const methods extends readonly Method.AnyClient[]>(
  config: polyfill.Config<methods>,
): void {
  originalFetch = globalThis.fetch
  globalThis.fetch = from(config)
}

export declare namespace polyfill {
  type Config<methods extends readonly Method.AnyClient[] = readonly Method.AnyClient[]> = {
    /** Array of payment methods to use. */
    methods: methods
  }
}

/**
 * Restores the original `fetch` after calling `polyfill`.
 *
 * @example
 * ```ts
 * import { Fetch, tempo } from 'mpay/client'
 *
 * Fetch.polyfill({ methods: [...] })
 *
 * // ... use payment-aware fetch ...
 *
 * Fetch.restore()
 * ```
 */
export function restore(): void {
  if (originalFetch) {
    globalThis.fetch = originalFetch
    originalFetch = undefined
  }
}

/** @internal */
async function createCredential<methods extends readonly Method.AnyClient[]>(
  response: Response,
  config: { methods: methods },
): Promise<string> {
  const { methods } = config
  const challenge = Challenge.fromResponse(response)

  const method = methods.find((m) => m.name === challenge.method)
  if (!method)
    throw new Error(
      `No method found for "${challenge.method}". Available: ${methods.map((m) => m.name).join(', ')}`,
    )

  return method.createCredential({ challenge } as never)
}
