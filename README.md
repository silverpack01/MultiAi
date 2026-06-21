# MultiAI Orbit

Run the site with a small proxy so the OpenRouter API key stays on the server.

## Setup

1. Set the environment variable `OPENROUTER_API_KEY` on your machine.
2. For local testing, run `npm start`.
3. Open `http://localhost:3000` in your browser.

## Netlify deploy

1. Push this folder to GitHub or connect it directly in Netlify.
2. In Netlify site settings, add the environment variable `OPENROUTER_API_KEY`.
3. If you want a custom referer header, add `OPENROUTER_REFERER` with your deployed site URL.
4. Deploy the site. Netlify will serve the static pages and run the function at `/api/chat`.

## Notes

- The orbit tabs open separate chat pages.
- The chat page sends requests to `/api/chat`, which Netlify rewrites to a function.
- Vision and audio tabs use text prompts with different system instructions; they are not true audio/video input models.