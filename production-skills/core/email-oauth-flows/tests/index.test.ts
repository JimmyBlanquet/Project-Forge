/**
 * Tests for main exports
 */

import { describe, it, expect } from 'vitest'
import {
  signInWithGmail,
  sendGmailEmail,
  listGmailMessages,
  signInWithOutlook,
  sendOutlookEmail,
  listOutlookMessages,
  getEmailAccessToken,
  isTokenExpired,
  storeEmailConnection,
} from '../src'

describe('email-oauth-flows exports', () => {
  it('exports Gmail functions', () => {
    expect(signInWithGmail).toBeDefined()
    expect(typeof signInWithGmail).toBe('function')
    expect(sendGmailEmail).toBeDefined()
    expect(typeof sendGmailEmail).toBe('function')
    expect(listGmailMessages).toBeDefined()
    expect(typeof listGmailMessages).toBe('function')
  })

  it('exports Outlook functions', () => {
    expect(signInWithOutlook).toBeDefined()
    expect(typeof signInWithOutlook).toBe('function')
    expect(sendOutlookEmail).toBeDefined()
    expect(typeof sendOutlookEmail).toBe('function')
    expect(listOutlookMessages).toBeDefined()
    expect(typeof listOutlookMessages).toBe('function')
  })

  it('exports token management functions', () => {
    expect(getEmailAccessToken).toBeDefined()
    expect(typeof getEmailAccessToken).toBe('function')
    expect(isTokenExpired).toBeDefined()
    expect(typeof isTokenExpired).toBe('function')
    expect(storeEmailConnection).toBeDefined()
    expect(typeof storeEmailConnection).toBe('function')
  })
})
