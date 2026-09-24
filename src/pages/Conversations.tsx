import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router";
import { trpc } from "@/providers/trpc";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Send,
  Archive,
  User,
  Headset,
  Phone,
  Search,
  Loader2,
  MessageSquare,
  VolumeX,
  Volume2,
  Image as ImageIcon,
  Check,
  CheckCheck,
  Zap,
  Sparkles,
  ExternalLink,
  ChevronDown,
  ChevronLeft,
  ArrowDown,
  CalendarDays,
  CheckCircle2,
  Clock,
  UserCheck,
  Plus,
  X,
  Receipt,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow, format } from "date-fns";
import { es } from "date-fns/locale";

interface QuickTemplatePreset {
  title: string;
  shortLabel: string;
  content: string;
}

const DEFAULT_QUICK_TEMPLATES: QuickTemplatePreset[] = [
  {
    title: "Precios y Catálogo",
    shortLabel: "💅 Precios",
    content:
      "¡Hola bella! 💅 Aquí tienes nuestros servicios y precios:\n• Sistemas Acrílicos: $25\n• Baño de Acrílico / Kapping: $18\n• Semipermanente: $12\n• Pedicura Spa: $15\n\n¿Para qué día te gustaría agendar tu cita?",
  },
  {
    title: "Datos de Pago Móvil",
    shortLabel: "💳 Pago Móvil",
    content:
      "¡Perfecto! Para apartar tu cita con el 50% de anticipo:\n🏦 *Banco de Venezuela* (0102)\n📱 *0412-1234567*\n🆔 *V-24.567.890*\n\nAl transferir, por favor envíanos la captura por aquí para confirmar tu cupo 💅.",
  },
  {
    title: "Ubicación del Salón",
    shortLabel: "📍 Ubicación",
    content:
      "💅 Estamos ubicadas en:\n*Av. Bicentenario, C.C. Plaza Girasol, local 12, Maturín*.\nFrente a la plaza, con fácil acceso y estacionamiento.",
  },
  {
    title: "Horario de Atención",
    shortLabel: "🕒 Horario",
    content:
      "Nuestro horario de atención es de *martes a sábado de 9:00 am a 5:00 pm* (previa cita).",
  },
  {
    title: "Confirmación de Cita",
    shortLabel: "✅ Confirmación",
    content:
      "✅ ¡Tu cita ha quedado confirmada con éxito en Glam Nails Maturín! 💅 Te esperamos con puntualidad. Si requieres retirar sistema anterior, avísanos con tiempo.",
  },
];

export default function Conversations() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const [selectedId, setSelectedId] = useState<number | null>(
    id ? parseInt(id) : null
  );
  const [messageInput, setMessageInput] = useState("");
  const [mediaUrlInput, setMediaUrlInput] = useState("");
  const [showMediaInput, setShowMediaInput] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "unread" | "muted">("all");
  const [zoomImageUrl, setZoomImageUrl] = useState<string | null>(null);
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isNearBottomRef = useRef(true);
  const [showScrollBottomBtn, setShowScrollBottomBtn] = useState(false);
  const prevSelectedIdRef = useRef<number | null>(null);
  const prevMessageCountRef = useRef(0);

  const utils = trpc.useUtils();

  // Auto-refresh conversations every 3s
  const { data: conversations, isLoading: convLoading } =
    trpc.conversation.list.useQuery(
      { status: "active" },
      { refetchInterval: 3000 }
    );

  // Auto-refresh messages every 3s for real-time customer/bot sync
  const { data: chatMessages, isLoading: msgLoading } =
    trpc.message.list.useQuery(
      { conversationId: selectedId || 0 },
      { enabled: !!selectedId, refetchInterval: 3000 }
    );

  const { data: activeConversation } =
    trpc.conversation.byId.useQuery(
      { id: selectedId || 0 },
      { enabled: !!selectedId, refetchInterval: 3000 }
    );

  const { data: dbTemplates } = trpc.template.list.useQuery();

  // Ficha de la Clienta state & queries
  const [showClientProfile, setShowClientProfile] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [scheduleDate, setScheduleDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [scheduleTime, setScheduleTime] = useState("10:00");
  const [scheduleServiceId, setScheduleServiceId] = useState<number | undefined>(undefined);
  const [scheduleNotes, setScheduleNotes] = useState("");

  const { data: clientAppointments, isLoading: clientAptsLoading } =
    trpc.appointment.list.useQuery(
      { clientPhone: activeConversation?.phoneNumber },
      {
        enabled: !!activeConversation?.phoneNumber,
        refetchInterval: 4000,
      }
    );

  const { data: services } = trpc.service.list.useQuery({ activeOnly: true });

  const createAppointmentMutation = trpc.appointment.create.useMutation({
    onSuccess: () => {
      toast.success(
        `¡Cita agendada para ${activeConversation?.contactName || "la clienta"}!`
      );
      setIsScheduleModalOpen(false);
      utils.appointment.list.invalidate();
      utils.appointment.stats.invalidate();
      utils.dashboard.stats.invalidate();
      utils.conversation.list.invalidate();
      setScheduleNotes("");
    },
    onError: (err) => {
      toast.error(err.message || "Error al agendar cita");
    },
  });

  const updateAppointmentStatus = trpc.appointment.updateStatus.useMutation({
    onSuccess: (_, vars) => {
      if (vars.status === "confirmada") {
        toast.success("¡Cita confirmada y notificada por WhatsApp!");
      } else {
        toast.success(`Cita marcada como ${vars.status}`);
      }
      utils.appointment.list.invalidate();
      utils.appointment.stats.invalidate();
      utils.dashboard.stats.invalidate();
    },
    onError: (err) => {
      toast.error(err.message || "Error al actualizar estado");
    },
  });

  const getAppointmentStatusBadge = (status: string) => {
    switch (status) {
      case "confirmada":
        return (
          <Badge className="bg-emerald-500/15 text-emerald-800 border-emerald-500/30 font-semibold text-[10px] gap-1 px-1.5 py-0.5">
            <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
            Confirmada
          </Badge>
        );
      case "pendiente":
        return (
          <Badge className="bg-amber-500/15 text-amber-800 border-amber-500/30 font-semibold text-[10px] gap-1 px-1.5 py-0.5">
            <Clock className="w-2.5 h-2.5 text-amber-600" />
            Pendiente
          </Badge>
        );
      case "completada":
        return (
          <Badge className="bg-blue-500/15 text-blue-800 border-blue-500/30 font-semibold text-[10px] gap-1 px-1.5 py-0.5">
            <Check className="w-2.5 h-2.5 text-blue-600" />
            Completada
          </Badge>
        );
      case "cancelada":
        return (
          <Badge className="bg-rose-500/15 text-rose-800 border-rose-500/30 font-semibold text-[10px] gap-1 px-1.5 py-0.5">
            Cancelada
          </Badge>
        );
      default:
        return <Badge variant="outline" className="text-[10px]">{status}</Badge>;
    }
  };

  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior,
      });
      isNearBottomRef.current = true;
      setShowScrollBottomBtn(false);
    } else {
      messagesEndRef.current?.scrollIntoView({ behavior });
    }
  };

  const handleChatScroll = () => {
    const el = chatContainerRef.current;
    if (!el) return;
    const distanceToBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    // Considered near bottom if within 100px
    const atBottom = distanceToBottom < 100;
    isNearBottomRef.current = atBottom;
    setShowScrollBottomBtn(!atBottom);
  };

  const sendMessage = trpc.message.create.useMutation({
    onSuccess: () => {
      utils.message.list.invalidate({ conversationId: selectedId || 0 });
      utils.conversation.list.invalidate();
      utils.conversation.recent.invalidate();
      utils.dashboard.stats.invalidate();
      setMessageInput("");
      setMediaUrlInput("");
      setShowMediaInput(false);
      isNearBottomRef.current = true;
      setTimeout(() => scrollToBottom("smooth"), 60);
    },
    onError: (err) => {
      toast.error(err.message || "Error al enviar mensaje");
    },
  });

  const toggleMuteMutation = trpc.conversation.toggleBotMuted.useMutation({
    onSuccess: (data) => {
      utils.conversation.byId.invalidate({ id: selectedId || 0 });
      utils.conversation.list.invalidate();
      if (data?.isBotMuted) {
        toast.info("Bot silenciado: Atención manual activa para esta clienta.");
      } else {
        toast.success("Bot reactivado: Responderá automáticamente.");
      }
    },
  });

  const archiveConv = trpc.conversation.archive.useMutation({
    onSuccess: () => {
      utils.conversation.list.invalidate();
      setSelectedId(null);
      setShowClientProfile(false);
      navigate("/conversations");
      toast.success("Conversación archivada");
    },
  });

  const resetUnread = trpc.conversation.resetUnread.useMutation({
    onSuccess: () => {
      utils.conversation.list.invalidate();
    },
  });

  // Immediate scroll to bottom on conversation switch
  useEffect(() => {
    if (selectedId && selectedId !== prevSelectedIdRef.current) {
      prevSelectedIdRef.current = selectedId;
      isNearBottomRef.current = true;
      setShowScrollBottomBtn(false);
      setShowClientProfile(false);
      prevMessageCountRef.current = 0;
      setTimeout(() => {
        if (chatContainerRef.current) {
          chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
      }, 50);
    }
  }, [selectedId]);

  // Smart auto-scroll on new messages:
  // Only auto-scrolls to bottom if the user is already at the bottom.
  // If the user scrolled up to read older messages, background polling will NOT jerk them back down!
  useEffect(() => {
    const currentCount = chatMessages?.length || 0;
    const hadNewMessage = currentCount > prevMessageCountRef.current;
    prevMessageCountRef.current = currentCount;

    if (isNearBottomRef.current) {
      scrollToBottom(hadNewMessage ? "smooth" : "auto");
    }
  }, [chatMessages]);

  // Sync selectedId with route param :id
  useEffect(() => {
    if (id) {
      const parsed = parseInt(id, 10);
      if (!isNaN(parsed) && parsed !== selectedId) {
        setSelectedId(parsed);
      }
    }
  }, [id, selectedId]);

  // Auto-select first active conversation on desktop if none selected
  useEffect(() => {
    if (!id && selectedId === null && conversations && conversations.length > 0) {
      if (typeof window !== "undefined" && window.innerWidth >= 768) {
        const first = conversations[0].id;
        setSelectedId(first);
        navigate(`/conversations/${first}`, { replace: true });
      }
    }
  }, [id, selectedId, conversations, navigate]);

  // Reset unread when selecting conversation
  const resetUnreadMutate = resetUnread.mutate;
  useEffect(() => {
    if (selectedId) {
      resetUnreadMutate({ id: selectedId });
    }
  }, [selectedId, resetUnreadMutate]);

  // Update URL when selecting
  const handleSelectConversation = (convId: number) => {
    setSelectedId(convId);
    setShowClientProfile(false);
    navigate(`/conversations/${convId}`);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if ((!messageInput.trim() && !mediaUrlInput.trim()) || !selectedId) return;

    sendMessage.mutate({
      conversationId: selectedId,
      content: messageInput.trim() || (mediaUrlInput ? "📷 Imagen adjunta" : ""),
      sender: "agent",
      messageType: mediaUrlInput ? "image" : "text",
      mediaUrl: mediaUrlInput.trim() || undefined,
    });

    inputRef.current?.focus();
  };

  const handleApplyTemplate = (content: string, sendImmediately = false) => {
    if (sendImmediately && selectedId) {
      sendMessage.mutate({
        conversationId: selectedId,
        content,
        sender: "agent",
        messageType: "text",
      });
      setShowTemplatePicker(false);
    } else {
      setMessageInput(content);
      setShowTemplatePicker(false);
      inputRef.current?.focus();
    }
  };

  const filteredConversations = conversations?.filter((conv) => {
    // Search query filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        conv.contactName?.toLowerCase().includes(query) ||
        conv.phoneNumber.includes(query) ||
        conv.lastMessage?.toLowerCase().includes(query);
      if (!matchesSearch) return false;
    }

    // Type filter
    if (filterType === "unread") return conv.unreadCount > 0;
    if (filterType === "muted") return conv.isBotMuted;

    return true;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "read":
        return (
          <span title="Leído">
            <CheckCheck className="w-3.5 h-3.5 text-cyan-500" />
          </span>
        );
      case "delivered":
        return (
          <span title="Entregado">
            <CheckCheck className="w-3.5 h-3.5 text-slate-400" />
          </span>
        );
      case "sent":
      default:
        return (
          <span title="Enviado">
            <Check className="w-3 h-3 text-slate-400" />
          </span>
        );
    }
  };

  const formatWhatsAppMessage = (text: string) => {
    const parts = text.split(/(\*[^*]+\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith("*") && part.endsWith("*") && part.length > 2) {
        return (
          <strong key={i} className="font-semibold text-slate-900">
            {part.slice(1, -1)}
          </strong>
        );
      }
      return part;
    });
  };

  const renderClientProfileContent = () => (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Profile Header */}
      <div className="p-4 border-b border-rose-100 bg-gradient-to-r from-rose-50/60 to-pink-50/40 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-rose-100 to-pink-100 border border-rose-200/80 flex items-center justify-center text-rose-700 shadow-2xs">
            <UserCheck className="w-4 h-4" />
          </div>
          <div>
            <DialogTitle className="font-extrabold text-sm text-slate-900 leading-tight">Ficha de la Clienta</DialogTitle>
            <p className="text-[10px] text-slate-500">Historial CRM y citas del salón</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowClientProfile(false)}
          className="h-7 w-7 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Client Overview Card */}
      <div className="p-4 text-center border-b border-rose-100/70 bg-white shrink-0">
        <div className="relative inline-block mx-auto">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-rose-500 via-pink-600 to-rose-600 flex items-center justify-center text-white text-xl font-black shadow-md shadow-rose-200">
            {activeConversation?.contactName?.charAt(0) || "?"}
          </div>
          {activeConversation?.isBotMuted && (
            <span
              className="absolute -bottom-0.5 -right-0.5 w-4.5 h-4.5 rounded-full bg-amber-500 text-white flex items-center justify-center border-2 border-white shadow-2xs"
              title="Atención manual activa"
            >
              <VolumeX className="w-2.5 h-2.5" />
            </span>
          )}
        </div>

        <h4 className="font-black text-slate-900 text-base mt-2">
          {activeConversation?.contactName || "Clienta WhatsApp"}
        </h4>
        <div className="flex items-center justify-center gap-1.5 mt-0.5">
          <Phone className="w-3 h-3 text-slate-400" />
          <span className="text-xs font-mono text-slate-600 font-medium">
            {activeConversation?.phoneNumber}
          </span>
        </div>

        <div className="flex items-center justify-center gap-2 mt-2.5 flex-wrap">
          {(clientAppointments?.length || 0) >= 2 ? (
            <Badge className="bg-gradient-to-r from-amber-500 to-rose-500 text-white border-0 font-bold text-[10px] gap-1 px-2.5 py-0.5 shadow-2xs">
              <Sparkles className="w-3 h-3" />
              Clienta VIP Frecuente
            </Badge>
          ) : (
            <Badge className="bg-rose-50 text-rose-700 border-rose-200/80 font-bold text-[10px] px-2.5 py-0.5">
              💅 Nueva Clienta
            </Badge>
          )}

          {activeConversation?.isBotMuted ? (
            <Badge className="bg-amber-100 text-amber-900 border-amber-300 font-semibold text-[10px] gap-1 px-2 py-0.5">
              <VolumeX className="w-2.5 h-2.5 text-amber-600" />
              Manual
            </Badge>
          ) : (
            <Badge className="bg-emerald-100 text-emerald-900 border-emerald-300 font-semibold text-[10px] gap-1 px-2 py-0.5">
              <Volume2 className="w-2.5 h-2.5 text-emerald-600" />
              Bot Activo
            </Badge>
          )}
        </div>

        {/* 3 Quick Metrics */}
        <div className="grid grid-cols-3 gap-2 mt-3.5 text-center">
          <div className="p-2 rounded-xl bg-rose-50/50 border border-rose-100/70">
            <p className="text-[10px] font-semibold text-slate-500">Citas</p>
            <p className="text-sm font-black text-rose-700">{clientAppointments?.length || 0}</p>
          </div>
          <div className="p-2 rounded-xl bg-emerald-50/50 border border-emerald-100/70">
            <p className="text-[10px] font-semibold text-slate-500">Efectivas</p>
            <p className="text-sm font-black text-emerald-700">
              {clientAppointments?.filter((a) => a.status === "confirmada" || a.status === "completada").length || 0}
            </p>
          </div>
          <div className="p-2 rounded-xl bg-pink-50/50 border border-pink-100/70">
            <p className="text-[10px] font-semibold text-slate-500">Inversión</p>
            <p className="text-sm font-black text-pink-700">
              ${clientAppointments?.reduce((sum, a) => sum + (a.service?.priceUsd || 0), 0) || 0}
            </p>
          </div>
        </div>

        <Button
          size="sm"
          onClick={() => setIsScheduleModalOpen(true)}
          className="w-full mt-3 bg-gradient-to-r from-rose-600 via-pink-600 to-rose-500 hover:from-rose-500 hover:to-pink-500 text-white font-bold text-xs gap-1.5 shadow-xs rounded-xl cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          Agendar Cita para esta Clienta
        </Button>
      </div>

      {/* Appointment History List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
        <div className="flex items-center justify-between">
          <h5 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-rose-500" />
            Historial de Citas
          </h5>
          <span className="text-[10px] text-slate-400 font-semibold">
            {clientAppointments?.length || 0} registradas
          </span>
        </div>

        {clientAptsLoading ? (
          <div className="py-8 text-center text-xs text-slate-400">
            <Loader2 className="w-4 h-4 animate-spin mx-auto text-rose-400 mb-1" />
            Cargando historial...
          </div>
        ) : !clientAppointments || clientAppointments.length === 0 ? (
          <div className="py-8 text-center text-slate-400">
            <CalendarDays className="w-8 h-8 mx-auto text-rose-200 mb-1" />
            <p className="text-xs font-bold text-slate-700">Sin citas previas</p>
            <p className="text-[10px] text-slate-400 mt-0.5">
              Esta clienta aún no tiene citas agendadas.
            </p>
          </div>
        ) : (
          clientAppointments.map((apt) => (
            <div
              key={apt.id}
              className="p-3 rounded-xl border border-rose-100 bg-white hover:border-rose-200 shadow-2xs space-y-2 transition-all"
            >
              <div className="flex items-start justify-between gap-1">
                <div>
                  <p className="text-xs font-bold text-slate-900">
                    {apt.service?.name || "Servicio General"}
                  </p>
                  <p className="text-[10px] text-slate-500 font-medium">
                    {new Date(apt.scheduledAt).toLocaleDateString("es-VE", {
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                    })} • {new Date(apt.scheduledAt).toLocaleTimeString("es-VE", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                {getAppointmentStatusBadge(apt.status)}
              </div>

              {apt.service && (
                <div className="flex items-center justify-between text-[11px] text-slate-600 bg-rose-50/40 px-2 py-0.5 rounded-lg border border-rose-100/60 font-medium">
                  <span>Precio: ${apt.service.priceUsd} USD</span>
                  <span>{apt.service.durationMinutes} min</span>
                </div>
              )}

              {apt.notes && (
                <p className="text-[10px] text-slate-600 bg-slate-50 p-1.5 rounded-lg border border-slate-100 italic">
                  "{apt.notes}"
                </p>
              )}

              {apt.paymentProofUrl && (
                <button
                  type="button"
                  onClick={() => setZoomImageUrl(apt.paymentProofUrl)}
                  className="text-[10px] text-emerald-700 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                >
                  <Receipt className="w-3 h-3 text-emerald-600" />
                  Ver Comprobante de Pago
                </button>
              )}

              {apt.status === "pendiente" && (
                <Button
                  size="sm"
                  onClick={() =>
                    updateAppointmentStatus.mutate({
                      id: apt.id,
                      status: "confirmada",
                    })
                  }
                  disabled={updateAppointmentStatus.isPending}
                  className="w-full h-7 text-[10px] bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-1 rounded-lg shadow-2xs cursor-pointer"
                >
                  <CheckCircle2 className="w-3 h-3" />
                  Confirmar Cita Ahora
                </Button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );

  return (
    <div className="flex-1 h-full min-h-0 flex gap-4 max-w-7xl mx-auto w-full overflow-hidden">
      {/* Sidebar: Conversations List */}
      <Card
        className={cn(
          "w-full md:w-80 lg:w-[350px] h-full flex flex-col overflow-hidden shrink-0 border-slate-200 shadow-xs bg-white p-0 py-0 gap-0",
          selectedId ? "hidden md:flex" : "flex"
        )}
      >
        {/* Header & Search */}
        <div className="p-3 border-b border-[#E2E8F0] space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4 text-rose-500" />
              Chats WhatsApp
            </h2>
            <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
              {conversations?.length || 0} activos
            </span>
          </div>

          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Buscar por nombre o teléfono..."
              className="pl-9 h-8 text-xs bg-slate-50 border-slate-200 focus-visible:ring-rose-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Quick Filters */}
          <div className="flex gap-1 pt-1 text-[11px] font-medium">
            <button
              onClick={() => setFilterType("all")}
              className={`px-2.5 py-1 rounded-full transition-colors ${
                filterType === "all"
                  ? "bg-slate-900 text-white font-semibold"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setFilterType("unread")}
              className={`px-2.5 py-1 rounded-full transition-colors flex items-center gap-1 ${
                filterType === "unread"
                  ? "bg-rose-600 text-white font-semibold"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              No leídos
              {conversations?.some((c) => c.unreadCount > 0) && (
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
              )}
            </button>
            <button
              onClick={() => setFilterType("muted")}
              className={`px-2.5 py-1 rounded-full transition-colors flex items-center gap-1 ${
                filterType === "muted"
                  ? "bg-amber-600 text-white font-semibold"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Manual / Mudo
            </button>
          </div>
        </div>

        {/* Conversations Scroll Area */}
        <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
          {convLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
            </div>
          ) : (
            <div className="divide-y divide-[#E2E8F0]">
              {filteredConversations?.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => handleSelectConversation(conv.id)}
                  className={cn(
                    "w-full flex items-start gap-3 p-3 text-left transition-colors hover:bg-slate-50 relative",
                    selectedId === conv.id
                      ? "bg-rose-50/80 hover:bg-rose-50 border-l-4 border-rose-500"
                      : conv.unreadCount > 0
                      ? "bg-slate-50/90"
                      : ""
                  )}
                >
                  <div className="relative shrink-0">
                    <div className="w-11 h-11 rounded-full bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center text-white font-bold text-sm shadow-xs">
                      {conv.contactName?.charAt(0) || "?"}
                    </div>
                    {conv.isBotMuted && (
                      <span
                        className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-amber-500 text-white flex items-center justify-center border-2 border-white shadow-xs"
                        title="Atención humana activa (Bot silenciado)"
                      >
                        <VolumeX className="w-2.5 h-2.5" />
                      </span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p
                        className={cn(
                          "text-xs truncate",
                          conv.unreadCount > 0
                            ? "font-extrabold text-slate-900"
                            : "font-semibold text-slate-800"
                        )}
                      >
                        {conv.contactName || conv.phoneNumber}
                      </p>
                      <span className="text-[10px] text-slate-400 shrink-0">
                        {conv.lastMessageAt
                          ? formatDistanceToNow(new Date(conv.lastMessageAt), {
                              addSuffix: false,
                              locale: es,
                            })
                          : ""}
                      </span>
                    </div>

                    <div className="flex items-center justify-between mt-1">
                      <p
                        className={cn(
                          "text-[11px] truncate max-w-[180px]",
                          conv.unreadCount > 0
                            ? "text-slate-800 font-medium"
                            : "text-slate-500"
                        )}
                      >
                        {conv.lastMessage || "Sin mensajes aún"}
                      </p>

                      {conv.unreadCount > 0 && (
                        <span className="w-5 h-5 bg-rose-600 text-white text-[10px] font-black rounded-full flex items-center justify-center shrink-0 shadow-xs">
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))}

              {filteredConversations?.length === 0 && (
                <div className="p-8 text-center text-slate-400">
                  <MessageSquare className="w-8 h-8 mx-auto text-slate-300 mb-1" />
                  <p className="text-xs font-medium">No se encontraron conversaciones.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </Card>

      {/* Main Chat Area */}
      <Card
        className={cn(
          "flex-1 min-w-0 h-full flex flex-col overflow-hidden border border-rose-100/80 shadow-xs bg-white relative rounded-2xl p-0 py-0 gap-0",
          !selectedId ? "hidden md:flex" : "flex"
        )}
      >
        {selectedId && activeConversation ? (
          <>
            {/* WhatsApp Web Chat Header */}
            <div className="h-16 min-h-[4rem] border-b border-rose-100 flex items-center justify-between px-4 shrink-0 bg-gradient-to-r from-rose-50/40 via-white to-pink-50/30">
              <div className="flex items-center gap-3">
                {/* Mobile Back Button to list */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setSelectedId(null);
                    navigate("/conversations");
                  }}
                  className="md:hidden -ml-1 text-slate-700 hover:text-slate-900 h-8 w-8 shrink-0 rounded-xl"
                  title="Volver a la lista de chats"
                >
                  <ChevronLeft className="w-5 h-5" />
                </Button>

                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center text-white font-bold text-sm shadow-xs shrink-0">
                  {activeConversation.contactName?.charAt(0) || "?"}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-slate-900 leading-tight">
                      {activeConversation.contactName || activeConversation.phoneNumber}
                    </p>
                    {activeConversation.isBotMuted ? (
                      <Badge className="bg-amber-100 text-amber-800 border-amber-300 text-[10px] gap-1 px-2 py-0.5 font-semibold">
                        <VolumeX className="w-3 h-3 text-amber-600" />
                        Atención Manual
                      </Badge>
                    ) : (
                      <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 text-[10px] gap-1 px-2 py-0.5 font-semibold">
                        <Volume2 className="w-3 h-3 text-emerald-600" />
                        Bot Activo
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                    <span className="flex items-center gap-1 font-mono">
                      <Phone className="w-3 h-3 text-slate-400" />
                      {activeConversation.phoneNumber}
                    </span>
                    <a
                      href={`https://wa.me/${activeConversation.phoneNumber.replace(/[^0-9]/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-700 hover:text-emerald-800 hover:underline flex items-center gap-0.5 font-medium"
                    >
                      Abrir en WhatsApp <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  </div>
                </div>
              </div>

              {/* Header Actions: Ficha Clienta + Bot Mute Toggle + Archive */}
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowClientProfile(!showClientProfile)}
                  className={cn(
                    "text-xs font-bold gap-1.5 shadow-2xs transition-all rounded-xl cursor-pointer",
                    showClientProfile
                      ? "bg-gradient-to-r from-rose-600 to-pink-600 text-white border-transparent shadow-xs"
                      : "border-rose-200/80 text-rose-800 bg-rose-50/50 hover:bg-rose-100/70"
                  )}
                  title="Ver ficha e historial de citas de la clienta"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Ficha Clienta</span>
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    toggleMuteMutation.mutate({
                      id: activeConversation.id,
                      isBotMuted: !activeConversation.isBotMuted,
                    })
                  }
                  className={cn(
                    "text-xs font-semibold gap-1.5 shadow-xs transition-colors rounded-xl",
                    activeConversation.isBotMuted
                      ? "border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                      : "border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100"
                  )}
                >
                  {activeConversation.isBotMuted ? (
                    <>
                      <Volume2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="hidden sm:inline">Reactivar Bot</span>
                    </>
                  ) : (
                    <>
                      <VolumeX className="w-3.5 h-3.5 text-amber-600" />
                      <span className="hidden sm:inline">Silenciar Bot</span>
                    </>
                  )}
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs font-semibold gap-1.5 shadow-2xs transition-colors rounded-xl border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 cursor-pointer"
                  onClick={() => archiveConv.mutate({ id: selectedId })}
                  title="Archivar conversación"
                >
                  <Archive className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Archivar</span>
                </Button>
              </div>
            </div>

            {/* Warning Banner if Bot is Muted */}
            {activeConversation.isBotMuted && (
              <div className="bg-amber-50 border-b border-amber-200 px-4 py-1.5 text-xs text-amber-800 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <VolumeX className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <strong>Atención manual activa:</strong> El bot no responderá a esta clienta. La recepcionista debe responder.
                </span>
                <button
                  onClick={() =>
                    toggleMuteMutation.mutate({
                      id: activeConversation.id,
                      isBotMuted: false,
                    })
                  }
                  className="text-xs font-bold text-amber-900 underline hover:text-amber-700 ml-2 cursor-pointer"
                >
                  Reactivar Bot Ahora
                </button>
              </div>
            )}

            {/* Messages Scroll Area with Native Visible Scrollbar & Smart Polling Auto-Scroll */}
            <div
              ref={chatContainerRef}
              onScroll={handleChatScroll}
              className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-4 pt-6 pb-6 whatsapp-chat-pattern custom-scrollbar relative"
              style={{ scrollbarGutter: "stable" }}
            >
              {msgLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
                </div>
              ) : (
                <div className="space-y-3 max-w-3xl mx-auto">
                  {chatMessages?.map((msg) => {
                    const isCust = msg.sender === "customer";
                    const isBot = msg.sender === "bot";
                    const isAgent = msg.sender === "agent";

                    return (
                      <div
                        key={msg.id}
                        className={cn(
                          "flex",
                          isCust ? "justify-start" : "justify-end"
                        )}
                      >
                        <div
                          className={cn(
                            "max-w-[78%] rounded-2xl px-3.5 py-2.5 text-xs shadow-2xs relative",
                            isCust
                              ? "bg-white text-slate-900 rounded-tl-none border border-rose-100/90"
                              : isBot
                              ? "bg-[#FFF1F2] border border-rose-200/90 text-slate-900 rounded-tr-none"
                              : "bg-[#DCF8C6] text-slate-900 rounded-tr-none border border-emerald-300/70"
                          )}
                        >
                          {/* Sender Identity Tag */}
                          <div className="flex items-center gap-1.5 mb-1.5">
                            {isCust && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                                <User className="w-3 h-3" />
                                {activeConversation.contactName || "Clienta"}
                              </span>
                            )}
                            {isBot && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200/70">
                                <Sparkles className="w-2.5 h-2.5 text-rose-500" />
                                Bot Sofía 💅 (Automático)
                              </span>
                            )}
                            {isAgent && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100/90 text-emerald-900 border border-emerald-200">
                                <Headset className="w-2.5 h-2.5 text-emerald-700" />
                                Recepcionista (Tú)
                              </span>
                            )}
                          </div>

                          {/* Media Image Rendering */}
                          {msg.mediaUrl && (
                            <div className="mb-2 rounded-lg overflow-hidden border border-slate-200/40 relative group">
                              <img
                                src={msg.mediaUrl}
                                alt="Imagen adjunta"
                                onClick={() => setZoomImageUrl(msg.mediaUrl)}
                                className="max-h-56 w-full object-cover cursor-pointer hover:opacity-95 transition-opacity"
                              />
                              <div
                                onClick={() => setZoomImageUrl(msg.mediaUrl)}
                                className="absolute bottom-1 right-1 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded-full cursor-pointer"
                              >
                                🔍 Ver imagen completa
                              </div>
                            </div>
                          )}

                          {/* Text Content */}
                          <p className="break-words whitespace-pre-wrap leading-relaxed text-xs text-slate-800">
                            {formatWhatsAppMessage(msg.content)}
                          </p>

                          {/* Footer: Time & Status */}
                          <div className="flex items-center justify-end gap-1 mt-1 text-[10px] text-slate-400">
                            <span>
                              {msg.createdAt
                                ? new Date(msg.createdAt).toLocaleTimeString("es-VE", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })
                                : ""}
                            </span>
                            {!isCust && getStatusIcon(msg.status)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Floating button to jump down to recent messages when scrolled up */}
            {showScrollBottomBtn && (
              <button
                type="button"
                onClick={() => scrollToBottom("smooth")}
                className="absolute bottom-16 right-6 z-20 bg-white/95 hover:bg-white text-slate-700 hover:text-rose-600 shadow-md border border-slate-200/90 rounded-full px-3.5 py-1.5 text-xs font-semibold flex items-center gap-1.5 transition-all transform hover:scale-105 active:scale-95 animate-in fade-in"
                title="Ir a los mensajes más recientes"
              >
                <ArrowDown className="w-3.5 h-3.5 text-rose-500 animate-bounce" />
                <span>Mensajes recientes</span>
              </button>
            )}

            {/* Quick Response Templates Bar (1-Clic) */}
            <div className="px-4 py-2 bg-slate-50 border-t border-slate-200 flex items-center gap-2.5 overflow-x-auto scrollbar-none shrink-0">
              <div className="flex items-center gap-1.5 text-xs text-slate-600 shrink-0 font-medium mr-1">
                <Zap className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                <span className="font-semibold text-slate-700 whitespace-nowrap">
                  Respuestas Rápidas:
                </span>
              </div>

              {DEFAULT_QUICK_TEMPLATES.map((tmpl) => (
                <button
                  key={tmpl.shortLabel}
                  type="button"
                  onClick={() => handleApplyTemplate(tmpl.content)}
                  className="px-3 py-1 rounded-full bg-white hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 text-slate-700 border border-slate-200 text-xs font-medium whitespace-nowrap shadow-xs transition-colors shrink-0"
                  title={tmpl.title}
                >
                  {tmpl.shortLabel}
                </button>
              ))}

              {/* More DB templates dropdown trigger */}
              {dbTemplates && dbTemplates.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowTemplatePicker(!showTemplatePicker)}
                  className="px-3 py-1 rounded-full bg-rose-100 hover:bg-rose-200 text-rose-800 text-xs font-semibold whitespace-nowrap border border-rose-200 flex items-center gap-1 shrink-0 transition-colors shadow-xs"
                >
                  <Sparkles className="w-3 h-3 text-rose-600" />
                  <span>Más Plantillas ({dbTemplates.length})</span>
                  <ChevronDown className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Dropdown list of DB message templates */}
            {showTemplatePicker && dbTemplates && (
              <div className="p-3 bg-white border-t border-slate-200 max-h-48 overflow-y-auto space-y-2">
                <p className="text-xs font-bold text-slate-700">
                  Selecciona una plantilla del salón:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {dbTemplates.map((t) => (
                    <div
                      key={t.id}
                      className="p-2 border border-slate-200 rounded-lg hover:border-rose-400 bg-slate-50/50 cursor-pointer text-xs"
                      onClick={() => handleApplyTemplate(t.content)}
                    >
                      <div className="flex items-center justify-between font-bold text-slate-800">
                        <span>{t.name}</span>
                        <span className="text-[10px] text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded">
                          {t.category}
                        </span>
                      </div>
                      <p className="text-slate-500 text-[11px] line-clamp-2 mt-1">
                        {t.content}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Media URL drawer */}
            {showMediaInput && (
              <div className="px-3 pt-2 pb-1 bg-slate-100 border-t border-slate-200 flex items-center gap-2">
                <Input
                  type="url"
                  placeholder="URL de imagen a enviar (ej. diseño de uñas o comprobante)..."
                  value={mediaUrlInput}
                  onChange={(e) => setMediaUrlInput(e.target.value)}
                  className="h-8 text-xs bg-white border-slate-300"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowMediaInput(false)}
                  className="h-8 text-xs"
                >
                  Cancelar
                </Button>
              </div>
            )}

            {/* Input Form */}
            <form
              onSubmit={handleSendMessage}
              className="p-3 border-t border-[#E2E8F0] flex items-center gap-2 shrink-0 bg-white"
            >
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setShowMediaInput(!showMediaInput)}
                className={cn(
                  "w-9 h-9 rounded-full",
                  showMediaInput || mediaUrlInput
                    ? "text-rose-600 bg-rose-50"
                    : "text-slate-400 hover:text-slate-700"
                )}
                title="Adjuntar imagen por URL"
              >
                <ImageIcon className="w-4 h-4" />
              </Button>

              <Input
                ref={inputRef}
                placeholder="Escribe como recepcionista humana en WhatsApp..."
                className="flex-1 text-xs border-slate-300 focus-visible:ring-rose-500 h-9"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
              />

              <Button
                type="submit"
                size="icon"
                className="bg-emerald-600 hover:bg-emerald-700 text-white shrink-0 shadow-sm w-9 h-9 rounded-full"
                disabled={sendMessage.isPending || (!messageInput.trim() && !mediaUrlInput.trim())}
                title="Enviar mensaje"
              >
                <Send className="w-4 h-4" />
              </Button>
            </form>
          </>
        ) : (
          /* Empty State */
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-slate-50/50">
            <div className="w-16 h-16 rounded-full bg-rose-50 flex items-center justify-center mb-4 text-rose-600 shadow-sm">
              <MessageSquare className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-[#0F172A] mb-1">
              Selecciona una conversación de WhatsApp
            </h3>
            <p className="text-xs text-[#64748B] max-w-sm">
              Elige una clienta para supervisar mensajes, silenciar o reactivar el bot, o enviar respuestas rápidas con plantillas en 1 clic.
            </p>
          </div>
        )}
      </Card>

      {/* Ficha de la Clienta (Modal unificado y responsivo para desktop y mobile) */}
      {selectedId && activeConversation && (
        <Dialog open={showClientProfile} onOpenChange={setShowClientProfile}>
          <DialogContent
            showCloseButton={false}
            className="max-w-md w-full bg-white p-0 overflow-hidden max-h-[88vh] flex flex-col rounded-3xl border border-rose-100 shadow-2xl"
          >
            {renderClientProfileContent()}
          </DialogContent>
        </Dialog>
      )}

      {/* Quick Schedule Appointment Dialog from CRM */}
      <Dialog open={isScheduleModalOpen} onOpenChange={setIsScheduleModalOpen}>
        <DialogContent className="max-w-md bg-white text-slate-900 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-sm sm:text-base font-bold flex items-center gap-2">
              💅 Agendar Cita para {activeConversation?.contactName || "Clienta"}
            </DialogTitle>
          </DialogHeader>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!scheduleDate || !scheduleTime) {
                toast.error("Selecciona fecha y hora");
                return;
              }
              const scheduledAt = new Date(`${scheduleDate}T${scheduleTime}:00`);
              createAppointmentMutation.mutate({
                clientName: activeConversation?.contactName || "Clienta WhatsApp",
                clientPhone: activeConversation?.phoneNumber || "+58412",
                serviceId: scheduleServiceId,
                scheduledAt,
                status: "confirmada",
                notes: scheduleNotes || undefined,
              });
            }}
            className="space-y-3 pt-2"
          >
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Clienta</Label>
              <Input
                readOnly
                value={`${activeConversation?.contactName || "Clienta"} (${activeConversation?.phoneNumber || ""})`}
                className="h-9 text-xs bg-slate-50 font-medium"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Servicio</Label>
              <select
                value={scheduleServiceId || ""}
                onChange={(e) =>
                  setScheduleServiceId(e.target.value ? Number(e.target.value) : undefined)
                }
                className="w-full h-9 rounded-md border border-slate-300 bg-white px-3 py-1 text-xs focus:ring-rose-500 focus:border-rose-500"
              >
                <option value="">Selecciona un servicio...</option>
                {services?.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} (${s.priceUsd} USD — {s.durationMinutes} min)
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Fecha</Label>
                <Input
                  type="date"
                  required
                  value={scheduleDate}
                  onChange={(e) => setScheduleDate(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Hora</Label>
                <Input
                  type="time"
                  required
                  value={scheduleTime}
                  onChange={(e) => setScheduleTime(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Notas / Diseño</Label>
              <Input
                placeholder="Acrílicas número 3, diseño francés..."
                value={scheduleNotes}
                onChange={(e) => setScheduleNotes(e.target.value)}
                className="h-9 text-xs"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsScheduleModalOpen(false)}
                className="rounded-xl text-xs"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={createAppointmentMutation.isPending}
                className="bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-bold text-xs rounded-xl shadow-xs"
              >
                Guardar y Confirmar Cita
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Photo Viewer Modal with Zoom */}
      {zoomImageUrl && (
        <Dialog open={!!zoomImageUrl} onOpenChange={() => setZoomImageUrl(null)}>
          <DialogContent className="max-w-xl bg-white p-4">
            <DialogHeader>
              <DialogTitle className="text-sm font-bold flex items-center justify-between">
                <span>Visualización de Imagen / Comprobante</span>
              </DialogTitle>
            </DialogHeader>
            <div className="mt-2 rounded-lg overflow-hidden border border-slate-200 bg-slate-900 flex items-center justify-center">
              <img
                src={zoomImageUrl}
                alt="Zoom"
                className="max-h-[75vh] w-auto object-contain"
              />
            </div>
            <div className="mt-3 flex items-center justify-between">
              <a
                href={zoomImageUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-rose-600 hover:underline flex items-center gap-1 font-medium"
              >
                Abrir imagen en nueva pestaña <ExternalLink className="w-3 h-3" />
              </a>
              <Button size="sm" onClick={() => setZoomImageUrl(null)}>
                Cerrar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
