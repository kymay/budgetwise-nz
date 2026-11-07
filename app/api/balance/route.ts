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
    // Fetch base income and user transactions concurrently
    const [settingsResult, transactionsResult] = await Promise.all([
      supabase
        .from("user_settings")
        .select("monthly_income")
        .eq("user_id", user.id)
        .maybeSingle(),
      supabase
        .from("transactions")
        .select("amount, type")
        .eq("user_id", user.id),
    ]);

    // Check for database errors
    if (settingsResult.error) {
      return NextResponse.json(
        { error: settingsResult.error.message },
        { status: 500 },
      );
    }

    if (transactionsResult.error) {
      return NextResponse.json(
        { error: transactionsResult.error.message },
        { status: 500 },
      );
    }

    // Extract monthly income (defautls to 0 if not set)
    const monthlyIncome = settingsResult.data?.monthly_income ?? 0;

    // Calculate total expenses and total additional income
    let totalExpenses = 0;
    let totalAdditionalIncome = 0;

    transactionsResult.data.forEach((tx) => {
      const amount = Number(tx.amount) || 0;
      if (tx.type === "expense") {
        totalExpenses += amount;
      } else if (tx.type === "income") {
        totalAdditionalIncome += amount;
      }
    });

    // Calculate net position
    const netBalance = monthlyIncome + totalAdditionalIncome - totalExpenses;

    return NextResponse.json(
      {
        monthlyIncome: monthlyIncome,
        totalAdditionalIncome: totalAdditionalIncome,
        totalExpenses: totalExpenses,
        netBalance: netBalance,
      },
      { status: 200 },
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to calculate balance totals." },
      { status: 500 },
    );
  }
}
