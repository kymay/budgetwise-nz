import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

// GET /api/balance
// Calculates and returns monthly base income, additional income, total expenses, and total balance for the current month.
export async function GET() {
  const supabase = await createClient();

  // Validate user session
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { error: "Unauthorized. Please sign in." },
      { status: 401 },
    );
  }

  try {
    // Fetch income, transactions and category limits concurrently
    const [settingsResult, transactionsResult, categoriesResult] = await Promise.all([
      supabase
        .from("user_settings")
        .select("monthly_income")
        .eq("user_id", user.id)
        .maybeSingle(),
      supabase
        .from("transactions")
        .select("amount, category")
        .eq("user_id", user.id),
      supabase
        .from("budget_categories")
        .select("name, monthly_limit")
        .eq("user_id", user.id),
    ]);

    if (settingsResult.error) {
      return NextResponse.json({ error: settingsResult.error.message }, { status: 500 });
    }
    if (transactionsResult.error) {
      return NextResponse.json({ error: transactionsResult.error.message }, { status: 500 });
    }

    const monthly_income = settingsResult.data?.monthly_income ?? 0;
    const transactions = transactionsResult.data ?? [];
    const categoryLimits = categoriesResult.data ?? [];

    // Negative amounts are expenses, positive are income
    let total_expenses = 0;
    transactions.forEach((tx) => {
      const amount = Number(tx.amount) || 0;
      if (amount < 0) total_expenses += Math.abs(amount);
    });

    const net_balance = monthly_income - total_expenses;

    // Build per-category spending totals so the budget view can show progress bars
    const categories = categoryLimits.map((cat) => {
      const spent = transactions
        .filter((tx) => tx.category === cat.name && Number(tx.amount) < 0)
        .reduce((sum, tx) => sum + Math.abs(Number(tx.amount)), 0);
      return { name: cat.name, monthly_limit: cat.monthly_limit, spent };
    });

    return NextResponse.json({ monthly_income, total_expenses, net_balance, categories }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to calculate balance totals." },
      { status: 500 },
    );
  }
}
