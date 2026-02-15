import { Link } from 'react-router-dom'
import { useAuth } from '@/AuthContext'
import { Button } from '@/components/ui/button'
import { Wallet } from 'lucide-react'

export function Navbar() {
  const { isAuthenticated, logout } = useAuth()

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-card shadow-sm">
      <div className="w-full max-w-[1600px] mx-auto flex min-h-[4.5rem] items-center gap-6 px-4 md:px-6 lg:px-8">
        <Link
          to="/"
          className="flex items-center gap-3 font-semibold text-foreground hover:text-primary transition-colors"
        >
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Wallet className="size-6" />
          </div>
          <span className="text-lg tracking-tight hidden sm:inline-block">
            Expense Tracker
          </span>
        </Link>
        <div className="flex flex-1 items-center justify-end gap-3">
          {isAuthenticated ? (
            <Button variant="outline" size="default" onClick={logout} className="font-medium">
              Logout
            </Button>
          ) : (
            <Button variant="default" size="default" asChild className="font-medium px-6">
              <Link to="/login">Sign in</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}
