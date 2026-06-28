import { describe, expect, it } from 'vitest'
import { isAllowedLocalOrigin } from './security.js'

describe('local origin guard', () => {
  it('allows non-browser local clients without an Origin header', () => {
    expect(isAllowedLocalOrigin(undefined, 43218)).toBe(true)
  })

  it('allows the local canvas page on the configured port', () => {
    expect(isAllowedLocalOrigin('http://127.0.0.1:43218', 43218)).toBe(true)
    expect(isAllowedLocalOrigin('http://localhost:43218', 43218)).toBe(true)
  })

  it('rejects remote origins and mismatched local ports', () => {
    expect(isAllowedLocalOrigin('https://example.com', 43218)).toBe(false)
    expect(isAllowedLocalOrigin('http://127.0.0.1:3000', 43218)).toBe(false)
    expect(isAllowedLocalOrigin('not a url', 43218)).toBe(false)
  })
})
