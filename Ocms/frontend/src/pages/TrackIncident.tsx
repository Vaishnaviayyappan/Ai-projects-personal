import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Loader2, CheckCircle2, Clock, Shield, AlertCircle, ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/stores/authStore"

export function TrackIncident() {
  const [trackingId, setTrackingId] = useState('')
  const [loading, setLoading] = useState(false)
  const [incident, setIncident] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()
  const { token, user } = useAuth()

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!trackingId.trim()) return

    setLoading(true)
    setError(null)
    setIncident(null)

    try {
      const response = await fetch(`http://127.0.0.1:8008/api/v1/incidents/track/${trackingId}`)
      if (response.ok) {
        const data = await response.json()
        setIncident(data)
      } else {
        setError("Invalid Tracking ID. Please double check the ID provided at the time of submission.")
      }
    } catch (err) {
      setError("Network failure. Could not connect to the verification gateway.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto py-12 space-y-12 relative">
      {/* Navigation Anchor */}
      <button 
        onClick={() => {
          if (token) {
            navigate(user?.role === 'Reporter' ? '/report' : '/dashboard')
          } else {
            navigate('/login')
          }
        }} 
        className="absolute -top-4 left-0 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-ai transition-all group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        {token ? 'Back to Workspace' : 'Return to Portal'}
      </button>

      {/* Header Section */}
      <div className="text-center space-y-4">
        <motion.div
           initial={{ opacity: 0, scale: 0.9 }}
           animate={{ opacity: 1, scale: 1 }}
           className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-ai/10 border border-ai/20 text-ai text-[10px] font-black uppercase tracking-widest mb-2"
        >
          <Shield className="w-3 h-3" /> Integrity Verification System
        </motion.div>
        <h1 className="text-5xl font-black tracking-tighter ai-gradient-text">Track Your Investigation</h1>
        <p className="text-muted-foreground text-lg max-w-xl mx-auto">Enter your unique Tracking ID below to verify the real-time status and cognitive consensus of your reported incident.</p>
      </div>

      {/* Search Bar */}
      <Card className="bg-background/40 border-white/5 backdrop-blur-3xl shadow-2xl p-2 rounded-[2.5rem]">
        <form onSubmit={handleTrack} className="flex gap-2">
          <Input 
            value={trackingId}
            onChange={(e) => setTrackingId(e.target.value)}
            placeholder="Enter Tracking ID (e.g. 550e8400-e29b-41d4-a716-446655440000)" 
            className="flex-1 h-14 rounded-full border-none bg-transparent px-8 text-lg font-mono focus-visible:ring-0 focus-visible:ring-offset-0"
          />
          <Button disabled={loading} type="submit" className="h-14 px-8 rounded-full ai-gradient-bg text-white font-bold shadow-xl shadow-ai/20 hover:scale-105 transition-transform">
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Search className="w-5 h-5 mr-2" /> Verify Status</>}
          </Button>
        </form>
      </Card>

      {/* Result Section */}
      <AnimatePresence mode="wait">
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="p-6 rounded-3xl bg-destructive/10 border border-destructive/20 text-destructive flex items-center gap-4"
          >
            <AlertCircle className="w-6 h-6 shrink-0" />
            <p className="font-bold">{error}</p>
          </motion.div>
        )}

        {incident && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-background/20 border-white/5 rounded-3xl p-8 space-y-6">
                <div className="space-y-2">
                  <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Case Profile</span>
                  <h2 className="text-2xl font-black truncate">{incident.title}</h2>
                </div>
                
                <div className="flex flex-wrap gap-4">
                  <div className="space-y-1">
                    <span className="text-[10px] text-muted-foreground font-bold uppercase block">Current Status</span>
                    <Badge variant={incident.status === 'Open' ? 'ai' : 'outline'} className="rounded-full px-4 py-1 font-black text-[12px]">
                      {incident.status.toUpperCase()}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] text-muted-foreground font-bold uppercase block">Priority Level</span>
                    <Badge variant="outline" className={`rounded-full px-4 py-1 font-black text-[12px] border-white/10 ${incident.priority === 'urgent' ? 'text-destructive bg-destructive/5' : 'text-ai bg-ai/5'}`}>
                      {incident.priority.toUpperCase()}
                    </Badge>
                  </div>
                </div>
              </Card>

              <Card className="bg-ai/10 border-ai/20 rounded-3xl p-8 flex flex-col justify-center items-center text-center gap-4 group">
                 <div className="p-4 bg-ai/20 rounded-full group-hover:scale-110 transition-transform shadow-lg shadow-ai/10 border border-ai/30">
                    <Shield className="w-8 h-8 text-ai" />
                 </div>
                 <h3 className="font-black text-lg">Neural Integrity Secured</h3>
                 <p className="text-xs text-muted-foreground font-medium">This incident is being autonomously processed by the ProAct Agent Council. All traces are secured on the neural ledger.</p>
              </Card>
            </div>

            <Card className="bg-background/20 border-white/5 rounded-[2.5rem] p-8">
               <h3 className="text-xs font-black uppercase text-muted-foreground tracking-widest mb-8 flex items-center gap-2">
                 <Clock className="w-4 h-4" /> Investigation Roadmap
               </h3>
               
               <div className="relative space-y-8 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-px before:bg-white/10">
                  {incident.timeline.map((step: any, idx: number) => (
                    <motion.div 
                      key={idx}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="relative pl-12"
                    >
                      <div className={`absolute left-0 top-1 w-6 h-6 rounded-full flex items-center justify-center border ${idx === 0 ? 'bg-ai border-ai shadow-[0_0_15px_hsl(var(--ai))]' : 'bg-background border-white/10'}`}>
                         {idx === 0 ? <CheckCircle2 className="w-3 h-3 text-white" /> : <Clock className="w-3 h-3 text-muted-foreground" />}
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-black text-sm">{step.action.replace(/_/g, ' ')}</h4>
                        <p className="text-xs text-muted-foreground font-medium">{step.note || "System-automated workflow update."}</p>
                        <span className="text-[9px] font-mono text-muted-foreground opacity-50 block mt-1">{new Date(step.timestamp || incident.created_at).toLocaleString()}</span>
                      </div>
                    </motion.div>
                  ))}
               </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col items-center gap-6 pt-12">
        <p className="text-sm text-muted-foreground font-medium">Lost your tracking ID? Contact your system administrator or the compliance hotline.</p>
        <div className="flex gap-4">
           {['Support Desk', 'Privacy Policy', 'Security Audit'].map(link => (
             <button key={link} className="text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-ai transition-colors">{link}</button>
           ))}
        </div>
      </div>
    </div>
  )
}
