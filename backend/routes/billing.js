const express = require('express');
const Stripe = require('stripe');
const { createClient } = require('@supabase/supabase-js');

const router = express.Router();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_mock', {
  apiVersion: '2024-12-18.acacia'
});

const auth = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return res.status(401).json({ error: 'Invalid token' });
  req.user = user;
  next();
};

router.post('/create-checkout', auth, async (req, res) => {
  try {
    const { priceId } = req.body;

    if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY === 'sk_test_mock') {
      await supabase.from('subscriptions').upsert({
        user_id: req.user.id,
        plan: 'pro',
        stripe_customer_id: 'mock_customer',
        stripe_subscription_id: 'mock_subscription'
      });
      return res.json({ url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard?upgraded=true` });
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.API_URL || 'http://localhost:3001'}/api/billing/checkout-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/pricing`,
      metadata: { user_id: req.user.id }
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY === 'sk_test_mock') {
    return res.json({ received: true });
  }

  const sig = req.headers['stripe-signature'];
  try {
    const event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
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

router.get('/checkout-success', async (req, res) => {
  try {
    const { session_id } = req.query;
    if (!session_id) return res.redirect(`${process.env.FRONTEND_URL}/dashboard`);

    const session = await stripe.checkout.sessions.retrieve(session_id);
    
    if (session.status === 'complete' && session.payment_status === 'paid') {
      const userId = session.metadata?.user_id;
      if (userId) {
        await supabase.from('subscriptions').upsert({
          user_id: userId,
          plan: 'pro',
          stripe_customer_id: session.customer,
          stripe_subscription_id: session.subscription,
          updated_at: new Date().toISOString()
        });
      }
    }

    res.redirect(`${process.env.FRONTEND_URL}/dashboard?upgraded=true`);
  } catch (error) {
    console.error('Checkout success error:', error);
    res.redirect(`${process.env.FRONTEND_URL}/dashboard`);
  }
});

router.get('/subscription', auth, async (req, res) => {
  const { data } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', req.user.id)
    .single();
  res.json(data || { plan: 'free' });
});

module.exports = router;
