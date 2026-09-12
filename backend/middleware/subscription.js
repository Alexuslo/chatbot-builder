const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

const PLAN_LIMITS = {
  free: { documents: 1, messages: 100, widget: false },
  pro: { documents: Infinity, messages: Infinity, widget: true }
};

async function getSubscription(userId) {
  const { data } = await supabase
    .from('subscriptions')
    .select('plan, stripe_subscription_id')
    .eq('user_id', userId)
    .single();
  
  // If has Stripe subscription, verify it's still active
  if (data?.plan === 'pro' && data?.stripe_subscription_id && 
      data.stripe_subscription_id !== 'mock_subscription') {
    try {
      const Stripe = require('stripe');
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-12-18.acacia' });
      const subscription = await stripe.subscriptions.retrieve(data.stripe_subscription_id);
      if (subscription.status !== 'active' && subscription.status !== 'trialing') {
        // Downgrade to free
        await supabase.from('subscriptions').update({
          plan: 'free',
          updated_at: new Date().toISOString()
        }).eq('user_id', userId);
        return 'free';
      }
    } catch (e) {
      // If Stripe check fails, trust the DB value
    }
  }
  
  return data?.plan || 'free';
}

async function checkLimit(userId, type) {
  const plan = await getSubscription(userId);
  const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.free;

  if (type === 'document') {
    const { count } = await supabase
      .from('documents')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);
    return { allowed: count < limits.documents, remaining: limits.documents - count, plan };
  }

  if (type === 'message') {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const { count } = await supabase
      .from('chat_messages')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'user')
      .gte('created_at', startOfMonth.toISOString());
    return { allowed: count < limits.messages, remaining: limits.messages - count, plan };
  }

  if (type === 'widget') {
    return { allowed: limits.widget, plan };
  }

  return { allowed: true, plan };
}

function subscriptionCheck(type) {
  return async (req, res, next) => {
    try {
      const result = await checkLimit(req.user.id, type);
      req.subscription = result;
      if (!result.allowed) {
        return res.status(403).json({ 
          error: `${type} limit reached`,
          plan: result.plan,
          upgrade: true
        });
      }
      next();
    } catch (error) {
      next(error);
    }
  };
}

module.exports = { getSubscription, checkLimit, subscriptionCheck, PLAN_LIMITS };
