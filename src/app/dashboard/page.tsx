import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getSummary } from "@/lib/summary";
import { formatRupiah } from "@/lib/format";
import { LogoutButton } from "./logout-button";
import { TransactionForm } from "./transaction-form";
import { LinkTelegram } from "./link-telegram";
import { ChangePassword } from "./change-password";

export default async function DashboardPage() {
  const session = await auth();
  const summary = await getSummary(session!.user.id);
  const user = await prisma.user.findUnique({
    where: { id: session!.user.id },
    select: { telegramId: true, telegramUsername: true },
  });

  const maxDay = Math.max(1, ...summary.byDay.map((d) => d.total));
  const maxCategory = Math.max(1, ...summary.byCategory.map((c) => c.total));

  return (
    <main className="mx-auto min-h-screen w-full max-w-md space-y-4 bg-neutral-950 p-4 pb-10 text-white">
      <div className="flex items-center justify-between pt-2">
        <div>
          <p className="text-sm text-neutral-400">{session!.user.email}</p>
          <p className="text-xs text-neutral-500">{summary.periodLabel}</p>
        </div>
        <LogoutButton />
      </div>

      {/* Hero Card */}
      <section className="rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-800 p-5">
        <p className="text-sm text-emerald-100">Pengeluaran Hari Ini</p>
        <p className="mt-1 text-3xl font-bold">{formatRupiah(summary.todayExpense)}</p>
        <div className="mt-4 flex justify-between text-sm text-emerald-100">
          <span>Rata-rata harian: {formatRupiah(summary.dailyAverage)}</span>
          {summary.paylaterOutstanding > 0 && (
            <span>💳 Pay Later: {formatRupiah(summary.paylaterOutstanding)}</span>
          )}
        </div>
      </section>

      {/* Stat cards */}
      <section className="grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-neutral-900 p-4">
          <p className="text-xs text-neutral-400">Total Pemasukan</p>
          <p className="mt-1 text-lg font-semibold text-emerald-400">
            {formatRupiah(summary.totalIncome)}
          </p>
        </div>
        <div className="rounded-xl bg-neutral-900 p-4">
          <p className="text-xs text-neutral-400">Total Pengeluaran</p>
          <p className="mt-1 text-lg font-semibold text-red-400">
            {formatRupiah(summary.totalExpense)}
          </p>
        </div>
      </section>

      <TransactionForm />

      <LinkTelegram
        telegramId={user?.telegramId ?? null}
        telegramUsername={user?.telegramUsername ?? null}
      />

      <ChangePassword />

      {/* Daily chart */}
      {summary.byDay.length > 0 && (
        <section className="rounded-xl bg-neutral-900 p-4">
          <p className="mb-3 text-sm font-medium text-neutral-300">Pengeluaran Harian</p>
          <div className="flex h-32 items-end gap-1">
            {summary.byDay.map((d) => (
              <div
                key={d.date}
                title={`${d.date}: ${formatRupiah(d.total)}`}
                className="flex-1 rounded-t bg-emerald-600/70"
                style={{ height: `${Math.max(4, (d.total / maxDay) * 100)}%` }}
              />
            ))}
          </div>
        </section>
      )}

      {/* Category breakdown */}
      {summary.byCategory.length > 0 && (
        <section className="rounded-xl bg-neutral-900 p-4">
          <p className="mb-3 text-sm font-medium text-neutral-300">Per Kategori</p>
          <div className="space-y-2">
            {summary.byCategory.map((c) => (
              <div key={c.category}>
                <div className="mb-1 flex justify-between text-sm">
                  <span className="text-neutral-300">{c.category}</span>
                  <span className="text-neutral-400">{formatRupiah(c.total)}</span>
                </div>
                <div className="h-2 rounded-full bg-neutral-800">
                  <div
                    className="h-2 rounded-full bg-emerald-600"
                    style={{ width: `${(c.total / maxCategory) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Transaction list */}
      <section className="rounded-xl bg-neutral-900 p-4">
        <p className="mb-3 text-sm font-medium text-neutral-300">Transaksi Terbaru</p>
        {summary.recentTransactions.length === 0 ? (
          <p className="text-sm text-neutral-500">Belum ada transaksi periode ini.</p>
        ) : (
          <div className="space-y-3">
            {summary.recentTransactions.map((t) => (
              <div key={t.id} className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-neutral-200">
                    {t.category}
                    {t.merchant ? ` · ${t.merchant}` : ""}
                  </p>
                  <p className="text-xs text-neutral-500">
                    {t.date.toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "short",
                      timeZone: "UTC",
                    })}
                    {t.note ? ` · ${t.note}` : ""}
                  </p>
                </div>
                <p
                  className={`text-sm font-medium ${
                    t.type === "EXPENSE" ? "text-red-400" : "text-emerald-400"
                  }`}
                >
                  {t.type === "EXPENSE" ? "-" : "+"}
                  {formatRupiah(t.amount)}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
