import type { FlexStatus, LiveFlex, LiveMe } from './live-map';
import type { RiderType } from './validation';

/**
 * The three ways to deliver with ChowBuy. This is only what the app shows; the model a rider is on is decided on the server and
 * can only be changed by ChowBuy. No copy here promises income, orders or employment, and no figures are quoted: rates are set by ChowBuy.
 */
export interface ModelCard { id: RiderType; title: string; tagline: string; compensation: string; eligibility: string; availability: string; note?: string }

export const MODEL_CARDS: ModelCard[] = [
  { id: 'fleet', title: 'ChowBuy Fleet', tagline: 'Salaried staff rider on a company bike.',
    compensation: 'Paid a monthly salary set by ChowBuy. You do not see per-ride fares.',
    eligibility: 'Selected by ChowBuy. Needs identity, guarantor and police clearance checks.',
    availability: 'Set shifts at a ChowBuy hub.',
    note: 'Fleet roles are offered by ChowBuy after review. Applying does not guarantee a place.' },
  { id: 'partner', title: 'ChowBuy Partner', tagline: 'Ride with your own vehicle and keep your earnings.',
    compensation: 'You keep each delivery fare after ChowBuy’s commission, plus 100% of tips.',
    eligibility: 'Your own vehicle, documents and a verified identity.',
    availability: 'Go online when you choose. Orders depend on demand in your area.' },
  { id: 'flex', title: 'ChowBuy Flex', tagline: 'Deliver flexibly, in the areas and for the delivery types ChowBuy has opened.',
    compensation: 'Earnings are calculated per delivery from the fare, ChowBuy’s platform fee and eligible tips. The terms are shown before you accept the agreement.',
    eligibility: 'Needs identity verification, an eligible vehicle, a service area open for Flex and ChowBuy approval.',
    availability: 'Go online or pause when you choose. Approval does not guarantee orders.',
    note: 'Flex is not employment. Flex may not be open in your area yet.' },
];

export const FLEX_STATUS_LABEL: Record<FlexStatus, string> = {
  draft: 'Draft', submitted: 'Submitted', under_review: 'Under review', action_required: 'Action required', approved: 'Approved', rejected: 'Rejected', suspended: 'Suspended',
};

export const modelLabel = (t: RiderType | null): string => (t === 'fleet' ? 'ChowBuy Fleet' : t === 'flex' ? 'ChowBuy Flex' : 'ChowBuy Partner');

export interface ChecklistItem { id: 'identity' | 'vehicle' | 'area' | 'settlement' | 'agreement'; label: string; done: boolean; note?: string }

/** The Flex onboarding checklist. Settlement details are only ever "pending verification" here: the app never claims they are verified. */
export function flexChecklist(me: LiveMe): ChecklistItem[] {
  const f = me.flex;
  return [
    { id: 'identity', label: 'Identity verification', done: me.verified, note: me.verified ? 'Verified by ChowBuy' : 'Add your documents under Profile, Documents and verification' },
    { id: 'vehicle', label: 'Vehicle and delivery method', done: !!me.vehicle && !!me.plate, note: me.vehicle ? `${me.vehicle} · ${me.plate}` : undefined },
    { id: 'area', label: 'Service area', done: !!f?.city, note: f?.city ?? undefined },
    { id: 'settlement', label: 'Settlement details', done: !!f?.settlement, note: f?.settlement ? `${f.settlement.bank} ••••${f.settlement.last4} · pending verification` : 'Optional until ChowBuy asks for it' },
    { id: 'agreement', label: 'Rider agreement', done: !!f?.agreementVersion, note: f?.agreementVersion ? `Accepted version ${f.agreementVersion}` : undefined },
  ];
}

/** Whether the rider can still edit and submit the application. */
export const flexEditable = (f?: LiveFlex): boolean => !!f && (f.status === 'draft' || f.status === 'action_required');

/** Plain-language availability line for the home screen. */
export function flexAvailabilityText(f?: LiveFlex): string {
  if (!f) return '';
  switch (f.availability) {
    case 'suspended': return 'Your Flex access is suspended.';
    case 'unavailable': return f.blockedReason ?? 'Flex deliveries are not available to you right now.';
    case 'paused': return 'You are paused. Resume to receive offers.';
    case 'online': return 'You are online for Flex deliveries.';
    default: return 'You are offline.';
  }
}

export const NAIRA_ACCOUNT = /^[0-9]{10}$/;
export const cleanAccount = (v: string): string => v.replace(/\D/g, '').slice(0, 10);
