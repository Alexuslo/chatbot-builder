const express = require('express');
const Stripe = require('stripe');
const { stripeCache } = require('../middleware/subscription');
const auth = require('../middleware/auth');
const config = require('../config');
const supabase = require('../config/supabase');
const { errorResponse } = require('../utils/error');

const router = express.Router();

const stripe = new Stripe(config.STRIPE_SECRET_KEY || 'sk_test_mock', {
  apiVersion: '2024-12-18.acacia'
});

router.post('/create-checkout', auth, async (req, res) => {
  try {
    const { priceId } = req.body;

    if (!config.STRIPE_SECRET_KEY || config.STRIPE_SECRET_KEY === 'sk_test_mock') {
      await supabase.from('subscriptions').upsert({
        user_id: req.user.id,
        plan: 'pro',
        stripe_customer_id: 'mock_customer',
        stripe_subscription_id: 'mock_subscription'
      });
      return res.json({ url: `${config.FRONTEND_URL}/dashboard?upgraded=true` });
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${config.FRONTEND_URL}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${config.FRONTEND_URL}/pricing`,
      metadata: { user_id: req.user.id }
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error(error);
    errorResponse(res, 500, 'CHECKOUT_ERROR', 'Failed to create checkout session');
  }
});

router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  if (!config.STRIPE_SECRET_KEY || config.STRIPE_SECRET_KEY === 'sk_test_mock') {
    return res.json({ received: true });
  }

  const sig = req.headers['stripe-signature'];
  try {
    const event = stripe.webhooks.constructEvent(req.body, sig, config.STRIPE_WEBHOOK_SECRET);
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      await supabase.from('subscriptions').upsert({
        user_id: session.metadata.user_id,
        plan: 'pro',
        stripe_customer_id: session.customer,
        stripe_subscription_id: session.subscription,
        updated_at: new Date().toISOString()
      });
    }
    if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object;
      const { data: sub } = await supabase
        .from('subscriptions')
        .select('user_id')
        .eq('stripe_subscription_id', subscription.id)
        .single();
      if (sub) {
        await supabase.from('subscriptions').update({
          plan: 'free',
          updated_at: new Date().toISOString()
        }).eq('user_id', sub.user_id);
      }
    }
    if (event.type === 'customer.subscription.updated') {
      const subscription = event.data.object;
      const { data: sub } = await supabase
        .from('subscriptions')
        .select('user_id')
        .eq('stripe_subscription_id', subscription.id)
        .single();
      if (sub) {
        const isActive = subscription.status === 'active' || subscription.status === 'trialing';
        await supabase.from('subscriptions').update({
          plan: isActive ? 'pro' : 'free',
          updated_at: new Date().toISOString()
        }).eq('user_id', sub.user_id);
      }
    }
    res.json({ received: true });
  } catch (error) {
    res.status(400).send(`Webhook Error: ${error.message}`);
  }
});

router.get('/subscription', auth, async (req, res) => {
  res.set('Cache-Control', 'no-store');
  const { data } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', req.user.id)
    .single();
  res.json(data || { plan: 'free' });
});

router.post('/verify-checkout', auth, async (req, res) => {
  try {
    const { session_id } = req.body;
    if (!session_id) return res.status(400).json({ error: 'Missing session_id' });

    const session = await stripe.checkout.sessions.retrieve(session_id);

    if (session.status === 'complete' && session.payment_status === 'paid') {
      const userId = session.metadata?.user_id;
      if (userId && userId === req.user.id) {
        await supabase.from('subscriptions').upsert({
          user_id: userId,
          plan: 'pro',
          stripe_customer_id: session.customer,
          stripe_subscription_id: session.subscription,
          updated_at: new Date().toISOString()
        });
        stripeCache.set(session.subscription, { plan: 'pro', time: Date.now() });
        return res.json({ success: true });
      }
    }

    res.status(400).json({ error: 'Invalid session' });
  } catch (error) {
    console.error('Verify checkout error:', error);
    errorResponse(res, 500, 'VERIFY_ERROR', 'Failed to verify checkout');
  }
});

module.exports = router;
