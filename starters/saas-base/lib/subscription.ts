// @ts-nocheck
// TODO: Fix this when we turn strict mode on.
import { pricingData } from "@/config/subscriptions";
import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe";
import { UserSubscriptionPlan } from "types";

export async function getUserSubscriptionPlan(
  userId: string
): Promise<UserSubscriptionPlan> {
  if(!userId) throw new Error("Missing parameters");

  const supabase = await createClient();
  const { data: user, error } = await supabase
    .from("profiles")
    .select("stripe_subscription_id, stripe_current_period_end, stripe_customer_id, stripe_price_id")
    .eq("id", userId)
    .single();

  if (error || !user) {
    throw new Error("User not found")
  }

  // Check if user is on a paid plan.
  const isPaid =
    user.stripe_price_id &&
    user.stripe_current_period_end &&
    new Date(user.stripe_current_period_end).getTime() + 86_400_000 > Date.now() ? true : false;

  // Find the pricing data corresponding to the user's plan
  const userPlan =
    pricingData.find((plan) => plan.stripeIds.monthly === user.stripe_price_id) ||
    pricingData.find((plan) => plan.stripeIds.yearly === user.stripe_price_id);

  const plan = isPaid && userPlan ? userPlan : pricingData[0]

  const interval = isPaid
    ? userPlan?.stripeIds.monthly === user.stripe_price_id
      ? "month"
      : userPlan?.stripeIds.yearly === user.stripe_price_id
      ? "year"
      : null
    : null;

  let isCanceled = false;
  if (isPaid && user.stripe_subscription_id) {
    const stripePlan = await stripe.subscriptions.retrieve(
      user.stripe_subscription_id
    )
    isCanceled = stripePlan.cancel_at_period_end
  }

  return {
    ...plan,
    stripeSubscriptionId: user.stripe_subscription_id,
    stripeCurrentPeriodEnd: user.stripe_current_period_end ? new Date(user.stripe_current_period_end).getTime() : undefined,
    stripeCustomerId: user.stripe_customer_id,
    stripePriceId: user.stripe_price_id,
    isPaid,
    interval,
    isCanceled
  }
}
