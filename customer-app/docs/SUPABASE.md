# ChowBuy on Supabase

Supabase holds the accounts and the shared data (orders, wallets, chat, reviews). Cloudflare Pages keeps hosting the websites. They do not conflict: Pages serves static files, and the websites and the mobile app talk to Supabase over HTTPS.

```
Phone app ──────────┐
Sponsor page (Pages) ┼──▶ Supabase: Auth · Postgres (RLS) · Realtime · Storage · Edge Functions ──▶ Korapay / Pocketfi / Google / LiveKit
Admin + Merchant (Pages) ┘  (not wired yet, see "What is not done")
```

## What is tested and what is not

| Part | Status |
|---|---|
| `migrations/…core.sql` + `seed.sql` | Run against an in-memory Postgres (PGlite) with 59 checks: row-level security, no client writes to roles/points/wallets/orders, server-side pricing, delivery-code secrecy, chat screening, wallet send/tip/link, idempotent credits. |
| Storage bucket policies (end of the migration) | **Not executed** (PGlite has no storage schema). Check them in the dashboard after applying. |
| Edge Functions | Written and syntax-checked only. **Never run** against Supabase, Korapay or LiveKit. Expect small fixes on first deploy. |
| Pocketfi adapter | **Stub.** The URL, payload and webhook header are assumptions. Compare with your Pocketfi merchant docs before enabling it. |
| Mobile app | Typechecks and passes its logic tests. **Not run on a device against a live project.** |
| Admin / Merchant web consoles | Still demo (browser localStorage). Not connected to Supabase. |
| Agora calls, iOS Live Activities, parcel booking in live mode | Not implemented. |

> **Already done for you:** project `chowbuy` (ref `nhaxcyfkbrbwlqbpizjo`, eu-west-2) exists in the Kryptonia Group org with the schema and demo catalogue applied, and the `live` profile in `eas.json` points at it. Steps 1–2 below are for reference or for a second environment. Still to do: steps 3–7.

## 1. Create the project

1. supabase.com → New project. Pick the region closest to your users (Europe or South Africa for Nigeria). Save the database password.
2. Dashboard → **Project Settings → API**: copy the **Project URL** and the **publishable (anon) key**. The service-role key never goes in the app or the websites.

## 2. Load the schema

SQL editor → run, in order: `supabase/migrations/20261018000001_core.sql`, then `supabase/seed.sql` (sample stores and menus; replace with your real ones later).

Or with the CLI: `npx supabase link --project-ref <ref>` then `npx supabase db push`.

Then check **Database → Replication**: `orders`, `chat_messages`, `chat_locks`, `payment_links`, `wallets`, `profiles`, `rx_uploads` should be in the `supabase_realtime` publication, and **Storage** should show a private bucket `rx`.

## 3. Auth settings

Authentication → Providers → Email: on. For testing you can switch off "Confirm email"; for production leave it on and set **Site URL** to your website and add your app scheme to **Redirect URLs**. Use a real SMTP sender (Resend, Postmark, …) before launch, because the built-in mailer is heavily rate limited.

## 4. Make yourself the first admin

Create your account in the app (or Authentication → Users → Add user), then in the SQL editor:

```sql
update public.profiles set role = 'admin' where email = 'you@example.com';
```

Merchants and riders are set the same way (`role = 'merchant'`, and set `merchants.owner_id`; `role = 'rider'` plus a row in `riders` with `verified = true`). There is no client path to change a role.

## 5. Deploy the Edge Functions

```bash
npx supabase functions deploy payments-initiate payments-verify calls-token maps-directions admin-settings delete-account
npx supabase functions deploy webhook-korapay webhook-pocketfi payment-link --no-verify-jwt
npx supabase secrets set PAYMENT_REDIRECT_URL=https://chowbuy.ng/pay/done ALLOWED_ORIGIN=https://chowbuy.ng
```

(`supabase/config.toml` already marks the three public functions as `verify_jwt = false`.)

## 6. Gateway keys and public settings

Keys live in the `platform_secrets` table, which no app user can read. Until the Admin Console is connected, set them in the SQL editor (it runs as the database owner):

```sql
insert into public.platform_secrets (key, value, hint) values
  ('korapay_secret_key', 'sk_live_xxx', 'sk_l••••xxx'),
  ('google_directions_key', 'AIza…', 'AIza••••')
on conflict (key) do update set value = excluded.value, hint = excluded.hint, updated_at = now();
```

Other keys the functions read: `livekit_api_key`, `livekit_api_secret`, `pocketfi_base_url`, `pocketfi_secret_key`, `pocketfi_webhook_secret`.

Public, non-secret settings (what the app may see) are one JSON row:

```sql
insert into public.platform_settings (key, value) values ('public', '{
  "gateways": {"korapay": {"enabled": true, "publicKey": "pk_live_xxx", "live": true}, "pocketfi": {"enabled": false, "live": false},
               "cod": {"enabled": true, "maxAmount": 20000}, "wallet": {"enabled": true}},
  "realtime": {"provider": "livekit", "livekitUrl": "wss://YOUR.livekit.cloud"},
  "push": {"fcmEnabled": true}, "maps": {"directionsViaProxy": true}, "loyalty": {"reviewPoints": 50}
}') on conflict (key) do update set value = excluded.value;
```

**Korapay dashboard:** set the webhook URL to `https://<ref>.supabase.co/functions/v1/webhook-korapay`.

## 7. Sponsor payment-link page (Cloudflare Pages)

`site/pay/` in the website project serves `chowbuy.ng/p/<token>` (and `pay.chowbuy.ng/p/<token>` if you point that subdomain at the same Pages project; the `_redirects` file handles both). Edit `site/pay/config.js` and set `CHOWBUY_FUNCTIONS_URL` to `https://<ref>.supabase.co/functions/v1`. Redeploy Pages.

## 8. Point the app at it

For a quick install on your Android phone, edit the `live` profile in `eas.json` (project URL, publishable key), then:

```bash
npm install --legacy-peer-deps
npx eas-cli login
npx eas-cli build --platform android --profile live
```

For local runs copy `.env.example` to `.env`. With no `EXPO_PUBLIC_SUPABASE_URL` the app stays in demo mode.

## How the data is protected

- Clients can read only their own rows (row-level security) and never write orders, wallets, points or roles directly.
- Every change goes through a database function that checks who is calling: `place_order` recomputes prices from the catalogue and promo table, `complete_delivery` needs the customer's 4-digit code (riders cannot read it, five wrong tries lock it), `wallet_send` / `tip_rider` move money with row locks.
- Payments are confirmed server-side (Korapay webhook, re-verified with Korapay's API) and credited exactly once.
- Chat is screened on the server as well as in the app; admins can lock a chat or broadcast.
- Deleting an account is refused while the wallet is not empty or an order is active; past orders are kept without a name for financial records.

## What is not done

- **Admin and Merchant consoles** still use browser localStorage. They need a Supabase sign-in and to read and write the same tables (admin: settings, filters, chat supervision, broadcasts, prescriptions; merchant: menu and order stage). The database functions for these already exist (`merchant_set_stage`, `admin_chat_say`, `admin_chat_lock`, `admin_broadcast`, `admin-settings`).
- **Rider app:** the rider RPCs exist (`rider_accept`, `rider_set_stage`, `rider_move`, `complete_delivery`) but there is no rider client yet.
- **Unpaid card/transfer orders** stay in the customer's list as "awaiting payment" until paid; nothing cancels them automatically yet.
- **Parcel booking** is disabled in live mode because fares are computed on the phone and the server only accepts catalogue items.


## 9. Email, promotional push and social sign-in (added Oct 19)

Migrations `20261019000001_messaging.sql` and `20261019000002_oauth_profile.sql` (both already applied to the `chowbuy` project) add promotional opt-outs, the `broadcasts` log, audience counts, the `auth` flags in the public config and OAuth-friendly profile creation.

**Deploy the two new functions** (they are not deployed yet and have not been run against real providers):

```bash
npx supabase login
npx supabase link --project-ref nhaxcyfkbrbwlqbpizjo
npx supabase functions deploy admin-settings admin-broadcast
```

**Email.** In Admin, Settings, Email: connect the backend (project URL, publishable key, your admin sign-in), choose a provider (Resend, Amazon SES and Brevo are the suggested ones; SMTP, SendGrid, Mailgun and Postmark also work), set the sender, enter the key, save, then press Send test email. Keys are stored in `platform_secrets` and never returned. Your sending domain needs SPF and DKIM. Supabase's own sign-up and password-reset emails are separate: set SMTP under Supabase, Authentication, SMTP settings.

**Broadcast email and Push promotions** (Admin, Messaging): pick Customers, Drivers, Merchants or Select all, write the message (`{{first_name}}` works), send a test to yourself first, then send. People who switched off promotional email/push in the app (Profile, Notifications) are skipped. Push goes through the Expo push service (FCM on Android, APNs on iOS). For OneSignal, the REST key goes in Settings, Realtime & push. Android pushes also need `google-services.json` and an FCM credential uploaded to Expo; iOS needs an APNs key in your Expo account.

**Google sign-in** (Android and iOS): create a Web OAuth client in Google Cloud, paste the client ID and secret into Supabase, Authentication, Providers, Google, add `chowbuy://auth-callback` to the redirect URLs, then switch it on in Admin, Settings, Sign-in methods.

**Apple sign-in** (iOS only): enable Sign in with Apple for the app ID in your Apple Developer account, create a Services ID and key, enable the Apple provider in Supabase with the bundle ID `ng.chowbuy.customer` as an authorised client, rebuild the iOS app (capability is already in `app.json`), then switch it on in Admin. Apple requires this option when another third-party login is offered.

Both switches default to off, and the buttons only appear in the app while on. Accounts made this way have no mobile number, so Profile asks for one (needed for wallet transfers).

**Dynamic Island / Live Activities are not implemented.** Order tracking is the in-app tracking screen plus normal push notifications. Live Activities need a native iOS widget extension and a push-to-start flow; that is a separate piece of work.

## What is not done (updated)

- The Admin web console calls the backend only for email settings, sign-in methods, broadcasts and push promotions; the rest of it is still the localStorage demo.
- None of the email providers, Expo push, Google or Apple sign-in has been exercised against the real services.
