import { useState } from "react"
import { motion } from "framer-motion"
import { useNavigate, Link } from "react-router-dom"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/stores/authStore"

export function Login() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()
  const { setAuth } = useAuth()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    try {
      const response = await fetch("http://127.0.0.1:8008/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email, password: password })
      })

      if (response.ok) {
        const data = await response.json()
        setAuth(data.user, data.access_token)
        navigate("/dashboard")
      } else {
        alert("Invalid credentials. Please verify your corporate email and password.")
      }
    } catch (error) {
      alert("Authentication system offline.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex justify-center items-center min-h-[85vh] relative py-12">
      {/* Decorative background blobs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl -z-10 mix-blend-multiply opacity-50 dark:opacity-20 animate-pulse-glow" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-ai/20 rounded-full blur-3xl -z-10 mix-blend-multiply opacity-50 dark:opacity-20 animate-pulse-glow" style={{ animationDelay: '1s' }} />

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, type: "spring", stiffness: 200, damping: 20 }}
        className="w-full max-w-md"
      >
        <Card className="w-full border-white/10 shadow-2xl shadow-black/5 bg-background/80 backdrop-blur-2xl rounded-3xl overflow-hidden relative">
          <div className="absolute top-0 w-full h-1 ai-gradient-bg" />
          <CardHeader className="space-y-3 pb-6 pt-10 px-10 text-center">
            <CardTitle className="text-3xl font-extrabold tracking-tight ai-gradient-text">Welcome Back</CardTitle>
            <CardDescription className="text-base text-muted-foreground">Sign in to securely access the compliance vault.</CardDescription>
          </CardHeader>
          <CardContent className="px-10 pb-10">
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="font-semibold text-foreground/80">Corporate Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-12 bg-background/50 focus:bg-background transition-colors px-4 rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="font-semibold text-foreground/80">Password</Label>
                    <a href="#" className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors">Forgot password?</a>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-12 bg-background/50 focus:bg-background transition-colors px-4 rounded-xl"
                  />
                </div>
              </div>
              <Button 
                className="w-full h-12 text-base font-semibold shadow-xl shadow-primary/20 rounded-xl hover:scale-[1.02] transition-transform" 
                variant="ai" 
                type="submit"
                disabled={isLoading}
              >
                {isLoading ? "Authenticating..." : "Sign In"}
              </Button>
              <p className="text-center text-sm text-muted-foreground mt-4">
                Don't have an account? <Link to="/signup" className="text-primary font-bold hover:underline">Create Account</Link>
              </p>
            </form>
          </CardContent>
        </Card>
        
        <p className="text-center text-sm font-medium text-muted-foreground mt-8">
          Powered by Resolver AI Engine securely.
        </p>
      </motion.div>
    </div>
  )
}
