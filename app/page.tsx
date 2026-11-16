"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Transaction = {
  id: string;
  name: string;
  amount: number;
  category: string | null;
  date: string;
};

// Builds a simple 6 point projected savings line from the users transactions.
// Each point is the cumulative net amount up to that month.
function buildSavingsProjection(transactions: Transaction[]) {
  const now = new Date();
  const points: { label: string; value: number }[] = [];
  let running = 0;

  for (let i = 5; i >= 0; i--) {
    const target = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const year = target.getFullYear();
    const month = target.getMonth();

    const monthNet = transactions
      .filter((t) => {
        const d = new Date(t.date);
        return d.getFullYear() === year && d.getMonth() === month;
      })
      .reduce((sum, t) => sum + t.amount, 0);

    running += monthNet;
    points.push({
      label: target.toLocaleString("en-NZ", { month: "short" }),
      value: running,
    });
  }

  return points;
}

// Draws a minimal SVG line chart from the projection points.
function SavingsChart({
  points,
}: {
  points: { label: string; value: number }[];
}) {
  const width = 400;
  const height = 120;
  const padding = 24;

  const values = points.map((p) => p.value);
  const min = Math.min(...values, 0);
  const max = Math.max(...values, 1);
  const range = max - min || 1;

  // Convert each data point into x and y coordinates inside the SVG viewport
  const coords = points.map((p, i) => ({
    x: padding + (i / (points.length - 1)) * (width - padding * 2),
    y: padding + (1 - (p.value - min) / range) * (height - padding * 2),
    label: p.label,
  }));

  const polyline = coords.map((c) => `${c.x},${c.y}`).join(" ");

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="w-full"
      aria-label="Projected savings chart"
    >
      <polyline
        points={polyline}
        fill="none"
        stroke="#22c55e"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {coords.map((c) => (
        <g key={c.label}>
          <circle cx={c.x} cy={c.y} r="3" fill="#22c55e" />
          <text
            x={c.x}
            y={height - 4}
            textAnchor="middle"
            fontSize="10"
            fill="#6b7280"
          >
            {c.label}
          </text>
        </g>
      ))}
    </svg>
  );
}

export default function DashboardPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Fetch all transactions for this user and redirect to login if the session has expired
    fetch("/api/transactions")
      .then((res) => {
        if (res.status === 401) {
          router.push("/login");
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (data) setTransactions(data.transactions ?? []);
        setLoading(false);
      });
  }, [router]);

  // The balance is the sum of all transaction amounts.
  // Expenses are stored as negative numbers and income as positive.
  const balance = transactions.reduce((sum, t) => sum + t.amount, 0);
  const recent = transactions.slice(0, 10);
  const savingsPoints = buildSavingsProjection(transactions);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-900">
        <p className="text-zinc-500">Loading your dashboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900 px-4 py-8">
      <div className="mx-auto max-w-2xl space-y-6">
        {/* Page heading */}
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Dashboard
        </h1>

        {/* Current balance card */}
        <div className="rounded-2xl bg-white dark:bg-zinc-800 p-6 shadow-sm">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Current balance
          </p>
          <p
            className={`mt-1 text-4xl font-bold ${balance >= 0 ? "text-green-500" : "text-red-500"}`}
          >
            {balance >= 0 ? "+" : ""}${balance.toFixed(2)}
          </p>
        </div>

        {/* Projected savings chart */}
        <div className="rounded-2xl bg-white dark:bg-zinc-800 p-6 shadow-sm">
          <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-4">
            Projected savings
          </p>
          {transactions.length === 0 ? (
            <p className="text-sm text-zinc-400">
              Add some transactions to see your savings projection.
            </p>
          ) : (
            <SavingsChart points={savingsPoints} />
          )}
        </div>

        {/* Recent transactions */}
        <div className="rounded-2xl bg-white dark:bg-zinc-800 p-6 shadow-sm">
          <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-4">
            Recent transactions
          </p>

          {recent.length === 0 ? (
            <p className="text-sm text-zinc-400">
              No transactions yet. Add one to get started.
            </p>
          ) : (
            <ul className="divide-y divide-zinc-100 dark:divide-zinc-700">
              {recent.map((t) => (
                <li
                  key={t.id}
                  className="flex items-center justify-between py-3"
                >
                  <div>
                    <p className="text-sm font-medium text-zinc-800 dark:text-zinc-100">
                      {t.name}
                    </p>
                    <p className="text-xs text-zinc-400">
                      {t.category ?? "Uncategorised"} &middot; {t.date}
                    </p>
                  </div>
                  <p
                    className={`text-sm font-semibold ${t.amount >= 0 ? "text-green-500" : "text-red-500"}`}
                  >
                    {t.amount >= 0 ? "+" : ""}${Math.abs(t.amount).toFixed(2)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Navigation buttons */}
        <div className="flex gap-3">
          <Link
            href="/transactions"
            className="flex-1 rounded-xl bg-green-500 py-3 text-center text-sm font-semibold text-white hover:bg-green-600 transition-colors"
          >
            Add Transaction
          </Link>
          <Link
            href="/budget"
            className="flex-1 rounded-xl border border-zinc-200 dark:border-zinc-700 py-3 text-center text-sm font-semibold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
          >
            View Budget
          </Link>
        </div>
      </div>
    </div>
  );
}
