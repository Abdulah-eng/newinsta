import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helper logging function for enhanced debugging
const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Webhook received");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    if (!webhookSecret) throw new Error("STRIPE_WEBHOOK_SECRET is not set");
    logStep("Environment variables verified");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    
    const body = await req.text();
    const signature = req.headers.get("stripe-signature");
    
    if (!signature) {
      throw new Error("No stripe signature found");
    }

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
      logStep("Event verified", { type: event.type, id: event.id });
    } catch (err) {
      logStep("Webhook signature verification failed", { error: err });
      return new Response("Webhook signature verification failed", { status: 400 });
    }

    // Handle different event types
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session, supabaseClient);
        break;
        
      case "customer.subscription.created":
        await handleSubscriptionCreated(event.data.object as Stripe.Subscription, supabaseClient);
        break;
        
      case "customer.subscription.updated":
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription, supabaseClient);
        break;
        
      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription, supabaseClient);
        break;
        
      case "invoice.payment_succeeded":
        await handlePaymentSucceeded(event.data.object as Stripe.Invoice, supabaseClient);
        break;
        
      case "invoice.payment_failed":
        await handlePaymentFailed(event.data.object as Stripe.Invoice, supabaseClient);
        break;
        
      default:
        logStep("Unhandled event type", { type: event.type });
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in stripe-webhook", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

async function handleCheckoutCompleted(session: Stripe.Checkout.Session, supabaseClient: any) {
  logStep("Handling checkout completed", { sessionId: session.id });
  
  if (session.mode === 'subscription') {
    const customerId = session.customer as string;
    const subscriptionId = session.subscription as string;
    
    // Get customer email
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY"), { apiVersion: "2023-10-16" });
    const customer = await stripe.customers.retrieve(customerId);
    const email = (customer as Stripe.Customer).email;
    
    if (!email) {
      logStep("No email found for customer", { customerId });
      return;
    }

    // Get user from profiles table
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('id, email')
      .eq('email', email)
      .single();

    if (profileError || !profile) {
      logStep("Profile not found", { email, error: profileError });
      return;
    }

    // Get subscription details
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const isTrial = subscription.status === "trialing";
    const subscriptionEnd = new Date(subscription.current_period_end * 1000).toISOString();

    // Update subscribers table
    await supabaseClient.from("subscribers").upsert({
      email: email,
      user_id: profile.id,
      stripe_customer_id: customerId,
      stripe_subscription_id: subscriptionId,
      subscribed: true,
      subscription_tier: "premium",
      subscription_end: subscriptionEnd,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'email' });

    // Update profile
    const profileUpdates: any = {
      navigate_to_portfolio: true,
      stripe_customer_id: customerId,
      stripe_subscription_id: subscriptionId,
      updated_at: new Date().toISOString(),
    };

    if (isTrial) {
      profileUpdates.trial_started_at = new Date().toISOString();
      profileUpdates.trial_ended_at = null;
    } else {
      profileUpdates.trial_ended_at = new Date().toISOString();
    }

    await supabaseClient
      .from('profiles')
      .update(profileUpdates)
      .eq('id', profile.id);

    logStep("Checkout completed processed", { 
      sessionId: session.id, 
      isTrial, 
      subscriptionEnd 
    });
  }
}

async function handleSubscriptionCreated(subscription: Stripe.Subscription, supabaseClient: any) {
  logStep("Handling subscription created", { subscriptionId: subscription.id });
  
  const customerId = subscription.customer as string;
  const customer = await stripe.customers.retrieve(customerId);
  const email = (customer as Stripe.Customer).email;
  
  if (!email) {
    logStep("No email found for customer", { customerId });
    return;
  }

  // Get user from profiles table
  const { data: profile, error: profileError } = await supabaseClient
    .from('profiles')
    .select('id, email')
    .eq('email', email)
    .single();

  if (profileError || !profile) {
    logStep("Profile not found", { email, error: profileError });
    return;
  }

  const isTrial = subscription.status === "trialing";
  const subscriptionEnd = new Date(subscription.current_period_end * 1000).toISOString();

  // Update subscribers table
  await supabaseClient.from("subscribers").upsert({
    email: email,
    user_id: profile.id,
    stripe_customer_id: customerId,
    stripe_subscription_id: subscription.id,
    subscribed: true, // Both trial and active subscriptions should be subscribed
    subscription_tier: "premium",
    subscription_end: subscriptionEnd,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'email' });

  // Update profile
  const profileUpdates: any = {
    navigate_to_portfolio: true,
    stripe_customer_id: customerId,
    stripe_subscription_id: subscription.id,
    updated_at: new Date().toISOString(),
  };

  if (isTrial) {
    profileUpdates.trial_started_at = new Date().toISOString();
    profileUpdates.trial_ended_at = null;
  } else {
    profileUpdates.trial_ended_at = new Date().toISOString();
  }

  await supabaseClient
    .from('profiles')
    .update(profileUpdates)
    .eq('id', profile.id);

  logStep("Subscription created processed", { 
    subscriptionId: subscription.id, 
    isTrial, 
    subscriptionEnd 
  });
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription, supabaseClient: any) {
  logStep("Handling subscription updated", { subscriptionId: subscription.id });
  
  const customerId = subscription.customer as string;
  const customer = await stripe.customers.retrieve(customerId);
  const email = (customer as Stripe.Customer).email;
  
  if (!email) {
    logStep("No email found for customer", { customerId });
    return;
  }

  const subscriptionEnd = new Date(subscription.current_period_end * 1000).toISOString();
  const isActive = subscription.status === "active";
  const isTrialing = subscription.status === "trialing";

  // Get user from profiles table to get user_id
  const { data: profile, error: profileError } = await supabaseClient
    .from('profiles')
    .select('id, email')
    .eq('email', email)
    .single();

  if (profileError || !profile) {
    logStep("Profile not found for subscription update", { email, error: profileError });
    return;
  }

  // Update subscribers table
  await supabaseClient.from("subscribers").upsert({
    email: email,
    user_id: profile.id,
    stripe_customer_id: customerId,
    stripe_subscription_id: subscription.id,
    subscribed: isActive || isTrialing, // Both active and trialing should be subscribed
    subscription_tier: isActive || isTrialing ? "premium" : null,
    subscription_end: subscriptionEnd,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'email' });

  // Update profile
  const profileUpdates: any = {
    navigate_to_portfolio: isActive || isTrialing,
    stripe_customer_id: customerId,
    stripe_subscription_id: subscription.id,
    updated_at: new Date().toISOString(),
  };

  if (isTrialing) {
    profileUpdates.trial_started_at = new Date().toISOString();
    profileUpdates.trial_ended_at = null;
  } else if (isActive) {
    profileUpdates.trial_ended_at = new Date().toISOString();
  }

  await supabaseClient
    .from('profiles')
    .update(profileUpdates)
    .eq('email', email);

  logStep("Subscription updated processed", { 
    subscriptionId: subscription.id, 
    isActive, 
    isTrialing,
    subscriptionEnd 
  });
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription, supabaseClient: any) {
  logStep("Handling subscription deleted", { subscriptionId: subscription.id });
  
  const customerId = subscription.customer as string;
  const customer = await stripe.customers.retrieve(customerId);
  const email = (customer as Stripe.Customer).email;
  
  if (!email) {
    logStep("No email found for customer", { customerId });
    return;
  }

  // Get user from profiles table to get user_id
  const { data: profile, error: profileError } = await supabaseClient
    .from('profiles')
    .select('id, email')
    .eq('email', email)
    .single();

  if (profileError || !profile) {
    logStep("Profile not found for subscription deletion", { email, error: profileError });
    return;
  }

  // Update subscribers table
  await supabaseClient.from("subscribers").upsert({
    email: email,
    user_id: profile.id,
    stripe_customer_id: customerId,
    stripe_subscription_id: null,
    subscribed: false,
    subscription_tier: null,
    subscription_end: null,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'email' });

  // Update profile
  await supabaseClient
    .from('profiles')
    .update({
      navigate_to_portfolio: false,
      trial_ended_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('email', email);

  logStep("Subscription deleted processed", { subscriptionId: subscription.id });
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice, supabaseClient: any) {
  logStep("Handling payment succeeded", { invoiceId: invoice.id });
  
  if (invoice.subscription) {
    const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
    await handleSubscriptionUpdated(subscription, supabaseClient);
  }
}

async function handlePaymentFailed(invoice: Stripe.Invoice, supabaseClient: any) {
  logStep("Handling payment failed", { invoiceId: invoice.id });
  
  if (invoice.subscription) {
    const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
    await handleSubscriptionUpdated(subscription, supabaseClient);
  }
}
