export function formatRupiah(amount: number) {
  return "Rp" + Math.round(amount).toLocaleString("id-ID");
}

// Bentuk ringkas untuk angka besar: Rp3,9 jt / Rp302rb
export function formatRupiahRingkas(amount: number) {
  if (amount >= 1e6) {
    const jt = amount / 1e6;
    return "Rp" + jt.toFixed(amount % 1e6 === 0 ? 0 : 1).replace(".", ",") + " jt";
  }
  return "Rp" + Math.round(amount / 1000) + "rb";
}
