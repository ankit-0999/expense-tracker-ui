import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-toastify'
import { api, CATEGORIES_FALLBACK, getTransactionId } from '@/api'
import type { Transaction, TransactionInput } from '@/api'
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { TrendingUp, TrendingDown, Wallet, PlusCircle, List } from 'lucide-react'

const COLORS = ['#0f172a', '#dc2626', '#16a34a', '#ca8a04', '#7c3aed', '#0891b2']

function formatDate(s: string) {
  return new Date(s).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function currentMonthParam() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export default function Dashboard() {
  const queryClient = useQueryClient()
  const [month, setMonth] = useState(currentMonthParam())
  const [form, setForm] = useState<Partial<TransactionInput> & { id?: string }>({
    type: 'expense',
    amount: 0,
    category: 'Food',
    description: '',
    date: new Date().toISOString().slice(0, 10),
  })
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ['summary', month],
    queryFn: () => api.summary(month),
  })

  const { data: transactions = [], isLoading: txLoading } = useQuery({
    queryKey: ['transactions', month],
    queryFn: () => api.transactions.list(month),
  })

  const { data: formCategories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.transactions.categories(),
    placeholderData: CATEGORIES_FALLBACK,
  })
  const categoriesForForm = formCategories ?? CATEGORIES_FALLBACK

  const createMutation = useMutation({
    mutationFn: (data: TransactionInput) => api.transactions.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions', month] })
      queryClient.invalidateQueries({ queryKey: ['summary', month] })
      setForm((f) => ({ ...f, amount: 0, description: '' }))
      toast.success('Transaction created successfully')
    },
    onError: (err: Error) => toast.error(err.message || 'Failed to create transaction'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<TransactionInput> }) =>
      api.transactions.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions', month] })
      queryClient.invalidateQueries({ queryKey: ['summary', month] })
      setForm({ type: 'expense', amount: 0, category: 'Food', description: '', date: new Date().toISOString().slice(0, 10), id: undefined })
      toast.success('Transaction updated successfully')
    },
    onError: (err: Error) => toast.error(err.message || 'Failed to update transaction'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.transactions.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions', month] })
      queryClient.invalidateQueries({ queryKey: ['summary', month] })
      setDeleteConfirmId(null)
      toast.success('Transaction deleted successfully')
    },
    onError: (err: Error) => {
      setDeleteConfirmId(null)
      toast.error(err.message || 'Failed to delete transaction')
    },
  })

  const submitForm = (e: React.FormEvent) => {
    e.preventDefault()
    const amount = Number(form.amount)
    if (!amount || amount <= 0 || !form.category) return
    const payload: TransactionInput = {
      type: form.type!,
      amount,
      category: form.category,
      description: form.description || '',
      date: form.date ? new Date(form.date).toISOString() : undefined,
    }
    if (form.id) {
      updateMutation.mutate({ id: form.id, data: payload })
    } else {
      createMutation.mutate(payload)
    }
  }

  const chartData = summary
    ? [
        { name: 'Income', value: summary.total_income, fill: '#16a34a' },
        { name: 'Expense', value: summary.total_expense, fill: '#dc2626' },
      ].filter((d) => d.value > 0)
    : []

  const categoryChartData = summary
    ? Object.entries(summary.category_breakdown).map(([name, value]) => ({
        name,
        value: Math.abs(value),
      }))
    : []

  const labelClass = 'block text-sm font-medium text-muted-foreground mb-2'

  return (
    <div className="w-full min-h-[calc(100vh-3.5rem)] bg-muted/30">
      {deleteConfirmId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setDeleteConfirmId(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-dialog-title"
        >
          <Card className="w-full max-w-sm shadow-xl bg-background" onClick={(e) => e.stopPropagation()}>
            <CardHeader className="pb-2">
              <CardTitle id="delete-dialog-title" className="text-lg">Delete transaction</CardTitle>
              <CardDescription>Are you sure you want to delete the transaction? This cannot be undone.</CardDescription>
            </CardHeader>
            <CardContent className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={() => setDeleteConfirmId(null)}>Cancel</Button>
              <Button
                type="button"
                variant="destructive"
                disabled={deleteMutation.isPending}
                onClick={() => deleteMutation.mutate(deleteConfirmId)}
              >
                {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="w-full max-w-[1600px] mx-auto p-4 md:p-6 lg:p-8 space-y-6">
        {/* Month filter - title/description left, calendar right */}
        <Card className="shadow-sm bg-primary/5 border-primary/10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6">
            <div className="space-y-1.5">
              <CardTitle className="text-2xl sm:text-3xl font-bold tracking-tight">
                Select month
              </CardTitle>
              <CardDescription className="text-base">
                Choose the month to view transactions and summary
              </CardDescription>
            </div>
            <div className="flex-shrink-0">
              <Input
                type="month"
                className="w-full sm:w-[200px] h-11"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
              />
            </div>
          </div>
        </Card>

        {summaryLoading ? (
          <Card className="bg-primary/5"><CardContent className="py-8 text-center text-muted-foreground">Loading summary...</CardContent></Card>
        ) : summary ? (
          <>
            {/* Summary row: balance + quick stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="shadow-sm bg-primary/5 border-primary/10">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Balance (this month)</CardTitle>
                  <Wallet className="size-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <p className={`text-2xl font-bold ${summary.balance >= 0 ? 'text-green-600' : 'text-destructive'}`}>
                    ₹{summary.balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </p>
                </CardContent>
              </Card>
              <Card className="shadow-sm bg-green-500/10 border-green-500/20">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Income</CardTitle>
                  <TrendingUp className="size-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-green-600">
                    ₹{summary.total_income.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </p>
                </CardContent>
              </Card>
              <Card className="shadow-sm bg-red-500/10 border-red-500/20">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Expense</CardTitle>
                  <TrendingDown className="size-4 text-destructive" />
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-destructive">
                    ₹{summary.total_expense.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Charts row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="shadow-sm bg-blue-500/5 border-blue-500/10">
                <CardHeader>
                  <CardTitle>Income vs Expense</CardTitle>
                  <CardDescription>Comparison for selected month</CardDescription>
                </CardHeader>
                <CardContent>
                  {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={240}>
                      <BarChart data={chartData}>
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Bar dataKey="value" name="Amount (₹)" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-muted-foreground text-sm py-8 text-center">No data for this month.</p>
                  )}
                </CardContent>
              </Card>
              <Card className="shadow-sm bg-violet-500/5 border-violet-500/10">
                <CardHeader>
                  <CardTitle>By category</CardTitle>
                  <CardDescription>Spending by category</CardDescription>
                </CardHeader>
                <CardContent>
                  {categoryChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={240}>
                      <PieChart>
                        <Pie
                          data={categoryChartData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          label={({ name, value }) => `${name}: ₹${value.toFixed(0)}`}
                        >
                          {categoryChartData.map((_, i) => (
                            <Cell key={i} fill={COLORS[i % COLORS.length]} />
                          ))}
                        </Pie>
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-muted-foreground text-sm py-8 text-center">No data for this month.</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </>
        ) : null}

        {/* Add transaction + Recent list */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="shadow-sm bg-primary/5 border-primary/10">
            <CardHeader className="flex flex-row items-center gap-2">
              <PlusCircle className="size-5" />
              <CardTitle>{form.id ? 'Edit transaction' : 'Add transaction'}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={submitForm} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className={labelClass}>Type</label>
                    <select
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      value={form.type}
                      onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as 'income' | 'expense' }))}
                    >
                      <option value="income">Income</option>
                      <option value="expense">Expense</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className={labelClass}>Amount (₹)</label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={form.amount || ''}
                      onChange={(e) => setForm((f) => ({ ...f, amount: parseFloat(e.target.value) || 0 }))}
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className={labelClass}>Category</label>
                    <select
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      value={form.category}
                      onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                    >
                      {categoriesForForm.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className={labelClass}>Description (optional)</label>
                  <Input
                    type="text"
                    value={form.description || ''}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                    placeholder="Note"
                  />
                </div>
                <div className="space-y-2">
                  <label className={labelClass}>Date</label>
                  <Input
                    type="date"
                    className="max-w-[180px]"
                    value={form.date || ''}
                    onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                    {form.id ? 'Update' : 'Add'}
                  </Button>
                  {form.id && (
                    <Button type="button" variant="outline" onClick={() => setForm({ type: 'expense', amount: 0, category: 'Food', description: '', date: new Date().toISOString().slice(0, 10), id: undefined })}>
                      Cancel
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>

          <Card className="shadow-sm bg-slate-500/5 border-slate-500/10">
            <CardHeader className="flex flex-row items-center gap-2">
              <List className="size-5" />
              <CardTitle>Recent transactions</CardTitle>
            </CardHeader>
            <CardContent>
              {txLoading ? (
                <p className="text-muted-foreground py-4">Loading...</p>
              ) : transactions.length === 0 ? (
                <p className="text-muted-foreground py-4">No transactions this month.</p>
              ) : (
                <ul className="space-y-0 divide-y divide-border">
                  {transactions.map((tx: Transaction) => {
                    const txId = getTransactionId(tx)
                    return (
                    <li key={txId || tx.date} className="flex justify-between items-center py-4 first:pt-0">
                      <div>
                        <span
                          className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${
                            tx.type === 'income' ? 'bg-green-100 text-green-800' : 'bg-destructive/10 text-destructive'
                          }`}
                        >
                          {tx.type}
                        </span>
                        <span className="ml-2 font-medium">{tx.category}</span>
                        {tx.description && (
                          <span className="ml-2 text-muted-foreground text-sm">– {tx.description}</span>
                        )}
                        <div className="text-xs text-muted-foreground mt-1">{formatDate(tx.date)}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`font-semibold ${tx.type === 'income' ? 'text-green-600' : 'text-destructive'}`}>
                          {tx.type === 'income' ? '+' : '-'}₹{tx.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            setForm({
                              id: txId,
                              type: tx.type,
                              amount: tx.amount,
                              category: tx.category,
                              description: tx.description,
                              date: tx.date.slice(0, 10),
                            })
                          }
                        >
                          Edit
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => txId && setDeleteConfirmId(txId)}
                        >
                          Delete
                        </Button>
                      </div>
                    </li>
                  )})}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
