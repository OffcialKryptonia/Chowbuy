# ChowBuy

**Fast. Fresh. Reliable.**

ChowBuy is a Nigerian food-delivery and quick-commerce platform concept connecting customers with restaurants, grocery stores, pharmacies, convenience stores and local vendors. The project brings customer ordering, merchant operations and delivery workflows into one digital commerce experience.

> This repository contains the website, operational dashboards and customer application source. Review the individual project documentation before configuring or deploying any component.

## Repository structure

| Path | Purpose | Deployment / runtime |
|---|---|---|
| `site/` | Public website, Admin Console (`/admin`), Merchant Dashboard (`/merchant`) and payment-link page (`/pay`) | Cloudflare Pages |
| `customer-app/` | Customer mobile application | Expo / React Native; EAS Build |
| `customer-app/supabase/` | Supabase project assets and backend configuration | Supabase |

## Getting started

1. Clone this repository.
2. Review the README and setup documentation inside the component you intend to work on.
3. Configure the required environment variables and service credentials locally.
4. Run the relevant component using its documented development commands.

### Website deployment (Cloudflare Pages)

- Connect this repository to Cloudflare Pages.
- Framework preset: **None**.
- Build command: leave empty.
- Build output directory: `site`.
- Pushes to `main` trigger production deployments; other branches can be used for previews.

### Customer application

See:
- `customer-app/README.md`
- `customer-app/docs/SUPABASE.md`

## Security

- Never commit API keys, access tokens, service-role keys, signing credentials, `google-services.json`, or populated `.env` files.
- Use environment-specific secrets and least-privilege credentials.
- Provider keys are configured through the application's intended administrative/backend flow; do not hard-code secrets into client code.
- Review access policies and backend permissions before production deployment.

## Project status

The repository contains multiple application surfaces. Feature completeness, production readiness and deployment status should be verified per component rather than inferred from the repository structure.

## Contributing

Keep changes focused, document new configuration, and include relevant test or build evidence with pull requests.

---

Built and maintained as part of the Kryptonia technology portfolio.
