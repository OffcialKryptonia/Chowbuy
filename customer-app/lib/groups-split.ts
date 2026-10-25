/** Splits a whole-naira total equally. Any remainder goes to the host, so shares always add up to the total exactly. */
export function splitEqual(total: number, memberIds: string[], hostId: string): { user_id: string; amount: number }[] {
  const ids = [...new Set(memberIds)];
  if (!ids.length || total < 0) return [];
  const each = Math.floor(total / ids.length);
  const rest = total - each * ids.length;
  return ids.map((id) => ({ user_id: id, amount: each + (id === hostId ? rest : 0) }));
}
