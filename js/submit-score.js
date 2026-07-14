// ============================================================
// EDGE FUNCTION: submit-score
// Supabase Dashboard → Edge Functions → New Function
// Назвать функцию: submit-score
// Вставить весь этот код
// ============================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL      = 'https://pghaqyyomljttnzbgazd.supabase.co';
const SUPABASE_SERVICE  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

// Максимально допустимый счёт (с запасом над реальным максимумом ~9999)
const MAX_SCORE = 15000;

const corsHeaders = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req) => {
  // Preflight CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  const { userId, username, score } = body;

  // --- Валидация ---
  if (!userId || typeof userId !== 'string' || userId.length > 80) {
    return new Response(JSON.stringify({ error: 'Invalid userId' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  if (!username || typeof username !== 'string') {
    return new Response(JSON.stringify({ error: 'Invalid username' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  if (typeof score !== 'number' || score <= 0 || score > MAX_SCORE || !Number.isInteger(score)) {
    return new Response(JSON.stringify({ error: 'Invalid score' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  // Санитайзинг никнейма: обрезаем, убираем управляющие символы
  const cleanUsername = username.trim().slice(0, 24).replace(/[<>&"]/g, '');
  if (!cleanUsername) {
    return new Response(JSON.stringify({ error: 'Empty username' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  // --- Supabase с service_role (пишет в обход RLS) ---
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE);

  // Читаем текущий рекорд игрока
  const { data: existing, error: readErr } = await supabase
    .from('leaderboard')
    .select('score')
    .eq('user_id', userId)
    .maybeSingle();

  if (readErr) {
    console.error('read error:', readErr);
    return new Response(JSON.stringify({ error: 'DB read error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  const prevScore = existing?.score ?? 0;

  // Обновляем только если новый счёт выше
  if (score <= prevScore) {
    return new Response(JSON.stringify({ updated: false, reason: 'not_better' }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  const { error: writeErr } = await supabase
    .from('leaderboard')
    .upsert({
      user_id:    userId,
      username:   cleanUsername,
      score:      score,
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id' });

  if (writeErr) {
    console.error('write error:', writeErr);
    return new Response(JSON.stringify({ error: 'DB write error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  return new Response(JSON.stringify({ updated: true }), {
    status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
});
