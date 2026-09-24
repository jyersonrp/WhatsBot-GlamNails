import { useState, useRef, useEffect } from "react";
import { trpc } from "@/providers/trpc";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Smartphone,
  Send,
  Image as ImageIcon,
  CheckCheck,
  RotateCcw,
  Sparkles,
  Volume2,
  VolumeX,
} from "lucide-react";
import { toast } from "sonner";

export function openWhatsAppSimulator() {
  window.dispatchEvent(new CustomEvent("open-whatsapp-simulator"));
}

interface SimMessage {
  id: string;
  sender: "customer" | "bot";
  text: string;
  mediaUrl?: string;
  ruleName?: string;
  source?: string;
  time: string;
}

const DEFAULT_WELCOME_MSG: SimMessage = {
  id: "initial",
  sender: "bot",
  text: "¡Hola! 💅 Bienvenida a *Glam Nails Maturín*. Soy tu asistente virtual y puedo ayudarte con catálogo, precios, horario o agendar tu cita.",
  time: "10:00 am",
  ruleName: "Bienvenida inicial",
};

function formatWhatsAppSimText(text: string) {
  const parts = text.split(/(\*[^*]+\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("*") && part.endsWith("*") && part.length > 2) {
      return (
        <strong key={i} className="font-bold">
          {part.slice(1, -1)}
        </strong>
      );
    }
    return part;
  });
}

export function WhatsAppSimulator() {
  const [open, setOpen] = useState(false);
  const [phone] = useState("+584129876543");
  const [contactName] = useState("Clienta Demo (Maturín)");
  const [inputText, setInputText] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [showMediaInput, setShowMediaInput] = useState(false);
  const [messages, setMessages] = useState<SimMessage[]>([DEFAULT_WELCOME_MSG]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const utils = trpc.useUtils();

  // Listen for global open event
  useEffect(() => {
    const handleOpen = () => setOpen(true);
    window.addEventListener("open-whatsapp-simulator", handleOpen);
    return () => window.removeEventListener("open-whatsapp-simulator", handleOpen);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (open) {
      scrollToBottom();
    }
  }, [messages, open]);

  // Check if simulated conversation is muted
  const { data: convData } = trpc.conversation.byPhone.useQuery(
    { phone },
    { enabled: open, refetchInterval: 3000 }
  );

  const toggleMuteMutation = trpc.conversation.toggleBotMuted.useMutation({
    onSuccess: (data) => {
      utils.conversation.byPhone.invalidate({ phone });
      utils.conversation.list.invalidate();
      if (data?.isBotMuted) {
        toast.info("Bot silenciado para esta clienta. Se espera atención manual.");
      } else {
        toast.success("Bot reactivado para esta clienta.");
      }
    },
  });

  const simulateMutation = trpc.webhook.simulate.useMutation({
    onSuccess: (data) => {
      const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

      if (data.botResponse) {
        setMessages((prev) => [
          ...prev,
          {
            id: `bot-${Date.now()}`,
            sender: "bot",
            text: data.botResponse.content,
            ruleName: data.botResponse.ruleName,
            source: data.botResponse.source,
            time: now,
          },
        ]);
      } else if (data.isBotMuted) {
        toast.info("El bot está silenciado para esta clienta. Se espera respuesta de la recepcionista.");
      }

      // Invalidate CRM conversations and messages query so the CRM updates in real time
      utils.conversation.list.invalidate();
      utils.conversation.messages.invalidate();
      utils.message.list.invalidate();
      utils.conversation.byPhone.invalidate({ phone });
      utils.dashboard.stats.invalidate();
      utils.appointment.list.invalidate();
    },
    onError: (err) => {
      toast.error(err.message || "Error al simular mensaje.");
    },
  });

  const handleSend = (textToSend?: string, urlToSend?: string) => {
    const text = (textToSend !== undefined ? textToSend : inputText).trim();
    const media = urlToSend !== undefined ? urlToSend : mediaUrl;
    if (!text && !media) return;

    const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    // Append customer message
    setMessages((prev) => [
      ...prev,
      {
        id: `cust-${Date.now()}`,
        sender: "customer",
        text: text || "📷 Imagen enviada",
        mediaUrl: media || undefined,
        time: now,
      },
    ]);

    simulateMutation.mutate({
      phoneNumber: phone,
      contactName,
      message: text || "📷 Imagen enviada",
      mediaUrl: media || undefined,
      mediaType: media ? "image" : undefined,
    });

    setInputText("");
    setMediaUrl("");
    setShowMediaInput(false);
  };

  const quickPrompts = [
    { label: "👋 Hola", text: "Hola, buenas tardes" },
    { label: "💅 ¿Precios de acrílicas?", text: "¿Cuánto cuesta el set de acrílico?" },
    { label: "💳 ¿Datos de pago móvil?", text: "¿Me das los datos de pago móvil?" },
    { label: "📅 Quiero agendar", text: "Hola, quiero agendar una cita para uñas" },
    { label: "❌ Cancelar cita", text: "Hola, necesito cancelar mi cita" },
    { label: "📍 ¿Dónde están ubicados?", text: "¿Dónde están ubicados?" },
    { label: "🕒 ¿A qué hora abren?", text: "¿A qué hora abren?" },
    { label: "✨ Catálogo", text: "¿Qué servicios tienen disponibles?" },
  ];

  const handleSendSampleImage = (type: "pago" | "diseno") => {
    if (type === "pago") {
      handleSend(
        "Listo amiga, aquí te adjunto la captura del Pago Móvil del anticipo",
        "https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=500"
      );
    } else {
      handleSend(
        "Hola, me encantó este diseño en Instagram, ¿pueden hacérmelo y cuánto saldría?",
        "https://images.unsplash.com/photo-1604654894610-df63bc536371?w=500"
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="bg-emerald-600/10 text-emerald-700 hover:text-white border-emerald-500/30 hover:bg-emerald-600 transition-all gap-1.5 font-medium shadow-xs"
        >
          <Smartphone className="w-4 h-4 text-emerald-600" />
          <span>Simulador WhatsApp</span>
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md max-w-[95vw] p-0 overflow-hidden bg-white border-slate-200 text-slate-800 shadow-2xl rounded-2xl [&>button]:text-white [&>button]:opacity-80 [&>button]:hover:opacity-100">
        <DialogTitle className="sr-only">Simulador de WhatsApp Glam Nails</DialogTitle>

        {/* WhatsApp Mobile Header */}
        <div className="bg-[#075E54] text-white p-3.5 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-rose-500 flex items-center justify-center text-white font-bold text-sm shadow">
              💅
            </div>
            <div>
              <h3 className="font-semibold text-sm leading-tight flex items-center gap-1.5">
                Glam Nails Maturín
                <Sparkles className="w-3 h-3 text-rose-300" />
              </h3>
              <p className="text-[11px] text-emerald-200 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Asistente Virtual Sofía en línea
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 mr-8">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMessages([DEFAULT_WELCOME_MSG])}
              className="text-white/80 hover:text-white hover:bg-emerald-800/40 w-8 h-8 rounded-full"
              title="Reiniciar chat"
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Client Number & Bot Mute status bar */}
        <div className="bg-slate-100 px-3.5 py-1.5 text-xs flex items-center justify-between border-b border-slate-200 text-slate-600">
          <div className="flex items-center gap-1.5 text-slate-600">
            <span className="text-slate-500 font-medium">Cliente demo:</span>
            <span className="text-emerald-700 font-mono font-semibold">{phone}</span>
          </div>

          {convData && (
            <button
              onClick={() =>
                toggleMuteMutation.mutate({
                  id: convData.id,
                  isBotMuted: !convData.isBotMuted,
                })
              }
              className={`text-[11px] px-2.5 py-0.5 rounded-full flex items-center gap-1 transition-colors font-medium shadow-xs ${
                convData.isBotMuted
                  ? "bg-amber-100 text-amber-800 border border-amber-300 hover:bg-amber-200"
                  : "bg-emerald-100 text-emerald-800 border border-emerald-300 hover:bg-emerald-200"
              }`}
            >
              {convData.isBotMuted ? (
                <>
                  <VolumeX className="w-3 h-3 text-amber-600" />
                  <span>Bot Silenciado</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-3 h-3 text-emerald-600" />
                  <span>Bot Activo</span>
                </>
              )}
            </button>
          )}
        </div>

        {/* Muted Warning Banner */}
        {convData?.isBotMuted && (
          <div className="bg-amber-50 border-b border-amber-200 px-3.5 py-1.5 text-[11px] text-amber-800 flex items-center justify-between">
            <span>⚠️ El bot está silenciado para este número (Atención humana activa).</span>
            <button
              onClick={() =>
                toggleMuteMutation.mutate({
                  id: convData.id,
                  isBotMuted: false,
                })
              }
              className="text-amber-900 underline font-semibold hover:text-amber-700 ml-2"
            >
              Reactivar
            </button>
          </div>
        )}

        {/* Chat History View */}
        <div className="h-[22rem] sm:h-[26rem] overflow-y-auto p-3.5 space-y-2.5 bg-[#EFEAE2]">
          {messages.map((m) => {
            const isCust = m.sender === "customer";
            return (
              <div
                key={m.id}
                className={`flex flex-col ${isCust ? "items-end" : "items-start"}`}
              >
                <div
                  className={`w-fit max-w-[85%] rounded-2xl px-3.5 py-2 text-xs shadow-xs relative ${
                    isCust
                      ? "bg-[#D9FDD3] text-slate-900 rounded-tr-none border border-[#C5EDB8]/60"
                      : "bg-white text-slate-800 rounded-tl-none border border-slate-200/80"
                  }`}
                >
                  {m.mediaUrl && (
                    <div className="mb-1.5 overflow-hidden rounded-lg">
                      <img
                        src={m.mediaUrl}
                        alt="Adjunto"
                        className="max-h-36 w-full object-cover rounded-md"
                      />
                    </div>
                  )}

                  <p className="break-words whitespace-pre-wrap leading-relaxed select-text">
                    {formatWhatsAppSimText(m.text)}
                  </p>

                  <div className="flex items-center justify-end gap-1 mt-1 text-[10px] text-slate-400">
                    <span>{m.time}</span>
                    {isCust && <CheckCheck className="w-3.5 h-3.5 text-[#53bdeb]" />}
                  </div>
                </div>

                {!isCust && m.ruleName && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-medium text-rose-700 bg-rose-50/90 border border-rose-200/80 rounded-full px-2 py-0.5 mt-1 shadow-xs">
                    <Sparkles className="w-2.5 h-2.5 text-rose-500" />
                    <span>{m.ruleName}</span>
                    {m.source === "ai" && <span className="text-rose-500 font-semibold">(Gemini AI)</span>}
                  </span>
                )}
              </div>
            );
          })}

          {simulateMutation.isPending && (
            <div className="flex flex-col items-start">
              <div className="bg-white text-slate-600 rounded-2xl rounded-tl-none px-3.5 py-2 text-xs border border-slate-200/80 flex items-center gap-1.5 shadow-xs">
                <span className="w-1.5 h-1.5 bg-rose-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                <span className="w-1.5 h-1.5 bg-rose-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                <span className="w-1.5 h-1.5 bg-rose-400 rounded-full animate-bounce" />
                <span className="text-[10px] text-slate-500 ml-1">Sofía está escribiendo...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Testing Actions */}
        <div className="p-2.5 bg-slate-50 border-t border-slate-200 space-y-1.5">
          <div className="flex flex-wrap items-center justify-between gap-1.5 text-[11px] text-slate-600 px-1 font-medium">
            <span className="shrink-0">Pruebas rápidas en 1 clic:</span>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => handleSendSampleImage("pago")}
                className="text-[10px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors font-medium shadow-xs"
                title="Simular envío de comprobante de Pago Móvil"
              >
                🧾 Enviar Pago
              </button>
              <button
                type="button"
                onClick={() => handleSendSampleImage("diseno")}
                className="text-[10px] px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 transition-colors font-medium shadow-xs"
                title="Simular envío de foto de diseño de uñas"
              >
                💅 Enviar Diseño
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5 text-[11px] max-h-24 overflow-y-auto py-0.5">
            {quickPrompts.map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => handleSend(item.text)}
                className="px-2.5 py-0.5 rounded-full bg-white text-slate-700 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 whitespace-nowrap border border-slate-200 transition-colors shadow-xs font-medium text-[11px]"
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Media URL Input Drawer */}
        {showMediaInput && (
          <div className="px-3 pt-2 pb-1 bg-slate-100 border-t border-slate-200 flex gap-2">
            <Input
              type="url"
              placeholder="URL de imagen (comprobante o diseño de uña)..."
              value={mediaUrl}
              onChange={(e) => setMediaUrl(e.target.value)}
              className="h-8 text-xs bg-white border-slate-200 text-slate-900 placeholder:text-slate-400"
            />
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                setMediaUrl(
                  "https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=500"
                )
              }
              className="h-8 text-[11px] px-2 bg-white"
            >
              Ejemplo Pago
            </Button>
          </div>
        )}

        {/* Input Bar */}
        <div className="p-2.5 bg-[#F0F2F5] border-t border-slate-200 flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setShowMediaInput(!showMediaInput)}
            className={`w-8 h-8 rounded-full ${
              showMediaInput || mediaUrl ? "text-rose-600 bg-rose-100" : "text-slate-500 hover:text-slate-700"
            }`}
            title="Adjuntar imagen por URL"
          >
            <ImageIcon className="w-4 h-4" />
          </Button>

          <Input
            placeholder="Escribe como clienta en WhatsApp..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            className="flex-1 h-9 bg-white border-slate-200 text-slate-900 text-xs placeholder:text-slate-400 focus-visible:ring-[#00A884] rounded-full px-3.5 shadow-xs"
          />

          <Button
            size="icon"
            onClick={() => handleSend()}
            disabled={simulateMutation.isPending || (!inputText.trim() && !mediaUrl)}
            className="w-9 h-9 rounded-full bg-[#00A884] hover:bg-[#008f6f] text-white shrink-0 shadow-sm"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default WhatsAppSimulator;
