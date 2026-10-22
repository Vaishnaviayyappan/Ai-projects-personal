import { useState } from "react"
import { motion } from "framer-motion"
import { useNavigate, Link } from "react-router-dom"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/stores/authStore"


export function Signup() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [tenantId, setTenantId] = useState("GLOBAL_CORP")
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()
  const { setAuth } = useAuth()

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    try {
      const response = await fetch("http://127.0.0.1:8008/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role: "Reporter", tenant_id: tenantId })
      })

      const data = await response.json()

      if (response.ok) {
        console.log("[SIGNUP] Identity provisioned successfully:", data);
        // AUTO-LOGIN BRIDGE: Establish session immediately
        console.log("[SIGNUP] Attempting auto-login for:", email);
        const loginResp = await fetch("http://127.0.0.1:8008/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password })
        })
        
        if (loginResp.ok) {
          const loginData = await loginResp.json()
          console.log("[SIGNUP] Auto-login successful. Terminating registration flow.");
          setAuth(loginData.user, loginData.access_token)
          navigate("/report") 
        } else {
          const logErr = await loginResp.json();
          console.error("[SIGNUP] Auto-login rejected:", logErr);
          alert(`Identity provisioned, but session initialization failed (${logErr.detail}). Please login manually.`)
          navigate("/login")
        }
      } else {
        console.error("[SIGNUP] Provisioning failed:", data);
        alert(`Provisioning Failed: ${data.detail || "Validation Error Detected"}`)
      }
    } catch (error) {
      alert("Registration system unreachable: Verify bridge connectivity.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex justify-center items-center min-h-[85vh] relative py-12">
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
            <CardTitle className="text-3xl font-extrabold tracking-tight ai-gradient-text">Create Account</CardTitle>
            <CardDescription className="text-base text-muted-foreground">Join the ProAct Enterprise Network.</CardDescription>
          </CardHeader>
          <CardContent className="px-10 pb-10">
            <form onSubmit={handleSignup} className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input id="name" placeholder="John Doe" value={name} onChange={(e) => setName(e.target.value)} required 
                    className="h-12 bg-background/50 rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Work Email</Label>
                  <Input id="email" type="email" placeholder="john@company.com" value={email} onChange={(e) => setEmail(e.target.value)} required 
                    className="h-12 bg-background/50 rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tenant">Organization Code</Label>
                  <Input id="tenant" placeholder="e.g. CORP_HQL" value={tenantId} onChange={(e) => setTenantId(e.target.value)} required 
                    className="h-12 bg-background/50 rounded-xl" />
                </div>
                {/* Public Role Lock: Only Reporters allowed from outside */}
                <div className="space-y-2 opacity-50 cursor-not-allowed">
                  <Label htmlFor="role">Account Type</Label>
                  <div className="h-12 w-full flex items-center bg-muted/30 rounded-xl px-4 text-sm font-bold border border-white/5">
                    Whistleblower / Reporter
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required 
                    className="h-12 bg-background/50 rounded-xl" />
                </div>
              </div>
              <Button className="w-full h-12 text-base font-semibold shadow-xl shadow-primary/20 rounded-xl" variant="ai" type="submit" disabled={isLoading}>
                {isLoading ? "Provisioning..." : "Create Reporter Account"}
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                Already have an account? <Link to="/login" className="text-primary font-bold hover:underline">Sign In</Link>
              </p>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
