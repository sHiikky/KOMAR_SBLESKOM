/* ============================================================
   leaderboard.js — Supabase лидерборд для Василий-прыгун
   Подключить в index.html: <script src="leaderboard.js"></script>
   ============================================================ */

const SUPABASE_URL = 'https://pghaqyyomljttnzbgazd.supabase.co';
const SUPABASE_KEY = 'sb_publishable_qUizYEF_QykJCjJlCDQWng_YyoFgTXj';

// URL Edge Function (submit защищён на сервере)
const EDGE_SUBMIT_URL = SUPABASE_URL + '/functions/v1/clever-endpoint';

// ── Фильтр мата (RU + EN) ────────────────────────────────────
const BAD_WORDS = [
  // RU
  'хуй','хуя','хую','хуем','хуев','хуйня','пизд','пизда','пиздец','пизде',
  'пиздой','пизду','ёбан','ёбаный','ёбать','еба','ебал','ебат','ебаный',
  'ебать','ёб','еб','бляд','блядь','блять','блядина','ёблан','шлюх','шлюха',
  'мудак','мудила','мудаки','залупа','залупу','залупой','сука','суки','суку',
  'пидор','пидар','пидорас','гандон','гандоны','уёбок','уебок','уебище',
  'ублюдок','ублюдки','дрочит','дрочер','дрочила','манда','мандой',
  'нахуй','нахуя','нахер','нахрен','похуй','похуя','похер',
  'ёптвоюмать','ёптвоюмать','ёпт','ёпта','бля','бляха',
  // EN
  'fuck','fuckin','fucking','fucker','fuckoff','fck','shit','shitting',
  'bitch','bitches','cunt','cunts','ass','asshole','assholes',
  'cock','cocks','dick','dicks','pussy','pussies','whore','whores',
  'nigger','nigga','faggot','fag','retard','retarded','bastard',
];

function containsBadWord(str) {
  const lower = str.toLowerCase().replace(/\s+/g,'');
  return BAD_WORDS.some(w => lower.includes(w));
}

// ── Объект Leaderboard ───────────────────────────────────────
const Leaderboard = {

  // Отправка результата через Edge Function (защищённо)
  async submit(userId, username, score) {
    if (!score || score <= 0) return;

    // Сначала пробуем облако
    try {
      const res = await fetch(EDGE_SUBMIT_URL, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ userId, username, score })
      });
      if (res.ok) {
        console.info('[Leaderboard] submit ok');
        return;
      }
      console.warn('[Leaderboard] submit HTTP', res.status);
    } catch (e) {
      console.warn('[Leaderboard] submit сеть недоступна, локальный фолбэк:', e);
    }

    // Локальный фолбэк (виден только на этом устройстве)
    const list = this._local();
    const cur  = list.find(r => r.userId === userId);
    if (cur) { if (score > cur.score) { cur.score = score; cur.username = username; } }
    else list.push({ userId, username, score });
    this._saveLocal(list);
  },

  // Получение топ-N (читаем напрямую из Supabase — чтение публично)
  async top(n = 10) {
    try {
      const url = `${SUPABASE_URL}/rest/v1/leaderboard` +
                  `?select=user_id,username,score` +
                  `&order=score.desc` +
                  `&limit=${n}`;
      const res = await fetch(url, {
        headers: {
          'apikey':        SUPABASE_KEY,
          'Authorization': 'Bearer ' + SUPABASE_KEY
        }
      });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const rows = await res.json();
      // Приводим к формату { userId, username, score }
      return rows.map(r => ({ userId: r.user_id, username: r.username, score: r.score }));
    } catch (e) {
      console.warn('[Leaderboard] top error, локальный фолбэк:', e);
      return this._local().sort((a, b) => b.score - a.score).slice(0, n);
    }
  },

  // Заглушка init() — для совместимости с вызовом Leaderboard.init() в index.html
  init() {},

  _local()      { try { return JSON.parse(localStorage.getItem('vj_leaderboard') || '[]'); } catch(e){ return []; } },
  _saveLocal(l) { try { localStorage.setItem('vj_leaderboard', JSON.stringify(l)); } catch(e){} }
};
