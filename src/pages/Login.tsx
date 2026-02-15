import { useState } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'react-toastify'
import { useAuth } from '@/AuthContext'
import { api } from '@/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Mail, Lock, User, Loader2 } from 'lucide-react'

export default function Login() {
  const { login, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [isRegister, setIsRegister] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')

  const authMutation = useMutation({
    mutationFn: () =>
      isRegister ? api.auth.register(email, password, name) : api.auth.login(email, password),
    onSuccess: (data) => {
      login(data.access_token)
      if (isRegister) toast.success('Account created successfully. Signed in.')
      else toast.success('Signed in successfully')
      navigate('/')
    },
    onError: (err: Error) => {
      const msg = err.message || 'Something went wrong'
      setError(msg)
      toast.error(msg)
    },
  })

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!email.trim() || !password) {
      setError('Email and password required')
      return
    }
    if (isRegister) {
      if (password !== confirmPassword) {
        setError('Passwords do not match')
        return
      }
    }
    authMutation.mutate()
  }

  if (isAuthenticated) return <Navigate to="/" replace />

  const inputWrap = 'relative'
  const iconClass = 'absolute left-3 top-1/2 -translate-y-1/2 size-5 text-muted-foreground pointer-events-none'

  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center p-4 bg-muted/30">
      <Card className="w-full max-w-[420px] shadow-lg">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl">
            {isRegister ? 'Create account' : 'Sign in'}
          </CardTitle>
          <CardDescription>
            {isRegister ? 'Enter your details to register.' : 'Enter your credentials to sign in.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-4">
            {isRegister && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Name</label>
                <div className={inputWrap}>
                  <User className={iconClass} />
                  <Input
                    type="text"
                    className="pl-10"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    autoComplete="name"
                  />
                </div>
              </div>
            )}
            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <div className={inputWrap}>
                <Mail className={iconClass} />
                <Input
                  type="email"
                  className="pl-10"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Password</label>
              <div className={inputWrap}>
                <Lock className={iconClass} />
                <Input
                  type="password"
                  className="pl-10"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete={isRegister ? 'new-password' : 'current-password'}
                />
              </div>
            </div>
            {isRegister && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Confirm password</label>
                <div className={inputWrap}>
                  <Lock className={iconClass} />
                  <Input
                    type="password"
                    className="pl-10"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="new-password"
                  />
                </div>
              </div>
            )}
            {error && (
              <p className="text-sm text-destructive">
                {error}
              </p>
            )}
            <Button
              type="submit"
              className="w-full"
              disabled={authMutation.isPending}
            >
              {authMutation.isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Please wait...
                </>
              ) : isRegister ? (
                'Register'
              ) : (
                'Sign in'
              )}
            </Button>
          </form>
          <Button
            type="button"
            variant="ghost"
            className="w-full mt-4"
            onClick={() => {
              setIsRegister((v) => !v)
              setError('')
              setConfirmPassword('')
            }}
          >
            {isRegister ? 'Already have an account? Sign in' : 'Need an account? Register'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
