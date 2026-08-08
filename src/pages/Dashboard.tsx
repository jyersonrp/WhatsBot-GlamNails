import { trpc } from "@/providers/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  MessageSquare,
  Clock,
  Bot,
  Users,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const COLORS = ["#10B981", "#3B82F6", "#F59E0B"];

export default function Dashboard() {
  const { data: stats } = trpc.dashboard.stats.useQuery();
  const { data: recentConversations } = trpc.dashboard.recentConversations.useQuery();

  const dailyMessagesData =
    stats?.dailyMessages.map((d) => ({
      date: format(new Date(d.date + "T00:00:00"), "dd MMM", { locale: es }),
      mensajes: d.count,
    })) || [];

  const senderData =
    stats?.messagesBySender.map((s) => ({
      name:
        s.sender === "bot"
          ? "Bot"
          : s.sender === "agent"
          ? "Agente"
          : "Cliente",
      value: s.count,
    })) || [];

  const statCards = [
    {
      title: "Conversaciones Activas",
      value: stats?.activeConversations || 0,
      icon: MessageSquare,
      trend: "+12%",
      trendUp: true,
      color: "bg-blue-50 text-blue-600",
    },
    {
      title: "Mensajes Hoy",
      value: stats?.messagesToday || 0,
      icon: MessageSquare,
      trend: "+35%",
      trendUp: true,
      color: "bg-emerald-50 text-emerald-600",
    },
    {
      title: "Tasa Resolución Bot",
      value: `${stats?.botResolutionRate || 0}%`,
      icon: Bot,
      trend: "+5%",
      trendUp: true,
      color: "bg-violet-50 text-violet-600",
    },
    {
      title: "Contactos Registrados",
      value: stats?.totalContacts || 0,
      icon: Users,
      trend: "+8%",
      trendUp: true,
      color: "bg-amber-50 text-amber-600",
    },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return "bg-emerald-50 text-emerald-700";
      case "pending":
        return "bg-amber-50 text-amber-700";
      case "archived":
        return "bg-slate-100 text-slate-600";
      default:
        return "bg-slate-100 text-slate-600";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "active":
        return "Activa";
      case "pending":
        return "Pendiente";
      case "archived":
        return "Archivada";
      default:
        return status;
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-semibold text-[#0F172A]">Dashboard</h1>
        <p className="text-sm text-[#64748B] mt-1">
          Resumen de la actividad de atención al cliente
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, i) => (
          <Card key={i} className="hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className="text-sm text-[#64748B]">{stat.title}</p>
                  <p className="text-2xl font-bold text-[#0F172A]">
                    {stat.value}
                  </p>
                  <div className="flex items-center gap-1 text-xs">
                    {stat.trendUp ? (
                      <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                    ) : (
                      <TrendingDown className="w-3.5 h-3.5 text-red-500" />
                    )}
                    <span
                      className={
                        stat.trendUp ? "text-emerald-600" : "text-red-600"
                      }
                    >
                      {stat.trend}
                    </span>
                    <span className="text-[#64748B]">vs ayer</span>
                  </div>
                </div>
                <div className={`p-3 rounded-xl ${stat.color}`}>
                  <stat.icon className="w-5 h-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Line Chart */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#64748B]" />
              Volumen de Mensajes (Últimos 7 días)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={dailyMessagesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12, fill: "#64748B" }}
                  axisLine={{ stroke: "#E2E8F0" }}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: "#64748B" }}
                  axisLine={{ stroke: "#E2E8F0" }}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: "8px",
                    border: "1px solid #E2E8F0",
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="mensajes"
                  stroke="#10B981"
                  strokeWidth={2.5}
                  dot={{ fill: "#10B981", r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Pie Chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Bot className="w-4 h-4 text-[#64748B]" />
              Mensajes por Origen
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={senderData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {senderData.map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-4 mt-2">
              {senderData.map((entry, index) => (
                <div key={index} className="flex items-center gap-1.5">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span className="text-xs text-[#64748B]">{entry.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Conversations */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium flex items-center justify-between">
            <span className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-[#64748B]" />
              Conversaciones Recientes
            </span>
            <a
              href="/conversations"
              className="text-xs text-[#10B981] hover:underline flex items-center gap-1"
            >
              Ver todas
              <ArrowUpRight className="w-3 h-3" />
            </a>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="divide-y divide-[#E2E8F0]">
            {recentConversations?.map((conv) => (
              <div
                key={conv.id}
                className="py-3 flex items-center justify-between hover:bg-slate-50 px-2 rounded-lg transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#10B981] to-[#059669] flex items-center justify-center text-white text-sm font-semibold">
                    {conv.contactName?.charAt(0) || "?"}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#0F172A]">
                      {conv.contactName || conv.phoneNumber}
                    </p>
                    <p className="text-xs text-[#64748B] truncate max-w-xs">
                      {conv.lastMessage || "Sin mensajes"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(
                      conv.status
                    )}`}
                  >
                    {getStatusLabel(conv.status)}
                  </span>
                  {conv.unreadCount > 0 && (
                    <span className="w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                      {conv.unreadCount}
                    </span>
                  )}
                </div>
              </div>
            ))}
            {(!recentConversations || recentConversations.length === 0) && (
              <p className="text-sm text-[#64748B] py-4 text-center">
                No hay conversaciones recientes
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
