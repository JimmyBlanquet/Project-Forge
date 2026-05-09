---
name: payments-stripe-full
description: Production-ready Stripe integration for Next.js with webhooks, subscriptions, checkout sessions, and secure payment handling. Includes webhook verification, idempotency, and comprehensive error handling.
effort: high
license: MIT
---

# Payments Stripe Full

Complete Stripe payment integration for Next.js applications with webhooks, subscriptions, checkout, and production-ready security patterns.

## When to Use

Use this skill when building Next.js SaaS applications that need:
- Stripe Checkout for one-time or subscription payments
- Webhook handling with signature verification
- Subscription management (create, update, cancel)
- Customer portal integration
- Idempotent payment operations
- Secure API key management

**Don't use this skill if:**
- You need a different payment provider (PayPal, Square, etc.)
- You only need client-side Stripe Elements (no server integration)
- Your app doesn't handle recurring subscriptions

## Stack

- Next.js 14+ (App Router)
- Stripe API (stripe npm package)
- TypeScript (strict mode)
- Webhook signature verification
- Supabase/PostgreSQL (for customer/subscription sync)

## Quick Start

### 1. Install Dependencies

```bash
npm install stripe
npm install -D @project-forge/payments-stripe-full
```

### 2. Setup Environment Variables

```bash
# .env.local
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Database
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Create Configuration

```typescript
// lib/stripe/config.ts
export const stripeConfig = {
  secretKey: process.env.STRIPE_SECRET_KEY!,
  publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET!,
}
```

### 4. Create Checkout Session

```typescript
import { createCheckoutSession } from '@project-forge/payments-stripe-full'

export async function POST(request: NextRequest) {
  const userId = await getUserId(request)

  const session = await createCheckoutSession(stripeConfig, {
    userId,
    priceId: 'price_1234...', // Stripe Price ID
    successUrl: `${process.env.NEXT_PUBLIC_URL}/success`,
    cancelUrl: `${process.env.NEXT_PUBLIC_URL}/cancel`,
  })

  return NextResponse.json({ sessionId: session.id })
}
```

### 5. Handle Webhooks

```typescript
import { handleWebhook } from '@project-forge/payments-stripe-full/webhooks'

export async function POST(request: NextRequest) {
  const payload = await request.text()
  const signature = request.headers.get('stripe-signature')!

  const result = await handleWebhook(stripeConfig, {
    payload,
    signature,
    handlers: {
      'checkout.session.completed': async (event) => {
        // Update database with successful payment
        const session = event.data.object
        await updateUserSubscription(session.customer, session.subscription)
      },
      'customer.subscription.deleted': async (event) => {
        // Handle subscription cancellation
        const subscription = event.data.object
        await cancelUserSubscription(subscription.customer)
      },
    },
  })

  return NextResponse.json(result)
}
```

## Key Features

### Secure Webhook Verification

Verifies Stripe webhook signatures to prevent fraud:

```typescript
const event = stripe.webhooks.constructEvent(
  payload,
  signature,
  webhookSecret
)
// Only processes verified events
```

### Idempotent Operations

Prevents duplicate payments using idempotency keys:

```typescript
await stripe.paymentIntents.create(
  { amount, currency, customer },
  { idempotencyKey: `payment-${userId}-${timestamp}` }
)
```

### Checkout Sessions

Create secure checkout sessions for one-time or subscription payments:

```typescript
const session = await createCheckoutSession(config, {
  userId: 'user-123',
  priceId: 'price_monthly',
  mode: 'subscription', // or 'payment'
  successUrl: '/success',
  cancelUrl: '/cancel',
  metadata: { userId: 'user-123' }, // Custom metadata
})
```

### Subscription Management

Full subscription lifecycle management:

```typescript
// Create subscription
const sub = await createSubscription(config, {
  customerId: 'cus_123',
  priceId: 'price_monthly',
})

// Update subscription
await updateSubscription(config, {
  subscriptionId: 'sub_123',
  newPriceId: 'price_annual',
})

// Cancel subscription
await cancelSubscription(config, {
  subscriptionId: 'sub_123',
  immediately: false, // Cancel at period end
})
```

### Customer Management

Create and sync Stripe customers:

```typescript
const customer = await createCustomer(config, {
  email: user.email,
  name: user.name,
  metadata: { userId: user.id },
})

// Sync to database
await db.users.update({
  where: { id: user.id },
  data: { stripeCustomerId: customer.id },
})
```

### Customer Portal

Generate customer portal links:

```typescript
const portalSession = await createCustomerPortalSession(config, {
  customerId: 'cus_123',
  returnUrl: `${process.env.NEXT_PUBLIC_URL}/account`,
})

// Redirect user to portalSession.url
```

## Core API

### Checkout

#### `createCheckoutSession(config, options)`

Create a Stripe Checkout session.

**Parameters:**
- `config` - Stripe configuration `{ secretKey, publishableKey }`
- `options`:
  - `userId` - User ID (stored in metadata)
  - `priceId` - Stripe Price ID
  - `mode` - 'subscription' | 'payment'
  - `successUrl` - Redirect after success
  - `cancelUrl` - Redirect on cancel
  - `customerId?` - Existing Stripe Customer ID
  - `metadata?` - Custom metadata

**Returns:** `Promise<Stripe.Checkout.Session>`

### Subscriptions

#### `createSubscription(config, options)`

Create a subscription for an existing customer.

**Parameters:**
- `config` - Stripe configuration
- `options`:
  - `customerId` - Stripe Customer ID
  - `priceId` - Stripe Price ID
  - `metadata?` - Custom metadata

#### `updateSubscription(config, options)`

Update an existing subscription (e.g., upgrade/downgrade).

#### `cancelSubscription(config, options)`

Cancel a subscription (immediate or at period end).

### Customers

#### `createCustomer(config, options)`

Create a Stripe customer.

#### `getCustomer(config, customerId)`

Retrieve customer details.

#### `updateCustomer(config, customerId, updates)`

Update customer information.

### Webhooks

#### `handleWebhook(config, options)`

Handle and verify Stripe webhooks.

**Parameters:**
- `config` - Stripe configuration with `webhookSecret`
- `options`:
  - `payload` - Raw webhook body (string)
  - `signature` - Stripe signature header
  - `handlers` - Event handlers object

**Example:**
```typescript
await handleWebhook(config, {
  payload,
  signature,
  handlers: {
    'payment_intent.succeeded': async (event) => { ... },
    'customer.subscription.updated': async (event) => { ... },
  },
})
```

## Webhook Events

Common webhook events to handle:

### Checkout
- `checkout.session.completed` - Payment successful
- `checkout.session.expired` - Session expired

### Subscriptions
- `customer.subscription.created` - New subscription
- `customer.subscription.updated` - Subscription changed
- `customer.subscription.deleted` - Subscription cancelled
- `invoice.paid` - Recurring payment successful
- `invoice.payment_failed` - Recurring payment failed

### Payments
- `payment_intent.succeeded` - One-time payment successful
- `payment_intent.payment_failed` - Payment failed
- `charge.refunded` - Payment refunded

## Database Schema

Recommended database schema for storing Stripe data:

```sql
-- Add to users table
ALTER TABLE users ADD COLUMN stripe_customer_id TEXT UNIQUE;

-- Subscriptions table
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    stripe_subscription_id TEXT NOT NULL UNIQUE,
    stripe_customer_id TEXT NOT NULL,
    status TEXT NOT NULL, -- active, canceled, past_due, etc.
    price_id TEXT NOT NULL,
    current_period_start TIMESTAMPTZ NOT NULL,
    current_period_end TIMESTAMPTZ NOT NULL,
    cancel_at_period_end BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payments table (optional, for tracking one-time payments)
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    stripe_payment_intent_id TEXT NOT NULL UNIQUE,
    amount INTEGER NOT NULL, -- Amount in cents
    currency TEXT NOT NULL DEFAULT 'usd',
    status TEXT NOT NULL, -- succeeded, pending, failed
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Security Best Practices

### 1. Webhook Signature Verification

Always verify webhook signatures:

```typescript
try {
  const event = stripe.webhooks.constructEvent(
    payload,
    signature,
    webhookSecret
  )
} catch (err) {
  return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
}
```

### 2. Never Expose Secret Keys

Use environment variables, never commit keys:

```typescript
// ✅ Good
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

// ❌ Bad
const stripe = new Stripe('sk_live_hardcoded')
```

### 3. Use Test Mode in Development

```bash
# Development
STRIPE_SECRET_KEY=sk_test_...

# Production
STRIPE_SECRET_KEY=sk_live_...
```

### 4. Validate Event Types

Only handle expected webhook events:

```typescript
const allowedEvents = [
  'checkout.session.completed',
  'customer.subscription.deleted',
]

if (!allowedEvents.includes(event.type)) {
  return NextResponse.json({ received: true })
}
```

### 5. Idempotency

Use idempotency keys for payment operations:

```typescript
const idempotencyKey = `${userId}-${Date.now()}`
await stripe.paymentIntents.create(..., { idempotencyKey })
```

## Testing

The skill includes comprehensive tests:

```bash
npm test
npm test -- --coverage
```

Test coverage includes:
- Checkout session creation
- Subscription lifecycle
- Webhook verification
- Error handling
- Idempotency

## Examples

The skill includes 5 production examples:

1. **Basic Checkout** (`examples/01-basic-checkout.ts`)
   - Create checkout session
   - Handle success/cancel

2. **Subscription Flow** (`examples/02-subscription-flow.ts`)
   - Create subscription
   - Upgrade/downgrade
   - Cancel

3. **Webhook Handler** (`examples/03-webhook-handler.ts`)
   - Verify webhooks
   - Handle common events
   - Database sync

4. **Customer Portal** (`examples/04-customer-portal.ts`)
   - Generate portal link
   - Self-service management

5. **Usage-Based Billing** (`examples/05-usage-based.ts`)
   - Metered billing
   - Usage reporting
   - Invoice generation

## Troubleshooting

**Webhook signature verification fails?**
- Ensure you're using raw request body (not parsed JSON)
- Verify webhook secret matches Stripe dashboard
- Check signature header is being passed correctly

**Customer not found?**
- Create customer before creating subscriptions
- Store Stripe Customer ID in your database
- Handle missing customers gracefully

**Subscription not updating?**
- Check subscription status in Stripe dashboard
- Verify webhook is being received
- Check database sync logic

## Performance

- Checkout session creation: ~200-500ms
- Webhook processing: ~50-100ms
- Subscription operations: ~300-600ms
- Customer creation: ~200-400ms

## Best Practices

1. **Always verify webhooks** - Never trust unverified webhook data
2. **Use metadata** - Store user IDs in Stripe metadata for easy linking
3. **Handle failed payments** - Implement retry logic and notify users
4. **Test webhooks** - Use Stripe CLI for local webhook testing
5. **Monitor webhook delivery** - Set up alerts for failed webhooks
6. **Use customer portal** - Let users manage their own subscriptions
7. **Implement idempotency** - Prevent duplicate charges
8. **Keep prices in Stripe** - Don't hardcode pricing in your app

## License

MIT - See LICENSE file for details

---

**Documentation Version:** 1.0.0
**Last Updated:** 2026-01-17
**Skill Compatibility:** Claude Code 2.1+, Claude Desktop, Claude.ai Pro/Max
