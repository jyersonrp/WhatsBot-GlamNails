import { useState } from "react";
import { trpc } from "@/providers/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Calendar as CalendarIcon,
  CheckCircle2,
  Clock,
  Sparkles,
  Phone,
  Plus,
  ExternalLink,
  Receipt,
  Scissors,
  Search,
  MessageSquare,
  AlertCircle,
  RotateCcw,
  Check,
  LayoutList,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router";
import {
  format,
  addDays,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
} from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";

type AppointmentStatusFilter =
  | "todas"
  | "pendiente"
  | "confirmada"
  | "completada"
  | "cancelada";

export default function Appointments() {
  const [activeTab, setActiveTab] = useState<AppointmentStatusFilter>("todas");
  const [isNewDialogOpen, setIsNewDialogOpen] = useState(false);
  const [viewProofUrl, setViewProofUrl] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"lista" | "calendario">("lista");
  const [calendarScope, setCalendarScope] = useState<"mensual" | "semanal">("mensual");
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [currentWeek, setCurrentWeek] = useState<Date>(new Date());
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<Date>(new Date());

  // Form state
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("+58412");
  const [serviceId, setServiceId] = useState<number | undefined>(undefined);
  const [scheduledDate, setScheduledDate] = useState(
    format(new Date(), "yyyy-MM-dd")
  );
  const [scheduledTime, setScheduledTime] = useState("10:00");
  const [statusChoice, setStatusChoice] = useState<"pendiente" | "confirmada">(
    "pendiente"
  );
  const [notes, setNotes] = useState("");
  const [paymentProofUrl, setPaymentProofUrl] = useState("");

  const utils = trpc.useUtils();

  const { data: appointments, isLoading } = trpc.appointment.list.useQuery(
    undefined,
    { refetchInterval: 5000 }
  );

  const { data: stats } = trpc.appointment.stats.useQuery(undefined, {
    refetchInterval: 5000,
  });

  const { data: services } = trpc.service.list.useQuery({ activeOnly: true });

  const createMutation = trpc.appointment.create.useMutation({
    onSuccess: () => {
      toast.success("Cita agendada correctamente.");
      setIsNewDialogOpen(false);
      utils.appointment.list.invalidate();
      utils.appointment.stats.invalidate();
      utils.dashboard.stats.invalidate();
      utils.conversation.list.invalidate();
      utils.message.list.invalidate();
      // Reset form
      setClientName("");
      setClientPhone("+58412");
      setNotes("");
      setPaymentProofUrl("");
      setStatusChoice("pendiente");
    },
    onError: (err) => {
      toast.error(err.message || "Error al crear la cita.");
    },
  });

  const updateStatusMutation = trpc.appointment.updateStatus.useMutation({
    onSuccess: (_, vars) => {
      if (vars.status === "confirmada") {
        toast.success("¡Cita confirmada! Notificación enviada por WhatsApp.");
      } else {
        toast.success(`Cita marcada como ${vars.status}.`);
      }
      utils.appointment.list.invalidate();
      utils.appointment.stats.invalidate();
      utils.dashboard.stats.invalidate();
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

    createMutation.mutate({
      clientName,
      clientPhone,
      serviceId,
      scheduledAt,
      status: statusChoice,
      notes: notes || undefined,
      paymentProofUrl: paymentProofUrl || undefined,
    });
  };

  const setDatePreset = (daysFromToday: number) => {
    const target = addDays(new Date(), daysFromToday);
    setScheduledDate(format(target, "yyyy-MM-dd"));
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmada":
        return (
          <Badge className="bg-emerald-500/15 text-emerald-800 border-emerald-500/30 font-semibold text-[11px] gap-1 px-2 py-0.5">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Confirmada
          </Badge>
        );
      case "pendiente":
        return (
          <Badge className="bg-amber-500/15 text-amber-800 border-amber-500/30 font-semibold text-[11px] gap-1 px-2 py-0.5">
            <Clock className="w-3 h-3 text-amber-600" />
            Pendiente Pago
          </Badge>
        );
      case "completada":
        return (
          <Badge className="bg-blue-500/15 text-blue-800 border-blue-500/30 font-semibold text-[11px] gap-1 px-2 py-0.5">
            <Check className="w-3 h-3 text-blue-600" />
            Completada
          </Badge>
        );
      case "cancelada":
        return (
          <Badge className="bg-rose-500/15 text-rose-800 border-rose-500/30 font-semibold text-[11px] gap-1 px-2 py-0.5">
            <AlertCircle className="w-3 h-3 text-rose-600" />
            Cancelada
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const filteredAppointments = appointments?.filter((apt) => {
    const matchesTab = activeTab === "todas" || apt.status === activeTab;
    if (!matchesTab) return false;
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      apt.clientName.toLowerCase().includes(q) ||
      apt.clientPhone.includes(q) ||
      apt.service?.name.toLowerCase().includes(q) ||
      apt.notes?.toLowerCase().includes(q)
    );
  });

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });
  const weekAppointments = appointments?.filter((apt) => {
    const d = new Date(apt.scheduledAt);
    return d >= weekStart && d <= weekEnd;
  }) || [];

  const selectedDayAppointments = appointments?.filter((apt) =>
    isSameDay(new Date(apt.scheduledAt), selectedCalendarDate)
  ) || [];

  const currentMonthAppointments = appointments?.filter((apt) =>
    isSameMonth(new Date(apt.scheduledAt), currentMonth)
  ) || [];

  const selectedService = services?.find((s) => s.id === serviceId);

  const handleOpenNewWithDate = (date: Date) => {
    setScheduledDate(format(date, "yyyy-MM-dd"));
    setIsNewDialogOpen(true);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200/60 shadow-2xs">
              💅 Salón Boutique Maturín
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2 mt-1">
            Agenda de Citas <Sparkles className="w-5 h-5 text-rose-500" />
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Control de citas del salón, confirmación automática por WhatsApp y verificación de pagos móviles.
          </p>
        </div>

        {/* Dual View Selector & New Appointment Button */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Dual View Toggle */}
          <div className="flex items-center p-1 bg-white border border-rose-200/80 rounded-xl shadow-xs">
            <button
              type="button"
              onClick={() => setViewMode("lista")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
                viewMode === "lista"
                  ? "bg-rose-600 text-white shadow-xs"
                  : "text-slate-600 hover:text-rose-700 hover:bg-rose-50"
              )}
            >
              <LayoutList className="w-3.5 h-3.5" />
              <span>Vista Lista</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("calendario")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
                viewMode === "calendario"
                  ? "bg-rose-600 text-white shadow-xs"
                  : "text-slate-600 hover:text-rose-700 hover:bg-rose-50"
              )}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span>Vista Calendario</span>
            </button>
          </div>

          <Dialog open={isNewDialogOpen} onOpenChange={setIsNewDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-rose-600 via-pink-600 to-rose-500 hover:from-rose-500 hover:to-pink-500 text-white gap-2 font-bold text-xs shadow-md shadow-rose-950/20 border border-rose-400/30">
                <Plus className="w-4 h-4" />
                Agendar Nueva Cita
              </Button>
            </DialogTrigger>

          <DialogContent className="max-w-md bg-white text-slate-900 rounded-2xl border border-rose-100 shadow-xl">
            <DialogHeader className="pb-3 border-b border-rose-100/80">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-rose-500 via-pink-400 to-amber-200 flex items-center justify-center text-slate-950 font-bold shadow-xs">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <DialogTitle className="text-base font-extrabold text-slate-900 tracking-tight">
                    Agendar Cita — Salón Boutique
                  </DialogTitle>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Glam Nails Maturín · Confirmación con anticipo Pago Móvil
                  </p>
                </div>
              </div>
            </DialogHeader>

            <form onSubmit={handleCreateAppointment} className="space-y-3.5 pt-2">
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-slate-700">Nombre de la clienta</Label>
                <Input
                  required
                  placeholder="Ej. Génesis Rondón"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="h-9 text-xs rounded-xl border-slate-200 focus-visible:ring-rose-500"
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
                    className="h-9 text-xs font-mono pl-8 rounded-xl border-slate-200 focus-visible:ring-rose-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">Servicio de Uñas</Label>
                <select
                  value={serviceId || ""}
                  onChange={(e) =>
                    setServiceId(e.target.value ? Number(e.target.value) : undefined)
                  }
                  className="w-full h-9 rounded-xl border border-slate-200 bg-white px-3 py-1 text-xs focus:ring-rose-500 focus:border-rose-500 shadow-2xs font-medium"
                >
                  <option value="">Selecciona un servicio del catálogo...</option>
                  {services?.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} (${s.priceUsd} USD — {s.durationMinutes} min)
                    </option>
                  ))}
                </select>

                {/* Live Service Quote Card */}
                {selectedService && (
                  <div className="p-2.5 rounded-xl bg-gradient-to-r from-rose-50 via-pink-50/50 to-amber-50/40 border border-rose-200/80 flex items-center justify-between text-xs animate-in fade-in">
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
                        ≈ Bs. {(selectedService.priceUsd * 70).toLocaleString("es-VE")}
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
                    className="h-9 text-xs rounded-xl border-slate-200"
                  />
                  <Input
                    type="time"
                    required
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    className="h-9 text-xs rounded-xl border-slate-200"
                  />
                </div>
              </div>

              {/* Initial Status */}
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-slate-700">Estado de la Cita</Label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setStatusChoice("pendiente")}
                    className={`flex-1 py-1.5 text-xs rounded-xl border font-bold transition-all cursor-pointer ${
                      statusChoice === "pendiente"
                        ? "bg-amber-50 border-amber-400 text-amber-900 shadow-2xs"
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    ⏳ Pendiente de Pago
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatusChoice("confirmada")}
                    className={`flex-1 py-1.5 text-xs rounded-xl border font-bold transition-all cursor-pointer ${
                      statusChoice === "confirmada"
                        ? "bg-emerald-50 border-emerald-400 text-emerald-900 shadow-2xs"
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    ✅ Ya Confirmada
                  </button>
                </div>
              </div>

              {/* Payment Proof URL */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold text-slate-700">
                    Comprobante de Pago Móvil (URL)
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
                  className="h-9 text-xs font-mono rounded-xl border-slate-200"
                />
              </div>

              {/* Notes */}
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-slate-700">Notas / Diseño deseado</Label>
                <Input
                  placeholder="Ej. Uñas acrílicas #3, punta almendra, diseño francés..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="h-9 text-xs rounded-xl border-slate-200"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsNewDialogOpen(false)}
                  className="rounded-xl text-xs"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={createMutation.isPending}
                  className="bg-gradient-to-r from-rose-600 via-pink-600 to-rose-500 hover:from-rose-500 hover:to-pink-500 text-white font-bold text-xs rounded-xl shadow-xs"
                >
                  Guardar Cita
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>

      {/* 4 Boutique Summary Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <Card
          onClick={() => setActiveTab("todas")}
          className={cn(
            "border border-rose-100/80 rounded-2xl cursor-pointer transition-all duration-200 bg-white/90 backdrop-blur-xs shadow-xs hover:shadow-md hover:-translate-y-0.5",
            activeTab === "todas"
              ? "ring-2 ring-rose-500/80 shadow-rose-100 bg-gradient-to-br from-white via-rose-50/30 to-pink-50/20"
              : "hover:border-rose-200"
          )}
        >
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500">Total Citas</p>
              <h3 className="text-2xl font-black text-slate-900 mt-0.5">{stats?.total || 0}</h3>
              <p className="text-[10px] text-slate-400 font-medium mt-0.5">En agenda general</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-50 to-pink-100/60 border border-rose-200/60 flex items-center justify-center text-rose-700 shadow-2xs">
              <CalendarIcon className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card
          onClick={() => setActiveTab("pendiente")}
          className={cn(
            "border border-amber-200/80 rounded-2xl cursor-pointer transition-all duration-200 bg-white/90 backdrop-blur-xs shadow-xs hover:shadow-md hover:-translate-y-0.5",
            activeTab === "pendiente"
              ? "ring-2 ring-amber-500 shadow-amber-100 bg-amber-50/30"
              : "hover:border-amber-300"
          )}
        >
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-amber-700">Por Confirmar</p>
              <h3 className="text-2xl font-black text-amber-800 mt-0.5">{stats?.pendientes || 0}</h3>
              <p className="text-[10px] text-amber-600/80 font-medium mt-0.5">Esperan pago móvil</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-100/70 border border-amber-300/60 flex items-center justify-center text-amber-700 shadow-2xs">
              <Clock className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card
          onClick={() => setActiveTab("confirmada")}
          className={cn(
            "border border-emerald-200/80 rounded-2xl cursor-pointer transition-all duration-200 bg-white/90 backdrop-blur-xs shadow-xs hover:shadow-md hover:-translate-y-0.5",
            activeTab === "confirmada"
              ? "ring-2 ring-emerald-500 shadow-emerald-100 bg-emerald-50/30"
              : "hover:border-emerald-300"
          )}
        >
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-emerald-700">Confirmadas</p>
              <h3 className="text-2xl font-black text-emerald-800 mt-0.5">{stats?.confirmadas || 0}</h3>
              <p className="text-[10px] text-emerald-600/80 font-medium mt-0.5">Cupo asegurado</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-100/70 border border-emerald-300/60 flex items-center justify-center text-emerald-700 shadow-2xs">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card
          onClick={() => setActiveTab("completada")}
          className={cn(
            "border border-rose-100/80 rounded-2xl cursor-pointer transition-all duration-200 bg-white/90 backdrop-blur-xs shadow-xs hover:shadow-md hover:-translate-y-0.5",
            activeTab === "completada"
              ? "ring-2 ring-pink-500 shadow-pink-100 bg-pink-50/30"
              : "hover:border-pink-300"
          )}
        >
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-pink-700">Completadas</p>
              <h3 className="text-2xl font-black text-pink-900 mt-0.5">{stats?.completadas || 0}</h3>
              <p className="text-[10px] text-pink-600/80 font-medium mt-0.5">Servicio realizado</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-pink-100/70 border border-pink-300/60 flex items-center justify-center text-pink-700 shadow-2xs">
              <Scissors className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-rose-100 pb-3">
        <div className="flex gap-1.5 overflow-x-auto text-xs font-medium scrollbar-none">
          {[
            { id: "todas", label: "Todas", count: stats?.total || 0 },
            { id: "pendiente", label: "Pendientes", count: stats?.pendientes || 0 },
            { id: "confirmada", label: "Confirmadas", count: stats?.confirmadas || 0 },
            { id: "completada", label: "Completadas", count: stats?.completadas || 0 },
            { id: "cancelada", label: "Canceladas", count: stats?.canceladas || 0 },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as AppointmentStatusFilter)}
              className={cn(
                "px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer text-xs font-semibold",
                activeTab === tab.id
                  ? "bg-gradient-to-r from-rose-600 to-pink-600 text-white shadow-xs"
                  : "bg-white text-slate-600 border border-rose-100 hover:bg-rose-50/70 hover:text-rose-700"
              )}
            >
              <span>{tab.label}</span>
              <span
                className={cn(
                  "text-[10px] px-1.5 py-0.2 rounded-full font-bold",
                  activeTab === tab.id
                    ? "bg-white/20 text-white"
                    : "bg-rose-100/80 text-rose-800"
                )}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search Filter */}
        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-rose-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            placeholder="Buscar por clienta, teléfono o servicio..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9 text-xs pl-8.5 bg-white border-rose-200/80 rounded-xl focus-visible:ring-rose-500 shadow-2xs"
          />
        </div>
      </div>

      {viewMode === "lista" ? (
        /* Appointments List / Cards */
        <Card className="border border-rose-100/80 shadow-xs bg-white rounded-2xl overflow-hidden">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-8 text-center text-sm text-slate-500">
                Cargando agenda de citas...
              </div>
            ) : !filteredAppointments || filteredAppointments.length === 0 ? (
              <div className="p-12 text-center text-slate-400">
                <CalendarIcon className="w-10 h-10 mx-auto mb-2 text-rose-200" />
                <p className="text-sm font-bold text-slate-800">
                  No hay citas en este estado.
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {searchQuery
                    ? "Intenta con otro término de búsqueda."
                    : "Usa el botón 'Agendar Nueva Cita' para registrar una clienta."}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-rose-50/80">
                {filteredAppointments.map((apt) => {
                  const dateObj = new Date(apt.scheduledAt);
                  const formattedDate = dateObj.toLocaleDateString("es-VE", {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                  });
                  const formattedTime = dateObj.toLocaleTimeString("es-VE", {
                    hour: "2-digit",
                    minute: "2-digit",
                  });
                  const waPhone = apt.clientPhone.replace(/[^0-9]/g, "");

                  return (
                    <div
                      key={apt.id}
                      className="p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:bg-rose-50/20 transition-colors"
                    >
                      {/* Left: Date badge & client details */}
                      <div className="flex items-start gap-3.5 min-w-0">
                        {/* Modern Tear-Sheet Calendar Badge */}
                        <div className="w-14 sm:w-16 rounded-xl border border-rose-200 bg-white shadow-2xs overflow-hidden flex flex-col shrink-0 text-center select-none hover:border-rose-300 transition-colors">
                          <div className="bg-gradient-to-r from-rose-600 to-pink-600 text-white text-[10px] font-black uppercase tracking-wider py-0.5 px-1 leading-tight">
                            {dateObj
                              .toLocaleDateString("es-VE", { month: "short" })
                              .replace(/\./g, "")
                              .slice(0, 3)
                              .toUpperCase()}
                          </div>
                          <div className="py-1 px-0.5 flex flex-col items-center justify-center bg-rose-50/40">
                            <span className="text-lg sm:text-xl font-black text-slate-900 leading-none">
                              {dateObj.getDate()}
                            </span>
                            <span className="text-[9px] font-bold text-rose-600 uppercase tracking-tight mt-0.5 leading-none">
                              {dateObj
                                .toLocaleDateString("es-VE", { weekday: "short" })
                                .replace(/\./g, "")
                                .slice(0, 3)
                                .toUpperCase()}
                            </span>
                          </div>
                        </div>

                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-bold text-sm text-slate-900">
                              {apt.clientName}
                            </h4>
                            {getStatusBadge(apt.status)}
                          </div>

                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                            {/* Phone link with WhatsApp */}
                            <a
                              href={`https://wa.me/${waPhone}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 font-mono text-emerald-700 hover:text-emerald-800 hover:underline"
                              title="Abrir chat en WhatsApp"
                            >
                              <Phone className="w-3.5 h-3.5 text-emerald-600" />
                              {apt.clientPhone}
                            </a>

                            <span className="flex items-center gap-1 text-slate-600 font-medium">
                              <Clock className="w-3.5 h-3.5 text-slate-400" />
                              {formattedDate}, {formattedTime}
                            </span>

                            {apt.service && (
                              <span className="font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-100">
                                {apt.service.name} (${apt.service.priceUsd} USD)
                              </span>
                            )}
                          </div>

                          {apt.notes && (
                            <p className="text-xs text-slate-600 italic mt-0.5 bg-slate-50 px-2 py-1 rounded border border-slate-100 inline-block">
                              "{apt.notes}"
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Right: 1-Click Action Buttons */}
                      <div className="flex items-center gap-2 self-end md:self-center shrink-0 flex-wrap">
                        {/* Payment proof preview button */}
                        {apt.paymentProofUrl && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setViewProofUrl(apt.paymentProofUrl)}
                            className="h-8 text-xs border-emerald-300 text-emerald-700 hover:bg-emerald-50 gap-1.5 shadow-xs rounded-xl"
                          >
                            <Receipt className="w-3.5 h-3.5 text-emerald-600" />
                            Ver Pago Móvil
                          </Button>
                        )}

                        {/* 1-Click Status Actions */}
                        {apt.status === "pendiente" && (
                          <Button
                            size="sm"
                            onClick={() =>
                              updateStatusMutation.mutate({
                                id: apt.id,
                                status: "confirmada",
                              })
                            }
                            disabled={updateStatusMutation.isPending}
                            className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold gap-1.5 shadow-xs rounded-xl"
                            title="Confirmar cita y enviar mensaje automático por WhatsApp"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Confirmar y Notificar WhatsApp
                          </Button>
                        )}

                        {apt.status === "confirmada" && (
                          <Button
                            size="sm"
                            onClick={() =>
                              updateStatusMutation.mutate({
                                id: apt.id,
                                status: "completada",
                              })
                            }
                            disabled={updateStatusMutation.isPending}
                            className="h-8 text-xs bg-blue-600 hover:bg-blue-700 text-white font-semibold gap-1 shadow-xs rounded-xl"
                          >
                            <Scissors className="w-3.5 h-3.5" />
                            Marcar Completada
                          </Button>
                        )}

                        {apt.status === "cancelada" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              updateStatusMutation.mutate({
                                id: apt.id,
                                status: "pendiente",
                              })
                            }
                            disabled={updateStatusMutation.isPending}
                            className="h-8 text-xs text-slate-600 hover:text-slate-900 gap-1 rounded-xl"
                          >
                            <RotateCcw className="w-3 h-3" />
                            Reactivar
                          </Button>
                        )}

                        {apt.status !== "cancelada" && apt.status !== "completada" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              if (confirm(`¿Seguro que deseas cancelar la cita de ${apt.clientName}?`)) {
                                updateStatusMutation.mutate({
                                  id: apt.id,
                                  status: "cancelada",
                                });
                              }
                            }}
                            disabled={updateStatusMutation.isPending}
                            className="h-8 text-xs text-rose-600 hover:bg-rose-50 rounded-xl"
                          >
                            Cancelar
                          </Button>
                        )}

                        {/* Go to CRM conversation link */}
                        {apt.conversationId && (
                          <Button
                            asChild
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-slate-400 hover:text-slate-800 rounded-xl"
                            title="Abrir conversación en CRM"
                          >
                            <Link to={`/conversations/${apt.conversationId}`}>
                              <MessageSquare className="w-4 h-4" />
                            </Link>
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        /* Boutique Interactive Calendar View with Scope Switch (Mensual vs Semanal) */
        <div className="space-y-4">
          {/* Calendar Scope Switch Header */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-rose-100/80 shadow-xs">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5 pl-1">
                <Sparkles className="w-3.5 h-3.5 text-rose-500" />
                Modalidad:
              </span>
              <div className="flex items-center p-1 bg-rose-50/70 border border-rose-200/60 rounded-xl">
                <button
                  type="button"
                  onClick={() => setCalendarScope("mensual")}
                  className={cn(
                    "px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5",
                    calendarScope === "mensual"
                      ? "bg-rose-600 text-white shadow-2xs"
                      : "text-slate-600 hover:text-rose-700 hover:bg-rose-100/60"
                  )}
                >
                  <CalendarDays className="w-3.5 h-3.5" />
                  <span>Vista Mensual</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCalendarScope("semanal");
                    setCurrentWeek(selectedCalendarDate);
                  }}
                  className={cn(
                    "px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5",
                    calendarScope === "semanal"
                      ? "bg-rose-600 text-white shadow-2xs"
                      : "text-slate-600 hover:text-rose-700 hover:bg-rose-100/60"
                  )}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Vista Semanal</span>
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs text-slate-500">
              <span className="font-semibold text-rose-800 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200/60 text-[11px]">
                {calendarScope === "mensual"
                  ? `${currentMonthAppointments.length} citas en este mes`
                  : `${weekAppointments.length} citas en esta semana`}
              </span>
            </div>
          </div>

          {calendarScope === "mensual" ? (
            /* Monthly Grid + Agenda Side Panel */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Calendar Matrix Card */}
              <div className="lg:col-span-7 xl:col-span-8 space-y-4">
                <Card className="border border-rose-100/80 rounded-2xl bg-white shadow-xs overflow-hidden">
                  {/* Calendar Navigation Header */}
                  <div className="p-4 sm:p-5 border-b border-rose-100/80 flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r from-rose-50/40 via-white to-pink-50/30">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1 bg-white border border-rose-200/80 rounded-xl p-1 shadow-2xs">
                        <button
                          type="button"
                          onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                          className="p-1.5 rounded-lg text-slate-600 hover:text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Mes anterior"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const today = new Date();
                            setCurrentMonth(today);
                            setSelectedCalendarDate(today);
                          }}
                          className="px-2.5 py-1 rounded-lg text-xs font-bold text-slate-700 hover:text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
                        >
                          Hoy
                        </button>
                        <button
                          type="button"
                          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                          className="p-1.5 rounded-lg text-slate-600 hover:text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Mes siguiente"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>

                      <div>
                        <h2 className="text-base sm:text-lg font-black text-slate-900 capitalize tracking-tight flex items-center gap-2">
                          {format(currentMonth, "MMMM yyyy", { locale: es })}
                        </h2>
                        <p className="text-[11px] text-slate-500">
                          {currentMonthAppointments.length} cita{currentMonthAppointments.length === 1 ? "" : "s"} programada{currentMonthAppointments.length === 1 ? "" : "s"} en este mes
                        </p>
                      </div>
                    </div>

                    {/* Status Indicator Legend */}
                    <div className="flex items-center gap-3 text-[11px] font-medium text-slate-600">
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" /> Confirmada
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-amber-500" /> Pendiente
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-blue-500" /> Completada
                      </span>
                    </div>
                  </div>

                  {/* Days of Week Header */}
                  <div className="grid grid-cols-7 border-b border-rose-100/70 bg-rose-50/20 text-center py-2.5 text-xs font-bold text-slate-600">
                    {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map((d) => (
                      <div key={d} className="py-0.5">
                        {d}
                      </div>
                    ))}
                  </div>

                  {/* Calendar Days Matrix */}
                  <div className="grid grid-cols-7 divide-x divide-y divide-rose-100/50 bg-slate-50/30">
                    {calendarDays.map((day, idx) => {
                      const isCurrent = isSameMonth(day, currentMonth);
                      const isDayToday = isToday(day);
                      const isSelected = isSameDay(day, selectedCalendarDate);
                      const dayApts = appointments?.filter((apt) =>
                        isSameDay(new Date(apt.scheduledAt), day)
                      ) || [];
                      const hasPending = dayApts.some((a) => a.status === "pendiente");
                      const hasConfirmed = dayApts.some((a) => a.status === "confirmada");
                      const hasCompleted = dayApts.some((a) => a.status === "completada");

                      return (
                        <div
                          key={day.toISOString() + idx}
                          onClick={() => setSelectedCalendarDate(day)}
                          className={cn(
                            "min-h-[75px] sm:min-h-[88px] p-2 flex flex-col justify-between transition-all cursor-pointer relative group",
                            !isCurrent && "bg-slate-50/50 opacity-40 hover:opacity-80",
                            isCurrent && "bg-white hover:bg-rose-50/40",
                            isSelected && "ring-2 ring-inset ring-rose-500 bg-rose-50/50",
                            isDayToday && !isSelected && "bg-rose-50/20"
                          )}
                        >
                          {/* Date Number Header */}
                          <div className="flex items-center justify-between">
                            <span
                              className={cn(
                                "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all",
                                isDayToday
                                  ? "bg-rose-600 text-white font-black shadow-2xs"
                                  : isSelected
                                  ? "bg-rose-900 text-white font-bold"
                                  : isCurrent
                                  ? "text-slate-800 group-hover:text-rose-700"
                                  : "text-slate-400"
                              )}
                            >
                              {format(day, "d")}
                            </span>

                            {/* Quick Add on Hover */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenNewWithDate(day);
                              }}
                              className="opacity-0 group-hover:opacity-100 w-5 h-5 rounded-md bg-rose-100 text-rose-700 hover:bg-rose-200 flex items-center justify-center text-xs transition-opacity cursor-pointer"
                              title="Agendar cita en este día"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>

                          {/* Appointments Count & Status Indicators */}
                          <div className="mt-1 space-y-1">
                            {dayApts.length > 0 && (
                              <div
                                className={cn(
                                  "px-1.5 py-0.5 rounded-md text-[10px] font-bold truncate flex items-center justify-between",
                                  hasPending
                                    ? "bg-amber-100 text-amber-900 border border-amber-200"
                                    : "bg-rose-100/90 text-rose-900 border border-rose-200"
                                )}
                              >
                                <span>{dayApts.length} {dayApts.length === 1 ? "cita" : "citas"}</span>
                                <div className="flex gap-0.5 ml-1">
                                  {hasConfirmed && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
                                  {hasPending && <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />}
                                  {hasCompleted && <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              </div>

              {/* Selected Day Agenda Panel */}
              <div className="lg:col-span-5 xl:col-span-4 space-y-4">
                <Card className="border border-rose-100/80 rounded-2xl bg-white shadow-xs overflow-hidden">
                  {/* Header for Selected Day Agenda */}
                  <div className="p-4 border-b border-rose-100/80 bg-gradient-to-r from-rose-50/50 to-pink-50/40 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-1.5 text-rose-700 text-xs font-semibold">
                        <CalendarDays className="w-3.5 h-3.5 text-rose-500" />
                        <span>Agenda del Día</span>
                      </div>
                      <h3 className="text-sm sm:text-base font-black text-slate-900 capitalize mt-0.5">
                        {format(selectedCalendarDate, "EEEE d 'de' MMMM", { locale: es })}
                      </h3>
                    </div>

                    <Button
                      size="sm"
                      onClick={() => handleOpenNewWithDate(selectedCalendarDate)}
                      className="bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-bold text-xs gap-1 shadow-xs h-8 px-2.5 rounded-xl border border-rose-300/30"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Agendar Cita</span>
                    </Button>
                  </div>

                  <CardContent className="p-3.5 space-y-3 max-h-[600px] overflow-y-auto custom-scrollbar">
                    {selectedDayAppointments.length === 0 ? (
                      <div className="py-12 text-center text-slate-400">
                        <CalendarDays className="w-10 h-10 mx-auto text-rose-200 mb-2" />
                        <p className="text-xs font-bold text-slate-700">Sin citas para esta fecha</p>
                        <p className="text-[11px] text-slate-400 mt-1 max-w-[220px] mx-auto">
                          Aprovecha este horario disponible en la agenda del salón.
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenNewWithDate(selectedCalendarDate)}
                          className="mt-3 text-xs border-rose-200 text-rose-700 hover:bg-rose-50 rounded-xl font-semibold gap-1.5"
                        >
                          <Plus className="w-3 h-3" />
                          Agendar para este día
                        </Button>
                      </div>
                    ) : (
                      selectedDayAppointments.map((apt) => {
                        const dateObj = new Date(apt.scheduledAt);
                        const formattedTime = dateObj.toLocaleTimeString("es-VE", {
                          hour: "2-digit",
                          minute: "2-digit",
                        });
                        const waPhone = apt.clientPhone.replace(/[^0-9]/g, "");

                        return (
                          <div
                            key={apt.id}
                            className="p-3.5 rounded-xl border border-rose-100 bg-white hover:border-rose-300/80 transition-all shadow-2xs hover:shadow-xs space-y-2.5"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-extrabold text-slate-900">
                                    {apt.clientName}
                                  </span>
                                  {getStatusBadge(apt.status)}
                                </div>
                                <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                                  <span className="font-bold text-rose-700 flex items-center gap-1">
                                    <Clock className="w-3 h-3 text-rose-500" />
                                    {formattedTime}
                                  </span>
                                  <span>•</span>
                                  <a
                                    href={`https://wa.me/${waPhone}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="font-mono text-emerald-700 hover:underline flex items-center gap-1"
                                  >
                                    <Phone className="w-2.5 h-2.5" />
                                    {apt.clientPhone}
                                  </a>
                                </div>
                              </div>

                              {apt.service && (
                                <div className="text-right shrink-0">
                                  <span className="text-xs font-bold text-slate-900">
                                    ${apt.service.priceUsd}
                                  </span>
                                  <p className="text-[10px] text-slate-400">{apt.service.durationMinutes} min</p>
                                </div>
                              )}
                            </div>

                            {apt.service && (
                              <div className="text-[11px] text-rose-700 bg-rose-50/70 border border-rose-100/80 px-2 py-0.5 rounded-md font-medium inline-block">
                                💅 {apt.service.name}
                              </div>
                            )}

                            {apt.notes && (
                              <p className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100 italic">
                                "{apt.notes}"
                              </p>
                            )}

                            {/* 1-Click Action Buttons for this card */}
                            <div className="flex items-center gap-1.5 pt-1 border-t border-slate-100 flex-wrap">
                              {apt.paymentProofUrl && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setViewProofUrl(apt.paymentProofUrl)}
                                  className="h-7 text-[10px] border-emerald-300 text-emerald-700 hover:bg-emerald-50 gap-1 rounded-lg"
                                >
                                  <Receipt className="w-3 h-3 text-emerald-600" />
                                  Pago
                                </Button>
                              )}

                              {apt.status === "pendiente" && (
                                <Button
                                  size="sm"
                                  onClick={() =>
                                    updateStatusMutation.mutate({
                                      id: apt.id,
                                      status: "confirmada",
                                    })
                                  }
                                  disabled={updateStatusMutation.isPending}
                                  className="h-7 text-[10px] bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-1 rounded-lg shadow-2xs"
                                >
                                  <CheckCircle2 className="w-3 h-3" />
                                  Confirmar WhatsApp
                                </Button>
                              )}

                              {apt.status === "confirmada" && (
                                <Button
                                  size="sm"
                                  onClick={() =>
                                    updateStatusMutation.mutate({
                                      id: apt.id,
                                      status: "completada",
                                    })
                                  }
                                  disabled={updateStatusMutation.isPending}
                                  className="h-7 text-[10px] bg-blue-600 hover:bg-blue-700 text-white font-bold gap-1 rounded-lg shadow-2xs"
                                >
                                  <Scissors className="w-3 h-3" />
                                  Completada
                                </Button>
                              )}

                              {apt.conversationId && (
                                <Button
                                  asChild
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-slate-400 hover:text-slate-700 rounded-lg ml-auto"
                                  title="Ver chat en CRM"
                                >
                                  <Link to={`/conversations/${apt.conversationId}`}>
                                    <MessageSquare className="w-3.5 h-3.5" />
                                  </Link>
                                </Button>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          ) : (
            /* Weekly 7-Day Columns View */
            <div className="space-y-4">
              <Card className="border border-rose-100/80 rounded-2xl bg-white shadow-xs overflow-hidden">
                {/* Weekly Navigation Header */}
                <div className="p-4 sm:p-5 border-b border-rose-100/80 flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r from-rose-50/40 via-white to-pink-50/30">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 bg-white border border-rose-200/80 rounded-xl p-1 shadow-2xs">
                      <button
                        type="button"
                        onClick={() => setCurrentWeek(subWeeks(currentWeek, 1))}
                        className="p-1.5 rounded-lg text-slate-600 hover:text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Semana anterior"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const today = new Date();
                          setCurrentWeek(today);
                          setSelectedCalendarDate(today);
                        }}
                        className="px-2.5 py-1 rounded-lg text-xs font-bold text-slate-700 hover:text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
                      >
                        Esta Semana
                      </button>
                      <button
                        type="button"
                        onClick={() => setCurrentWeek(addWeeks(currentWeek, 1))}
                        className="p-1.5 rounded-lg text-slate-600 hover:text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Semana siguiente"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>

                    <div>
                      <h2 className="text-base sm:text-lg font-black text-slate-900 capitalize tracking-tight flex items-center gap-2">
                        Semana del {format(weekStart, "d 'de' MMMM", { locale: es })} al {format(weekEnd, "d 'de' MMMM yyyy", { locale: es })}
                      </h2>
                      <p className="text-[11px] text-slate-500">
                        {weekAppointments.length} cita{weekAppointments.length === 1 ? "" : "s"} programada{weekAppointments.length === 1 ? "" : "s"} en esta semana
                      </p>
                    </div>
                  </div>

                  {/* Status Indicator Legend */}
                  <div className="flex items-center gap-3 text-[11px] font-medium text-slate-600">
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" /> Confirmada
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-amber-500" /> Pendiente
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-blue-500" /> Completada
                    </span>
                  </div>
                </div>

                {/* 7-column grid of days for the week */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 divide-y lg:divide-y-0 lg:divide-x divide-rose-100/70 bg-slate-50/20">
                  {weekDays.map((day) => {
                    const isDayToday = isToday(day);
                    const dayApts = appointments?.filter((apt) =>
                      isSameDay(new Date(apt.scheduledAt), day)
                    ) || [];

                    return (
                      <div
                        key={day.toISOString()}
                        className={cn(
                          "min-h-[380px] flex flex-col p-3 transition-colors",
                          isDayToday ? "bg-rose-50/30" : "bg-white"
                        )}
                      >
                        {/* Day Header */}
                        <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-rose-100">
                          <div className="flex items-center gap-2">
                            <div
                              className={cn(
                                "w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black",
                                isDayToday
                                  ? "bg-rose-600 text-white shadow-xs"
                                  : "bg-rose-100 text-rose-900"
                              )}
                            >
                              {format(day, "d")}
                            </div>
                            <div>
                              <p className="text-xs font-bold text-slate-900 capitalize">
                                {format(day, "EEEE", { locale: es })}
                              </p>
                              {isDayToday && (
                                <span className="text-[9px] font-extrabold text-rose-600 uppercase tracking-tight">
                                  ¡Hoy!
                                </span>
                              )}
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleOpenNewWithDate(day)}
                            className="w-6 h-6 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 flex items-center justify-center text-xs transition-colors cursor-pointer"
                            title="Agendar cita para este día"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Day's appointments */}
                        <div className="space-y-2 flex-1 overflow-y-auto">
                          {dayApts.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-center p-3 text-slate-400">
                              <p className="text-[11px] font-medium text-slate-400">Sin citas</p>
                              <button
                                type="button"
                                onClick={() => handleOpenNewWithDate(day)}
                                className="mt-1 text-[10px] text-rose-600 hover:underline font-semibold cursor-pointer"
                              >
                                + Agendar
                              </button>
                            </div>
                          ) : (
                            dayApts.map((apt) => {
                              const timeStr = new Date(apt.scheduledAt).toLocaleTimeString("es-VE", {
                                hour: "2-digit",
                                minute: "2-digit",
                              });
                              const waPhone = apt.clientPhone.replace(/[^0-9]/g, "");

                              return (
                                <div
                                  key={apt.id}
                                  className={cn(
                                    "p-2.5 rounded-xl border text-xs space-y-1.5 transition-all shadow-2xs",
                                    apt.status === "confirmada"
                                      ? "bg-emerald-50/40 border-emerald-200/80"
                                      : apt.status === "pendiente"
                                      ? "bg-amber-50/40 border-amber-200/80"
                                      : "bg-white border-rose-100"
                                  )}
                                >
                                  <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-black text-rose-700 bg-white/90 px-1.5 py-0.5 rounded border border-rose-200/60">
                                      {timeStr}
                                    </span>
                                    {getStatusBadge(apt.status)}
                                  </div>

                                  <p className="font-bold text-slate-900 truncate">
                                    {apt.clientName}
                                  </p>

                                  <div className="text-[10px] text-slate-600 truncate">
                                    💅 {apt.service?.name || "Servicio"} (${apt.service?.priceUsd || 0})
                                  </div>

                                  {/* Quick 1-click action */}
                                  <div className="pt-1 flex items-center justify-between border-t border-slate-200/60">
                                    <a
                                      href={`https://wa.me/${waPhone}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-emerald-700 text-[10px] hover:underline flex items-center gap-0.5"
                                    >
                                      <Phone className="w-2.5 h-2.5" />
                                      <span>WhatsApp</span>
                                    </a>

                                    {apt.status === "pendiente" && (
                                      <button
                                        type="button"
                                        onClick={() =>
                                          updateStatusMutation.mutate({
                                            id: apt.id,
                                            status: "confirmada",
                                          })
                                        }
                                        disabled={updateStatusMutation.isPending}
                                        className="text-[10px] bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-1.5 py-0.5 rounded shadow-2xs cursor-pointer"
                                        title="Confirmar cita y enviar WhatsApp"
                                      >
                                        Confirmar
                                      </button>
                                    )}

                                    {apt.status === "confirmada" && (
                                      <button
                                        type="button"
                                        onClick={() =>
                                          updateStatusMutation.mutate({
                                            id: apt.id,
                                            status: "completada",
                                          })
                                        }
                                        disabled={updateStatusMutation.isPending}
                                        className="text-[10px] bg-blue-600 hover:bg-blue-700 text-white font-bold px-1.5 py-0.5 rounded shadow-2xs cursor-pointer"
                                        title="Marcar como realizada"
                                      >
                                        Completada
                                      </button>
                                    )}
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </div>
          )}
        </div>
      )}

      {/* Payment Proof Modal View */}
      {viewProofUrl && (
        <Dialog open={!!viewProofUrl} onOpenChange={() => setViewProofUrl(null)}>
          <DialogContent className="max-w-md bg-white p-4">
            <DialogHeader>
              <DialogTitle className="text-sm font-bold flex items-center justify-between text-slate-900">
                <span className="flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-emerald-600" />
                  Comprobante de Pago Móvil
                </span>
              </DialogTitle>
            </DialogHeader>

            <div className="mt-2 rounded-lg overflow-hidden border border-slate-200 bg-slate-50 flex items-center justify-center">
              <img
                src={viewProofUrl}
                alt="Comprobante de Pago"
                className="w-full max-h-96 object-contain"
              />
            </div>

            <div className="mt-3 flex items-center justify-between">
              <a
                href={viewProofUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-rose-600 hover:underline flex items-center gap-1 font-medium"
              >
                Abrir en nueva pestaña <ExternalLink className="w-3 h-3" />
              </a>
              <Button size="sm" onClick={() => setViewProofUrl(null)}>
                Cerrar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
