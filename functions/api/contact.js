// Contact form handler: POST /api/contact
// 1. Checks the Cloudflare Turnstile token (spam check).
// 2. Emails the message to info@ through Resend, with Reply-To set to the visitor.
//
// Settings (Cloudflare Pages > Settings > Variables and Secrets):
//   TURNSTILE_SECRET_KEY  secret  from Cloudflare Turnstile
//   RESEND_API_KEY        secret  from resend.com
//   CONTACT_TO            text    where messages go, e.g. info@upperroombookshop.com
//   CONTACT_FROM          text    verified sender, e.g. "Upper Room website <website@upperroombookshop.com>"

const MAX = { name: 120, email: 200, loc: 60, topic: 160, message: 5000 };

export async function onRequestPost({ request, env }) {
  const wantsJson = (request.headers.get('Accept') || '').includes('application/json');
  const reply = (ok, status = ok ? 200 : 400) =>
    wantsJson
      ? Response.json({ ok }, { status })
      : Response.redirect(new URL(ok ? '/contact?sent=1#top' : '/contact?error=1#top', request.url), 303);

  let form;
  try {
    form = await request.formData();
  } catch {
    return reply(false);
  }
  const get = (k) => String(form.get(k) || '').trim().slice(0, MAX[k] || 200);
  const name = get('name'), email = get('email'), loc = get('loc'), message = get('message');
  const topic = get('topic'); // set by the Books & gifts page, e.g. "Please put aside: <title>"

  // Honeypot: real people never fill this hidden field. Pretend success so bots move on.
  if (String(form.get('website') || '').trim()) return reply(true);
  if (!name || !message || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return reply(false);

  // Spam check
  const verify = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    body: new URLSearchParams({
      secret: env.TURNSTILE_SECRET_KEY || '1x0000000000000000000000000000000AA', // Cloudflare's always-pass test secret
      response: String(form.get('cf-turnstile-response') || ''),
      remoteip: request.headers.get('CF-Connecting-IP') || '',
    }),
  }).then((r) => r.json()).catch(() => ({ success: false }));
  if (!verify.success) return reply(false);

  if (!env.RESEND_API_KEY || !env.CONTACT_TO || !env.CONTACT_FROM) {
    console.error('Contact form is missing RESEND_API_KEY, CONTACT_TO or CONTACT_FROM');
    return reply(false, 500);
  }

  const esc = (s) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const subject = topic ? `${topic} (from ${name})` : `Website message from ${name}${loc ? ` (${loc})` : ''}`;
  const text = `Name: ${name}\nEmail: ${email}\nWhich Upper Room: ${loc || '-'}\n\n${message}\n\n-- Sent from the contact form on upperroombookshop.com. Reply to this email to answer ${name}.`;
  const htmlBody = `<p><strong>Name:</strong> ${esc(name)}<br><strong>Email:</strong> ${esc(email)}<br><strong>Which Upper Room:</strong> ${esc(loc || '-')}</p>`
    + `<p style="white-space:pre-wrap">${esc(message)}</p>`
    + `<p style="color:#777;font-size:13px">Sent from the contact form on upperroombookshop.com. Reply to this email to answer ${esc(name)}.</p>`;

  const sent = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: env.CONTACT_FROM,
      to: env.CONTACT_TO.split(',').map((s) => s.trim()),
      reply_to: email,
      subject,
      text,
      html: htmlBody,
    }),
  });
  if (!sent.ok) {
    console.error('Resend error', sent.status, await sent.text());
    return reply(false, 502);
  }
  return reply(true);
}

export function onRequest() {
  return new Response('Method not allowed', { status: 405, headers: { Allow: 'POST' } });
}
