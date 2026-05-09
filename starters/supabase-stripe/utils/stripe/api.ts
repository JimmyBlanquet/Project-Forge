import { Stripe } from 'stripe';
import { db } from '../db/db';
import { usersTable } from '../db/schema';
import { eq } from "drizzle-orm";


const stripeKey = process.env.STRIPE_SECRET_KEY;
const isStripeConfigured = stripeKey && stripeKey.startsWith('sk_');

export const stripe = isStripeConfigured ? new Stripe(stripeKey) : null;
const PUBLIC_URL = process.env.NEXT_PUBLIC_WEBSITE_URL || "http://localhost:3000"

function getStripeOrThrow(): Stripe {
    if (!stripe) {
        throw new Error("Stripe is not configured. Set a valid STRIPE_SECRET_KEY (starting with sk_) in your environment.");
    }
    return stripe;
}

export async function getStripePlan(email: string) {
    if (!stripe) {
        return "Free";
    }
    try {
        const user = await db.select().from(usersTable).where(eq(usersTable.email, email))
        if (!user[0] || user[0].plan === "none") {
            return "Free";
        }
        const subscription = await stripe.subscriptions.retrieve(user[0].plan);
        const productId = subscription.items.data[0].plan.product as string
        const product = await stripe.products.retrieve(productId)
        return product.name
    } catch {
        return "Free";
    }
}

export async function createStripeCustomer(id: string, email: string, name?: string) {
    const s = getStripeOrThrow();
    const customer = await s.customers.create({
        name: name ? name : "",
        email: email,
        metadata: {
            supabase_id: id
        }
    });
    // Create a new customer in Stripe
    return customer.id
}

export async function createStripeCheckoutSession(email: string) {
    const s = getStripeOrThrow();
    const user = await db.select().from(usersTable).where(eq(usersTable.email, email))
    const customerSession = await s.customerSessions.create({
        customer: user[0].stripe_id,
        components: {
            pricing_table: {
                enabled: true,
            },
        },
    });
    return customerSession.client_secret
}

export async function generateStripeBillingPortalLink(email: string) {
    const s = getStripeOrThrow();
    const user = await db.select().from(usersTable).where(eq(usersTable.email, email))
    const portalSession = await s.billingPortal.sessions.create({
        customer: user[0].stripe_id,
        return_url: `${PUBLIC_URL}/dashboard`,
    });
    return portalSession.url
}