export function formatVND(amount) {
  if (amount === null || amount === undefined || amount === '' || isNaN(Number(amount))) return 'N/A';
  return Number(amount).toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });
} 

export function formatNumber(amount) {
  if (amount === null || amount === undefined || amount === '' || isNaN(Number(amount))) return 'N/A';
  return Number(amount).toLocaleString('vi-VN');
} 



