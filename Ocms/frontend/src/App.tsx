import React from "react"
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { useWebSocket } from "@/hooks/useWebSocket"
import { ComplaintForm } from "@/pages/ComplaintForm"
import { Dashboard } from "@/pages/Dashboard"
import { Analytics } from "@/pages/Analytics"
import { Login } from "@/pages/Login"
import { Signup } from "@/pages/Signup"
import { TrackIncident } from "@/pages/TrackIncident"

import { Shield, LayoutDashboard, FilePlus, BarChart3, LogOut, Bell, Search, Terminal, Zap, Clock, User, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { AiAssistant } from "@/components/AiAssistant"
import { Toaster, sysNotify } from "@/components/Toaster"

import { useAuth } from "@/stores/authStore"
import { Admin } from "@/pages/Admin"
import { AgentLogs } from "@/pages/AgentLogs"

import { useAgentStore } from "@/stores/agentStore"

function Topbar() {
  const location = useLocation()
  const [showNotifications, setShowNotifications] = React.useState(false)
  const { user } = useAuth()
  const { activities } = useAgentStore()
  if (location.pathname === "/login" || location.pathname === "/signup") return null

  const isReporter = user?.role === "Reporter"
  const systemNotifications = activities.filter(a => a.type !== 'agent')
  const agentPulses = activities.filter(a => a.type === 'agent')
  const latestActivity = agentPulses[0] || systemNotifications[0]
  const recentNotifications = systemNotifications.slice(0, 8)

  return (
    <header className="h-16 border-b border-border/40 bg-background/60 backdrop-blur-xl sticky top-0 z-40 px-6 flex items-center justify-between">
      <div className="flex items-center gap-4 flex-1">
        <AnimatePresence mode="wait">
          {latestActivity ? (
            <motion.div 
               key={latestActivity.id}
               initial={{ opacity: 0, x: -20 }}
               animate={{ opacity: 1, x: 0 }}
               exit={{ opacity: 0, x: 20 }}
               className="flex items-center gap-2 px-4 py-1.5 bg-ai/10 border border-ai/20 rounded-full shadow-[0_0_15px_hsl(var(--ai)/0.1)]"
            >
               <div className="w-2 h-2 bg-ai rounded-full animate-pulse" />
               <span className="text-[10px] uppercase font-black tracking-widest text-ai">{latestActivity.agent}:</span>
               <span className="text-xs font-semibold text-foreground/80 truncate max-w-[300px]">{latestActivity.message}</span>
            </motion.div>
          ) : (
            <div className="relative w-64 max-w-md hidden md:flex items-center bg-background/50 border border-white/5 hover:border-white/20 transition-colors rounded-full h-10 px-3 cursor-text group">
              <Search className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
              <span className="ml-2 text-sm text-muted-foreground flex-1 select-none">Search global cases...</span>
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-muted/50 text-[10px] font-mono font-medium text-muted-foreground/80 border border-border/50 select-none">
                <span className="text-[12px] leading-none">⌘</span> K
              </div>
            </div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative">
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className={`p-2.5 rounded-xl transition-all relative ${showNotifications ? 'bg-primary/20 text-primary' : 'bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-foreground'}`}
          >
            <Bell className="w-5 h-5" />
            {systemNotifications.length > 0 && (
              <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full shadow-[0_0_8px_hsl(var(--primary))]" />
            )}
          </button>

          <AnimatePresence>
            {showNotifications && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute right-0 mt-4 w-96 bg-background/95 backdrop-blur-3xl border border-white/10 rounded-3xl shadow-2xl z-50 overflow-hidden"
              >
                <div className="p-5 border-b border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-black uppercase tracking-widest">Notification Center</h3>
                    <Badge variant="outline" className="rounded-full text-[10px] font-black">{systemNotifications.length}</Badge>
                  </div>
                  <button onClick={() => setShowNotifications(false)} className="p-1 hover:bg-white/5 rounded-md transition-colors text-muted-foreground hover:text-foreground">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="max-h-[400px] overflow-y-auto p-2 scroll-smooth">
                  {recentNotifications.length > 0 ? (
                    recentNotifications.map((n, i) => (
                      <div key={i} className="p-4 rounded-2xl hover:bg-white/5 border border-transparent hover:border-white/5 transition-all group mb-1">
                        <div className="flex items-center gap-3 mb-1">
                          <div className="p-1.5 rounded-lg bg-ai text-white">
                            <Zap className="w-3 h-3" />
                          </div>
                          <span className="text-[10px] font-black uppercase tracking-widest text-ai">{n.agent}</span>
                          <span className="text-[9px] font-medium text-muted-foreground ml-auto flex items-center gap-1">
                             <Clock className="w-2.5 h-2.5" /> Just Now
                          </span>
                        </div>
                        <p className="text-xs text-foreground/90 font-medium leading-relaxed">{n.message}</p>
                      </div>
                    ))
                  ) : (
                    <div className="py-12 text-center space-y-3">
                       <Bell className="w-8 h-8 text-muted-foreground/20 mx-auto" />
                       <p className="text-sm text-muted-foreground font-medium">No system events recorded.</p>
                    </div>
                  )}
                </div>
                {!isReporter && (
                  <div className="p-4 border-t border-white/5 bg-background/50 text-center">
                    <Link to="/agent-audit" onClick={() => setShowNotifications(false)} className="text-xs font-bold text-primary hover:underline flex items-center justify-center gap-2">
                      View Full Neural Audit <Search className="w-3 h-3" />
                    </Link>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="h-8 w-px bg-white/10 mx-2" />

        <div className="flex items-center gap-3 pl-2">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-black text-foreground">{user?.name || "Expert Explorer"}</p>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none">{user?.role || "Provisioning..."}</p>
          </div>
          <div className="w-10 h-10 rounded-2xl ai-gradient-bg flex items-center justify-center text-white shadow-lg shadow-ai/10 border border-white/10 ring-1 ring-white/5">
            <User className="w-5 h-5" />
          </div>
        </div>
      </div>
    </header>
  )
}

function Sidebar() {
  const location = useLocation()
  const { user, logout } = useAuth()
  if (location.pathname === "/login" || location.pathname === "/signup") return null

  const isReporter = user?.role === "Reporter"
  const isHandler = user?.role === "Case Handler"
  const isSupervisor = user?.role === "Department Supervisor"
  const isCompliance = user?.role === "Compliance Officer"
  const isEscalation = user?.role === "Escalation Authority"
  const isAuditor = user?.role === "System Auditor"
  const isAdmin = user?.role === "System Administrator"

  const canViewDashboard = !isReporter 
  const canViewAnalytics = isSupervisor || isCompliance || isEscalation || isAuditor || isAdmin
  const canViewAudits = isCompliance || isAuditor || isHandler || isSupervisor || isEscalation || isAdmin

  return (
    <aside className="w-72 border-r border-border/20 bg-background/40 backdrop-blur-3xl fixed left-0 top-0 h-full z-50 flex flex-col hide-scrollbar overflow-y-auto hidden lg:flex shadow-[8px_0_40px_rgba(0,0,0,0.03)] border-r-white/5">
      <div className="h-20 flex items-center px-8 gap-4 mb-6 shrink-0 bg-gradient-to-b from-background/80 to-transparent">
        <div className="p-2 bg-gradient-to-br from-ai to-primary rounded-xl shadow-[0_0_20px_hsl(var(--ai)/0.3)] border border-white/10">
          <Shield className="w-6 h-6 text-white" />
        </div>
        <span className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/60 tracking-tighter">
          Resolver<span className="text-ai">AI</span>
        </span>
      </div>

      <nav className="flex-1 px-5 space-y-3 relative z-10">
        <div className="text-[10px] font-black text-muted-foreground/50 uppercase tracking-[0.2em] mb-4 px-3 mt-4">Intelligence Platform</div>
        
        {canViewDashboard && (
          <Link to="/dashboard" className={`w-full px-4 py-3.5 rounded-2xl flex items-center gap-4 text-sm font-semibold transition-all duration-300 group relative overflow-hidden ${location.pathname === '/dashboard' ? 'text-primary bg-primary/10 border-primary/20 shadow-[0_4px_24px_hsl(var(--primary)/0.15)] ring-1 ring-primary/30' : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'}`}>
            {location.pathname === '/dashboard' && <motion.div layoutId="sidebar-active" className="absolute left-0 top-0 w-1.5 h-full rounded-r-md bg-gradient-to-b from-primary to-primary/50" />}
            <div className={`p-2 rounded-xl transition-colors ${location.pathname === '/dashboard' ? 'bg-primary/20 text-primary' : 'bg-transparent group-hover:bg-white/5'}`}>
              <LayoutDashboard className="w-5 h-5" />
            </div>
            Active Incident CRM
          </Link>
        )}

        <Link to="/report" className={`w-full px-4 py-3.5 rounded-2xl flex items-center gap-4 text-sm font-semibold transition-all duration-300 group relative overflow-hidden ${location.pathname === '/report' ? 'text-ai bg-ai/10 border-ai/20 shadow-[0_4px_24px_hsl(var(--ai)/0.15)] ring-1 ring-ai/30' : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'}`}>
          {location.pathname === '/report' && <motion.div layoutId="sidebar-active" className="absolute left-0 top-0 w-1.5 h-full rounded-r-md bg-gradient-to-b from-ai to-ai/50" />}
          <div className={`p-2 rounded-xl transition-colors ${location.pathname === '/report' ? 'bg-ai/20 text-ai' : 'bg-transparent group-hover:bg-white/5'}`}>
            <FilePlus className="w-5 h-5" />
          </div>
          Intake Agent
        </Link>

        <Link to="/track" className={`w-full px-4 py-3.5 rounded-2xl flex items-center gap-4 text-sm font-semibold transition-all duration-300 group relative overflow-hidden ${location.pathname === '/track' ? 'text-primary bg-primary/10 border-primary/20 shadow-[0_4px_24px_hsl(var(--primary)/0.15)] ring-1 ring-primary/30' : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'}`}>
          {location.pathname === '/track' && <motion.div layoutId="sidebar-active" className="absolute left-0 top-0 w-1.5 h-full rounded-r-md bg-gradient-to-b from-primary to-primary/50" />}
          <div className={`p-2 rounded-xl transition-colors ${location.pathname === '/track' ? 'bg-primary/20 text-primary' : 'bg-transparent group-hover:bg-white/5'}`}>
            <Search className="w-5 h-5" />
          </div>
          Track Progress
        </Link>

        {canViewAnalytics && (
          <Link to="/analytics" className={`w-full px-4 py-3.5 rounded-2xl flex items-center gap-4 text-sm font-semibold transition-all duration-300 group relative overflow-hidden ${location.pathname === '/analytics' ? 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20 shadow-[0_4px_24px_rgba(16,185,129,0.15)] ring-1 ring-emerald-500/30' : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'}`}>
            {location.pathname === '/analytics' && <motion.div layoutId="sidebar-active" className="absolute left-0 top-0 w-1.5 h-full rounded-r-md bg-gradient-to-b from-emerald-500 to-emerald-500/50" />}
            <div className={`p-2 rounded-xl transition-colors ${location.pathname === '/analytics' ? 'bg-emerald-500/20 text-emerald-500' : 'bg-transparent group-hover:bg-white/5'}`}>
              <BarChart3 className="w-5 h-5" />
            </div>
            Predictive Insights
          </Link>
        )}

        {canViewAudits && (
          <Link to="/agent-audit" className={`w-full px-4 py-3.5 rounded-2xl flex items-center gap-4 text-sm font-semibold transition-all duration-300 group relative overflow-hidden ${location.pathname === '/agent-audit' ? 'text-ai bg-ai/10 border-ai/20 shadow-[0_4px_24px_hsl(var(--ai)/0.15)] ring-1 ring-ai/30' : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'}`}>
            {location.pathname === '/agent-audit' && <motion.div layoutId="sidebar-active" className="absolute left-0 top-0 w-1.5 h-full rounded-r-md bg-gradient-to-b from-ai to-ai/50" />}
            <div className={`p-2 rounded-xl transition-colors ${location.pathname === '/agent-audit' ? 'bg-ai/20 text-ai' : 'bg-transparent group-hover:bg-white/5'}`}>
              <Terminal className="w-5 h-5" />
            </div>
            Neural Trace Audit
          </Link>
        )}

        {isAdmin && (
          <Link to="/admin" className={`w-full px-4 py-3.5 rounded-2xl flex items-center gap-4 text-sm font-semibold transition-all duration-300 group relative overflow-hidden ${location.pathname === '/admin' ? 'text-amber-500 bg-amber-500/10 border-amber-500/20 shadow-[0_4px_24px_hsl(var(--amber-500)/0.15)] ring-1 ring-amber-500/30' : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'}`}>
            {location.pathname === '/admin' && <motion.div layoutId="sidebar-active" className="absolute left-0 top-0 w-1.5 h-full rounded-r-md bg-gradient-to-b from-amber-500 to-amber-500/50" />}
            <div className={`p-2 rounded-xl transition-colors ${location.pathname === '/admin' ? 'bg-amber-500/20 text-amber-500' : 'bg-transparent group-hover:bg-white/5'}`}>
              <Shield className="w-5 h-5" />
            </div>
            Neural Admin
          </Link>
        )}
      </nav>

      <div className="p-6 mt-auto">
        <button onClick={() => { logout(); }} className="flex items-center justify-center gap-3 text-sm font-bold text-destructive/80 transition-all hover:text-destructive hover:shadow-[0_0_20px_hsl(var(--destructive)/0.2)] px-4 py-3.5 hover:bg-destructive/10 rounded-2xl border border-transparent ring-1 ring-transparent hover:ring-destructive/30 w-full group overflow-hidden relative">
          <LogOut className="w-4 h-4 group-hover:-translate-x-1 transition-transform relative z-10" /> 
          <span className="relative z-10">Disconnect</span>
          <div className="absolute inset-0 bg-gradient-to-r from-destructive/0 via-destructive/5 to-destructive/0 -translate-x-[100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
        </button>
      </div>
    </aside>
  )
}

function LayoutContent() {
  const location = useLocation()
  const { user, token } = useAuth()
  const { addActivity } = useAgentStore()
  const isPublicRoute = ["/login", "/signup", "/track"].includes(location.pathname)

  // Neural trace pulse configuration (Memoized to prevent flickers)
  const wsOptions = React.useMemo(() => ({
    onMessage: (message: any) => {
      if (message.event === "NEW_INCIDENT") {
        addActivity(message.agent || "System", message.message, message.data?.id, "system");
        sysNotify({ title: "New Case Reported", message: message.message, type: "success" });
      } else if (message.event === "ESCALATION") {
        addActivity(message.agent || "Security", message.message, message.data?.incident_id, "security");
        sysNotify({ title: "Priority Escalation", message: message.message, type: "warning" });
      } else if (message.event === "MAIL_SENT") {
        addActivity(message.agent || "Postmaster", message.message, undefined, "mail");
        sysNotify({ title: "Email Dispatched", message: message.message, type: "info" });
      } else if (message.agent && message.message) {
        addActivity(message.agent, message.message, message.incident_id, "agent");
      }
    }
  }), [addActivity]);

  useWebSocket(token ? "http://127.0.0.1:8008/api/v1/stream" : null, wsOptions);
  
  if (!token && !isPublicRoute) {
    return <Navigate to="/login" replace />
  }

  // Redirect authenticated users away from login/signup
  if (token && (location.pathname === "/login" || location.pathname === "/signup")) {
    const target = user?.role === "Reporter" ? "/report" : "/dashboard"
    return <Navigate to={target} replace />
  }

  return (
    <div className={`flex min-h-screen bg-background text-foreground font-sans selection:bg-ai/30 selection:text-white ${token ? 'lg:pl-72' : ''}`}>
      <Toaster />
      <AiAssistant />
      {token && <Sidebar />}
      
      <div className="flex-1 flex flex-col relative w-full h-screen overflow-y-auto hide-scrollbar scroll-smooth">
        {token && <Topbar />}
        <main className={`flex-1 p-8 md:p-12 relative z-10 ${isPublicRoute ? 'p-0 flex items-center justify-center w-full min-h-screen' : 'max-w-[1800px] mx-auto w-full'}`}>
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="h-full"
            >
              <Routes>
                <Route path="/" element={<Navigate to="/login" replace />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/report" element={<ComplaintForm />} />
                <Route path="/track" element={<TrackIncident />} />
                <Route 
                  path="/dashboard" 
                  element={user?.role === "Reporter" ? <Navigate to="/report" replace /> : <Dashboard />} 
                />
                <Route path="/analytics" element={<Analytics />} />
                <Route path="/admin" element={<Admin />} />
                <Route path="/agent-audit" element={<AgentLogs />} />
              </Routes>
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  )
}

function App() {
  return (
    <Router>
      <LayoutContent />
    </Router>
  )
}

export default App
