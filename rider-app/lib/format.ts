/** Whole naira with thousands separators: 12500 -> "₦12,500". */
export const naira = (n: number): string => '₦' + Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
