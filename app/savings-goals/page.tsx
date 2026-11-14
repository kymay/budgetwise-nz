"use client";

import { useState, useEffect } from "react";

interface SavingsGoal {
  id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  target_date?: string;
}

export default function SavingsGoalsPage() {
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [currentAmount, setCurrentAmount] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchGoals = async () => {
    try {
      const res = await fetch("/api/savings-goals");
      if (!res.ok) throw new Error("Failed to fetch savings goals.");
      const data = await res.json();
      setGoals(data.goals || []);
    } catch (err: any) {
      setError(err.message || "Error loading goals.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGoals();
  }, []);

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const target = parseFloat(targetAmount);
    const current = currentAmount ? parseFloat(currentAmount) : 0;

    if (!name.trim() || isNaN(target) || target <= 0) {
      setError(
        "Please provide a valid goal name and a positive target amount.",
      );
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/savings-goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          target_amount: target,
          current_amount: current,
          target_date: targetDate || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create goal.");

      setName("");
      setTargetAmount("");
      setCurrentAmount("");
      setTargetDate("");
      fetchGoals();
    } catch (err: any) {
      setError(err.message || "An error occurred while creating the goal.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteGoal = async (id: string) => {
    if (!confirm("Are you sure you want to delete this savings goal?")) return;

    try {
      const res = await fetch(`/api/savings-goals?id=${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete goal.");
      setGoals(goals.filter((g) => g.id !== id));
    } catch (err: any) {
      alert(err.message || "Error deleting goal.");
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-gray-500">
        Loading your savings goals...
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8 my-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Savings Goals</h1>
        <p className="text-sm text-gray-500">
          Track progress toward specific financial targets like emergencies or
          holidays.
        </p>
      </div>

      {error && (
        <div className="p-3 bg-red-100 text-red-700 rounded text-sm">
          {error}
        </div>
      )}

      {/* Create Goal Form */}
      <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Create New Savings Goal
        </h2>
        <form
          onSubmit={handleCreateGoal}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Goal Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Emergency Fund"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Target Amount ($)
            </label>
            <input
              type="number"
              min="1"
              step="0.01"
              value={targetAmount}
              onChange={(e) => setTargetAmount(e.target.value)}
              placeholder="e.g. 5000"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Current Saved ($) [Optional]
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={currentAmount}
              onChange={(e) => setCurrentAmount(e.target.value)}
              placeholder="e.g. 500"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Target Date [Optional]
            </label>
            <input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div className="md:col-span-2 pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2 px-4 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 transition disabled:opacity-50"
            >
              {submitting ? "Creating..." : "Add Savings Goal"}
            </button>
          </div>
        </form>
      </div>

      {/* Goals List & Empty State */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">
          Your Active Goals
        </h2>
        {goals.length === 0 ? (
          <div className="bg-white p-8 text-center rounded-lg shadow border border-gray-100 text-gray-500">
            No savings goals found. Create your first goal above to start
            tracking!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {goals.map((goal) => {
              const progress = Math.min(
                100,
                Math.round((goal.current_amount / goal.target_amount) * 100),
              );
              return (
                <div
                  key={goal.id}
                  className="bg-white p-6 rounded-lg shadow border border-gray-100 space-y-4 relative"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-gray-900 text-lg">
                        {goal.name}
                      </h3>
                      {goal.target_date && (
                        <p className="text-xs text-gray-400">
                          Target Date:{" "}
                          {new Date(goal.target_date).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => handleDeleteGoal(goal.id)}
                      className="text-red-500 hover:text-red-700 text-sm font-medium"
                    >
                      Delete
                    </button>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-sm font-medium">
                      <span className="text-gray-600">
                        ${goal.current_amount.toFixed(2)} / $
                        {goal.target_amount.toFixed(2)}
                      </span>
                      <span className="text-indigo-600 font-bold">
                        {progress}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                      <div
                        className="bg-indigo-600 h-full transition-all duration-500"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
