export function formatRupiah(amount: number) {
  return "Rp" + Math.round(amount).toLocaleString("id-ID");
}
