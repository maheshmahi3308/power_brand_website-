// Currency formatter — Indian Rupee
export const money = (n) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(n || 0));

// Discount percentage calculator
export const discountPct = (original, sale) => {
  if (!sale || !original || sale >= original) return 0;
  return Math.round(((original - sale) / original) * 100);
};

// Short reference code from UUID
export const shortRef = (id) =>
  id ? String(id).replace(/-/g, '').slice(0, 8).toUpperCase() : '';
