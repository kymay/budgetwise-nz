'use client'

import { useEffect, useState } from 'react'

type Transaction = {
  id: string
  name: string
  amount: number
  category: string | null
  date: string
}

const CATEGORIES = [
  'Groceries',
  'Rent',
  'Transport',
  'Utilities',
  'Entertainment',
  'Subscriptions',
  'Dining Out',
  'Healthcare',
  'Education',
  'Other',
]

// Empty form state used when creating a new transaction or resetting after save
const emptyForm = {
  name: '',
  amount: '',
  category: 'Groceries',
  date: new Date().toISOString().split('T')[0],
  type: 'expense' as 'expense' | 'income',
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  // Load all transactions when the page first mounts
  useEffect(() => {
    loadTransactions()
  }, [])

  async function loadTransactions() {
    setLoading(true)
    const res = await fetch('/api/transactions')
    const data = await res.json()
    setTransactions(data.transactions ?? [])
    setLoading(false)
  }

  // Pre-fill the form with an existing transaction so the user can edit it
  function startEdit(t: Transaction) {
    setEditingId(t.id)
    setError(null)
    setSuccess(null)
    setForm({
      name: t.name,
      amount: Math.abs(t.amount).toString(),
      category: t.category ?? 'Groceries',
      date: t.date,
      type: t.amount >= 0 ? 'income' : 'expense',
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function cancelEdit() {
    setEditingId(null)
    setForm(emptyForm)
    setError(null)
  }

  function validateForm() {
    if (!form.name.trim()) return 'Name is required.'
    if (!form.amount || isNaN(parseFloat(form.amount)) || parseFloat(form.amount) <= 0)
      return 'Amount must be a positive number.'
    if (!form.date) return 'Date is required.'
    return null
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    const validationError = validateForm()
    if (validationError) {
      setError(validationError)
      return
    }

    setSaving(true)

    // Expenses are stored as negative amounts and income as positive
    const signedAmount =
      form.type === 'expense'
        ? -Math.abs(parseFloat(form.amount))
        : Math.abs(parseFloat(form.amount))

    const payload = {
      name: form.name.trim(),
      amount: signedAmount,
      category: form.category,
      date: form.date,
    }

    const res = editingId
      ? await fetch(`/api/transactions/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      : await fetch('/api/transactions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })

    const data = await res.json()

    if (!res.ok) {
      setError(data.error ?? 'Something went wrong.')
    } else {
      setSuccess(editingId ? 'Transaction updated.' : 'Transaction saved.')
      setEditingId(null)
      setForm(emptyForm)
      await loadTransactions()
    }

    setSaving(false)
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/transactions/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setDeleteConfirmId(null)
      setSuccess('Transaction deleted.')
      await loadTransactions()
    } else {
      setError('Failed to delete transaction.')
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900 px-4 py-8">
      <div className="mx-auto max-w-2xl space-y-6">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Transactions</h1>

        {/* Add or edit form */}
        <div className="rounded-2xl bg-white dark:bg-zinc-800 p-6 shadow-sm">
          <h2 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-4">
            {editingId ? 'Edit transaction' : 'Add a transaction'}
          </h2>

          {error && (
            <p className="mb-4 rounded-lg bg-red-50 dark:bg-red-950 px-3 py-2 text-sm text-red-600 dark:text-red-400">
              {error}
            </p>
          )}
          {success && (
            <p className="mb-4 rounded-lg bg-green-50 dark:bg-green-950 px-3 py-2 text-sm text-green-600 dark:text-green-400">
              {success}
            </p>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Income or expense toggle */}
            <div className="flex rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-700">
              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, type: 'expense' }))}
                className={`flex-1 py-2 text-sm font-medium transition-colors ${
                  form.type === 'expense'
                    ? 'bg-red-500 text-white'
                    : 'bg-white dark:bg-zinc-800 text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-700'
                }`}
              >
                Expense
              </button>
              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, type: 'income' }))}
                className={`flex-1 py-2 text-sm font-medium transition-colors ${
                  form.type === 'income'
                    ? 'bg-green-500 text-white'
                    : 'bg-white dark:bg-zinc-800 text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-700'
                }`}
              >
                Income
              </button>
            </div>

            <div>
              <label className="block text-xs text-zinc-500 mb-1">Name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Countdown groceries"
                className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-xs text-zinc-500 mb-1">Amount ($)</label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={form.amount}
                  onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                  placeholder="0.00"
                  className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs text-zinc-500 mb-1">Date</label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                  className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-zinc-500 mb-1">Category</label>
              <select
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 rounded-xl bg-green-500 py-2.5 text-sm font-semibold text-white hover:bg-green-600 disabled:opacity-50 transition-colors"
              >
                {saving ? 'Saving...' : editingId ? 'Update' : 'Save'}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="flex-1 rounded-xl border border-zinc-200 dark:border-zinc-700 py-2.5 text-sm font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Transaction list */}
        <div className="rounded-2xl bg-white dark:bg-zinc-800 p-6 shadow-sm">
          <h2 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-4">All transactions</h2>

          {loading ? (
            <p className="text-sm text-zinc-400">Loading...</p>
          ) : transactions.length === 0 ? (
            <p className="text-sm text-zinc-400">No transactions yet. Add one above.</p>
          ) : (
            <ul className="divide-y divide-zinc-100 dark:divide-zinc-700">
              {transactions.map((t) => (
                <li key={t.id} className="py-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-zinc-800 dark:text-zinc-100">{t.name}</p>
                      <p className="text-xs text-zinc-400">{t.category ?? 'Uncategorised'} &middot; {t.date}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <p className={`text-sm font-semibold ${t.amount >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {t.amount >= 0 ? '+' : ''}${Math.abs(t.amount).toFixed(2)}
                      </p>
                      <button
                        onClick={() => startEdit(t)}
                        className="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
                      >
                        Edit
                      </button>
                      {deleteConfirmId === t.id ? (
                        <span className="flex items-center gap-2 text-xs">
                          <button
                            onClick={() => handleDelete(t.id)}
                            className="text-red-500 hover:text-red-600 font-medium"
                          >
                            Confirm
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(null)}
                            className="text-zinc-400 hover:text-zinc-600"
                          >
                            Cancel
                          </button>
                        </span>
                      ) : (
                        // Requires a second tap to confirm so users do not accidentally delete
                        <button
                          onClick={() => setDeleteConfirmId(t.id)}
                          className="text-xs text-zinc-400 hover:text-red-500 transition-colors"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
