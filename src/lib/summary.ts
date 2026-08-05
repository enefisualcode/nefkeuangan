import { prisma } from "@/lib/prisma";
import {
  currentPeriodRange,
  daysElapsedInPeriod,
  dateKey,
  formatPeriodLabel,
  jakartaToday,
} from "@/lib/period";

export async function getSummary(userId: string) {
  const { start, end } = currentPeriodRange();

  const transactions = await prisma.transaction.findMany({
    where: { userId, date: { gte: start, lte: end } },
    orderBy: { date: "desc" },
  });

  const totalIncome = transactions
    .filter((t) => t.type === "INCOME")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = transactions
    .filter((t) => t.type === "EXPENSE")
    .reduce((sum, t) => sum + t.amount, 0);

  const todayKey = dateKey(jakartaToday());
  const todayExpense = transactions
    .filter((t) => t.type === "EXPENSE" && dateKey(t.date) === todayKey)
    .reduce((sum, t) => sum + t.amount, 0);

  const paylaterOutstanding = transactions
    .filter((t) => t.type === "EXPENSE" && t.paymentType === "Pay Later")
    .reduce((sum, t) => sum + t.amount, 0);

  const dailyAverage = Math.round(totalExpense / daysElapsedInPeriod(start));

  const byCategoryMap = new Map<string, number>();
  for (const t of transactions) {
    if (t.type !== "EXPENSE") continue;
    byCategoryMap.set(t.category, (byCategoryMap.get(t.category) ?? 0) + t.amount);
  }
  const byCategory = Array.from(byCategoryMap.entries())
    .map(([category, total]) => ({ category, total }))
    .sort((a, b) => b.total - a.total);

  const byDayMap = new Map<string, number>();
  for (const t of transactions) {
    if (t.type !== "EXPENSE") continue;
    const key = dateKey(t.date);
    byDayMap.set(key, (byDayMap.get(key) ?? 0) + t.amount);
  }
  const byDay = Array.from(byDayMap.entries())
    .map(([date, total]) => ({ date, total }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return {
    periodLabel: formatPeriodLabel(start, end),
    totalIncome,
    totalExpense,
    balance: totalIncome - totalExpense,
    todayExpense,
    paylaterOutstanding,
    dailyAverage,
    byCategory,
    byDay,
    recentTransactions: transactions.slice(0, 20),
  };
}
