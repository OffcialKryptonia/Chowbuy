# ChowBuy

| Folder | What it is | Deploys to |
|---|---|---|
| `site/` | Website, Admin Console (`/admin`), Merchant Dashboard (`/merchant`), payment-link page (`/pay`) | Cloudflare Pages |
| `customer-app/` | Customer mobile app (Expo / React Native) and the Supabase backend (`supabase/`) | EAS Build / Supabase |

## Website (Cloudflare Pages)
Connect this repo in Cloudflare Pages: Workers & Pages, Create, Pages, Connect to Git.
- Framework preset: None
- Build command: (leave empty)
- Build output directory: `site`

Every push to `main` redeploys the site. Other branches get preview URLs.

## Customer app
See `customer-app/README.md` and `customer-app/docs/SUPABASE.md`.

## Secrets
Never commit API keys, service-role keys, `google-services.json` or `.env` files. Provider keys are entered in Admin and stored in Supabase, not in this repo.
