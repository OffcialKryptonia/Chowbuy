/** Rider-customer chat helpers: the polite address greeting, quick replies and the safety filter. */

export const greeting = (customer: string, merchant: string): string =>
  `Good day ${customer}! I have picked up your ChowBuy order from ${merchant} and I'm currently on my way to your location. To ensure a prompt and smooth delivery to your exact door, please let me know if there are any specific estate gate codes, building descriptions, or landmarks I should look out for. Thank you!`;

export const GREETING_DELAY_SECONDS = 60;

export const quickReplies = (etaMinutes: number): { id: string; text: string }[] => [
  { id: 'gate', text: 'I have arrived at your estate security gate / entrance.' },
  { id: 'code', text: 'Security has requested an access code or clearance call.' },
  { id: 'traffic', text: `Slight traffic delay along the corridor. New ETA: ${Math.max(1, Math.round(etaMinutes))} minutes.` },
  { id: 'reception', text: 'I am waiting at your building reception / compound gate.' },
  { id: 'pin', text: 'Kindly have your 4-digit delivery PIN ready for handover.' },
];

export type FlagKind = 'offplatform_payment' | 'harassment' | 'accident' | 'security';
const RULES: { kind: FlagKind; re: RegExp }[] = [
  { kind: 'offplatform_payment', re: /\b(send (me )?(the )?money|transfer to my|pay me (directly|outside)|my account number|opay|palmpay|cash app|outside the app|bank transfer to me)\b/i },
  { kind: 'harassment', re: /\b(idiot|stupid|fool|useless|shut up|i will beat|i go beat|nonsense|fuck|bastard)\b/i },
  { kind: 'accident', re: /\b(accident|crash(ed)?|injur(y|ed)|hospital|ambulance|knocked down|bleeding)\b/i },
  { kind: 'security', re: /\b(robber(s|y)?|armed|gun|kidnap|attack(ed)?|thief|thieves|stolen|one chance|hijack)\b/i },
];

/** Flags worth a supervisor's attention. Streamed to Admin with the chat log. */
export const flagMessage = (text: string): FlagKind[] => RULES.filter((r) => r.re.test(text)).map((r) => r.kind);
export const isUrgent = (kinds: FlagKind[]) => kinds.includes('accident') || kinds.includes('security');

export type Receipt = 'sent' | 'delivered' | 'read';
export const VOICE_NOTE_MAX_SECONDS = 30;
