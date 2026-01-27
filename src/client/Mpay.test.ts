import type { Account } from 'viem'
import { describe, expect, test } from 'vitest'
import * as Challenge from '../Challenge.js'
import * as Credential from '../Credential.js'
import * as Method from '../Method.js'
import { tempo } from '../tempo/Method.js'
import * as Intents from '../tempo/Intents.js'
import * as z from '../zod.js'
import * as Mpay from './Mpay.js'

const realm = 'api.example.com'
const secretKey = 'test-secret-key'

describe('Mpay.create', () => {
  test('default', () => {
    const clientMethod = Method.toClient(tempo, {
      async createCredential({ challenge }) {
        return Credential.serialize({
          challenge,
          payload: { signature: '0xtest', type: 'transaction' },
        })
      },
    })

    const mpay = Mpay.create({ methods: [clientMethod] })

    expect(mpay.methods).toHaveLength(1)
    expect(mpay.methods[0]?.name).toBe('tempo')
    expect(typeof mpay.createCredential).toBe('function')
  })

  test('behavior: with multiple methods', () => {
    const tempoClient = Method.toClient(tempo, {
      async createCredential({ challenge }) {
        return Credential.serialize({
          challenge,
          payload: { signature: '0xtest', type: 'transaction' },
        })
      },
    })

    const stripeMethod = Method.from({
      name: 'stripe',
      intents: { charge: Intents.charge },
    })

    const stripeClient = Method.toClient(stripeMethod, {
      async createCredential({ challenge }) {
        return Credential.serialize({
          challenge,
          payload: { signature: '0xstripe', type: 'transaction' },
        })
      },
    })

    const mpay = Mpay.create({ methods: [tempoClient, stripeClient] })

    expect(mpay.methods).toHaveLength(2)
    expect(mpay.methods[0]?.name).toBe('tempo')
    expect(mpay.methods[1]?.name).toBe('stripe')
  })
})

describe('createCredential', () => {
  test('behavior: routes to correct method based on challenge', async () => {
    const tempoClient = Method.toClient(tempo, {
      async createCredential({ challenge }) {
        return Credential.serialize({
          challenge,
          payload: { signature: '0xtest-signature', type: 'transaction' },
        })
      },
    })

    const mpay = Mpay.create({ methods: [tempoClient] })

    const challenge = Challenge.fromIntent(Intents.charge, {
      realm,
      secretKey,
      request: {
        amount: '1000',
        currency: '0x1234',
        recipient: '0x5678',
        expires: new Date(Date.now() + 60_000).toISOString(),
      },
    })

    const response = new Response(null, {
      status: 402,
      headers: {
        'WWW-Authenticate': Challenge.serialize(challenge),
      },
    })

    const credential = await mpay.createCredential(response)

    expect(credential).toMatch(/^Payment /)

    const parsed = Credential.deserialize(credential)
    expect(parsed.payload).toEqual({ signature: '0xtest-signature', type: 'transaction' })
    expect(parsed.challenge.method).toBe('tempo')
  })

  test('behavior: throws when method not found', async () => {
    const tempoClient = Method.toClient(tempo, {
      async createCredential({ challenge }) {
        return Credential.serialize({
          challenge,
          payload: { signature: '0xtest', type: 'transaction' },
        })
      },
    })

    const mpay = Mpay.create({ methods: [tempoClient] })

    const challenge = Challenge.from({
      id: 'test-id',
      realm,
      method: 'unknown',
      intent: 'charge',
      request: { amount: '1000', currency: '0x1234' },
    })

    const response = new Response(null, {
      status: 402,
      headers: {
        'WWW-Authenticate': Challenge.serialize(challenge),
      },
    })

    await expect(mpay.createCredential(response)).rejects.toThrow(
      'No method found for "unknown". Available: tempo',
    )
  })

  test('behavior: routes to correct method with multiple methods', async () => {
    const tempoClient = Method.toClient(tempo, {
      async createCredential({ challenge }) {
        return Credential.serialize({
          challenge,
          payload: { signature: '0xtest', type: 'transaction' },
        })
      },
    })

    const stripeMethod = Method.from({
      name: 'stripe',
      intents: { charge: Intents.charge },
    })

    const stripeClient = Method.toClient(stripeMethod, {
      async createCredential({ challenge }) {
        return Credential.serialize({
          challenge,
          payload: { signature: '0xstripe', type: 'transaction' },
        })
      },
    })

    const mpay = Mpay.create({ methods: [tempoClient, stripeClient] })

    const stripeChallenge = Challenge.from({
      id: 'stripe-challenge-id',
      realm,
      method: 'stripe',
      intent: 'charge',
      request: {
        amount: '2000',
        currency: '0xabcd',
        recipient: '0xefgh',
        expires: new Date(Date.now() + 60_000).toISOString(),
      },
    })

    const response = new Response(null, {
      status: 402,
      headers: {
        'WWW-Authenticate': Challenge.serialize(stripeChallenge),
      },
    })

    const credential = await mpay.createCredential(response)
    const parsed = Credential.deserialize(credential)

    expect(parsed.payload).toEqual({ signature: '0xstripe', type: 'transaction' })
    expect(parsed.challenge.method).toBe('stripe')
  })

  test('behavior: passes context to createCredential', async () => {
    const tempoClient = Method.toClient(tempo, {
      context: z.object({
        account: z.custom<Account>(),
      }),
      async createCredential({ challenge, context }) {
        return Credential.serialize({
          challenge,
          payload: { signature: context.account.address, type: 'transaction' },
        })
      },
    })

    const mpay = Mpay.create({ methods: [tempoClient] })

    const challenge = Challenge.fromIntent(Intents.charge, {
      realm,
      secretKey,
      request: {
        amount: '1000',
        currency: '0x1234',
        recipient: '0x5678',
        expires: new Date(Date.now() + 60_000).toISOString(),
      },
    })

    const response = new Response(null, {
      status: 402,
      headers: {
        'WWW-Authenticate': Challenge.serialize(challenge),
      },
    })

    const mockAccount = { address: '0xMockAddress' } as unknown as Account
    const credential = await mpay.createCredential(response, { account: mockAccount })

    const parsed = Credential.deserialize(credential)
    expect(parsed.payload).toEqual({ signature: '0xMockAddress', type: 'transaction' })
  })

  test('behavior: works without context when method has no context schema', async () => {
    const tempoClient = Method.toClient(tempo, {
      async createCredential({ challenge }) {
        return Credential.serialize({
          challenge,
          payload: { signature: '0xno-context', type: 'transaction' },
        })
      },
    })

    const mpay = Mpay.create({ methods: [tempoClient] })

    const challenge = Challenge.fromIntent(Intents.charge, {
      realm,
      secretKey,
      request: {
        amount: '1000',
        currency: '0x1234',
        recipient: '0x5678',
        expires: new Date(Date.now() + 60_000).toISOString(),
      },
    })

    const response = new Response(null, {
      status: 402,
      headers: {
        'WWW-Authenticate': Challenge.serialize(challenge),
      },
    })

    const credential = await mpay.createCredential(response)
    const parsed = Credential.deserialize(credential)
    expect(parsed.payload).toEqual({ signature: '0xno-context', type: 'transaction' })
  })
})
