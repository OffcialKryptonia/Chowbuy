import { handle, HttpError, json, requireAdmin } from '../_shared/util.ts';
import { sendTemplateEmail } from '../_shared/mail.ts';

/**
 * Admin-only, controlled test send. Always sends to the signed-in admin's own
 * account email, never to an address supplied in the request.
 * Never accepts provider credentials from the request.
 */

Deno.serve(handle(async (req) => {
  if (req.method !== 'POST') throw new HttpError(405, 'Method not allowed.');
  const { user } = await requireAdmin(req);
  const TEST_RECIPIENT = user.email ?? '';
  if (!TEST_RECIPIENT) throw new HttpError(400, 'Your admin account has no email address.');
  const body = await req.json().catch(() => { throw new HttpError(400, 'Request body must be valid JSON.'); });
  const templateId = typeof body?.templateId === 'string' ? body.templateId : '';
  if (!/^[a-z0-9][a-z0-9_-]{0,79}$/.test(templateId)) throw new HttpError(400, 'Choose a valid template.');
  const result = await sendTemplateEmail(templateId, TEST_RECIPIENT, {
    recipient_name: 'ChowBuy email test',
    customer_name: 'ChowBuy email test',
    app_name: 'ChowBuy',
    action_url: 'https://chowbuy.ng',
    order_reference: 'TEST-DO-NOT-FULFIL',
    transaction_reference: 'TEST-EMAIL-ONLY',
    amount: '1,000.00',
    currency: 'NGN',
    available_balance: '1,000.00',
    merchant_name: 'Test Merchant',
    order_status: 'Test notification',
    support_email: 'support@chowbuy.ng',
  });
  if (result === 'skipped') throw new HttpError(409, 'The template is disabled or email provider settings are incomplete.');
  return json({ ok: true, status: 'provider_accepted', recipient: TEST_RECIPIENT, templateId });
}));
