# ChowBuy backend contract (what the customer app calls)

The app runs fully offline in demo mode (`EXPO_PUBLIC_DEMO=1`, the default). Set `EXPO_PUBLIC_DEMO=0`, `EXPO_PUBLIC_API_URL` and `EXPO_PUBLIC_WS_URL` to use a real backend. Auth: `Authorization: Bearer <token>` (stored in SecureStore).

Secrets never reach the app. Korapay secret, Pocketfi key, webhook secrets, LiveKit API secret, Agora certificate, FCM service account, OneSignal REST key and the Google Directions key live on the server and are entered in **Admin > Settings > Payment gateways / Integrations & maps / Realtime & push**.

## REST

| Method / path | Purpose | Response |
|---|---|---|
| `GET /config/public` | Published from Admin, no secrets | `PublicConfig` (see `lib/types.ts`): enabled gateways, COD max, call provider + LiveKit URL or Agora App ID, OneSignal App ID, FCM flag, review points |
| `POST /payments/initiate` `{method, amount, orderId, email}` | Starts a payment | `{method, status: pending\|paid\|cod, reference, checkoutUrl?, virtualAccount?{bank,number,name,expiresAt}}`. Korapay returns `checkoutUrl`; Pocketfi returns a one-time `virtualAccount` |
| `GET /payments/verify?reference=` | Poll after checkout / transfer | `{status: pending\|paid\|failed}` |
| `POST /payments/links` `{orderId, amount}` | "Share your payment link" | `PaymentLink {url, token, expiresAt (24h), status}` |
| `POST /calls/token` `{orderId}` | Short-lived in-app call token | `{token, url?}` (LiveKit). Must check the caller owns the order and the order is active |
| `GET /maps/directions?origin=&destination=` | Proxy to Google Directions | `{polyline, distanceM, durationS}` |
| `POST /devices` `{token, provider: expo\|onesignal, platform}` | Push registration | 204 |

Server-side rules the app also pre-checks (the server decides): chat messages with phone numbers or off-platform payment phrases are blocked/masked per Admin > Chat supervision > Keyword filters; COD above the Admin limit is refused; the rider app cannot mark an order delivered without the 4-digit `otp`.

## Webhooks (server to server)

- `POST /webhooks/korapay` and `/webhooks/pocketfi`: verify the signature with the secret from Admin, mark the order paid, then push a `payment` realtime event. A sponsor paying through a payment link (card, Pocketfi transfer, or wallet) uses the same path, with `by` set to the sponsor's name.

## Realtime socket (`WS_URL`)

Client sends `{type:'auth', token}` first, then `{type:'subscribe', orderIds:[...]}`, heartbeat `{type:'ping'}`. Chat sends `{type:'chat', orderId, text}`.
Server events (zod-validated in `lib/realtime.ts`):

```
{type:'stage', orderId, stage, at}                 // received|preparing|rider_accepted|rider_at_store|in_transit|arrived|delivered
{type:'rider', orderId, rider{id,name,plate,vehicle,rating,verified,proxyPhone}, route:[{latitude,longitude}]}
{type:'position', orderId, pos, heading, etaMinutes}
{type:'chat', orderId, from:'rider'|'system'|'customer', text}
{type:'payment', orderId, by?}
{type:'call', orderId, state}
```

`proxyPhone` is a masked ChowBuy number. Never send a rider's real number.

## Admin settings mapped to the app

| Admin screen | Feeds |
|---|---|
| Settings > Payment gateways | `/config/public.gateways`, `/payments/*`, webhooks |
| Settings > Realtime & push | `/config/public.realtime/push`, `/calls/token`, push sending |
| Chat supervision > Keyword filters | server chat screening, flagged-message queue |
| Chat supervision > Emergency broadcast | server posts a `system` chat message and push to each active order in the chosen city |
