const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

function getToken(): string | null {
  return localStorage.getItem('token');
}

export async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    const msg = typeof err.detail === 'string'
      ? err.detail
      : Array.isArray(err.detail)
        ? err.detail[0]?.msg || 'Validation error'
        : 'Request failed';
    throw new Error(msg);
  }
  return res.json();
}

export const api = {
  auth: {
    register: (email: string, password: string, name?: string) =>
      request<{ access_token: string }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, password, name: name || '' }),
      }),
    login: (email: string, password: string) =>
      request<{ access_token: string }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }),
  },
  transactions: {
    list: (month?: string) =>
      request<Transaction[]>(month ? `/transactions?month=${month}` : '/transactions'),
    get: (id: string) => request<Transaction>(`/transactions/${id}`),
    create: (data: TransactionInput) =>
      request<Transaction>('/transactions', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: Partial<TransactionInput>) =>
      request<Transaction>(`/transactions/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      request<{ message: string }>(`/transactions/${id}`, { method: 'DELETE' }),
    categories: () =>
      request<{ categories: string[] }>('/transactions/categories').then((r) => r.categories),
  },
  summary: (month?: string) =>
    request<Summary>(month ? `/summary?month=${month}` : '/summary'),
};

export interface Transaction {
  id?: string;
  _id?: string
  user_id: string;
  type: 'income' | 'expense';
  amount: number;
  currency: string;
  category: string;
  description: string;
  date: string;
  created_at: string;
  updated_at: string;
}

/** Resolve transaction id from API response (id or _id). */
export function getTransactionId(tx: Transaction): string {
  if (tx.id) return String(tx.id);
  const raw = (tx as { _id?: string | { $oid?: string } })._id;
  if (typeof raw === 'string') return raw;
  if (raw && typeof raw === 'object' && typeof raw.$oid === 'string') return raw.$oid;
  return '';
}

export interface TransactionInput {
  type: 'income' | 'expense';
  amount: number;
  currency?: string;
  category: string;
  description?: string;
  date?: string;
}

export interface Summary {
  total_income: number;
  total_expense: number;
  balance: number;
  category_breakdown: Record<string, number>;
}

/** Fallback categories when API is unavailable. */
export const CATEGORIES_FALLBACK = [
  'Salary', 'Food', 'Rent', 'Freelance', 'Transport',
  'Entertainment', 'Utilities', 'Shopping', 'Other',
];
