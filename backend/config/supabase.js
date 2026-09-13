const { createClient } = require('@supabase/supabase-js');
const config = require('./index');

const supabase = createClient(config.SUPABASE_URL, config.SUPABASE_ANON_KEY);

module.exports = supabase;
