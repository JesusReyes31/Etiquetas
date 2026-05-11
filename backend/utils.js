export function normalizeCodigo(codigo) {
  if (!codigo) return null;
  const num = parseInt(codigo, 10);
  return isNaN(num) ? codigo : num.toString();
}

export function formatFechaSQL(fecha) {
  const [year, month, day] = fecha.split('-');
  return `${year}${month}${day}`;
}

export function formatFechaISO(fecha) {
  const d = new Date(fecha);
  return d.toISOString().split('T')[0];
}
