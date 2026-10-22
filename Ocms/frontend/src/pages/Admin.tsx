import React, { useState } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Shield, Lock, Database, Globe, BrainCircuit, UserPlus, Loader2, CheckCircle } from "lucide-react"

const RBAC_POLICIES = [
  { role: "Reporter", access: "Limited", level: 1, permissions: ["Create Complaints", "View Own Status"] },
  { role: "Case Handler", access: "Operational", level: 2, permissions: ["View All Complaints", "Update Status", "Basic Analytics"] },
  { role: "Compliance Officer", access: "Auditorial", level: 4, permissions: ["View Audit Logs", "Verify Ethics Flags", "Export Reports"] },
  { role: "System Administrator", access: "Total Control", level: 7, permissions: ["All System Functions", "Manage Users", "Define RBAC"] },
]

export function Admin() {
  const [provisioning, setProvisioning] = useState(false)
  const [success, setSuccess] = useState(false)
  const [formData, setFormData] = useState({ name: '', email: '', role: 'Case Handler', password: 'Password123' })

  const handleProvision = async (e: React.FormEvent) => {
    e.preventDefault()
    setProvisioning(true)
    
    try {
      const resp = await fetch("http://127.0.0.1:8008/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      })
      
      if (resp.ok) {
        setSuccess(true)
        setTimeout(() => setSuccess(false), 3000)
        setFormData({ name: '', email: '', role: 'Case Handler', password: 'Password123' })
      } else {
        const error = await resp.json()
        alert(`Provisioning Failed: ${error.detail}`)
      }
    } catch (err) {
      alert("Auth Bridge Error")
    } finally {
      setProvisioning(false)
    }
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto py-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-black ai-gradient-text tracking-tighter">System Administration</h2>
        <p className="text-muted-foreground font-medium">Manage Role-Based Access Control and underlying Agentic neural pathways.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-8">
          {/* RBAC Matrix Card */}
          <Card className="bg-background/40 backdrop-blur-xl border-white/5 shadow-2xl overflow-hidden relative rounded-[2rem]">
            <div className="absolute top-0 w-full h-1 bg-primary" />
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl font-black">
                <Shield className="w-6 h-6 text-primary" /> RBAC Matrix
              </CardTitle>
              <CardDescription className="text-xs font-medium">Configure system hierarchies across designated enterprise roles.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {RBAC_POLICIES.map((p) => (
                <div key={p.role} className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-primary/30 transition-all group">
                  <div className="flex flex-col">
                    <span className="font-bold text-foreground text-sm">{p.role}</span>
                    <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-black">Level {p.level} Access</span>
                  </div>
                  <div className="flex gap-2">
                    {p.permissions.slice(0, 1).map(perm => (
                      <Badge key={perm} variant="outline" className="text-[9px] border-white/10 uppercase font-bold">{perm}</Badge>
                    ))}
                    <Badge className="bg-primary/20 text-primary border-none text-[9px] font-black">ACTIVE</Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* User Provisioning Console */}
          <Card className="bg-background/40 backdrop-blur-xl border-white/5 shadow-2xl overflow-hidden relative rounded-[2rem]">
            <div className="absolute top-0 w-full h-1 ai-gradient-bg" />
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl font-black">
                <UserPlus className="w-6 h-6 text-ai" /> User Provisioning
              </CardTitle>
              <CardDescription className="text-xs font-medium">Authorize new personnel and assign specialized investigatory roles.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleProvision} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] uppercase font-black tracking-widest ml-1 text-muted-foreground">Full Name</Label>
                    <Input 
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        placeholder="Expert Name" 
                        className="h-11 bg-background/50 rounded-xl" 
                        required 
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] uppercase font-black tracking-widest ml-1 text-muted-foreground">Initial Role</Label>
                    <select 
                        value={formData.role}
                        onChange={(e) => setFormData({...formData, role: e.target.value})}
                        className="flex h-11 w-full items-center justify-between rounded-xl border border-white/10 bg-background/50 px-4 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-ai/50 transition-all appearance-none cursor-pointer"
                    >
                        <option value="Case Handler">Case Handler</option>
                        <option value="Legal Counsel">Legal Counsel</option>
                        <option value="Compliance Officer">Compliance Officer</option>
                        <option value="System Administrator">Admin</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] uppercase font-black tracking-widest ml-1 text-muted-foreground">Corporate Email</Label>
                  <Input 
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    type="email" 
                    placeholder="expert@enterprise.ai" 
                    className="h-11 bg-background/50 rounded-xl" 
                    required 
                  />
                </div>
                <Button disabled={provisioning || success} type="submit" className="w-full h-11 rounded-xl font-black text-xs uppercase tracking-widest ai-gradient-bg text-white shadow-xl shadow-ai/20 transition-all hover:scale-[1.02]">
                  {provisioning ? <Loader2 className="w-4 h-4 animate-spin" /> : success ? <><CheckCircle className="w-4 h-4 mr-2" /> Authorized</> : "Provision Identity"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-background/40 backdrop-blur-xl border-white/5 shadow-2xl relative rounded-[2rem]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl font-black">
              <Database className="w-5 h-5 text-ai" /> Agent Cluster Core
            </CardTitle>
            <CardDescription className="text-xs font-medium">Monitoring neural node health and Vector DB persistence.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: "Vector Indexing", status: "Optimal", icon: Globe },
                { label: "LLM Orchestration", status: "Healthy", icon: BrainCircuit },
                { label: "Memory Retention", status: "100%", icon: Database },
                { label: "Crypto-Anonymizer", status: "Live", icon: Lock },
              ].map((node) => (
                <div key={node.label} className="p-4 rounded-xl bg-background/60 border border-white/5 flex flex-col items-center justify-center text-center gap-2 group hover:border-ai/40 transition-all">
                  <node.icon className="w-6 h-6 text-muted-foreground group-hover:text-ai group-hover:scale-110 transition-all" />
                  <span className="text-xs font-bold">{node.label}</span>
                  <Badge variant="ai" className="text-[8px] h-4">STABLE</Badge>
                </div>
              ))}
            </div>
            <div className="p-6 rounded-2xl bg-ai/5 border border-ai/20">
               <div className="flex items-center justify-between mb-2">
                 <span className="text-[10px] font-black uppercase text-ai tracking-widest">Token Usage (Monthly)</span>
                 <span className="text-xs font-mono text-muted-foreground font-bold">8.2M / 20M</span>
               </div>
               <div className="w-full h-2 bg-background rounded-full overflow-hidden">
                 <motion.div initial={{ width: 0 }} animate={{ width: "41%" }} transition={{ duration: 1.5 }} className="h-full bg-ai shadow-[0_0_15px_hsl(var(--ai))]" />
               </div>
            </div>

            <div className="pt-4">
              <Card className="bg-white/2 border-dashed border border-white/10 rounded-2xl p-6 text-center space-y-2">
                 <Lock className="w-6 h-6 text-muted-foreground/40 mx-auto" />
                 <h5 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Hardware Security Module</h5>
                 <p className="text-[10px] text-muted-foreground/60 leading-tight">All enterprise encryption keys are cryptographically isolated in the secure enclave during provisioning events.</p>
              </Card>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
