/**
 * Impor data lama dari export CSV Google Sheets ke database.
 *
 * Pemakaian:
 *   node scripts/import-csv.mjs <file.csv> <email-akun> <EXPENSE|INCOME> [--tulis]
 *
 * Tanpa --tulis, skrip hanya menampilkan hasil bacanya (uji coba, tidak
 * menyentuh database). Baris yang isinya sudah persis sama dengan transaksi
 * yang ada akan dilewati, jadi skrip ini aman dijalankan berulang.
 *
 * Kolom dikenali dari judulnya, bukan urutannya, supaya export lama (tanpa
 * kolom "Tipe Bayar") maupun yang baru sama-sama bisa dibaca.
 */
import { readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import "dotenv/config";
import pg from "pg";

// --- Pembacaan CSV (menangani tanda kutip dan koma di dalam sel) ---
function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];

    if (quoted) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          cell += '"';
          i++;
        } else {
          quoted = false;
        }
      } else {
        cell += ch;
      }
      continue;
    }

    if (ch === '"') quoted = true;
    else if (ch === ",") {
      row.push(cell);
      cell = "";
    } else if (ch === "\n") {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else if (ch !== "\r") {
      cell += ch;
    }
  }
  if (cell !== "" || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows.filter((r) => r.some((c) => c.trim() !== ""));
}

// "150.000" / "Rp 150,000" / "150000" -> 150000
function parseNominal(raw) {
  const digits = String(raw ?? "").replace(/[^\d]/g, "");
  return digits ? Number(digits) : 0;
}

// Terima "2026-06-29" maupun "29/06/2026".
function parseTanggal(raw) {
  const s = String(raw ?? "").trim();
  let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (m) return new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  m = s.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (m) return new Date(Date.UTC(+m[3], +m[2] - 1, +m[1]));
  return null;
}

function kolom(header) {
  const cari = (...nama) =>
    header.findIndex((h) =>
      nama.some((n) => h.trim().toLowerCase() === n.toLowerCase())
    );
  return {
    tanggal: cari("Tanggal"),
    kategori: cari("Kategori"),
    nominal: cari("Nominal"),
    merchant: cari("Merchant"),
    sumber: cari("Sumber"),
    catatan: cari("Catatan"),
    tipeBayar: cari("Tipe Bayar", "TipeBayar"),
  };
}

const [, , fileArg, emailArg, tipeArg, ...flags] = process.argv;
const tulis = flags.includes("--tulis");

if (!fileArg || !emailArg || !["EXPENSE", "INCOME"].includes(tipeArg)) {
  console.error(
    "Pemakaian: node scripts/import-csv.mjs <file.csv> <email> <EXPENSE|INCOME> [--tulis]"
  );
  process.exit(1);
}

const rows = parseCsv(readFileSync(fileArg, "utf8"));
if (rows.length < 2) {
  console.error("CSV kosong atau hanya berisi judul kolom.");
  process.exit(1);
}

const idx = kolom(rows[0]);
if (idx.tanggal < 0 || idx.nominal < 0) {
  console.error("Kolom 'Tanggal' dan 'Nominal' tidak ditemukan. Judul:", rows[0]);
  process.exit(1);
}

const catatanBaris = [];
const dilewati = [];

for (const r of rows.slice(1)) {
  const tanggal = parseTanggal(r[idx.tanggal]);
  const nominal = parseNominal(r[idx.nominal]);
  const kategori = (idx.kategori >= 0 ? r[idx.kategori] : "").trim();

  if (!tanggal || !nominal) {
    dilewati.push({ baris: r, alasan: !tanggal ? "tanggal tidak terbaca" : "nominal kosong" });
    continue;
  }

  catatanBaris.push({
    date: tanggal,
    amount: nominal,
    category: kategori || "Lainnya",
    merchant: idx.merchant >= 0 ? r[idx.merchant]?.trim() || null : null,
    source: idx.sumber >= 0 ? r[idx.sumber]?.trim() || "Impor" : "Impor",
    note: idx.catatan >= 0 ? r[idx.catatan]?.trim() || null : null,
    paymentType:
      tipeArg === "EXPENSE" && idx.tipeBayar >= 0
        ? r[idx.tipeBayar]?.trim() || null
        : null,
  });
}

// Nilai "-" di sheet lama artinya kosong.
for (const t of catatanBaris) {
  if (t.merchant === "-") t.merchant = null;
  if (t.note === "-") t.note = null;
}

// Struk yang dipindai AI kadang salah baca tahun. Tanggal yang jauh
// menyimpang dari sisanya ditandai supaya bisa diperiksa manual dulu.
const terbaru = catatanBaris.reduce(
  (max, t) => (t.date > max ? t.date : max),
  new Date(0)
);
const batasLama = new Date(terbaru);
batasLama.setUTCFullYear(batasLama.getUTCFullYear() - 1);
const besok = new Date(Date.now() + 86_400_000);
const janggal = catatanBaris.filter((t) => t.date < batasLama || t.date > besok);

const total = catatanBaris.reduce((s, t) => s + t.amount, 0);
console.log(`File      : ${fileArg}`);
console.log(`Jenis     : ${tipeArg}`);
console.log(`Terbaca   : ${catatanBaris.length} baris`);
console.log(`Dilewati  : ${dilewati.length} baris`);
console.log(`Total nilai: Rp${total.toLocaleString("id-ID")}`);
if (dilewati.length) {
  console.log("Baris yang dilewati:");
  dilewati.slice(0, 10).forEach((d) => console.log("  -", d.alasan, "|", d.baris.join(" | ")));
}
if (janggal.length) {
  console.log(`\n⚠️  ${janggal.length} baris bertanggal janggal (periksa dulu di sheet):`);
  janggal.forEach((t) =>
    console.log(
      "  -",
      t.date.toISOString().slice(0, 10),
      "|",
      t.category,
      "| Rp" + t.amount.toLocaleString("id-ID"),
      "|",
      t.merchant ?? "",
      "| sumber:",
      t.source
    )
  );
  console.log("");
}

console.log("Contoh 3 baris pertama:");
catatanBaris.slice(0, 3).forEach((t) =>
  console.log("  ", t.date.toISOString().slice(0, 10), t.category, t.amount, t.note ?? "")
);

if (!tulis) {
  console.log("\n(uji coba - database tidak diubah. Tambahkan --tulis untuk menyimpan.)");
  process.exit(0);
}

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();

const u = await client.query('SELECT id FROM "User" WHERE email = $1', [emailArg]);
if (!u.rows.length) {
  console.error(`Akun ${emailArg} tidak ditemukan.`);
  await client.end();
  process.exit(1);
}
const userId = u.rows[0].id;

let masuk = 0;
let duplikat = 0;

for (const t of catatanBaris) {
  const ada = await client.query(
    `SELECT id FROM "Transaction"
     WHERE "userId" = $1 AND date = $2 AND amount = $3 AND category = $4
       AND COALESCE(note, '') = COALESCE($5, '')`,
    [userId, t.date, t.amount, t.category, t.note]
  );
  if (ada.rows.length) {
    duplikat++;
    continue;
  }

  await client.query(
    `INSERT INTO "Transaction"
       (id, "userId", type, date, amount, category, merchant, source, note, "paymentType", "createdAt")
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10, now())`,
    [
      randomUUID(),
      userId,
      tipeArg,
      t.date,
      t.amount,
      t.category,
      t.merchant,
      t.source,
      t.note,
      t.paymentType,
    ]
  );
  masuk++;
}

console.log(`\nTersimpan : ${masuk}`);
console.log(`Dilewati (sudah ada) : ${duplikat}`);
await client.end();
