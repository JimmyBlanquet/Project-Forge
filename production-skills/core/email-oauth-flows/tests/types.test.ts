/**
 * Tests for type definitions
 */

import { describe, it, expect } from 'vitest'
import type {
  EmailProvider,
  GmailScope,
  OutlookScope,
  OAuthSignInOptions,
  SendEmailOptions,
  ListGmailMessagesOptions,
  ListOutlookMessagesOptions,
  EmailMessage,
  TokenResponse,
  ApiResponse,
} from '../src/types'

describe('types', () => {
  it('EmailProvider accepts valid values', () => {
    const google: EmailProvider = 'google'
    const azure: EmailProvider = 'azure'
    expect(google).toBe('google')
    expect(azure).toBe('azure')
  })

  it('GmailScope accepts valid values', () => {
    const send: GmailScope = 'gmail.send'
    const modify: GmailScope = 'gmail.modify'
    const readonly: GmailScope = 'gmail.readonly'
    const compose: GmailScope = 'gmail.compose'
    expect(send).toBe('gmail.send')
    expect(modify).toBe('gmail.modify')
    expect(readonly).toBe('gmail.readonly')
    expect(compose).toBe('gmail.compose')
  })

  it('OutlookScope accepts valid values', () => {
    const send: OutlookScope = 'Mail.Send'
    const read: OutlookScope = 'Mail.Read'
    const readWrite: OutlookScope = 'Mail.ReadWrite'
    expect(send).toBe('Mail.Send')
    expect(read).toBe('Mail.Read')
    expect(readWrite).toBe('Mail.ReadWrite')
  })

  it('OAuthSignInOptions has correct structure', () => {
    const options: OAuthSignInOptions = {
      redirectTo: 'http://localhost:3000/callback',
      scopes: ['gmail.send'],
    }
    expect(options.redirectTo).toBeDefined()
    expect(options.scopes).toBeDefined()
  })

  it('SendEmailOptions has correct structure', () => {
    const options: SendEmailOptions = {
      accessToken: 'token',
      to: 'test@example.com',
      subject: 'Test',
      body: 'Test body',
    }
    expect(options.accessToken).toBeDefined()
    expect(options.to).toBeDefined()
    expect(options.subject).toBeDefined()
    expect(options.body).toBeDefined()
  })

  it('EmailMessage has correct structure', () => {
    const message: EmailMessage = {
      id: '123',
      subject: 'Test',
      from: 'sender@example.com',
      to: ['recipient@example.com'],
      date: new Date(),
      snippet: 'Preview text',
    }
    expect(message.id).toBeDefined()
    expect(message.subject).toBeDefined()
    expect(message.from).toBeDefined()
    expect(message.to).toBeDefined()
    expect(message.date).toBeDefined()
  })

  it('TokenResponse has correct structure', () => {
    const response: TokenResponse = {
      accessToken: 'token',
      refreshToken: 'refresh',
      error: null,
    }
    expect(response.accessToken).toBeDefined()
    expect(response.error).toBeNull()
  })

  it('ApiResponse has correct structure', () => {
    const response: ApiResponse = {
      data: { test: 'data' },
      error: null,
    }
    expect(response.data).toBeDefined()
    expect(response.error).toBeNull()
  })
})
