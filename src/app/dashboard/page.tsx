import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getSummary } from "@/lib/summary";
import { formatRupiah, formatRupiahRingkas } from "@/lib/format";
import { RincianHarian } from "./rincian-harian";
import { PengaturanAkun } from "./pengaturan-akun";
import { TransactionForm } from "./transaction-form";
import { ScanStruk } from "./scan-struk";

export default async function DashboardPage() {
  const session = await auth();
  const data = await getSummary(session!.user.id);
  const user = await prisma.user.findUnique({
    where: { id: session!.user.id },
    select: { telegramId: true, telegramUsername: true },
  });

  const jam = new Date().toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
  });

  return (
    <main>
      {/* ---------- kepala ---------- */}
      <div className="flex items-baseline justify-between gap-3 px-5 pt-7">
        <div className="eyebrow">Pengeluaran</div>
        <div className="mono text-[11.5px]" style={{ color: "var(--muted)" }}>
          {data.periodeLabel}
        </div>
      </div>

      {/* ---------- hero: hari ini ---------- */}
      <section
        className="kartu naik mx-5 mt-4 rounded-[20px] px-[22px] pt-[22px] pb-5"
        style={{ borderRadius: 20 }}
      >
        <div
          className="mono text-[10px] uppercase tracking-[0.14em]"
          style={{ color: "var(--faint)" }}
        >
          Hari ini
        </div>
        <div className="mt-[3px] text-[12.5px]" style={{ color: "var(--muted)" }}>
          {data.todayLabel}
        </div>
        <div className="display mt-3 text-[42px] font-extrabold leading-[1.05] tracking-[-0.03em] tabular-nums">
          {formatRupiah(data.totalHariIni)}
        </div>

        <div
          className="mt-3 flex items-center gap-2 text-[12.5px] leading-snug"
          style={{ color: "var(--muted)" }}
        >
          {data.totalHariIni === 0 ? (
            "Belum ada pengeluaran hari ini."
          ) : (
            <>
              <span
                className="mono rounded-full px-2 py-[3px] text-[11px] font-medium whitespace-nowrap"
                style={
                  data.diAtas
                    ? { background: "rgba(255,120,71,.15)", color: "var(--orange-deep)" }
                    : { background: "rgba(84,168,255,.15)", color: "var(--blue)" }
                }
              >
                {data.diAtas ? "▲" : "▼"} {data.persen.toFixed(0)}%
              </span>
              <span>{data.diAtas ? "di atas" : "di bawah"} rata-rata harianmu</span>
            </>
          )}
        </div>

        {data.payLater > 0 && (
          <div
            className="mt-3.5 flex items-baseline justify-between gap-3 pt-[13px]"
            style={{ borderTop: "1px solid var(--line)" }}
          >
            <span
              className="mono text-[10px] uppercase tracking-[0.13em]"
              style={{ color: "var(--faint)" }}
            >
              Total Pay Later
            </span>
            <span
              className="mono text-[15px] font-semibold tabular-nums"
              style={{ color: "var(--orange-deep)" }}
            >
              {formatRupiah(data.payLater)}
            </span>
          </div>
        )}
      </section>

      {/* ---------- statistik ---------- */}
      <div className="naik mx-5 mt-3 grid grid-cols-2 gap-2.5">
        <div className="kartu rounded-[14px] px-[15px] py-3.5">
          <div
            className="mono text-[9.5px] uppercase tracking-[0.13em]"
            style={{ color: "var(--faint)" }}
          >
            Rata-rata harian
          </div>
          <div className="mono mt-1.5 text-[17px] font-medium tabular-nums tracking-[-0.01em]">
            {formatRupiah(data.rata)}
          </div>
          <div className="mt-[3px] text-[11px]" style={{ color: "var(--muted)" }}>
            dari {data.hariAktif} hari ada transaksi
          </div>
        </div>
        <div className="kartu rounded-[14px] px-[15px] py-3.5">
          <div
            className="mono text-[9.5px] uppercase tracking-[0.13em]"
            style={{ color: "var(--faint)" }}
          >
            Total periode
          </div>
          <div className="mono mt-1.5 text-[17px] font-medium tabular-nums tracking-[-0.01em]">
            {formatRupiahRingkas(data.totalPeriode)}
          </div>
          <div className="mt-[3px] text-[11px]" style={{ color: "var(--muted)" }}>
            hari ke-{data.hariKe} dari {data.totalHari}
          </div>
        </div>
      </div>

      <TransactionForm />
      <ScanStruk />

      <RincianHarian data={data} />

      {/* ---------- kaki ---------- */}
      <div
        className="mono mx-5 mt-8 pt-4 text-[10.5px] leading-[1.7]"
        style={{ borderTop: "1px solid var(--line)", color: "var(--faint)" }}
      >
        {data.jumlahHariIni} transaksi hari ini · {data.jumlahPeriode} periode ini
        <br />
        Siklus tanggal {data.siklus} ke {data.siklus - 1} · Diperbarui {jam}
      </div>

      <PengaturanAkun
        email={session!.user.email ?? ""}
        telegramId={user?.telegramId ?? null}
        telegramUsername={user?.telegramUsername ?? null}
      />
    </main>
  );
}
