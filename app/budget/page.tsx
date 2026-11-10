"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Category {
  id?: string;
  name: string;
  monthly_limit: number;
}

const DEFAULT_CATEGORIES = [
  "Housing",
  "Groceries",
  "Utilities",
  "Transportation",
  "Entertainment",
  "Dining Out",
  "Savings",
  "Subscriptions",
  "Healthcare",
  "Miscellaneous",
];

export default function BudgetPage() {
  const router = useRouter();
  const [monthlyIncome, setMonthlyIncome] = useState<string>("");
  const [categories, setCategories] = useState<Category[]>(
    DEFAULT_CATEGORIES.map((name) => ({ name, monthly_limit: 0 })),
  );
  const [isExistingBudget, setIsExistingBudget] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Load existing budget on mount (handles return visits vs first visit)
  useEffect(() => {
    async function fetchBudget() {
      try {
        const response = await fetch("/api/budget");
        if (response.ok) {
          const data = await response.json();
          if (
            data.monthly_income > 0 ||
            (data.categories && data.categories.length > 0)
          ) {
            setMonthlyIncome(data.monthly_income.toString());
            if (data.categories && data.categories.length > 0) {
              setCategories(data.categories);
            }
            setIsExistingBudget(true); // Pre-fill flag for PUT vs POST
          }
        }
      } catch (err) {
        console.error("Failed to load budget", err);
      } finally {
        setLoading(false);
      }
    }
    fetchBudget();
  }, []);

  // Handle category limit change with validation (no negative values)
  const handleLimitChange = (index: number, value: string) => {
    const newCategories = [...categories];
    const num = parseFloat(value);
    newCategories[index].monthly_limit = isNaN(num) ? 0 : Math.max(0, num);
    setCategories(newCategories);
  };

  // Submit form (POST for new, PUT for updates)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    const incomeNum = parseFloat(monthlyIncome);
    if (isNaN(incomeNum) || incomeNum < 0) {
      setError("Monthly income must be a valid positive number.");
      return;
    }

    // Validation: check for empty or negative category limits
    for (const cat of categories) {
      if (cat.monthly_limit < 0) {
        setError('Category "${cat.name}" cannot have a negative limit.');
        return;
      }
    }

    setSaving(true);

    try {
      const method = isExistingBudget ? "PUT" : "POST";
      const res = await fetch("/api/budget", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          monthly_income: incomeNum,
          categories,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to save budget.");
      }

      setSuccessMessage("Budget saved successfully!");
      setIsExistingBudget(true); // Future saves will now update

      // redirect after short delay or let user stay on page
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-gray-500">
        Loading your budget configuration...
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white shadow-md rounded-md rounded-lg my-8">
      <h1 className="text-2xl font-bold mb-2">Set Your Monthly Budget</h1>
      <p className="text-gray-600 mb-6">
        Define your monthly income and allocate spending limits across your
        categories. This will help you track your expenses and stay within your
        budget.
      </p>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded text-sm">
          {error}
        </div>
      )}
      {successMessage && (
        <div className="mb-4 p-3 bg-green-100 text-green-700 rounded text-sm">
          {successMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Monthly Income Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Monthly Income ($)
          </label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={monthlyIncome}
            onChange={(e) => setMonthlyIncome(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="e.g. 3500"
          />
        </div>

        <hr className="my-4" />

        <h2 className="text-lg font-semibold mb-3">Category Spending Limits</h2>

        {/* Category Inputs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {categories.map((cat, index) => (
            <div key={cat.id || cat.name}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {cat.name}
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={cat.monthly_limit}
                onChange={(e) => handleLimitChange(index, e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          ))}
        </div>

        <div className="pt-4">
          <button
            type="submit"
            disabled={saving}
            className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {saving
              ? "Saving..."
              : isExistingBudget
                ? "Update Budget"
                : "Create Budget"}
          </button>
        </div>
      </form>
    </div>
  );
}
