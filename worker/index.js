// Cloudflare Worker entry. Static pages come from dist/ (Workers static assets,
// which also apply src/_redirects and src/_headers). Only /api/* and /books/* reach this code.
import { onRequestPost, onRequest } from '../functions/api/contact.js';
import { onRequestReviews } from './reviews.js';
import { onRequestCatalogue, onRequestShelfPage } from './catalogue.js';

export default {
  async fetch(request, env, ctx) {
    const { pathname } = new URL(request.url);
    if (pathname === '/api/contact') {
      return request.method === 'POST' ? onRequestPost({ request, env, ctx }) : onRequest();
    }
    if (pathname === '/api/reviews' && request.method === 'GET') return onRequestReviews({ request, env, ctx });
    if (pathname === '/api/catalogue' && request.method === 'GET') return onRequestCatalogue({ request, env, ctx });
    if (pathname.startsWith('/books/') && request.method === 'GET') return onRequestShelfPage({ request, env, ctx });
    return env.ASSETS.fetch(request);
  },
};
