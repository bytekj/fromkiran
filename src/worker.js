// Worker entry point. Pages are static; only /api/* reaches this code
// (see run_worker_first in wrangler.jsonc).

const REACTIONS = {
  bhavlay: 'भावलं',
  patlay: 'पटलं',
  vichar: 'विचार करायला लावलं',
};

const LIMITS = { name: 80, email: 254, message: 2000, minMessage: 5, title: 300, slug: 200 };
const MAX_BODY_BYTES = 12 * 1024;
const MIN_FILL_MS = 2000; // a human takes longer than this to write a letter
const PER_IP_PER_HOUR = 5;
const PER_DAY_TOTAL = 100;

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });

const clean = (v, max) => (typeof v === 'string' ? v.replace(/\r\n/g, '\n').trim().slice(0, max) : '');
const oneLine = (v, max) => clean(v, max).replace(/\s+/g, ' ');
const EMAIL_RE = /^[^@\s<>"]+@[^@\s<>"]+\.[^@\s<>"]+$/;

const escapeHtml = (s) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

async function sha256Hex(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function originAllowed(request, env) {
  const origin = request.headers.get('origin');
  if (!origin) return true; // same-origin form posts from some browsers omit it
  if (origin === new URL(request.url).origin) return true; // the site posting to itself (also covers preview URLs)
  const allowed = (env.SITE_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean);
  if (allowed.includes(origin)) return true;
  const { hostname } = new URL(origin);
  return hostname === 'localhost' || hostname === '127.0.0.1';
}

async function handleFeedback(request, env, ctx) {
  if (request.method !== 'POST') return json({ ok: false, error: 'method' }, 405);
  if (!originAllowed(request, env)) return json({ ok: false, error: 'origin' }, 403);

  const raw = await request.text();
  if (raw.length > MAX_BODY_BYTES) return json({ ok: false, error: 'too_large' }, 413);

  let body;
  try {
    body = JSON.parse(raw);
  } catch {
    return json({ ok: false, error: 'bad_json' }, 400);
  }
  if (!body || typeof body !== 'object') return json({ ok: false, error: 'bad_json' }, 400);

  // Bots: the hidden "website" field is filled in, or the form was "written" in under 2 seconds.
  // Pretend it worked so they don't adapt.
  if (clean(body.website, 50) || Number(body.elapsed) < MIN_FILL_MS) return json({ ok: true });

  const name = oneLine(body.name, LIMITS.name);
  const email = oneLine(body.email, LIMITS.email);
  const message = clean(body.message, LIMITS.message);
  const slug = oneLine(body.slug, LIMITS.slug).replace(/[^a-zA-Z0-9\-_/]/g, '');
  const title = oneLine(body.title, LIMITS.title) || slug;
  const reactionKey = typeof body.reaction === 'string' && body.reaction in REACTIONS ? body.reaction : '';

  const fields = {};
  if (!name) fields.name = 'required';
  if (email && !EMAIL_RE.test(email)) fields.email = 'invalid';
  if (message.length < LIMITS.minMessage) fields.message = 'too_short';
  if (!slug) fields.slug = 'required';
  if (Object.keys(fields).length) return json({ ok: false, error: 'invalid', fields }, 400);

  // Rate limits. Only a salted hash of the IP is stored, never the address itself.
  const ip = request.headers.get('cf-connecting-ip') || 'unknown';
  const ipHash = (await sha256Hex(`${env.IP_SALT || 'fromkiran-letters'}:${ip}`)).slice(0, 32);
  const hourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const counts = await env.DB.prepare(
    `SELECT
       (SELECT COUNT(*) FROM letters WHERE ip_hash = ?1 AND created_at > ?2) AS per_ip,
       (SELECT COUNT(*) FROM letters WHERE created_at > ?3) AS per_day`,
  )
    .bind(ipHash, hourAgo, dayAgo)
    .first();
  if (counts.per_ip >= PER_IP_PER_HOUR || counts.per_day >= PER_DAY_TOTAL) {
    return json({ ok: false, error: 'rate_limited' }, 429);
  }

  // Store first, so a letter is never lost even if the email fails.
  const inserted = await env.DB.prepare(
    `INSERT INTO letters (essay_slug, essay_title, name, email, message, reaction, ip_hash)
     VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7) RETURNING id`,
  )
    .bind(slug, title, name, email || null, message, reactionKey || null, ipHash)
    .first();

  const emailTask = notifyAuthor(env, { id: inserted.id, slug, title, name, email, message, reactionKey });
  ctx.waitUntil(emailTask);

  return json({ ok: true });
}

async function notifyAuthor(env, letter) {
  const { id, slug, title, name, email, message, reactionKey } = letter;
  const reaction = reactionKey ? REACTIONS[reactionKey] : '';
  const link = `https://fromkiran.com/essays/${slug.replace(/^\/+|\/+$/g, '')}/`;

  const text = [
    `लेख: ${title}`,
    link,
    '',
    `कोणाकडून: ${name}${email ? ` <${email}>` : ' (ईमेल दिलेला नाही)'}`,
    reaction ? `प्रतिक्रिया: ${reaction}` : null,
    '',
    message,
    '',
    email ? 'या ईमेलला थेट उत्तर दिल्यास ते वाचकाला जाईल.' : 'वाचकाने ईमेल दिलेला नाही, त्यामुळे उत्तर देता येणार नाही.',
  ]
    .filter((l) => l !== null)
    .join('\n');

  const html = `<div style="font-family:system-ui,sans-serif;font-size:16px;line-height:1.6;color:#222">
<p style="margin:0 0 4px;color:#666">लेख</p>
<p style="margin:0 0 14px"><a href="${escapeHtml(link)}">${escapeHtml(title)}</a></p>
<p style="margin:0 0 4px;color:#666">कोणाकडून</p>
<p style="margin:0 0 14px">${escapeHtml(name)}${email ? ` &lt;${escapeHtml(email)}&gt;` : ' (ईमेल दिलेला नाही)'}</p>
${reaction ? `<p style="margin:0 0 14px">प्रतिक्रिया: <b>${escapeHtml(reaction)}</b></p>` : ''}
<div style="white-space:pre-wrap;border-left:3px solid #ecbdca;padding:4px 0 4px 14px">${escapeHtml(message)}</div>
<p style="margin:18px 0 0;color:#888;font-size:13px">${email ? 'या ईमेलला थेट उत्तर दिल्यास ते वाचकाला जाईल.' : 'वाचकाने ईमेल दिलेला नाही.'}</p>
</div>`;

  const msg = {
    to: env.NOTIFY_TO,
    from: { email: env.MAIL_FROM, name: 'fromkiran.com पत्रपेटी' },
    subject: `नवीन पत्र: ${title} — ${name}`.slice(0, 200),
    text,
    html,
  };
  if (email) msg.replyTo = { email, name };

  try {
    await env.EMAIL.send(msg);
    await env.DB.prepare('UPDATE letters SET email_sent = 1 WHERE id = ?1').bind(id).run();
  } catch (err) {
    // The letter is already saved; email_sent stays 0 so it is easy to find later.
    console.error('letter email failed', id, err && err.code, err && err.message);
  }
}

export default {
  async fetch(request, env, ctx) {
    const { pathname } = new URL(request.url);
    if (pathname === '/api/feedback') {
      try {
        return await handleFeedback(request, env, ctx);
      } catch (err) {
        console.error('feedback error', err && err.message);
        return json({ ok: false, error: 'server' }, 500);
      }
    }
    if (pathname.startsWith('/api/')) return json({ ok: false, error: 'not_found' }, 404);
    return env.ASSETS.fetch(request);
  },
};
