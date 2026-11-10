import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        },
      },
    },
  );
}

export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { error: "Unauthorised. Please sign in." },
      { status: 401 },
    );
  }

  const { data: goals, error } = await supabase
    .from("savings_goals")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ goals: goals ?? [] }, { status: 200 });
}

export async function POST(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { error: "Unauthorised. Please sign in." },
      { status: 401 },
    );
  }

  try {
    const body = await request.json();
    const { name, target_amount, current_amount, target_date } = body;

    if (!name || target_amount === undefined || target_amount === null) {
      return NextResponse.json(
        { error: "name and target_amount are required fields." },
        { status: 400 },
      );
    }

    const { data: createdGoal, error } = await supabase
      .from("savings_goals")
      .insert({
        user_id: user.id,
        name,
        target_amount,
        current_amount: current_amount ?? 0,
        target_date: target_date || null,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ goal: createdGoal }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON request payload." },
      { status: 400 },
    );
  }
}

export async function PUT(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { error: "Unauthorised. Please sign in." },
      { status: 401 },
    );
  }

  try {
    const body = await request.json();
    const { id, name, target_amount, current_amount, target_date } = body;

    if (!id) {
      return NextResponse.json(
        { error: "id is required to update a savings goal." },
        { status: 400 },
      );
    }

    const updates: Record<string, any> = {};
    if (name !== undefined) updates.name = name;
    if (target_amount !== undefined) updates.target_amount = target_amount;
    if (current_amount !== undefined) updates.current_amount = current_amount;
    if (target_date !== undefined) updates.target_date = target_date;

    const { data: updatedGoal, error } = await supabase
      .from("savings_goals")
      .update(updates)
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ goal: updatedGoal }, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON request payload." },
      { status: 400 },
    );
  }
}

export async function DELETE(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { error: "Unauthorised. Please sign in." },
      { status: 401 },
    );
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json(
      { error: "Goal id query parameter is required for deletion." },
      { status: 400 },
    );
  }

  const { error } = await supabase
    .from("savings_goals")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(
    { message: "Savings goal deleted successfully." },
    { status: 200 },
  );
}
