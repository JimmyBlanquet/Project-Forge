import { headers } from "next/headers";
import Stripe from "stripe";

import { env } from "@/env.mjs";
import { createServiceClient } from "@/lib/supabase/service";
import { stripe } from "@/lib/stripe";

export async function POST(req: Request) {
  const body = await req.text();
  const signature = headers().get("Stripe-Signature") as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      env.STRIPE_WEBHOOK_SECRET,
    );
  } catch (error) {
    return new Response(`Webhook Error: ${error.message}`, { status: 400 });
  }

  // Use service role client for admin operations (bypasses RLS)
  const supabase = createServiceClient();

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    // Retrieve the subscription details from Stripe.
    const subscription = await stripe.subscriptions.retrieve(
      session.subscription as string,
    );

    // Update the user stripe info in our database.
    // Since this is the initial subscription, we need to update
    // the subscription id and customer id.
    const { error } = await supabase
      .from("profiles")
      .update({
        stripe_subscription_id: subscription.id,
        stripe_customer_id: subscription.customer as string,
        stripe_price_id: subscription.items.data[0].price.id,
        stripe_current_period_end: new Date(
          subscription.current_period_end * 1000,
        ).toISOString(),
      })
      .eq("id", session?.metadata?.userId);

    if (error) {
      console.error("Error updating user subscription:", error);
      return new Response(`Database Error: ${error.message}`, { status: 500 });
    }
  }

  if (event.type === "invoice.payment_succeeded") {
    const session = event.data.object as Stripe.Invoice;

    // If the billing reason is not subscription_create, it means the customer has updated their subscription.
    // If it is subscription_create, we don't need to update the subscription id and it will handle by the checkout.session.completed event.
    if (session.billing_reason != "subscription_create") {
      // Retrieve the subscription details from Stripe.
      const subscription = await stripe.subscriptions.retrieve(
        session.subscription as string,
      );

      // Update the price id and set the new period end.
      const { error } = await supabase
        .from("profiles")
        .update({
          stripe_price_id: subscription.items.data[0].price.id,
          stripe_current_period_end: new Date(
            subscription.current_period_end * 1000,
          ).toISOString(),
        })
        .eq("stripe_subscription_id", subscription.id);

      if (error) {
        console.error("Error updating subscription renewal:", error);
        return new Response(`Database Error: ${error.message}`, { status: 500 });
      }
    }
  }

  return new Response(null, { status: 200 });
}
