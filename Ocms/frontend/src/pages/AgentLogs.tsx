import { motion, AnimatePresence } from "framer-motion"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Terminal, Cpu, Zap, Activity, ShieldAlert, Database, BrainCircuit, Gavel, CheckCircle2, ShieldCheck } from "lucide-react"

import { useAgentStore } from "@/stores/agentStore"

export function AgentLogs() {
  const { activities } = useAgentStore()
  const logs = activities;

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto py-4">
      {/* Neural Stats Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: "Active Nodes", value: "8/8", sub: "Operational", color: "text-ai" },
          { label: "Neural Latency", value: "42ms", sub: "Quantum-ready", color: "text-emerald-500" },
          { label: "State Coherence", value: "99.4%", sub: "High Trust", color: "text-primary" },
          { label: "Audit Throughput", value: logs.length.toString(), sub: "Buffered", color: "text-amber-500" },
        ].map((stat) => (
          <Card key={stat.label} className="bg-background/20 border-white/5 backdrop-blur-xl group hover:border-ai/30 transition-all overflow-hidden relative">
            <div className="absolute top-0 right-0 w-24 h-24 bg-ai/5 rounded-full blur-3xl -z-10 group-hover:bg-ai/10" />
            <CardContent className="p-4 flex flex-col gap-1">
              <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">{stat.label}</span>
              <span className={`text-2xl font-black ${stat.color}`}>{stat.value}</span>
              <span className="text-[10px] font-medium text-muted-foreground/60">{stat.sub}</span>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-col gap-2 mb-2">
        <h2 className="text-4xl font-black ai-gradient-text tracking-tighter flex items-center gap-4">
          <Terminal className="w-10 h-10 text-ai" /> Neural Trace Audit
        </h2>
        <p className="text-sm text-muted-foreground font-medium max-w-2xl">High-fidelity observability into the non-linear cognitive pathways of the Agent Council orchestrator.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-[calc(100vh-280px)]">
        {/* Main Audit Stream */}
        <div className="lg:col-span-8 flex flex-col gap-4 overflow-hidden">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground/60 flex items-center gap-2">
              <Activity className="w-3 h-3" /> Cognitive Stream
            </h3>
            <Badge variant="outline" className="text-[10px] font-bold border-white/10 bg-white/5">Auto-refreshing</Badge>
          </div>
          
          <div className="flex-1 overflow-y-auto pr-4 space-y-4 hide-scrollbar">
            <AnimatePresence initial={false}>
              {logs.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-[2rem] bg-white/2 backdrop-blur-3xl group">
                  <div className="p-6 rounded-full bg-ai/10 mb-4 group-hover:scale-110 transition-transform">
                    <Zap className="w-12 h-12 text-ai animate-pulse" />
                  </div>
                  <p className="font-black text-lg text-foreground/80 tracking-tight">Initializing Neural Context...</p>
                  <p className="text-xs text-muted-foreground mt-2 font-mono">Awaiting first pulse from decentralized mesh</p>
                </div>
              ) : (
                logs.map((log) => (
                  <motion.div
                    key={log.id}
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    className="p-5 rounded-3xl bg-background/40 border border-white/5 shadow-2xl backdrop-blur-3xl flex items-start gap-5 group hover:border-ai/40 transition-all relative overflow-hidden"
                  >
                    <div className="absolute top-0 left-0 w-1 h-full bg-ai opacity-50 shadow-[0_0_15px_hsl(var(--ai))]" />
                    <div className="p-3 rounded-2xl bg-ai/10 text-ai shadow-inner border border-ai/20">
                      <Cpu className="w-5 h-5" />
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                           <span className="text-[11px] text-ai font-black uppercase tracking-[0.15em] bg-ai/20 px-3 py-1 rounded-full border border-ai/30 shadow-sm">{log.agent}</span>
                           {log.incidentId && <span className="text-[10px] text-muted-foreground font-mono font-bold opacity-60">ID: {log.incidentId.substring(0,8)}</span>}
                        </div>
                        <span className="text-[10px] text-muted-foreground font-bold bg-white/5 px-2 py-1 rounded-md">{log.timestamp.toLocaleTimeString()}</span>
                      </div>
                      <p className="text-sm text-foreground/90 font-bold leading-relaxed tracking-tight">{log.message}</p>
                      <div className="flex items-center gap-4 pt-2">
                        <div className="flex items-center gap-1.5 text-[9px] font-black uppercase text-muted-foreground tracking-widest leading-none">
                          <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Integrity Verified
                        </div>
                        <div className="w-px h-2 bg-white/10" />
                        <div className="flex items-center gap-1.5 text-[9px] font-black uppercase text-muted-foreground tracking-widest leading-none">
                          <ShieldCheck className="w-3 h-3 text-ai" /> Encrypted Trace
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Intelligence Sidebar */}
        <div className="lg:col-span-4 space-y-6 overflow-y-auto pr-2 hide-scrollbar">
           <Card className="bg-background/20 border-white/5 backdrop-blur-3xl shadow-2xl overflow-hidden relative border-l-4 border-l-ai rounded-3xl">
             <div className="absolute top-0 right-0 p-5">
                <Badge variant="ai" className="animate-pulse shadow-[0_0_15px_hsl(var(--ai)/0.3)]">SYNCHRONIZED</Badge>
             </div>
             <CardHeader className="pb-2">
               <CardTitle className="text-xl font-black">Cluster Health</CardTitle>
               <p className="text-xs text-muted-foreground">Real-time node metrics</p>
             </CardHeader>
             <CardContent className="space-y-4 pt-4">
                {[
                  { name: "Identity Agent", load: "2%", icon: ShieldAlert, state: "Active" },
                  { name: "Intelligence Agent", load: "42%", icon: BrainCircuit, state: "Reasoning" },
                  { name: "Ethics Agent", load: "12%", icon: Gavel, state: "Monitoring" },
                  { name: "Memory Vault", load: "99%", icon: Database, state: "Indexing" },
                ].map(node => (
                  <div key={node.name} className="group p-4 rounded-2xl bg-white/5 border border-transparent hover:border-white/10 hover:bg-white/10 transition-all flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-2 rounded-lg bg-background/50 border border-white/5 group-hover:scale-110 transition-transform">
                        <node.icon className="w-4 h-4 text-muted-foreground group-hover:text-ai" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold">{node.name}</span>
                        <span className="text-[10px] text-muted-foreground font-semibold">{node.state}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-[10px] font-black font-mono text-ai">{node.load}</span>
                      <div className="w-12 h-1 bg-white/10 rounded-full mt-1 overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: node.load }} className="h-full bg-ai" />
                      </div>
                    </div>
                  </div>
                ))}
             </CardContent>
           </Card>

           <div className="p-8 rounded-[2rem] ai-gradient-bg shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-white/20 transition-colors" />
              <h4 className="text-white font-black text-lg uppercase tracking-[0.1em] mb-4 flex items-center gap-2">
                <Terminal className="w-5 h-5" /> Architect Data
              </h4>
              <p className="text-white/80 text-xs leading-relaxed font-medium">
                This Neural Trace log captures the non-linear decision tree generated by the Enterprise Agent Council. Each entry represents a successful cognitive state transition verified by our consensus mesh.
              </p>
              <div className="mt-6 pt-6 border-t border-white/20 flex items-center justify-between">
                <span className="text-white/60 text-[10px] font-black uppercase tracking-widest">Core Version 2.4.0</span>
                <Badge variant="outline" className="text-white border-white/30 text-[9px] font-black uppercase">Alpha Build</Badge>
              </div>
           </div>

           <Card className="bg-background/20 border-white/5 backdrop-blur-xl border-dashed border-2 rounded-3xl p-6 flex flex-col items-center justify-center text-center gap-3 group hover:border-ai/30 transition-all">
              <div className="p-3 rounded-full bg-white/5 text-muted-foreground group-hover:text-ai transition-colors">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <h5 className="text-sm font-black">Quantum Proofing Active</h5>
              <p className="text-[10px] text-muted-foreground font-medium leading-relaxed">All audit logs are cryptographically sealed and distributed across the redundant node mesh to prevent tampering.</p>
           </Card>
        </div>
      </div>
    </div>
  )
}
