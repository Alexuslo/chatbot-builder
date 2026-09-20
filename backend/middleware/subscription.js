const config = require('../config');
const supabase = require('../config/supabase');

const PLAN_LIMITS = {
  free: { documents: 1, messages: 100, widget: false },
  pro: { documents: Infinity, messages: Infinity, widget: true }
};

const stripeCache = new Map();
const CACHE_TTL = 60 * 60 * 1000;

async function getSubscription(userId) {
  const { data } = await supabase
    .from('subscriptions')
    .select('plan, stripe_subscription_id')
    .eq('user_id', userId)
    .single();
  
  // If has Stripe subscription, verify it's still active
  if (data?.plan === 'pro' && data?.stripe_subscription_id && 
      data.stripe_subscription_id !== 'mock_subscription') {
    
    const cached = stripeCache.get(data.stripe_subscription_id);
    if (cached && Date.now() - cached.time < CACHE_TTL) {
      return cached.plan;
    }

    try {
      const Stripe = require('stripe');
      const stripe = new Stripe(config.STRIPE_SECRET_KEY, { apiVersion: '2024-12-18.acacia' });
      const subscription = await stripe.subscriptions.retrieve(data.stripe_subscription_id);
      
      const isActive = subscription.status === 'active' || subscription.status === 'trialing';
      const plan = isActive ? 'pro' : 'free';
      
      stripeCache.set(data.stripe_subscription_id, { plan, time: Date.now() });
      
      if (!isActive) {
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
      .eq('user_id', userId)
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
