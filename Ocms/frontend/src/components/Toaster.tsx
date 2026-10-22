import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, AlertCircle, Info, X, Zap } from 'lucide-react'

export interface Notification {
  id: string
  title: string
  message: string
  type: 'success' | 'error' | 'info' | 'agent' | 'warning'
  timestamp: Date
}

let notificationListener: ((n: Notification) => void) | null = null

export const sysNotify = (n: Omit<Notification, 'id' | 'timestamp'>) => {
  if (notificationListener) {
    notificationListener({
      ...n,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date()
    })
  }
}

export function Toaster() {
  const [toasts, setToasts] = useState<Notification[]>([])

  useEffect(() => {
    notificationListener = (n: Notification) => {
      setToasts(prev => [n, ...prev].slice(0, 5))
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== n.id))
      }, 5000)
    }
    return () => { notificationListener = null }
  }, [])

  return (
    <div className="fixed bottom-6 left-6 z-[100] space-y-3 w-80 pointer-events-none">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, x: -40, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
            className={`pointer-events-auto p-4 rounded-2xl border shadow-2xl flex items-start gap-3 backdrop-blur-xl ${
              t.type === 'agent' ? 'bg-ai/10 border-ai/20 shadow-ai/10' :
              t.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 shadow-emerald-500/10' :
              t.type === 'error' ? 'bg-destructive/10 border-destructive/20 shadow-destructive/10' :
              t.type === 'warning' ? 'bg-amber-500/10 border-amber-500/20 shadow-amber-500/10' :
              'bg-blue-500/10 border-blue-500/20 shadow-blue-500/10'
            }`}
          >
            <div className={`p-1.5 rounded-lg ${
              t.type === 'agent' ? 'bg-ai text-white' :
              t.type === 'success' ? 'bg-emerald-500 text-white' :
              t.type === 'error' ? 'bg-destructive text-white' :
              t.type === 'warning' ? 'bg-amber-500 text-white' :
              'bg-blue-500 text-white'
            }`}>
              {t.type === 'agent' ? <Zap className="w-3.5 h-3.5" /> :
               t.type === 'success' ? <CheckCircle className="w-3.5 h-3.5" /> :
               t.type === 'error' ? <AlertCircle className="w-3.5 h-3.5" /> :
               t.type === 'warning' ? <AlertCircle className="w-3.5 h-3.5" /> :
               <Info className="w-3.5 h-3.5" />}
            </div>
            
            <div className="flex-1 space-y-1">
              <h4 className="text-xs font-black uppercase tracking-widest text-foreground">{t.title}</h4>
              <p className="text-[11px] text-muted-foreground font-medium leading-snug">{t.message}</p>
            </div>

            <button 
              onClick={() => setToasts(prev => prev.filter(toast => toast.id !== t.id))}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
