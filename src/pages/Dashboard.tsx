import { useState, useMemo } from "react";
import { trpc } from "@/providers/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  MessageSquare,
  Clock,
  Calendar,
  Sparkles,
  ArrowUpRight,
  Plus,
  Smartphone,
  CheckCircle2,
  Phone,
  Scissors,
  VolumeX,
  TrendingUp,
  ChevronRight,
  Coins,
  Receipt,
  ExternalLink,
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
import { format, isToday } from "date-fns";
import { es } from "date-fns/locale";
import { Link } from "react-router";
import { toast } from "sonner";
import { openWhatsAppSimulator } from "@/components/WhatsAppSimulator";
import { cn } from "@/lib/utils";

const PIE_COLORS = ["#E11D48", "#EC4899", "#F59E0B"];

export default function Dashboard() {
  const [isNewAptOpen, setIsNewAptOpen] = useState(false);
  const [aptTab, setAptTab] = useState<"hoy" | "proximas">("hoy");
  const [viewProofUrl, setViewProofUrl] = useState<string | null>(null);

  // New Appointment Form
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("+58412");
  const [serviceId, setServiceId] = useState<number | undefined>(undefined);
  const [scheduledDate, setScheduledDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [scheduledTime, setScheduledTime] = useState("10:00");
  const [notes, setNotes] = useState("");
  const [paymentProofUrl, setPaymentProofUrl] = useState("");

  const utils = trpc.useUtils();

  const { data: stats } = trpc.dashboard.stats.useQuery(undefined, {
    refetchInterval: 5000,
  });

  const { data: services } = trpc.service.list.useQuery({ activeOnly: true });

  const { data: allAppointments } = trpc.appointment.list.useQuery(undefined, {
    refetchInterval: 5000,
  });

  const selectedService = services?.find((s) => s.id === serviceId);

  const setDatePreset = (daysFromNow: number) => {
    const target = new Date();
    target.setDate(target.getDate() + daysFromNow);
    setScheduledDate(format(target, "yyyy-MM-dd"));
  };

  const todayAppointments = useMemo(() => {
    if (allAppointments) {
      return allAppointments.filter((a) => isToday(new Date(a.scheduledAt)));
    }
    return (stats?.upcomingAppointments || []).filter((a) => isToday(new Date(a.scheduledAt)));
  }, [allAppointments, stats?.upcomingAppointments]);

  const upcomingAppointmentsList = useMemo(() => {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    if (allAppointments) {
      return allAppointments
        .filter((a) => new Date(a.scheduledAt) >= startOfToday)
        .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
        .slice(0, 10);
    }
    return stats?.upcomingAppointments || [];
  }, [allAppointments, stats?.upcomingAppointments]);

  const displayedAppointments = aptTab === "hoy" ? todayAppointments : upcomingAppointmentsList;

  const createAptMutation = trpc.appointment.create.useMutation({
    onSuccess: () => {
      toast.success("Cita agendada exitosamente.");
      setIsNewAptOpen(false);
      utils.dashboard.stats.invalidate();
      utils.appointment.list.invalidate();
      utils.appointment.stats.invalidate();
      utils.conversation.list.invalidate();
      utils.message.list.invalidate();
      // Reset form
      setClientName("");
      setClientPhone("+58412");
      setNotes("");
      setPaymentProofUrl("");
    },
    onError: (err) => {
      toast.error(err.message || "Error al crear la cita.");
    },
  });

  const updateStatusMutation = trpc.appointment.updateStatus.useMutation({
    onSuccess: (_, vars) => {
      toast.success(`Cita marcada como ${vars.status}. WhatsApp notificado.`);
      utils.dashboard.stats.invalidate();
      utils.appointment.list.invalidate();
      utils.appointment.stats.invalidate();
      utils.conversation.list.invalidate();
      utils.message.list.invalidate();
    },
    onError: (err) => {
      toast.error(err.message || "Error al actualizar estado.");
    },
  });

  const handleCreateAppointment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduledDate || !scheduledTime) {
      toast.error("Por favor selecciona fecha y hora.");
      return;
    }

    const scheduledAt = new Date(`${scheduledDate}T${scheduledTime}:00`);

    createAptMutation.mutate({
      clientName,
      clientPhone,
      serviceId,
      scheduledAt,
      status: "pendiente",
      notes: notes || undefined,
      paymentProofUrl: paymentProofUrl || undefined,
    });
  };

  const dailyMessagesData =
    stats?.dailyMessages?.map((d) => {
      let dateObj: Date;
      try {
        const raw = String(d.date || "");
        dateObj = raw.includes("T") ? new Date(raw) : new Date(raw + "T00:00:00");
        if (isNaN(dateObj.getTime())) dateObj = new Date();
      } catch {
        dateObj = new Date();
      }
      return {
        date: format(dateObj, "dd MMM", { locale: es }),
        mensajes: Number(d.count || 0),
      };
    }) || [];

  const senderData =
    stats?.messagesBySender?.map((s) => ({
      name:
        s.sender === "bot"
          ? "Bot Sofía"
          : s.sender === "agent"
          ? "Recepcionista"
          : "Clientas",
      value: Number(s.count),
    })) || [];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmada":
        return (
          <Badge className="bg-emerald-500/15 text-emerald-700 border-emerald-500/30 text-[11px]">
            Confirmada
          </Badge>
        );
      case "pendiente":
        return (
          <Badge className="bg-amber-500/15 text-amber-700 border-amber-500/30 text-[11px]">
            Pendiente Pago
          </Badge>
        );
      case "completada":
        return (
          <Badge className="bg-blue-500/15 text-blue-700 border-blue-500/30 text-[11px]">
            Completada
          </Badge>
        );
      case "cancelada":
        return (
          <Badge className="bg-rose-500/15 text-rose-700 border-rose-500/30 text-[11px]">
            Cancelada
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Welcome Banner & Shortcuts */}
      <div className="bg-gradient-to-r from-[#200B16] via-[#1B1124] to-[#0D111D] rounded-2xl p-6 text-white shadow-md border border-rose-900/40 relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute -top-16 -right-16 w-56 h-56 bg-rose-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-56 h-56 bg-pink-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/25 text-rose-200 border border-rose-400/30 flex items-center gap-1">
                <span>💅 Maturín, Monagas</span>
              </span>
              <span className="text-xs text-rose-200/90 font-medium">
                {format(new Date(), "EEEE, d 'de' MMMM", { locale: es })}
              </span>
              <span className="text-[11px] font-semibold text-amber-300 bg-amber-950/50 px-2 py-0.5 rounded-full border border-amber-500/30">
                Tasa BCV: Bs. {stats?.bcvRate || 70},00 / $
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight mt-1.5 flex items-center gap-2">
              <span className="bg-gradient-to-r from-white via-rose-100 to-amber-100 bg-clip-text text-transparent">
                Panel Ejecutivo Glam Nails
              </span>
              <Sparkles className="w-5 h-5 text-rose-400 shrink-0" />
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl mt-1 leading-relaxed">
              Gestión boutique del salón: confirmación de citas con anticipo Pago Móvil, atención automática por WhatsApp y finanzas en tiempo real.
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <Button
              onClick={() => setIsNewAptOpen(true)}
              className="bg-gradient-to-r from-rose-600 via-pink-600 to-rose-500 hover:from-rose-500 hover:to-pink-500 text-white font-bold text-xs shadow-md shadow-rose-950/40 gap-1.5 border border-rose-400/30 transition-all hover:scale-[1.02]"
            >
              <Plus className="w-4 h-4" />
              Nueva Cita
            </Button>

            <Button
              onClick={openWhatsAppSimulator}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-md gap-1.5 border border-emerald-500/30 transition-all hover:scale-[1.02]"
            >
              <Smartphone className="w-4 h-4" />
              Simulador WhatsApp
            </Button>

            <Button
              asChild
              variant="outline"
              className="bg-slate-900/80 hover:bg-slate-800 text-white border-slate-700 font-semibold text-xs gap-1.5"
            >
              <Link to="/conversations">
                <MessageSquare className="w-4 h-4 text-rose-400" />
                Ver CRM
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* 4 Executive Metric Cards (Estilo Salón Boutique) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Citas de Hoy */}
        <Link to="/appointments">
          <Card className="hover:shadow-md transition-all hover:border-rose-300 cursor-pointer h-full border-rose-100/80 bg-white rounded-2xl group shadow-xs">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Citas de Hoy
                  </p>
                  <p className="text-3xl font-black text-slate-900 mt-1">
                    {stats?.todayAppointments ?? 0}
                  </p>
                  <div className="flex flex-wrap items-center gap-1.5 mt-2">
                    <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      {stats?.todayConfirmedAppointments ?? 0} confirmadas
                    </span>
                    {(stats?.todayPendingAppointments ?? 0) > 0 && (
                      <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                        {stats?.todayPendingAppointments} por pagar
                      </span>
                    )}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-rose-50 text-rose-600 border border-rose-100/80 shadow-xs group-hover:scale-110 transition-transform">
                  <Calendar className="w-5 h-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Card 2: Ingresos Estimados ($ USD y Bs BCV) */}
        <Link to="/appointments">
          <Card className="hover:shadow-md transition-all hover:border-amber-300 cursor-pointer h-full border-rose-100/80 bg-white rounded-2xl group shadow-xs">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="min-w-0">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                    <span>Ingresos Estimados</span>
                  </p>
                  <div className="flex items-baseline gap-1.5 mt-1">
                    <span className="text-3xl font-black text-slate-900">
                      ${stats?.todayEstimatedRevenueUsd ?? 0}
                    </span>
                    <span className="text-xs font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded-full border border-rose-100">
                      Hoy
                    </span>
                  </div>
                  <div className="mt-1.5 flex flex-col gap-0.5">
                    <p className="text-xs font-extrabold text-amber-800 tracking-tight">
                      ≈ Bs. {(stats?.todayEstimatedRevenueBs ?? ((stats?.todayEstimatedRevenueUsd ?? 0) * (stats?.bcvRate || 70))).toLocaleString("es-VE")}
                    </p>
                    <div className="flex items-center gap-1 text-[10px] text-slate-500 mt-0.5">
                      <span className="font-semibold text-slate-600">
                        Total citas: ${stats?.estimatedRevenueUsd ?? 0} USD
                      </span>
                    </div>
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-amber-50 text-amber-600 border border-amber-100 shadow-xs group-hover:scale-110 transition-transform shrink-0">
                  <Coins className="w-5 h-5 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Card 3: Chats Activos & Mensajes */}
        <Link to="/conversations">
          <Card className="hover:shadow-md transition-all hover:border-sky-300 cursor-pointer h-full border-rose-100/80 bg-white rounded-2xl group shadow-xs">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Chats Activos WhatsApp
                  </p>
                  <p className="text-3xl font-black text-slate-900 mt-1">
                    {stats?.activeConversations ?? 0}
                  </p>
                  <div className="flex flex-col gap-1 mt-2">
                    <span className="text-[11px] text-sky-700 bg-sky-50 px-2 py-0.5 rounded-full border border-sky-200 inline-flex items-center gap-1 font-medium w-fit">
                      <Clock className="w-3 h-3 text-sky-600" />
                      {stats?.messagesToday ?? 0} mensajes hoy
                    </span>
                    {(stats?.chatsNeedingAttention?.length ?? 0) > 0 && (
                      <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200 inline-block w-fit">
                        {stats?.chatsNeedingAttention?.length} esperan atención
                      </span>
                    )}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-sky-50 text-sky-600 border border-sky-100 shadow-xs group-hover:scale-110 transition-transform">
                  <MessageSquare className="w-5 h-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Card 4: Tasa de Confirmación */}
        <Link to="/appointments">
          <Card className="hover:shadow-md transition-all hover:border-emerald-300 cursor-pointer h-full border-rose-100/80 bg-white rounded-2xl group shadow-xs">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Tasa de Confirmación
                  </p>
                  <p className="text-3xl font-black text-slate-900 mt-1">
                    {stats?.confirmationRate ?? 100}%
                  </p>
                  <div className="flex flex-col gap-1 mt-2">
                    <span className="text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 inline-flex items-center gap-1 font-semibold w-fit">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      {stats?.confirmedAppointments ?? 0} de {stats?.totalAppointments ?? 0} citas
                    </span>
                    <span className="text-[10px] text-pink-700 bg-pink-50 px-2 py-0.5 rounded-full border border-pink-200 font-medium inline-block w-fit">
                      {stats?.botResolutionRate ?? 100}% automatizado por Sofía 💅
                    </span>
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 shadow-xs group-hover:scale-110 transition-transform">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Two-Column Operational Layout: Upcoming Appointments + Attention Chats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Próximas Citas VIP del Salón */}
        <Card className="border-rose-100/80 shadow-xs bg-white rounded-2xl overflow-hidden">
          <CardHeader className="pb-3 border-b border-rose-100/60 bg-rose-50/20">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="flex items-center gap-2">
                <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-900">
                  <Calendar className="w-4 h-4 text-rose-600" />
                  <span>Agenda VIP</span>
                </CardTitle>
                {/* Tab Switcher: Hoy vs Próximas */}
                <div className="flex items-center gap-1 bg-rose-100/60 p-0.5 rounded-xl border border-rose-200/60 text-xs">
                  <button
                    type="button"
                    onClick={() => setAptTab("hoy")}
                    className={cn(
                      "px-2.5 py-1 rounded-lg font-bold transition-all text-xs cursor-pointer flex items-center gap-1",
                      aptTab === "hoy"
                        ? "bg-white text-rose-700 shadow-2xs"
                        : "text-slate-600 hover:text-rose-600"
                    )}
                  >
                    <span>Hoy</span>
                    <span
                      className={cn(
                        "text-[10px] px-1.5 py-0.2 rounded-full",
                        aptTab === "hoy"
                          ? "bg-rose-100 text-rose-800"
                          : "bg-white/80 text-slate-500"
                      )}
                    >
                      {todayAppointments.length}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAptTab("proximas")}
                    className={cn(
                      "px-2.5 py-1 rounded-lg font-bold transition-all text-xs cursor-pointer flex items-center gap-1",
                      aptTab === "proximas"
                        ? "bg-white text-rose-700 shadow-2xs"
                        : "text-slate-600 hover:text-rose-600"
                    )}
                  >
                    <span>Próximas</span>
                    <span
                      className={cn(
                        "text-[10px] px-1.5 py-0.2 rounded-full",
                        aptTab === "proximas"
                          ? "bg-rose-100 text-rose-800"
                          : "bg-white/80 text-slate-500"
                      )}
                    >
                      {upcomingAppointmentsList.length}
                    </span>
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsNewAptOpen(true)}
                  className="h-7 text-xs border-rose-200 text-rose-700 hover:bg-rose-50 gap-1 rounded-lg shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Cita</span>
                </Button>
                <Link
                  to="/appointments"
                  className="text-xs font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1 hover:underline"
                >
                  Ver agenda
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-4">
            <div className="divide-y divide-rose-50">
              {displayedAppointments.map((apt) => {
                const dateObj = new Date(apt.scheduledAt);
                const timeStr = dateObj.toLocaleTimeString("es-VE", {
                  hour: "2-digit",
                  minute: "2-digit",
                });
                const dateStr = dateObj
                  .toLocaleDateString("es-VE", {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                  })
                  .replace(/\./g, "");
                const waPhone = apt.clientPhone.replace(/[^0-9]/g, "");
                const isAptToday = isToday(dateObj);

                return (
                  <div
                    key={apt.id}
                    className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-rose-50/30 px-2 rounded-xl transition-colors"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      {/* Tear-sheet calendar badge */}
                      <div
                        className={cn(
                          "w-14 rounded-xl border bg-white shadow-2xs overflow-hidden flex flex-col shrink-0 text-center select-none",
                          isAptToday ? "border-rose-400 ring-2 ring-rose-200" : "border-rose-200"
                        )}
                      >
                        <div className="bg-gradient-to-r from-rose-600 to-pink-600 text-white text-[9px] font-black uppercase tracking-wider py-0.5 px-1 leading-tight">
                          {dateObj
                            .toLocaleDateString("es-VE", { month: "short" })
                            .replace(/\./g, "")
                            .slice(0, 3)
                            .toUpperCase()}
                        </div>
                        <div className="py-0.5 px-0.5 flex flex-col items-center justify-center bg-rose-50/40">
                          <span className="text-base font-black text-slate-900 leading-none">
                            {dateObj.getDate()}
                          </span>
                          <span className="text-[8px] font-bold text-rose-600 uppercase tracking-tight mt-0.5 leading-none">
                            {dateStr}
                          </span>
                        </div>
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-bold text-slate-900 truncate">
                            {apt.clientName}
                          </p>
                          {isAptToday && (
                            <span className="text-[10px] font-black text-rose-700 bg-rose-100/90 border border-rose-300 px-1.5 py-0.2 rounded-full inline-flex items-center gap-0.5 shadow-2xs">
                              ✨ HOY
                            </span>
                          )}
                          <span className="text-xs font-semibold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-100">
                            {timeStr}
                          </span>
                          {getStatusBadge(apt.status)}
                        </div>
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500 mt-1">
                          <span className="font-semibold text-rose-700 bg-rose-50/80 px-2 py-0.5 rounded-full border border-rose-200/60 truncate">
                            {apt.service?.name || "Servicio uñas"} (${apt.service?.priceUsd || 0} USD)
                          </span>
                          <a
                            href={`https://wa.me/${waPhone}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-mono text-[11px] text-emerald-700 hover:text-emerald-800 hover:underline flex items-center gap-1"
                            title="Abrir chat WhatsApp"
                          >
                            <Phone className="w-3 h-3 text-emerald-600" />
                            {apt.clientPhone}
                          </a>
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-1.5 self-end sm:self-center">
                      {apt.paymentProofUrl && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setViewProofUrl(apt.paymentProofUrl!)}
                          className="h-8 text-xs border-amber-300 bg-amber-50/80 hover:bg-amber-100 text-amber-900 font-medium gap-1 px-2 shadow-2xs"
                          title="Ver comprobante de Pago Móvil"
                        >
                          <Receipt className="w-3.5 h-3.5 text-amber-600" />
                          <span className="hidden sm:inline">Comprobante</span>
                        </Button>
                      )}

                      {apt.status === "pendiente" ? (
                        <Button
                          size="sm"
                          onClick={() =>
                            updateStatusMutation.mutate({
                              id: apt.id,
                              status: "confirmada",
                            })
                          }
                          disabled={updateStatusMutation.isPending}
                          className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold gap-1.5 shadow-xs"
                          title="Confirmar cita y enviar WhatsApp a la clienta"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Confirmar
                        </Button>
                      ) : (
                        <Button
                          asChild
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs border-rose-200 text-slate-700 hover:text-rose-600 hover:bg-rose-50 gap-1 px-2.5 font-medium shadow-2xs"
                        >
                          <Link to="/appointments">
                            <span>Gestionar</span>
                            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                          </Link>
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}

              {displayedAppointments.length === 0 && (
                <div className="py-8 text-center text-slate-400">
                  <Calendar className="w-8 h-8 mx-auto text-rose-300 mb-1" />
                  <p className="text-xs font-semibold text-slate-600">
                    {aptTab === "hoy"
                      ? "No hay citas programadas para hoy."
                      : "No hay citas próximas agendadas."}
                  </p>
                  <Button
                    size="sm"
                    variant="link"
                    onClick={() => setIsNewAptOpen(true)}
                    className="text-rose-600 text-xs mt-1 font-semibold"
                  >
                    + Agendar una cita ahora
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Right: Chats Esperando Atención Humana (CRM) */}
        <Card className="border-rose-100/80 shadow-xs bg-white rounded-2xl overflow-hidden">
          <CardHeader className="pb-3 border-b border-rose-100/60 bg-rose-50/20">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-900">
                <MessageSquare className="w-4 h-4 text-rose-600" />
                <span>Chats Esperando Atención Humana</span>
              </CardTitle>
              <Link
                to="/conversations"
                className="text-xs font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1 hover:underline"
              >
                Abrir CRM WhatsApp
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </CardHeader>

          <CardContent className="p-4">
            <div className="divide-y divide-rose-50">
              {stats?.chatsNeedingAttention?.map((chat) => (
                <Link
                  key={chat.id}
                  to={`/conversations/${chat.id}`}
                  className="py-3 flex items-center justify-between gap-3 hover:bg-rose-50/30 px-2 rounded-xl transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-rose-500 via-pink-400 to-amber-200 flex items-center justify-center text-slate-900 font-extrabold text-sm shadow-xs ring-2 ring-rose-200/80 shrink-0 group-hover:scale-105 transition-transform">
                      {chat.contactName?.charAt(0) || "?"}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-slate-900 truncate">
                          {chat.contactName || chat.phoneNumber}
                        </p>
                        {chat.isBotMuted ? (
                          <span className="text-[10px] font-semibold bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full flex items-center gap-1 border border-amber-200">
                            <VolumeX className="w-3 h-3 text-amber-700" />
                            Atención Manual
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold bg-rose-100 text-rose-900 px-2 py-0.5 rounded-full border border-rose-200">
                            Esperando Respuesta
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 truncate mt-0.5 font-normal">
                        {chat.lastMessage || "Sin mensajes"}
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-2">
                    {chat.unreadCount > 0 && (
                      <span className="min-w-5 h-5 px-1 bg-gradient-to-r from-rose-600 to-pink-600 text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-xs">
                        {chat.unreadCount}
                      </span>
                    )}
                    <span className="text-xs font-semibold text-rose-600 group-hover:text-rose-700 group-hover:translate-x-0.5 transition-all flex items-center">
                      Responder
                      <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </Link>
              ))}

              {(!stats?.chatsNeedingAttention || stats.chatsNeedingAttention.length === 0) && (
                <div className="py-8 text-center text-slate-400">
                  <div className="w-9 h-9 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-1 border border-emerald-100">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-bold text-slate-700">
                    ¡Todo al día en el salón!
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    No hay chats esperando respuesta humana. El Bot Sofía está respondiendo consultas.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Row: Volume Chart + Top Services Ranking */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Messages Volume Line Chart */}
        <Card className="lg:col-span-2 border-rose-100/80 shadow-xs bg-white rounded-2xl overflow-hidden">
          <CardHeader className="pb-2 border-b border-rose-100/40 bg-rose-50/10">
            <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-800">
              <TrendingUp className="w-4 h-4 text-rose-500" />
              <span>Volumen de Mensajes por WhatsApp (Últimos 7 días)</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={dailyMessagesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#FCE7F3" opacity={0.6} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: "#64748B" }}
                  axisLine={{ stroke: "#F3D5D7" }}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#64748B" }}
                  axisLine={{ stroke: "#F3D5D7" }}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: "12px",
                    border: "1px solid #FECDD3",
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.05)",
                    fontSize: "12px",
                    backgroundColor: "#FFFFFF",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="mensajes"
                  stroke="#E11D48"
                  strokeWidth={2.5}
                  dot={{ fill: "#E11D48", r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Services Ranking */}
        <Card className="border-rose-100/80 shadow-xs bg-white rounded-2xl overflow-hidden">
          <CardHeader className="pb-2 border-b border-rose-100/40 bg-rose-50/10">
            <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-800">
              <Scissors className="w-4 h-4 text-rose-500" />
              <span>Servicios Más Solicitados</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="space-y-3">
              {stats?.topServices?.map((srv, idx) => (
                <div
                  key={srv.id}
                  className="flex items-center justify-between text-xs pb-2 border-b border-slate-100 last:border-none"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-5 h-5 rounded-full bg-rose-100 text-rose-700 font-bold text-[10px] flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <div className="truncate">
                      <p className="font-semibold text-slate-800 truncate">
                        {srv.name}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        ${srv.priceUsd} USD · {srv.durationMinutes} min
                      </p>
                    </div>
                  </div>
                  <span className="font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-full text-[11px] shrink-0">
                    {srv.count} citas
                  </span>
                </div>
              ))}
            </div>

            {/* Distribution Pie Chart */}
            <div className="mt-4 pt-4 border-t border-slate-100">
              <p className="text-xs font-semibold text-slate-700 mb-1">
                Participación en Conversaciones
              </p>
              <div className="flex items-center justify-between">
                <div className="w-24 h-24">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={senderData}
                        cx="50%"
                        cy="50%"
                        innerRadius={28}
                        outerRadius={42}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {senderData.map((_, index) => (
                          <Cell
                            key={index}
                            fill={PIE_COLORS[index % PIE_COLORS.length]}
                          />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="text-[11px] space-y-1 text-slate-600">
                  {senderData.map((entry, index) => (
                    <div key={index} className="flex items-center gap-1.5">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{
                          backgroundColor:
                            PIE_COLORS[index % PIE_COLORS.length],
                        }}
                      />
                      <span>
                        {entry.name}: <strong>{entry.value}</strong>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* New Appointment Modal */}
      <Dialog open={isNewAptOpen} onOpenChange={setIsNewAptOpen}>
        <DialogContent className="max-w-md bg-white text-slate-900 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2 text-slate-900">
              💅 Agendar Cita en Glam Nails Maturín
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreateAppointment} className="space-y-3 pt-2">
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-slate-700">Nombre de la clienta</Label>
              <Input
                required
                placeholder="Ej. Génesis Rondón"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="h-9 text-xs rounded-xl"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold text-slate-700">Teléfono WhatsApp</Label>
              <div className="relative">
                <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <Input
                  required
                  placeholder="+584121234567"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  className="h-9 text-xs font-mono pl-8 rounded-xl"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold text-slate-700">Servicio deseado</Label>
              <select
                value={serviceId || ""}
                onChange={(e) =>
                  setServiceId(e.target.value ? Number(e.target.value) : undefined)
                }
                className="w-full h-9 rounded-xl border border-slate-300 bg-white px-3 py-1 text-xs focus:ring-rose-500 focus:border-rose-500 shadow-2xs font-medium"
              >
                <option value="">Selecciona un servicio...</option>
                {services?.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} (${s.priceUsd} USD — {s.durationMinutes} min)
                  </option>
                ))}
              </select>

              {/* Live Service Quote Card */}
              {selectedService && (
                <div className="p-2.5 rounded-xl bg-gradient-to-r from-rose-50 via-pink-50/50 to-amber-50/40 border border-rose-200/80 flex items-center justify-between text-xs animate-in fade-in mt-1.5">
                  <div>
                    <p className="font-bold text-rose-900 flex items-center gap-1">
                      <span>💅 {selectedService.name}</span>
                    </p>
                    <p className="text-[10px] text-slate-500">
                      Duración: {selectedService.durationMinutes} min de sesión
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-slate-900">
                      ${selectedService.priceUsd} USD
                    </p>
                    <p className="text-[10px] font-extrabold text-amber-800">
                      ≈ Bs. {(selectedService.priceUsd * (stats?.bcvRate || 70)).toLocaleString("es-VE")}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Date & Time Selectors with Presets */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold text-slate-700">Fecha y Hora</Label>
                <div className="flex gap-1 text-[10px]">
                  <button
                    type="button"
                    onClick={() => setDatePreset(0)}
                    className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 hover:bg-rose-100 font-semibold transition-colors cursor-pointer border border-rose-200/60"
                  >
                    Hoy
                  </button>
                  <button
                    type="button"
                    onClick={() => setDatePreset(1)}
                    className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 hover:bg-slate-200 font-semibold transition-colors cursor-pointer"
                  >
                    Mañana
                  </button>
                  <button
                    type="button"
                    onClick={() => setDatePreset(2)}
                    className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 hover:bg-slate-200 font-semibold transition-colors cursor-pointer"
                  >
                    Pasado
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="date"
                  required
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className="h-9 text-xs rounded-xl"
                />
                <Input
                  type="time"
                  required
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  className="h-9 text-xs rounded-xl"
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold text-slate-700">
                  URL Comprobante Pago Móvil (opcional)
                </Label>
                <button
                  type="button"
                  onClick={() =>
                    setPaymentProofUrl(
                      "https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=500"
                    )
                  }
                  className="text-[10px] text-emerald-700 hover:underline font-semibold cursor-pointer"
                >
                  Comprobante demo
                </button>
              </div>
              <Input
                type="url"
                placeholder="https://..."
                value={paymentProofUrl}
                onChange={(e) => setPaymentProofUrl(e.target.value)}
                className="h-9 text-xs font-mono rounded-xl"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold text-slate-700">Notas / Preferencias de diseño</Label>
              <Input
                placeholder="Largo #3, punta cuadrada o almendra, diseño francés..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="h-9 text-xs rounded-xl"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsNewAptOpen(false)}
                className="rounded-xl"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={createAptMutation.isPending}
                className="bg-gradient-to-r from-rose-600 via-pink-600 to-rose-500 hover:from-rose-500 hover:to-pink-500 text-white font-bold rounded-xl shadow-xs"
              >
                Guardar Cita
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Comprobante de Pago Móvil Modal */}
      <Dialog open={!!viewProofUrl} onOpenChange={(open) => !open && setViewProofUrl(null)}>
        <DialogContent className="max-w-md bg-white text-slate-900 p-5 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold flex items-center gap-2 text-slate-900">
              <Receipt className="w-4 h-4 text-rose-600" />
              <span>Comprobante de Pago Móvil</span>
            </DialogTitle>
          </DialogHeader>
          <div className="mt-3 flex flex-col items-center">
            {viewProofUrl?.match(/\.(jpeg|jpg|gif|png|webp)($|\?)/i) || viewProofUrl?.startsWith("data:image") ? (
              <img
                src={viewProofUrl}
                alt="Comprobante de Pago Móvil"
                className="max-h-96 w-auto object-contain rounded-xl border border-rose-100 shadow-sm"
              />
            ) : (
              <div className="w-full p-4 rounded-xl bg-rose-50/50 border border-rose-100 text-center">
                <p className="text-xs text-slate-600 mb-2 break-all font-mono">
                  {viewProofUrl}
                </p>
                <a
                  href={viewProofUrl || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:underline"
                >
                  Abrir enlace externo
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            )}
          </div>
          <div className="mt-4 flex justify-end">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setViewProofUrl(null)}
              className="text-xs rounded-xl"
            >
              Cerrar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
