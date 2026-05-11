export function normalizeCodigo(codigo) {
  if (!codigo) return '';
  const num = parseInt(codigo, 10);
  return isNaN(num) ? codigo : num.toString();
}
