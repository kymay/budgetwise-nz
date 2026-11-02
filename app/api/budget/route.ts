import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

// Helper to create a Supabase client that can read the user's session from cookies.
// We use this instead of the browser client because API routes run on the server.
async function createClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )
}

// GET /api/budget
// Returns the logged-in user's monthly income and all their budget category limits.
export async function GET() {
  const supabase = await createClient()

  // Check the session — if no user is logged in, return 401 Unauthorised
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  // Fetch the user's income setting and their category limits in parallel
  const [settingsResult, categoriesResult] = await Promise.all([
    supabase
      .from('user_settings')
      .select('monthly_income')
      .eq('user_id', user.id)
      .single(),
    supabase
      .from('budget_categories')
      .select('id, name, monthly_limit')
      .eq('user_id', user.id)
      .order('name'),
  ])

  // Return both together so the frontend can display the full budget in one request
  return NextResponse.json({
    monthly_income: settingsResult.data?.monthly_income ?? 0,
    categories: categoriesResult.data ?? [],
  })
}

// POST /api/budget
// Creates the user's budget for the first time.
// Expects a JSON body: { monthly_income: number, categories: [{ name, monthly_limit }] }
export async function POST(request: Request) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const body = await request.json()
  const { monthly_income, categories } = body

  // Basic validation — both fields are required
  if (monthly_income === undefined || !Array.isArray(categories)) {
    return NextResponse.json({ error: 'monthly_income and categories are required' }, { status: 400 })
  }

  // Save the user's income — the unique constraint on user_id means only one row per user
  const { error: settingsError } = await supabase
    .from('user_settings')
    .insert({ user_id: user.id, monthly_income })

  if (settingsError) {
    return NextResponse.json({ error: settingsError.message }, { status: 500 })
  }

  // Attach the user_id to each category before inserting
  const categoryRows = categories.map((cat: { name: string; monthly_limit: number }) => ({
    user_id: user.id,
    name: cat.name,
    monthly_limit: cat.monthly_limit,
  }))

  const { data: createdCategories, error: categoriesError } = await supabase
    .from('budget_categories')
    .insert(categoryRows)
    .select()

  if (categoriesError) {
    return NextResponse.json({ error: categoriesError.message }, { status: 500 })
  }

  return NextResponse.json({ monthly_income, categories: createdCategories }, { status: 201 })
}

// PUT /api/budget
// Updates the user's existing budget — income and/or category limits.
// Expects a JSON body: { monthly_income?: number, categories?: [{ id?, name, monthly_limit }] }
export async function PUT(request: Request) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const body = await request.json()
  const { monthly_income, categories } = body

  // Update income if it was provided
  if (monthly_income !== undefined) {
    // upsert = insert if not exists, update if it does — safe to call even on first setup
    const { error } = await supabase
      .from('user_settings')
      .upsert({ user_id: user.id, monthly_income })
      .eq('user_id', user.id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
  }

  // Update each category if a list was provided
  if (Array.isArray(categories)) {
    for (const cat of categories) {
      const { error } = await supabase
        .from('budget_categories')
        .upsert({ ...cat, user_id: user.id })
        .eq('user_id', user.id)

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
    }
  }

  return NextResponse.json({ message: 'Budget updated successfully' })
}
