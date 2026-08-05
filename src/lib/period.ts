// Server (Railway) berjalan dengan waktu UTC, sedangkan penggunanya di WIB.
// Semua patokan tanggal di sini dihitung memakai kalender Jakarta supaya
// transaksi lewat tengah malam tidak jatuh ke tanggal yang salah.
const TZ = "Asia/Jakarta";

function jakartaParts(now = new Date()) {
  const [year, month, day] = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .format(now)
    .split("-")
    .map(Number);
  return { year, month, day };
}

// Tanggal kalender Jakarta hari ini, disimpan sebagai tengah malam UTC.
// Semua tanggal transaksi memakai bentuk yang sama supaya bisa dibandingkan.
export function jakartaToday(now = new Date()) {
  const { year, month, day } = jakartaParts(now);
  return new Date(Date.UTC(year, month - 1, day));
}

export function dateKey(d: Date) {
  return d.toISOString().slice(0, 10);
}

// Periode berjalan mengikuti siklus tanggal 25 - 24 (kebiasaan lama di sheet).
export function currentPeriodRange(now = new Date()) {
  const { year, month, day } = jakartaParts(now);
  const offset = day >= 25 ? 0 : -1;
  const start = new Date(Date.UTC(year, month - 1 + offset, 25));
  const end = new Date(Date.UTC(year, month + offset, 24, 23, 59, 59, 999));
  return { start, end };
}

export function daysElapsedInPeriod(start: Date, now = new Date()) {
  const diff = jakartaToday(now).getTime() - start.getTime();
  return Math.max(1, Math.round(diff / 86_400_000) + 1);
}

export function formatPeriodLabel(start: Date, end: Date) {
  const fmt = (d: Date) =>
    d.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      timeZone: "UTC",
    });
  return `${fmt(start)} - ${fmt(end)} ${end.getUTCFullYear()}`;
}
