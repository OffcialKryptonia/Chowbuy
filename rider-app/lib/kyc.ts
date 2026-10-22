import type { RiderType, Vehicle } from './validation';

/** Documents a rider must have verified. Admin can help applicants upload and can approve or decline each one. */
export type DocId = 'photo_id' | 'rider_card' | 'plate' | 'insurance' | 'roadworthy' | 'police' | 'guarantor' | 'next_of_kin';
export type DocStatus = 'missing' | 'pending' | 'approved' | 'declined';

export interface DocDef { id: DocId; label: string; help: string }
const ALL: Record<DocId, DocDef> = {
  photo_id: { id: 'photo_id', label: 'Government photo ID', help: 'NIN slip, voter’s card or international passport' },
  rider_card: { id: 'rider_card', label: 'Rider’s card / licence', help: 'Class A motorcycle licence, or LASRAA card in Lagos' },
  plate: { id: 'plate', label: 'Vehicle plate number', help: 'Plate, engine capacity and make' },
  insurance: { id: 'insurance', label: 'Insurance certificate', help: 'Valid third-party insurance' },
  roadworthy: { id: 'roadworthy', label: 'Roadworthiness certificate', help: 'Current certificate for your vehicle' },
  police: { id: 'police', label: 'Police character clearance', help: 'Background check status' },
  guarantor: { id: 'guarantor', label: 'Guarantor details', help: 'Name, phone and address of a guarantor' },
  next_of_kin: { id: 'next_of_kin', label: 'Next of kin', help: 'Name and phone of a family contact' },
};

export function requiredDocs(type: RiderType | null, vehicle: Vehicle | null): DocDef[] {
  const ids: DocId[] = ['photo_id', 'next_of_kin', 'guarantor', 'police'];
  const motor = vehicle !== 'bicycle';
  if (type === 'partner' && motor) ids.push('rider_card', 'plate', 'insurance', 'roadworthy');
  if (type === 'fleet' && vehicle !== 'bicycle') ids.push('rider_card');   // the company bike is already insured and registered
  return ids.map((i) => ALL[i]);
}

export function kycSummary(docs: DocDef[], status: Partial<Record<DocId, DocStatus>>) {
  const s = (d: DocDef): DocStatus => status[d.id] ?? 'missing';
  const approved = docs.filter((d) => s(d) === 'approved').length;
  const declined = docs.filter((d) => s(d) === 'declined').length;
  const pending = docs.filter((d) => s(d) === 'pending').length;
  const missing = docs.length - approved - declined - pending;
  const state: 'verified' | 'in_review' | 'action_needed' = declined || missing ? 'action_needed' : approved === docs.length ? 'verified' : 'in_review';
  return { approved, declined, pending, missing, total: docs.length, state };
}
