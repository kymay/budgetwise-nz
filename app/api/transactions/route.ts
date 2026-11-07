import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

// Creates a Supabase client that reads the logged in user session from cookies.
// API routes run on the server so we cannot use the browser client here.
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

// GET /api/transactions
// Returns all transactions for the logged in user, newest first.
// Accepts optional query params for filtering by category or date range.
export async function GET(request: Request) {
  const supabase = await createClient()

  // Reject the request if no one is logged in
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  // Pull optional filters out of the URL query string
  const { searchParams } = new URL(request.url)
  const category = searchParams.get('category')
  const from = searchParams.get('from')
  const to = searchParams.get('to')

  // Start building the query and sort newest transactions to the top
  let query = supabase
    .from('transactions')
    .select('id, name, amount, category, date, created_at')
    .eq('user_id', user.id)
    .order('date', { ascending: false })

  // Apply filters only when the caller has provided them
  if (category) query = query.eq('category', category)
  if (from) query = query.gte('date', from)
  if (to) query = query.lte('date', to)

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ transactions: data })
}

// POST /api/transactions
// Creates a new transaction for the logged in user.
// Expects a JSON body with name, amount, category and date.
export async function POST(request: Request) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const body = await request.json()
  const { name, amount, category, date } = body

  // All four fields are required to save a valid transaction
  if (!name || amount === undefined || !date) {
    return NextResponse.json({ error: 'name, amount and date are required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('transactions')
    .insert({ user_id: user.id, name, amount, category, date })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ transaction: data }, { status: 201 })
}
