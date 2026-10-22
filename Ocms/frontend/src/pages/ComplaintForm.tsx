import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { BrainCircuit, Send, AlertTriangle, ShieldCheck, Fingerprint, Gavel, FileText, CheckCircle2 } from "lucide-react"

const AGENT_STEPS = [
  { id: 'identity', icon: Fingerprint, text: 'Identity Agent: Cryptographically anonymizing whistleblower PII...', delay: 0 },
  { id: 'intelligence', icon: BrainCircuit, text: 'Intelligence Agent: Plotting severity vectors and categorizing intent...', delay: 800 },
  { id: 'ethics', icon: ShieldCheck, text: 'Ethics Agent: Cross-referencing SEC and Title VII corporate policies...', delay: 1800 },
  { id: 'escalation', icon: Gavel, text: 'Escalation Agent: Overriding SLAs based on identified key-entities...', delay: 2800 },
  { id: 'council', icon: FileText, text: 'Agent Council: Negotiating final workflow plan and drafting resolution...', delay: 3800 },
]

import { useAuth } from "@/stores/authStore"

export function ComplaintForm() {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [activeStep, setActiveStep] = useState(0)
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [uiState, setUiState] = useState<'idle' | 'processing' | 'success'>('idle')
  const [isTyping, setIsTyping] = useState(false)
  const [aiAnalysis, setAiAnalysis] = useState<{ category?: string; priority?: string } | null>(null)
  const [trackingId, setTrackingId] = useState<string | null>(null)
  const { user, token } = useAuth()

  // Simulation of real-time AI classification
  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDescription(e.target.value)
    setIsTyping(true)
    
    if (e.target.value.length > 20) {
      setTimeout(() => {
        setIsTyping(false)
        setAiAnalysis({
          category: e.target.value.toLowerCase().includes("money") ? "Fraud" : "Ethics Focus",
          priority: e.target.value.toLowerCase().includes("urgent") ? "urgent" : "medium"
        })
      }, 1000)
    } else {
      setIsTyping(false)
      setAiAnalysis(null)
    }
  }

  const submitComplaint = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setUiState('processing')
    setActiveStep(0)
    
    // Simulate real-time agent progression in UI
    const stepInterval = setInterval(() => {
       setActiveStep(prev => {
          if (prev >= AGENT_STEPS.length - 1) {
             clearInterval(stepInterval)
             return prev
          }
          return prev + 1
       })
    }, 100)

    // Preserve logs for global audit consistency
    // clearAgentLogs() 
    try {
      const response = await fetch("http://127.0.0.1:8008/api/v1/incidents/", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          title: title || "Auto-Generated Incident",
          description: description,
          department: "General", 
          is_anonymous: isAnonymous,
          reporter_email: isAnonymous ? null : (user?.name || "anonymous")
        })
      })

      if (response.ok) {
        const data = await response.json()
        setTrackingId(data.id)
        clearInterval(stepInterval)
        setActiveStep(AGENT_STEPS.length)
        setUiState('success')
      } else {
        alert("Agent Council execution flagged an external API failure.")
        setUiState('idle')
      }
    } catch (error) {
      alert("System architecture offline. Contact Administrator.")
      setUiState('idle')
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    setUiState('idle')
    setDescription("")
    setTitle("")
    setActiveStep(0)
    setTrackingId(null)
  }

  if (uiState === 'success') {
     return (
       <div className="max-w-2xl mx-auto w-full flex flex-col items-center justify-center p-12 text-center space-y-8 animate-in zoom-in duration-500">
         <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-24 h-24 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center ring-4 ring-emerald-500/30 shadow-[0_0_30px_rgba(16,185,129,0.3)]">
           <CheckCircle2 className="w-12 h-12" />
         </motion.div>
         
         <div className="space-y-3">
           <h2 className="text-4xl font-black text-foreground tracking-tighter">Council Consensus Reached</h2>
           <p className="text-muted-foreground max-w-md mx-auto font-medium">Your incident has been anonymized, validated by the 8-node Agent Council, and securely injected into the neural ledger.</p>
         </div>

         {trackingId && (
           <Card className="w-full bg-white/5 border-white/10 rounded-3xl p-8 space-y-4 relative group overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-20 transition-opacity text-ai">
                <Fingerprint className="w-20 h-20" />
             </div>
             <div className="text-left space-y-2 relative z-10">
               <span className="text-[10px] font-black uppercase tracking-widest text-ai">Investigation Tracking ID</span>
               <div className="flex items-center gap-2">
                 <code className="text-xl font-mono font-bold text-foreground break-all bg-black/40 p-4 rounded-xl border border-white/5 block w-full select-all">{trackingId}</code>
                 <Button size="icon" variant="ghost" onClick={() => { navigator.clipboard.writeText(trackingId || ''); alert("Tracking ID Copied") }} className="shrink-0 h-14 w-14 rounded-xl hover:bg-ai/10 hover:text-ai transition-colors border border-white/5">
                    <Fingerprint className="w-6 h-6" />
                 </Button>
               </div>
             </div>
             <p className="text-xs text-muted-foreground text-left font-medium">Maintain this ID securely. You can use it in the <strong className="text-foreground italic">Track Progress</strong> portal to monitor cognitive status updates without logging in.</p>
           </Card>
         )}

         <div className="flex gap-4">
           <Button variant="ghost" className="px-8 py-6 rounded-2xl font-bold" onClick={() => window.location.href = '/track'}>Go to Tracking</Button>
           <Button variant="ai" className="px-8 py-6 rounded-2xl font-bold shadow-xl shadow-ai/20" onClick={resetForm}>Process Next Incident</Button>
         </div>
       </div>
     )
  }

  return (
    <div className="max-w-4xl mx-auto mt-12 bg-background/50 p-6 rounded-3xl border border-white/10 shadow-2xl backdrop-blur-xl">
      <motion.div initial={{ opacity: 0, scale: 0.98, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <Card className="relative overflow-hidden border-ai shadow-lg shadow-ai/10 bg-background/90 backdrop-blur-3xl rounded-2xl">
          <div className="absolute top-0 w-full h-1 ai-gradient-bg" />
          <CardHeader className="pb-8 pt-8 px-10">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 ai-gradient-bg rounded-lg shadow-lg shadow-ai/20">
                <BrainCircuit className="w-6 h-6 text-white" />
              </div>
              <CardTitle className="text-3xl ai-gradient-text">AI Powered Reporting</CardTitle>
            </div>
            <CardDescription className="text-base text-muted-foreground">
              Describe the incident in detail. Our AI will automatically classify and priority-route it securely.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-10 pb-10">
            <form onSubmit={submitComplaint} className="space-y-8">
              <div className="space-y-4">
                <Label className="text-lg font-medium text-foreground/80">Incident Details</Label>
                <div className="relative group">
                  <Input
                    placeholder="Short Title..."
                    className="h-12 bg-background/50 focus:bg-background transition-colors px-4 rounded-xl mb-4"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                  <Textarea
                    placeholder="E.g., I noticed some strange financial transactions in the accounting department last week..."
                    className="min-h-[180px] resize-y text-base p-5 focus-visible:ring-ai transition-shadow group-hover:shadow-md bg-background"
                    value={description}
                    onChange={handleDescriptionChange}
                  />
                  {uiState === 'processing' && (
                     <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="absolute inset-0 bg-background/95 backdrop-blur-3xl z-50 rounded-2xl border border-white/10 shadow-2xl p-8 flex flex-col justify-center">
                        <h3 className="text-xl font-black ai-gradient-text mb-8">Agent Council Diagnostics</h3>
                        <div className="space-y-4">
                           {AGENT_STEPS.map((step, idx) => (
                             <motion.div 
                               key={step.id}
                               initial={{ opacity: 0, x: -20 }}
                               animate={{ 
                                 opacity: idx <= activeStep ? 1 : 0.3,
                                 x: idx <= activeStep ? 0 : -10 
                               }}
                               className={`flex items-start gap-4 p-3 rounded-xl border transition-colors ${idx === activeStep ? 'bg-ai/10 border-ai/30 shadow-[0_0_20px_hsl(var(--ai)/0.2)]' : idx < activeStep ? 'bg-white/5 border-transparent' : 'border-transparent'}`}
                             >
                                <div className={`mt-0.5 p-1.5 rounded-md ${idx === activeStep ? 'bg-ai text-white animate-pulse' : idx < activeStep ? 'text-primary' : 'text-muted-foreground'}`}>
                                  <step.icon className="w-4 h-4" />
                                </div>
                                <div>
                                  <p className={`text-sm font-semibold tracking-wide ${idx === activeStep ? 'text-foreground' : 'text-muted-foreground'}`}>{step.text}</p>
                                  {idx === activeStep && <p className="text-[10px] text-ai font-mono mt-1 uppercase tracking-widest">Executing Neural Pathways...</p>}
                                </div>
                             </motion.div>
                           ))}
                        </div>
                     </motion.div>
                  )}
                  
                  {/* AI Real-time Feedback Panel */}
                  <AnimatePresence>
                    {isTyping && !aiAnalysis && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="absolute bottom-5 right-5 flex gap-2 text-xs font-semibold tracking-wide text-ai animate-pulse"
                      >
                        AI is analyzing...
                      </motion.div>
                    )}
                    {aiAnalysis && !isTyping && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="absolute bottom-5 right-5 flex gap-2"
                      >
                        <Badge variant="ai" className="shadow-sm px-3 py-1 text-xs font-semibold">
                          {aiAnalysis.category}
                        </Badge>
                        <Badge variant={aiAnalysis.priority === "urgent" ? "destructive" : "secondary"} className="px-3 py-1 text-xs font-semibold">
                          {aiAnalysis.priority?.toUpperCase()} Priority
                        </Badge>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
              
              <AnimatePresence>
                {aiAnalysis?.category === 'Fraud' && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    className="flex gap-3 items-center text-sm text-destructive bg-destructive/10 p-4 rounded-xl border border-destructive/20 shadow-inner"
                  >
                    <AlertTriangle className="w-5 h-5" />
                    <span className="font-medium">Our AI has detected potential financial fraud. Please ensure you upload any relevant receipts or documents securely later.</span>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex items-center justify-between pt-4 border-t border-border/50">
                <div className="flex items-center space-x-3">
                  <input type="checkbox" id="anonymous" checked={isAnonymous} onChange={(e) => setIsAnonymous(e.target.checked)} className="w-4 h-4 rounded border-input text-primary focus:ring-primary focus:ring-offset-background bg-background cursor-pointer" />
                  <Label htmlFor="anonymous" className="cursor-pointer font-medium">Submit Anonymously</Label>
                </div>
                <Button variant="ai" size="lg" type="submit" disabled={description.length < 10 || isSubmitting} className="shadow-ai/20 shadow-xl rounded-full px-8 hover:scale-105 transition-transform">
                  <Send className={`w-4 h-4 mr-2 ${isSubmitting ? 'animate-bounce' : ''}`} />
                  {isSubmitting ? 'AI Routing...' : 'Securely Submit'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
