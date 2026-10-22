import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from "recharts"
import { TrendingUp, Users, ShieldCheck, AlertCircle } from "lucide-react"

import { useAuth } from "@/stores/authStore"

const COLORS = ["#00f5ff", "#00d1ff", "#00adff", "#0089ff"]

export function Analytics() {
  const { token } = useAuth()
  const [summary, setSummary] = useState<any>({})
  const [distribution, setDistribution] = useState([])
  const [trends, setTrends] = useState([])

  useEffect(() => {
    const fetchData = async () => {
       try {
         const [sumRes, distRes, trendRes] = await Promise.all([
           fetch("http://127.0.0.1:8008/api/v1/analytics/summary", { headers: { "Authorization": `Bearer ${token}` } }),
           fetch("http://127.0.0.1:8008/api/v1/analytics/distribution", { headers: { "Authorization": `Bearer ${token}` } }),
           fetch("http://127.0.0.1:8008/api/v1/analytics/trends", { headers: { "Authorization": `Bearer ${token}` } })
         ])
         
         setSummary(await sumRes.json())
         setDistribution(await distRes.json())
         setTrends(await trendRes.json())
       } catch (error) {
         console.error("Analytics sync error:", error)
       }
    }
    fetchData()
  }, [])

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div>
        <h2 className="text-3xl font-black ai-gradient-text">Enterprise Intelligence</h2>
        <p className="text-muted-foreground mt-2">Real-time KPI aggregation across decentralized service domains.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Total Volume", value: summary.total_volume || 0, icon: TrendingUp },
          { label: "Resolution Rate", value: summary.resolution_rate || "0%", icon: ShieldCheck },
          { label: "Escalation Rate", value: summary.escalation_rate || "0%", icon: AlertCircle },
          { label: "Active Nodes", value: summary.active_investigations || 0, icon: Users },
        ].map((kpi, i) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className="bg-background/40 border-white/5 shadow-xl hover:border-ai/30 transition-all group overflow-hidden relative">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-100 transition-opacity">
                 <kpi.icon className="w-8 h-8 text-ai" />
              </div>
              <CardHeader className="pb-2">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{kpi.label}</p>
              </CardHeader>
              <CardContent>
                <h3 className="text-3xl font-black text-ai">{kpi.value}</h3>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="bg-background/40 border-white/5 shadow-xl">
          <CardHeader>
            <CardTitle className="text-sm uppercase tracking-widest">Incident Distribution (Status)</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%" minHeight={300}>
               <PieChart>
                 <Pie
                   data={distribution}
                   innerRadius={60}
                   outerRadius={80}
                   paddingAngle={5}
                   dataKey="value"
                 >
                   {distribution.map((_, index) => (
                     <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                   ))}
                 </Pie>
                 <Tooltip 
                   contentStyle={{ backgroundColor: "#020817", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px" }} 
                   itemStyle={{ color: "#fff" }}
                 />
               </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-background/40 border-white/5 shadow-xl">
          <CardHeader>
             <CardTitle className="text-sm uppercase tracking-widest">Priority Map</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%" minHeight={300}>
              <BarChart data={trends}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={10} axisLine={false} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={10} axisLine={false} tickLine={false} />
                <Tooltip 
                   cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                   contentStyle={{ backgroundColor: "#020817", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px" }} 
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                   {trends.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                   ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
