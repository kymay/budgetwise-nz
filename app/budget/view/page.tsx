"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface CategoryBreakdown {
  name: string;
  monthly_limit: number;
  spent: number;
}

interface BudgetViewData {
  monthly_income: number;
  total_expenses: number;
  net_balance: number;
  categories: CategoryBreakdown[];
}

export default function ViewBudgetPage() {
  const [data, setData] = useState<BudgetViewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBudgetData() {
      try {
        // Fetching from balance/budget API routes
        const response = await fetch("/api/balance");
        if (!response.ok) throw new Error("Failed to fetch budget summary.");
        const json = await response.json();
        setData(json);
      } catch (err: any) {
        setError(err.message || "An error occurred.");
      } finally {
        setLoading(false);
      }
    }
    fetchBudgetData();
  }, []);

  if (loading) {
    return (
      <div className="p-8 text-center text-gray-500">
        Loading your financial overview...
      </div>
    );
  }

  // Acceptance criteria: If no budget/income has been set, prompt the user to create one
  if (
    error ||
    !data ||
    (data.monthly_income === 0 &&
      (!data.categories || data.categories.length === 0))
  ) {
    return (
      <div className="max-w-xl mx-auto p-8 text-center bg-white shadow-md rounded-lg my-12">
        <h2 className="text-xl font-bold text-gray-800 mb-2">
          No Budget Found
        </h2>
        <p className="text-gray-600 mb-6">
          You haven't set up your monthly income and category spending limits
          yet. You need to create a budget before we can track your spending.
        </p>
        <Link
          href="/budget"
          className="inline-block px-6 py-2 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 transition"
        >
          Set Up Your Budget Now
        </Link>
      </div>
    );
  }

  const { monthly_income, total_expenses, net_balance, categories = [] } = data;
  const remainingBudget = monthly_income - total_expenses;
  const spentPercentage =
    monthly_income > 0
      ? Math.min(100, Math.round((total_expenses / monthly_income) * 100))
      : 0;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6 my-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Monthly Budget Overview
          </h1>
          <p className="text-sm text-gray-500">
            Live summary for the current calendar month.
          </p>
        </div>
        <Link
          href="/budget"
          className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md font-medium transition"
        >
          Edit Budget & Limits
        </Link>
      </div>

      {/* Summary Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-lg shadow border border-gray-100">
          <p className="text-sm text-gray-500 font-medium">Monthly Income</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            ${monthly_income.toFixed(2)}
          </p>
        </div>
        <div className="bg-white p-5 rounded-lg shadow border border-gray-100">
          <p className="text-sm text-gray-500 font-medium">Total Spent</p>
          <p className="text-2xl font-bold text-red-600 mt-1">
            ${total_expenses.toFixed(2)}
          </p>
        </div>
        <div className="bg-white p-5 rounded-lg shadow border border-gray-100">
          <p className="text-sm text-gray-500 font-medium">Remaining Budget</p>
          <p
            className={`text-2xl font-bold mt-1 ${remainingBudget < 0 ? "text-red-600" : "text-green-600"}`}
          >
            ${remainingBudget.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Overall Progress Bar */}
      <div className="bg-white p-6 rounded-lg shadow border border-gray-100 space-y-2">
        <div className="flex justify-between text-sm font-medium text-gray-700">
          <span>Overall Budget Usage</span>
          <span>{spentPercentage}% Spent</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${spentPercentage > 90 ? "bg-red-500" : spentPercentage > 75 ? "bg-yellow-500" : "bg-indigo-600"}`}
            style={{ width: `${spentPercentage}%` }}
          />
        </div>
      </div>

      {/* Category Spending vs Limits */}
      <div className="bg-white p-6 rounded-lg shadow border border-gray-100 space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">
          Category Breakdown
        </h2>
        <div className="divide-y divide-gray-100">
          {categories.map((cat) => {
            const limit = cat.monthly_limit || 1; // Prevent division by zero
            const spent = cat.spent || 0;
            const catPercentage = Math.round((spent / limit) * 100);
            const isNearLimit = catPercentage >= 80; // Acceptance criteria: alert at 80% or more

            return (
              <div
                key={cat.name}
                className="py-4 first:pt-0 last:pb-0 space-y-2"
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-gray-800">
                      {cat.name}
                    </span>
                    {isNearLimit && (
                      <span className="px-2 py-0.5 text-xs font-semibold bg-red-100 text-red-700 rounded-full animate-pulse">
                        Near Limit !
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-600">
                    <span className="font-semibold text-gray-900">
                      ${spent.toFixed(2)}
                    </span>{" "}
                    / ${limit.toFixed(2)}
                  </div>
                </div>
                {/* Category Progress Bar */}
                <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full ${isNearLimit ? "bg-red-500" : "bg-indigo-500"}`}
                    style={{ width: `${Math.min(100, catPercentage)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
