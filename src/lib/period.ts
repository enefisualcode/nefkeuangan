// Periode berjalan mengikuti siklus tanggal 25 - 24 (mengikuti kebiasaan lama di sheet).
export function currentPeriodRange(now = new Date()) {
  const day = now.getDate();
  const start = new Date(now.getFullYear(), now.getMonth() + (day >= 25 ? 0 : -1), 25);
  const end = new Date(now.getFullYear(), now.getMonth() + (day >= 25 ? 1 : 0), 24, 23, 59, 59);
  return { start, end };
}

export function formatPeriodLabel(start: Date, end: Date) {
  const fmt = (d: Date) =>
    d.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
  return `${fmt(start)} - ${fmt(end)} ${end.getFullYear()}`;
}
