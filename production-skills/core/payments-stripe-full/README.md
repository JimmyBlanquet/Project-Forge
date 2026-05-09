# Payments Stripe Full

Production-ready Stripe integration for Next.js with webhooks, subscriptions, and checkout.

## Features

- ✅ Stripe Checkout (one-time & subscriptions)
- ✅ Webhook handling with signature verification
- ✅ Subscription management (create, update, cancel)
- ✅ Customer portal integration
- ✅ Idempotent operations
- ✅ Full TypeScript support
- ✅ Latest Stripe API (2025-12-15.clover)

## Installation

```bash
npm install stripe
npm install -D @project-forge/payments-stripe-full
```

## Quick Start

See `SKILL.md` for full documentation.

```typescript
import { createCheckoutSession } from '@project-forge/payments-stripe-full'

const session = await createCheckoutSession(config, {
  userId: 'user-123',
  priceId: 'price_monthly',
  successUrl: '/success',
  cancelUrl: '/cancel',
})
```

## License

MIT
