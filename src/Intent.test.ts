import { describe, expect, test } from 'vitest'
import * as Intent from './Intent.js'

describe('charge', () => {
  test('behavior: validates valid request', () => {
    expect(
      Intent.charge.schema.request.parse({
        amount: '1000',
        currency: 'USD',
      }),
    ).toMatchInlineSnapshot(`
      {
        "amount": "1000",
        "currency": "USD",
      }
    `)
  })

  test('behavior: validates with all optional fields', () => {
    expect(
      Intent.charge.schema.request.parse({
        amount: '1000',
        currency: 'USD',
        description: 'Test payment',
        expires: '2030-01-01T00:00:00Z',
        externalId: 'order-123',
        recipient: '0x1234567890abcdef',
      }),
    ).toMatchInlineSnapshot(`
      {
        "amount": "1000",
        "currency": "USD",
        "description": "Test payment",
        "expires": "2030-01-01T00:00:00Z",
        "externalId": "order-123",
        "recipient": "0x1234567890abcdef",
      }
    `)
  })

  test('error: invalid amount (non-numeric)', () => {
    expect(() =>
      Intent.charge.schema.request.parse({
        amount: 'abc',
        currency: 'USD',
      }),
    ).toThrowErrorMatchingInlineSnapshot(`
      [$ZodError: [
        {
          "origin": "string",
          "code": "invalid_format",
          "format": "regex",
          "pattern": "/^\\\\d+$/",
          "path": [
            "amount"
          ],
          "message": "Invalid amount"
        }
      ]]
    `)
  })

  test('error: invalid amount (decimal)', () => {
    expect(() =>
      Intent.charge.schema.request.parse({
        amount: '100.50',
        currency: 'USD',
      }),
    ).toThrowErrorMatchingInlineSnapshot(`
      [$ZodError: [
        {
          "origin": "string",
          "code": "invalid_format",
          "format": "regex",
          "pattern": "/^\\\\d+$/",
          "path": [
            "amount"
          ],
          "message": "Invalid amount"
        }
      ]]
    `)
  })

  test('error: invalid expires (not ISO 8601)', () => {
    expect(() =>
      Intent.charge.schema.request.parse({
        amount: '1000',
        currency: 'USD',
        expires: 'not-a-date',
      }),
    ).toThrowErrorMatchingInlineSnapshot(`
      [$ZodError: [
        {
          "origin": "string",
          "code": "invalid_format",
          "format": "regex",
          "pattern": "/^\\\\d{4}-\\\\d{2}-\\\\d{2}T\\\\d{2}:\\\\d{2}:\\\\d{2}(?:\\\\.\\\\d+)?(?:Z|[+-]\\\\d{2}:\\\\d{2})$/",
          "path": [
            "expires"
          ],
          "message": "Invalid ISO 8601 datetime"
        }
      ]]
    `)
  })
})

describe('authorize', () => {
  test('behavior: validates valid request', () => {
    expect(
      Intent.authorize.schema.request.parse({
        amount: '5000',
        currency: 'EUR',
        expires: '2030-06-15T12:00:00Z',
      }),
    ).toMatchInlineSnapshot(`
      {
        "amount": "5000",
        "currency": "EUR",
        "expires": "2030-06-15T12:00:00Z",
      }
    `)
  })

  test('error: missing expires field', () => {
    expect(() =>
      Intent.authorize.schema.request.parse({
        amount: '5000',
        currency: 'EUR',
      }),
    ).toThrowErrorMatchingInlineSnapshot(`
      [$ZodError: [
        {
          "expected": "string",
          "code": "invalid_type",
          "path": [
            "expires"
          ],
          "message": "Invalid input"
        }
      ]]
    `)
  })

  test('error: invalid expires', () => {
    expect(() =>
      Intent.authorize.schema.request.parse({
        amount: '5000',
        currency: 'EUR',
        expires: 'invalid',
      }),
    ).toThrowErrorMatchingInlineSnapshot(`
      [$ZodError: [
        {
          "origin": "string",
          "code": "invalid_format",
          "format": "regex",
          "pattern": "/^\\\\d{4}-\\\\d{2}-\\\\d{2}T\\\\d{2}:\\\\d{2}:\\\\d{2}(?:\\\\.\\\\d+)?(?:Z|[+-]\\\\d{2}:\\\\d{2})$/",
          "path": [
            "expires"
          ],
          "message": "Invalid ISO 8601 datetime"
        }
      ]]
    `)
  })
})

describe('subscription', () => {
  test('behavior: validates valid request with named period', () => {
    expect(
      Intent.subscription.schema.request.parse({
        amount: '999',
        currency: 'USD',
        period: 'month',
      }),
    ).toMatchInlineSnapshot(`
      {
        "amount": "999",
        "currency": "USD",
        "period": "month",
      }
    `)
  })

  test('behavior: validates valid request with seconds period', () => {
    expect(
      Intent.subscription.schema.request.parse({
        amount: '999',
        currency: 'USD',
        period: '86400',
      }),
    ).toMatchInlineSnapshot(`
      {
        "amount": "999",
        "currency": "USD",
        "period": "86400",
      }
    `)
  })

  test('behavior: validates all named periods', () => {
    for (const period of ['day', 'week', 'month', 'year']) {
      expect(
        Intent.subscription.schema.request.parse({
          amount: '100',
          currency: 'USD',
          period,
        }),
      ).toMatchObject({ period })
    }
  })

  test('error: invalid period', () => {
    expect(() =>
      Intent.subscription.schema.request.parse({
        amount: '999',
        currency: 'USD',
        period: 'biweekly',
      }),
    ).toThrowErrorMatchingInlineSnapshot(`
      [$ZodError: [
        {
          "origin": "string",
          "code": "invalid_format",
          "format": "regex",
          "pattern": "/^(day|week|month|year|\\\\d+)$/",
          "path": [
            "period"
          ],
          "message": "Invalid period"
        }
      ]]
    `)
  })

  test('behavior: validates cycles as positive integer', () => {
    expect(
      Intent.subscription.schema.request.parse({
        amount: '999',
        currency: 'USD',
        period: 'month',
        cycles: 12,
      }),
    ).toMatchInlineSnapshot(`
      {
        "amount": "999",
        "currency": "USD",
        "cycles": 12,
        "period": "month",
      }
    `)
  })

  test('error: cycles as zero', () => {
    expect(() =>
      Intent.subscription.schema.request.parse({
        amount: '999',
        currency: 'USD',
        period: 'month',
        cycles: 0,
      }),
    ).toThrowErrorMatchingInlineSnapshot(`
      [$ZodError: [
        {
          "code": "custom",
          "path": [
            "cycles"
          ],
          "message": "Must be positive integer"
        }
      ]]
    `)
  })

  test('error: cycles as negative', () => {
    expect(() =>
      Intent.subscription.schema.request.parse({
        amount: '999',
        currency: 'USD',
        period: 'month',
        cycles: -1,
      }),
    ).toThrowErrorMatchingInlineSnapshot(`
      [$ZodError: [
        {
          "code": "custom",
          "path": [
            "cycles"
          ],
          "message": "Must be positive integer"
        }
      ]]
    `)
  })

  test('error: cycles as decimal', () => {
    expect(() =>
      Intent.subscription.schema.request.parse({
        amount: '999',
        currency: 'USD',
        period: 'month',
        cycles: 1.5,
      }),
    ).toThrowErrorMatchingInlineSnapshot(`
      [$ZodError: [
        {
          "code": "custom",
          "path": [
            "cycles"
          ],
          "message": "Must be positive integer"
        }
      ]]
    `)
  })
})
