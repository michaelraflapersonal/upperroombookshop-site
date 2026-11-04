// Cloudflare Worker entry. Static pages come from dist/ (Workers static assets,
// which also apply src/_redirects and src/_headers). Only /api/* reaches this code.
import { onRequestPost, onRequest } from '../functions/api/contact.js';
import { onRequestReviews } from './reviews.js';

export default {
  async fetch(request, env, ctx) {
    const { pathname } = new URL(request.url);
    if (pathname === '/api/contact') {
      return request.method === 'POST' ? onRequestPost({ request, env, ctx }) : onRequest();
    }
    if (pathname === '/api/reviews' && request.method === 'GET') return onRequestReviews({ request, env, ctx });
    return env.ASSETS.fetch(request);
  },
};
