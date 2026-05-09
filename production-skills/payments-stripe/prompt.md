# Stripe Subscription Payments Skill

## Objective

Implement complete Stripe subscription payments with:
- Stripe Checkout for new subscriptions
- Webhooks for payment events
- Customer portal for subscription management
- Database tracking of subscription status

## Prerequisites

Before using this skill, ensure:
1. ✅ Prisma User model exists (will be extended with Stripe fields)
2. ✅ Stripe account created with products/prices configured
3. ✅ Next.js 14+ with App Router

## Implementation Steps

### Step 1: Install Dependencies

```bash
pnpm add stripe
```

### Step 2: Extend Prisma User Model

Add to existing `User` model in `prisma/schema.prisma`:

```prisma
model User {
  // ... existing fields ...

  stripeCustomerId       String?   @unique @map(name: "stripe_customer_id")
  stripeSubscriptionId   String?   @unique @map(name: "stripe_subscription_id")
  stripePriceId          String?   @map(name: "stripe_price_id")
  stripeCurrentPeriodEnd DateTime? @map(name: "stripe_current_period_end")
}
```

Run migration:
```bash
pnpm prisma db push
```

### Step 3: Create Stripe Client

**File: `lib/stripe.ts`**

```typescript
import Stripe from "stripe";
import { env } from "@/env.mjs";

export const stripe = new Stripe(env.STRIPE_API_KEY, {
  apiVersion: "2024-04-10",
  typescript: true,
});
```

### Step 4: Create Subscription Helper

**File: `lib/subscription.ts`**

```typescript
import { pricingData } from "@/config/subscriptions";
import { prisma } from "@/lib/db";
import { stripe } from "@/lib/stripe";
import { UserSubscriptionPlan } from "types";

export async function getUserSubscriptionPlan(
  userId: string
): Promise<UserSubscriptionPlan> {
  if (!userId) throw new Error("Missing parameters");

  const user = await prisma.user.findFirst({
    where: { id: userId },
    select: {
      stripeSubscriptionId: true,
      stripeCurrentPeriodEnd: true,
      stripeCustomerId: true,
      stripePriceId: true,
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  // Check if user is on a paid plan
  const isPaid =
    user.stripePriceId &&
    user.stripeCurrentPeriodEnd?.getTime() + 86_400_000 > Date.now();

  // Find the pricing data corresponding to the user's plan
  const userPlan =
    pricingData.find((plan) => plan.stripeIds.monthly === user.stripePriceId) ||
    pricingData.find((plan) => plan.stripeIds.yearly === user.stripePriceId);

  const plan = isPaid && userPlan ? userPlan : pricingData[0];

  const interval = isPaid
    ? userPlan?.stripeIds.monthly === user.stripePriceId
      ? "month"
      : "year"
    : null;

  let isCanceled = false;
  if (isPaid && user.stripeSubscriptionId) {
    const stripePlan = await stripe.subscriptions.retrieve(
      user.stripeSubscriptionId
    );
    isCanceled = stripePlan.cancel_at_period_end;
  }

  return {
    ...plan,
    ...user,
    stripeCurrentPeriodEnd: user.stripeCurrentPeriodEnd?.getTime(),
    isPaid,
    interval,
    isCanceled,
  };
}
```

### Step 5: Create Pricing Configuration

**File: `config/subscriptions.ts`**

```typescript
import { SubscriptionPlan } from "types";
import { env } from "@/env.mjs";

export const pricingData: SubscriptionPlan[] = [
  {
    title: "Starter",
    description: "For Beginners",
    benefits: ["Basic features", "Limited support"],
    prices: { monthly: 0, yearly: 0 },
    stripeIds: { monthly: null, yearly: null },
  },
  {
    title: "Pro",
    description: "Unlock Advanced Features",
    benefits: ["All features", "Priority support"],
    prices: { monthly: 15, yearly: 144 },
    stripeIds: {
      monthly: env.NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PLAN_ID,
      yearly: env.NEXT_PUBLIC_STRIPE_PRO_YEARLY_PLAN_ID,
    },
  },
];
```

### Step 6: Create Server Actions

**File: `actions/generate-user-stripe.ts`**

```typescript
"use server";

import { auth } from "@/auth";
import { stripe } from "@/lib/stripe";
import { getUserSubscriptionPlan } from "@/lib/subscription";
import { absoluteUrl } from "@/lib/utils";
import { redirect } from "next/navigation";

const billingUrl = absoluteUrl("/pricing");

export async function generateUserStripe(priceId: string) {
  const session = await auth();
  const user = session?.user;

  if (!user || !user.email || !user.id) {
    throw new Error("Unauthorized");
  }

  const subscriptionPlan = await getUserSubscriptionPlan(user.id);

  if (subscriptionPlan.isPaid && subscriptionPlan.stripeCustomerId) {
    // User on Paid Plan - Create portal session
    const stripeSession = await stripe.billingPortal.sessions.create({
      customer: subscriptionPlan.stripeCustomerId,
      return_url: billingUrl,
    });

    redirect(stripeSession.url as string);
  } else {
    // User on Free Plan - Create checkout session
    const stripeSession = await stripe.checkout.sessions.create({
      success_url: billingUrl,
      cancel_url: billingUrl,
      payment_method_types: ["card"],
      mode: "subscription",
      billing_address_collection: "auto",
      customer_email: user.email,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      metadata: {
        userId: user.id,
      },
    });

    redirect(stripeSession.url as string);
  }
}
```

**File: `actions/open-customer-portal.ts`**

```typescript
"use server";

import { auth } from "@/auth";
import { stripe } from "@/lib/stripe";
import { absoluteUrl } from "@/lib/utils";
import { redirect } from "next/navigation";

const billingUrl = absoluteUrl("/dashboard/billing");

export async function openCustomerPortal(userStripeId: string) {
  const session = await auth();

  if (!session?.user || !session?.user.email) {
    throw new Error("Unauthorized");
  }

  if (userStripeId) {
    const stripeSession = await stripe.billingPortal.sessions.create({
      customer: userStripeId,
      return_url: billingUrl,
    });

    redirect(stripeSession.url as string);
  }
}
```

### Step 7: Create Webhook Handler

**File: `app/api/webhooks/stripe/route.ts`**

```typescript
import { headers } from "next/headers";
import Stripe from "stripe";

import { env } from "@/env.mjs";
import { prisma } from "@/lib/db";
import { stripe } from "@/lib/stripe";

export async function POST(req: Request) {
  const body = await req.text();
  const signature = headers().get("Stripe-Signature") as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      env.STRIPE_WEBHOOK_SECRET
    );
  } catch (error) {
    return new Response(`Webhook Error: ${error.message}`, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    const subscription = await stripe.subscriptions.retrieve(
      session.subscription as string
    );

    await prisma.user.update({
      where: { id: session?.metadata?.userId },
      data: {
        stripeSubscriptionId: subscription.id,
        stripeCustomerId: subscription.customer as string,
        stripePriceId: subscription.items.data[0].price.id,
        stripeCurrentPeriodEnd: new Date(
          subscription.current_period_end * 1000
        ),
      },
    });
  }

  if (event.type === "invoice.payment_succeeded") {
    const session = event.data.object as Stripe.Invoice;

    if (session.billing_reason !== "subscription_create") {
      const subscription = await stripe.subscriptions.retrieve(
        session.subscription as string
      );

      await prisma.user.update({
        where: { stripeSubscriptionId: subscription.id },
        data: {
          stripePriceId: subscription.items.data[0].price.id,
          stripeCurrentPeriodEnd: new Date(
            subscription.current_period_end * 1000
          ),
        },
      });
    }
  }

  return new Response(null, { status: 200 });
}
```

### Step 8: Environment Variables

Add to `.env.local`:

```env
# Stripe
STRIPE_API_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PLAN_ID="price_..."
NEXT_PUBLIC_STRIPE_PRO_YEARLY_PLAN_ID="price_..."
```

### Step 9: Create TypeScript Types

**File: `types/index.d.ts`**

```typescript
export type SubscriptionPlan = {
  title: string;
  description: string;
  benefits: string[];
  prices: {
    monthly: number;
    yearly: number;
  };
  stripeIds: {
    monthly: string | null;
    yearly: string | null;
  };
};

export type UserSubscriptionPlan = SubscriptionPlan & {
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  stripePriceId?: string | null;
  stripeCurrentPeriodEnd?: number | null;
  isPaid: boolean;
  interval: "month" | "year" | null;
  isCanceled: boolean;
};
```

## Usage Patterns

### Pricing Page with Checkout

```typescript
import { generateUserStripe } from "@/actions/generate-user-stripe";

export default function PricingPage() {
  return (
    <form action={() => generateUserStripe("price_...")}>
      <button type="submit">Subscribe to Pro</button>
    </form>
  );
}
```

### Check Subscription Status

```typescript
import { auth } from "@/auth";
import { getUserSubscriptionPlan } from "@/lib/subscription";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) return null;

  const plan = await getUserSubscriptionPlan(session.user.id);

  return (
    <div>
      <p>Plan: {plan.title}</p>
      <p>Status: {plan.isPaid ? "Active" : "Free"}</p>
    </div>
  );
}
```

## Stripe Setup Guide

### 1. Create Products and Prices

1. Go to https://dashboard.stripe.com/test/products
2. Create product "Pro Monthly"
   - Price: $15/month recurring
   - Copy price ID (starts with `price_`)
3. Create product "Pro Yearly"
   - Price: $144/year recurring
   - Copy price ID

### 2. Configure Webhook

1. Go to https://dashboard.stripe.com/test/webhooks
2. Add endpoint: `https://yourdomain.com/api/webhooks/stripe`
3. Select events:
   - `checkout.session.completed`
   - `invoice.payment_succeeded`
4. Copy webhook signing secret (starts with `whsec_`)

### 3. Test Locally with Stripe CLI

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward webhooks to local
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Use test card: 4242 4242 4242 4242
```

## Quality Gates

Before marking this skill as complete, verify:

1. ✅ **TypeScript Check**: `pnpm tsc --noEmit` passes
2. ✅ **Webhook Test**: Stripe CLI receives events
3. ✅ **Database**: User table has Stripe fields
4. ✅ **Checkout**: Creates session and redirects to Stripe
5. ✅ **Subscription**: Webhook updates database correctly
6. ✅ **Portal**: Customer portal link works

## Common Issues

### Issue: Webhook signature verification fails

**Solution**: Ensure `STRIPE_WEBHOOK_SECRET` matches the webhook endpoint secret, not the API key.

### Issue: Subscription not updating in database

**Solution**: Check webhook logs in Stripe dashboard. Ensure webhook URL is accessible publicly.

### Issue: Price ID not found

**Solution**: Verify price IDs in `.env.local` match Stripe dashboard product prices.

## Testing Checklist

- [ ] Checkout session creates successfully
- [ ] Webhook receives checkout.session.completed
- [ ] User record updated with subscription data
- [ ] Customer portal opens correctly
- [ ] Subscription renewal triggers invoice.payment_succeeded
- [ ] Canceled subscription shows isCanceled: true

## References

- Stripe Docs: https://stripe.com/docs
- Stripe Testing Cards: https://stripe.com/docs/testing
- Stripe CLI: https://stripe.com/docs/stripe-cli
