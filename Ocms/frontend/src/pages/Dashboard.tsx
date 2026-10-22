import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, MoreHorizontal, MessageSquare, Plus, AlertCircle, Fingerprint, CheckCircle, Send, Forward, Heart, X, Zap } from "lucide-react"
import { Link } from "react-router-dom"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/stores/authStore"
import { useAgentStore } from "@/stores/agentStore"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useWebSocket } from "@/hooks/useWebSocket"

export function Dashboard() {
  const [complaints, setComplaints] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedCase, setSelectedCase] = useState<any | null>(null)
  const [comment, setComment] = useState("")
  const [replyTo, setReplyTo] = useState<string | null>(null)
  const [replyText, setReplyText] = useState("")
  const [escalationLevel, setEscalationLevel] = useState<string>("")
  const { user, token } = useAuth()
  const { addActivity } = useAgentStore()

  const isPrivileged = user?.role !== "Reporter"

  const handleStatusUpdate = async (caseId: string, newStatus: string, escalateTo?: string) => {
    try {
      const response = await fetch(`http://localhost:8008/api/v1/incidents/${caseId}/status`, {
        method: "PATCH",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus, escalate_to: escalateTo })
      })
      if (response.ok) {
        setSelectedCase(null)
        setEscalationLevel("")
      } else {
        const errData = await response.json();
        alert(errData.detail || "Action denied by security protocol.");
      }
    } catch (err) {
      console.error("Failed to update status")
    }
  }

  const handleSendMemo = async () => {
    if (!selectedCase || !comment.trim()) return;

    try {
      const response = await fetch(`http://localhost:8008/api/v1/incidents/${selectedCase.id}/memos`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ 
          content: comment,
          author_name: user?.name || "Team Member"
        })
      })
      if (response.ok) {
        const updatedCase = await response.json();
        setSelectedCase(updatedCase);
        setComplaints(prev => prev.map(c => c.id === updatedCase.id ? { ...c, memos: updatedCase.memos } : c));
        setComment("");
      }
    } catch (err) {
      console.error("Failed to send memo");
    }
  }

  const handleToggleLike = async (memoId: string) => {
    if (!selectedCase) return;
    try {
      const response = await fetch(`http://localhost:8008/api/v1/incidents/${selectedCase.id}/memos/${memoId}/like`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` }
      })
      if (response.ok) {
        const updatedCase = await response.json();
        setSelectedCase(updatedCase);
      }
    } catch (err) {
      console.error("Failed to toggle like");
    }
  }

  const handleSendReply = async (memoId: string) => {
    if (!selectedCase || !replyText.trim()) return;
    try {
      const response = await fetch(`http://localhost:8008/api/v1/incidents/${selectedCase.id}/memos/${memoId}/replies`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ 
          content: replyText,
          author_name: user?.name || "Team Member"
        })
      })
      if (response.ok) {
        const updatedCase = await response.json();
        setSelectedCase(updatedCase);
        setReplyTo(null);
        setReplyText("");
      }
    } catch (err) {
      console.error("Failed to send reply");
    }
  }

  useWebSocket("http://127.0.0.1:8008/api/v1/stream", {
    onMessage: (message) => {
      if (message.event === "NEW_COMPLAINT") {
        setComplaints(prev => [...prev, {
          id: message.data._id || String(Date.now()),
          title: message.data.title,
          priority: message.data.priority,
          status: message.data.status,
          department: message.data.department,
          aiCategory: message.data.ai_category,
          ai_summary: message.data.ai_summary
        }]);
      } else if (message.event === "STATUS_UPDATE") {
        setComplaints(prev => prev.map(c => 
          c.id === message.data.complaint_id ? { ...c, status: message.data.status } : c
        ));
      } else if (message.event === "AGENT_TRACE") {
        addActivity(message.agent, message.message);
      } else if (message.event === "MEMO_ADDED") {
        const { incident_id, memo, timeline_event } = message.data;
        setComplaints(prev => prev.map(c => 
          c.id === incident_id ? { 
            ...c, 
            memos: [...(c.memos || []), memo],
            timeline: [...(c.timeline || []), timeline_event]
          } : c
        ));
        if (selectedCase?.id === incident_id) {
          setSelectedCase((prev: any) => ({ 
            ...prev, 
            memos: [...(prev?.memos || []), memo],
            timeline: [...(prev?.timeline || []), timeline_event]
          }));
        }
      } else if (message.event === "MEMO_UPDATED") {
        const { incident_id, memo_id, likes, reply } = message.data;
        const updateMemos = (memos: any[]) => memos.map(m => {
          if (m.id === memo_id) {
            return {
              ...m,
              likes: likes !== undefined ? likes : m.likes,
              replies: reply ? [...(m.replies || []), reply] : m.replies
            };
          }
          return m;
        });

        setComplaints(prev => prev.map(c => 
          c.id === incident_id ? { ...c, memos: updateMemos(c.memos || []) } : c
        ));

        if (selectedCase?.id === incident_id) {
          setSelectedCase((prev: any) => ({ ...prev, memos: updateMemos(prev?.memos || []) }));
        }
      }
    }
  });

  useEffect(() => {
    // 1. Fetch initial state from Enterprise v1 API
    fetch("http://127.0.0.1:8008/api/v1/incidents/", {
      headers: { "Authorization": `Bearer ${token}` }
    })
      .then(res => {
         if (!res.ok) throw new Error("API Failure")
         return res.json()
      })
      .then(data => {
         const mapped = data.map((d: any) => ({
           id: d.id,
           title: d.title,
           priority: d.priority,
           status: d.status,
           department: d.department,
           aiCategory: d.ai_category,
           ai_summary: d.ai_summary,
           memos: d.memos || [],
           timeline: d.timeline || []
         }))
         setComplaints(mapped)
      })
      .catch(err => {
         console.error("Failed to load initial data", err)
         setComplaints([])
      })
      .finally(() => {
         setIsLoading(false)
      })
  }, [token])

  const openCols = complaints.filter(c => c.status === "open")
  const inProgressCols = complaints.filter(c => c.status === "investigating")
  const escCols = complaints.filter(c => c.status === "escalated")
  const resCols = complaints.filter(c => c.status === "resolved")

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Active Incident CRM</h2>
          <p className="text-muted-foreground">Manage and resolve compliance issues using AI insights.</p>
        </div>
      </div>

      {/* Case Management Modal */}
      <Dialog open={selectedCase !== null} onOpenChange={(open) => !open && setSelectedCase(null)}>
        <DialogContent className="max-w-2xl bg-background/90 backdrop-blur-3xl border-white/10 shadow-2xl overflow-hidden rounded-3xl relative">
          <button 
            onClick={() => setSelectedCase(null)} 
            className="absolute top-6 right-6 p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-all text-muted-foreground hover:text-foreground z-50 border border-white/5"
          >
            <X className="w-5 h-5" />
          </button>
          {selectedCase && (
            <>
              <DialogHeader className="p-6 pb-0">
                <div className="flex items-center gap-3 mb-2">
                  <Badge variant={selectedCase.priority === "urgent" ? "destructive" : "secondary"} className="uppercase font-bold tracking-widest text-[10px]">{selectedCase.priority}</Badge>
                  <Badge variant="outline" className="text-ai border-ai/30">{selectedCase.aiCategory}</Badge>
                </div>
                <DialogTitle className="text-2xl font-black">{selectedCase.title}</DialogTitle>
                <DialogDescription className="text-sm mt-2">UUID: ANON_{selectedCase.id.substring(0, 8).toUpperCase()}</DialogDescription>
              </DialogHeader>
              
              <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto hide-scrollbar">
                <div className="space-y-3">
                   <h4 className="text-xs font-black uppercase text-muted-foreground tracking-widest">Resolution Draft</h4>
                   <div className="p-4 bg-ai/10 border border-ai/20 rounded-xl text-sm font-medium text-ai shadow-inner">
                     {selectedCase.ai_summary || "Resolution inherently locked. Awaiting handler review."}
                   </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-xs font-black uppercase text-muted-foreground tracking-widest flex items-center gap-2">
                    <Fingerprint className="w-4 h-4" /> Agent Council Audit Trail
                  </h4>
                  <div className="space-y-2 border-l-2 border-border/40 pl-4 py-2 relative">
                     {selectedCase.timeline && selectedCase.timeline.length > 0 ? (
                       selectedCase.timeline.map((event: any, idx: number) => (
                         <div key={idx} className="text-xs text-muted-foreground font-mono bg-background/50 p-2 rounded-lg border border-white/5 shadow-sm">
                           <span className={`${event.action.includes('AGENT') ? 'text-ai' : 'text-primary'} font-bold`}>
                             [{new Date(event.timestamp).toLocaleTimeString([], { hour12: false })}] {event.action}:
                           </span> {event.note || "Process telemetry pulse detected."}
                         </div>
                       ))
                     ) : (
                       <div className="text-xs text-muted-foreground italic p-2 italic opacity-50">
                         Initializing neural capture...
                       </div>
                     )}
                  </div>
                </div>

                {isPrivileged && (
                  <div className="space-y-3 pt-4 border-t border-border/20">
                    <h4 className="text-xs font-black uppercase text-muted-foreground tracking-widest">Internal Case Disposition</h4>
                    <div className="flex flex-col gap-3">
                      <div className="flex gap-3">
                        {selectedCase.status === "open" && (
                          <Button variant="ai" className="flex-1 h-12 rounded-xl text-xs font-bold gap-2 shadow-lg shadow-ai/10" onClick={() => handleStatusUpdate(selectedCase.id, "investigating")}>
                            <Zap className="w-4 h-4" /> Process Case
                          </Button>
                        )}
                        <Button variant="outline" className="flex-1 h-12 rounded-xl text-xs font-bold gap-2 hover:bg-emerald-500/10 hover:text-emerald-500 transition-colors" onClick={() => handleStatusUpdate(selectedCase.id, "resolved")}>
                          <CheckCircle className="w-4 h-4" /> Resolve Case
                        </Button>
                      </div>

                      <div className="flex items-center gap-2 bg-muted/20 p-2 rounded-2xl border border-white/5">
                        <Select value={escalationLevel} onValueChange={setEscalationLevel}>
                          <SelectTrigger className="flex-1 bg-transparent border-none text-xs font-bold focus:ring-0">
                            <SelectValue placeholder="Select Target Authority..." />
                          </SelectTrigger>
                          <SelectContent className="bg-background/95 backdrop-blur-xl border-white/10 rounded-xl">
                            <SelectItem value="Department Supervisor">Department Supervisor</SelectItem>
                            <SelectItem value="Compliance Officer">Compliance Officer</SelectItem>
                            <SelectItem value="Escalation Authority">Escalation Authority</SelectItem>
                            <SelectItem value="System Administrator">System Administrator</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button 
                          variant="outline" 
                          disabled={!escalationLevel}
                          className="px-6 h-10 rounded-xl text-xs font-bold gap-2 hover:bg-destructive/10 hover:text-destructive transition-all border-destructive/20" 
                          onClick={() => handleStatusUpdate(selectedCase.id, "escalated", escalationLevel)}
                        >
                          <Forward className="w-4 h-4" /> Escalate
                        </Button>
                      </div>
                      
                      {selectedCase.escalated_to && (
                        <p className="text-[10px] text-muted-foreground italic px-2">
                           Currently managed by: <span className="text-destructive font-bold uppercase">{selectedCase.escalated_to}</span>
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {isPrivileged && (
                  <div className="space-y-3 pt-2">
                    <h4 className="text-xs font-black uppercase text-muted-foreground tracking-widest">Internal Case Notes</h4>
                    <div className="space-y-4 max-h-[400px] overflow-y-auto mb-4 pr-2 custom-scrollbar">
                        {selectedCase.memos && selectedCase.memos.length > 0 ? (
                          selectedCase.memos.map((memo: any) => (
                            <div key={memo.id} className="space-y-3">
                              <div className="p-3 bg-muted/30 rounded-2xl border border-white/5 space-y-2 relative group-memo">
                                <div className="flex justify-between items-center">
                                  <div className="flex items-center gap-2">
                                    <div className="w-5 h-5 rounded-full bg-ai/20 flex items-center justify-center text-[10px] font-black text-ai">
                                      {memo.author_name ? memo.author_name.charAt(0).toUpperCase() : "?"}
                                    </div>
                                    <span className="text-[10px] font-black text-foreground uppercase tracking-tighter">{memo.author_name || "Team Member"}</span>
                                  </div>
                                  <span className="text-[9px] text-muted-foreground">{new Date(memo.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                                <p className="text-[11px] leading-relaxed text-foreground/80 pl-7">{memo.content}</p>
                                
                                <div className="flex items-center gap-4 pl-7 pt-1">
                                  <button 
                                    onClick={() => handleToggleLike(memo.id)}
                                    className={`flex items-center gap-1 text-[9px] font-bold transition-colors ${memo.likes?.includes(user?.id) ? 'text-rose-500' : 'text-muted-foreground hover:text-rose-400'}`}
                                  >
                                    <Heart className={`w-3 h-3 ${memo.likes?.includes(user?.id) ? 'fill-current' : ''}`} />
                                    {memo.likes?.length || 0}
                                  </button>
                                  <button 
                                    onClick={() => setReplyTo(replyTo === memo.id ? null : memo.id)}
                                    className="flex items-center gap-1 text-[9px] font-bold text-muted-foreground hover:text-ai transition-colors"
                                  >
                                    <MessageSquare className="w-3 h-3" />
                                    Reply
                                  </button>
                                </div>

                                {replyTo === memo.id && (
                                  <div className="pl-7 pt-2 space-y-2">
                                    <Textarea 
                                      placeholder="Write a reply..." 
                                      value={replyText} 
                                      onChange={(e) => setReplyText(e.target.value)}
                                      className="min-h-[60px] bg-background/50 border-white/10 rounded-xl text-[10px] p-2 focus-visible:ring-ai"
                                    />
                                    <div className="flex justify-end gap-2">
                                      <Button size="sm" variant="ghost" className="h-7 text-[10px] px-3" onClick={() => setReplyTo(null)}>Cancel</Button>
                                      <Button size="sm" variant="ai" className="h-7 text-[10px] px-3" onClick={() => handleSendReply(memo.id)} disabled={!replyText.trim()}>Send Reply</Button>
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* Nested Replies */}
                              {memo.replies && memo.replies.length > 0 && (
                                <div className="pl-10 space-y-3 border-l border-border/20">
                                  {memo.replies.map((reply: any) => (
                                    <div key={reply.id} className="p-3 bg-muted/10 rounded-2xl border border-white/5 space-y-1">
                                      <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-2">
                                           <div className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center text-[8px] font-black text-primary">
                                              {reply.author_name ? reply.author_name.charAt(0).toUpperCase() : "?"}
                                           </div>
                                           <span className="text-[9px] font-black text-foreground uppercase tracking-tighter">{reply.author_name || "Team Member"}</span>
                                        </div>
                                        <span className="text-[9px] text-muted-foreground">{new Date(reply.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                      </div>
                                      <p className="text-[10px] leading-relaxed text-foreground/75 pl-6">{reply.content}</p>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))
                        ) : (
                          <div className="py-8 text-center border-2 border-dashed border-border/20 rounded-xl">
                            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">No internal notes shared yet</p>
                          </div>
                        )}
                    </div>

                    <div className="relative">
                        <Textarea placeholder="Add a team-only note or insight..." value={comment} onChange={(e) => setComment(e.target.value)} className="min-h-[80px] bg-background/50 border-white/5 rounded-xl text-xs p-4 focus-visible:ring-ai" />
                        <Button size="icon" variant="ai" onClick={handleSendMemo} className="absolute bottom-3 right-3 w-8 h-8 rounded-full shadow-lg" disabled={!comment.trim()}>
                          <Send className="w-3.5 h-3.5" />
                        </Button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Kanban Columns */}
        {["Open", "In Progress", "Escalated", "Resolved"].map((col, idx) => (
          <div key={col} className="bg-background/40 backdrop-blur-sm border border-border/50 p-4 rounded-2xl space-y-4 min-h-[500px] shadow-sm">
            <h3 className="font-semibold px-2 text-muted-foreground uppercase tracking-wider text-xs">{col} <span className="ml-2 bg-muted text-foreground px-2 py-0.5 rounded-full text-[10px]">
              {idx === 0 ? openCols.length : idx === 1 ? inProgressCols.length : idx === 2 ? escCols.length : idx === 3 ? resCols.length : 0}
            </span></h3>

            {/* States Handling */}
            {isLoading && (
              <div className="space-y-4">
                {[1,2,3].map((i) => (
                  <div key={i} className="h-40 bg-white/5 border border-white/10 rounded-2xl animate-pulse relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-[100%] animate-[shimmer_2s_infinite]"></div>
                  </div>
                ))}
              </div>
            )}

            {!isLoading && idx === 0 && openCols.length === 0 && (
              <div className="h-40 flex flex-col items-center justify-center border-2 border-dashed border-primary/20 rounded-xl bg-primary/5 text-muted-foreground/60 text-sm font-medium hover:bg-primary/10 transition-colors group">
                 <AlertCircle className="w-6 h-6 mb-2 text-primary/40 group-hover:text-primary transition-colors" />
                 <span className="mb-3">No active incidents</span>
                 <Link to="/report" className="px-4 py-1.5 bg-primary/20 hover:bg-primary/30 text-primary rounded-full text-xs font-bold transition-colors flex items-center gap-1"><Plus className="w-3 h-3"/> Create Incident</Link>
              </div>
            )}
            {!isLoading && idx === 1 && inProgressCols.length === 0 && (
               <div className="h-40 flex flex-col items-center justify-center border-2 border-dashed border-ai/20 rounded-xl bg-ai/5 text-muted-foreground/60 text-sm font-medium">
                 <Zap className="w-6 h-6 mb-2 text-ai/40" />
                 <span>Bench clear. Neural triage optimal.</span>
               </div>
            )}
            {!isLoading && idx === 2 && escCols.length === 0 && (
              <div className="h-40 flex flex-col items-center justify-center border-2 border-dashed border-emerald-500/20 rounded-xl bg-emerald-500/5 text-muted-foreground/80 text-sm font-medium">
                 <span className="text-2xl mb-2 grayscale">🎉</span>
                 <span>Clear of escalations</span>
              </div>
            )}
            {!isLoading && idx === 3 && resCols.length === 0 && (
               <div className="h-40 flex flex-col items-center justify-center border-2 border-dashed border-border/50 rounded-xl bg-background/20 text-muted-foreground/60 text-sm font-medium">
                 <span>No resolutions yet</span>
               </div>
            )}

            {/* Populate active items */}
            {!isLoading && idx === 0 && openCols.map((c) => (
              <motion.div key={c.id} layoutId={c.id} whileHover={{ scale: 1.02, y: -2 }} transition={{ type: "spring", stiffness: 300, damping: 20 }} onClick={() => setSelectedCase(c)}>
                <Card className="cursor-pointer border-l-[6px] border-l-primary/80 hover:shadow-[0_8px_40px_hsl(var(--primary)/0.15)] ring-1 ring-white/5 transition-all duration-300 hover:ring-primary/40 group bg-background/50 backdrop-blur-md h-full flex flex-col justify-between overflow-hidden relative">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -z-10 group-hover:bg-primary/20 transition-colors" />
                  <CardHeader className="p-5 flex-row items-start justify-between pb-3 space-y-0 relative z-10">
                    <CardTitle className="text-[16px] leading-tight font-bold pr-6 group-hover:text-primary transition-colors">{c.title}</CardTitle>
                    <button className="absolute right-3 top-3 w-8 h-8 flex items-center justify-center rounded-full bg-background border border-white/5 text-muted-foreground hover:text-primary hover:border-primary/30 opacity-0 group-hover:opacity-100 transition-all shadow-sm">
                      < MoreHorizontal className="w-4 h-4" />
                    </button>
                  </CardHeader>
                  <CardContent className="p-5 pt-0 flex flex-col gap-4 relative z-10">
                    <div className="flex gap-2 flex-wrap">
                       <Badge variant={c.priority === "urgent" ? "destructive" : "secondary"} className="rounded-md uppercase text-[10px] tracking-[0.1em] px-2 py-0.5 font-bold shadow-sm">{c.priority}</Badge>
                       <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
                         <Badge variant="outline" className="rounded-md text-[10px] tracking-wider px-2 border-border/60 bg-background/80 shadow-sm">{c.department}</Badge>
                         <Badge variant="ai" className="rounded-md text-[10px] tracking-wider px-2 bg-ai/10 text-ai border border-ai/30 shadow-sm">{c.aiCategory}</Badge>
                       </div>
                    </div>
                    
                    <div className="flex items-center justify-between mt-auto pt-4 border-t border-border/40">
                      <div className="flex -space-x-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-primary/60 border-2 border-background flex items-center justify-center text-xs font-black text-white shadow-md z-10">J</div>
                        <div className="w-8 h-8 rounded-full ai-gradient-bg border-2 border-background flex items-center justify-center text-[10px] font-black text-white shadow-md z-0">AI</div>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground font-semibold">
                        <span className="flex items-center gap-1 hover:text-foreground transition-colors bg-white/5 py-1 px-2 rounded-md"><MessageSquare className="w-3.5 h-3.5" /> {c.memos?.length || 0}</span>
                        <span className="flex items-center gap-1 text-amber-500 bg-amber-500/10 py-1 px-2 rounded-md font-bold"><Clock className="w-3.5 h-3.5" /> 4h left</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}

            {!isLoading && idx === 1 && inProgressCols.map((c) => (
              <motion.div key={c.id} layoutId={c.id} whileHover={{ scale: 1.02, y: -2 }} transition={{ type: "spring", stiffness: 300, damping: 20 }} onClick={() => setSelectedCase(c)}>
                <Card className="cursor-pointer border-l-[6px] border-l-ai/80 hover:shadow-[0_8px_40px_hsl(var(--ai)/0.15)] ring-1 ring-white/5 transition-all duration-300 hover:ring-ai/40 group bg-background/50 backdrop-blur-md h-full flex flex-col justify-between overflow-hidden relative">
                   <div className="absolute top-0 right-0 w-32 h-32 bg-ai/10 rounded-full blur-3xl -z-10 group-hover:bg-ai/20 transition-colors" />
                   <CardHeader className="p-5 flex-row items-start justify-between pb-3 space-y-0 relative z-10">
                    <CardTitle className="text-[16px] leading-tight font-bold pr-6 group-hover:text-ai transition-colors">{c.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="p-5 pt-0 flex flex-col gap-4 relative z-10">
                    <div className="flex gap-2 flex-wrap">
                       <Badge variant={c.priority === "urgent" ? "destructive" : "secondary"} className="rounded-md uppercase text-[10px] tracking-[0.1em] px-2 py-0.5 font-bold shadow-sm">{c.priority}</Badge>
                       <Badge variant="outline" className="rounded-md text-[10px] tracking-wider px-2 border-border/60 bg-background/80 shadow-sm">{c.department}</Badge>
                       <Badge variant="ai" className="rounded-md text-[10px] tracking-wider px-2 bg-ai/10 text-ai border border-ai/30 shadow-sm">{c.aiCategory}</Badge>
                    </div>
                    <div className="flex items-center justify-between mt-auto pt-4 border-t border-border/40">
                      <div className="flex -space-x-2">
                         <div className="w-8 h-8 rounded-full ai-gradient-bg border-2 border-background flex items-center justify-center text-[10px] font-black text-white shadow-md z-10">AI</div>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground font-semibold">
                         <span className="flex items-center gap-1 hover:text-foreground transition-colors bg-white/5 py-1 px-2 rounded-md"><MessageSquare className="w-3.5 h-3.5" /> {c.memos?.length || 0}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
            {!isLoading && idx === 2 && escCols.map(c => (
              <motion.div key={c.id} layoutId={c.id} whileHover={{ scale: 1.02, y: -2 }} transition={{ type: "spring", stiffness: 300, damping: 20 }}>
                <Card className="cursor-pointer border-l-[6px] border-l-destructive/80 hover:shadow-[0_8px_40px_hsl(var(--destructive)/0.15)] ring-1 ring-destructive/10 transition-all duration-300 hover:ring-destructive/40 group bg-destructive/5 backdrop-blur-md h-full flex flex-col justify-between overflow-hidden relative">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-destructive/10 rounded-full blur-3xl -z-10 group-hover:bg-destructive/20 transition-colors" />
                  <CardHeader className="p-5 flex-row items-start justify-between pb-3 space-y-0 relative z-10">
                    <CardTitle className="text-[16px] leading-tight font-bold pr-6 group-hover:text-destructive transition-colors">{c.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="p-5 pt-0 flex flex-col gap-4 relative z-10">
                     <div className="flex gap-2 flex-wrap">
                       <Badge variant="destructive" className="rounded-md uppercase text-[10px] tracking-[0.1em] px-2 py-0.5 shadow-sm shadow-destructive/20 bg-destructive text-white font-bold">ESCALATED</Badge>
                       <Badge variant="outline" className="rounded-md text-[10px] tracking-wider px-2 border-border/60 bg-background/80 shadow-sm opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">{c.department}</Badge>
                     </div>
                     <div className="flex items-center justify-between mt-auto pt-4 border-t border-border/40">
                      <div className="flex items-center gap-2 bg-background/50 pr-3 rounded-full shadow-inner border border-white/5">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-destructive to-destructive/60 border-2 border-background flex items-center justify-center text-xs font-black text-white shadow-md">L</div>
                        <span className="text-[11px] text-muted-foreground font-bold tracking-wide uppercase">Legal Team</span>
                      </div>
                      <div className="flex items-center gap-1 text-[11px] uppercase tracking-wider text-destructive font-black animate-pulse bg-destructive/10 py-1.5 px-2.5 rounded-md border border-destructive/20">
                        <Clock className="w-3.5 h-3.5" /> OVERDUE
                      </div>
                    </div>
                  </CardContent>
                 </Card>
              </motion.div>
            ))}
            {!isLoading && idx === 3 && resCols.map(c => (
              <motion.div key={c.id} layoutId={c.id} whileHover={{ scale: 1.02, y: -2 }}>
                 <Card className="cursor-pointer border-l-[6px] border-l-emerald-500/80 hover:shadow-[0_8px_40px_rgba(16,185,129,0.15)] ring-1 ring-emerald-500/10 transition-all duration-300 hover:ring-emerald-500/40 bg-background/20 opacity-60 hover:opacity-100 group h-full flex flex-col justify-between overflow-hidden relative">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl -z-10 group-hover:bg-emerald-500/10 transition-colors" />
                  <CardHeader className="p-5 flex-row items-start justify-between pb-3 space-y-0 relative z-10">
                    <CardTitle className="text-[15px] leading-tight font-semibold line-through text-muted-foreground group-hover:text-foreground transition-colors">{c.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="p-5 pt-0 flex flex-col gap-4 relative z-10">
                     <div className="flex gap-2">
                       <Badge variant="outline" className="rounded-md text-[10px] tracking-[0.1em] px-2 py-0.5 text-emerald-500 border-emerald-500/30 bg-emerald-500/10 font-bold shadow-sm">RESOLVED</Badge>
                     </div>
                     <div className="flex items-center justify-between mt-auto pt-4 border-t border-border/30">
                      <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider bg-background/50 py-1.5 px-3 rounded-full border border-white/5">Closed Jan 14, 2025</span>
                    </div>
                  </CardContent>
                 </Card>
              </motion.div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
