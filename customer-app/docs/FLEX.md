# ChowBuy Flex

Third rider operating model beside Fleet (salaried) and Partner (commission). Migration: `20261102000001_chowbuy_flex.sql` (additive, re-runnable).

## How it works
- `riders.pay_model` is `fleet`, `partner` or `flex`. A model changes only through `admin_rider_set_type` (reason required, audited, rider goes offline, past earnings untouched). Riders cannot update their own row.
- Applying: `rider_apply(..., p_type)`. Flex needs registration switched on in Flex settings. Fleet applicants start as Partner (Admin moves them, as before).
- Flex lifecycle: draft → submitted → under review → action required → approved / rejected / suspended. Registration alone grants no deliveries.
- Dispatch uses the existing `rider_open_orders` / `rider_accept`. `_flex_block` checks approved, identity verified, dispatch on, vehicle type, live service city; delivery type and max concurrent deliveries are checked per order. Accept is atomic and idempotent.
- Earnings: `_on_delivered` has an explicit branch per model. Flex: fare − platform fee + eligible tip (+ admin-approved incentive). With no platform fee configured the row is `pending` with net 0 until `admin_flex_reprice_pending`.
- Earning statuses: pending, confirmed, available, requested, processing, paid, failed, reversed. `paid` needs a provider reference (`admin_flex_earning_status`).
- Admin: Riders (filters, Change model), Flex (applications, KPIs), Flex settings. All settings changes and decisions are in the audit log.

## Launch requirements (not invented by the code)
1. Agreement version and legal text (published by your legal team) → Flex settings.
2. Platform fee %, payout schedule, minimum payout, regions, delivery types.
3. A payout provider and the job that moves earnings from `available` to paid. Rider-side payout requests and wallet credit for Flex are not built; there is no server-side payout flow for any rider model today.
4. Settlement account verification with your provider. Accounts stay "pending verification".
5. Notification providers for decisions (nothing is sent today).
6. Base fare, distance and zone pricing for Flex are not modelled: only the platform-fee formula is applied.
