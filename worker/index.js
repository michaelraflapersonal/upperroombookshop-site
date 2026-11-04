// Cloudflare Worker entry. Static pages come from dist/ (Workers static assets,
// which also apply src/_redirects and src/_headers). Only /api/* reaches this code.
import { onRequestPost, onRequest } from '../functions/api/contact.js';

export default {
  async fetch(request, env, ctx) {
    const { pathname } = new URL(request.url);
    if (pathname === '/api/contact') {
      return request.method === 'POST' ? onRequestPost({ request, env, ctx }) : onRequest();
    }
    return env.ASSETS.fetch(request);
  },
};
