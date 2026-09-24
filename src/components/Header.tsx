import { useAuth } from "@/hooks/useAuth";
import { CircleUser, Sparkles, Calendar, Bot } from "lucide-react";
import { trpc } from "@/providers/trpc";
import { WhatsAppSimulator } from "./WhatsAppSimulator";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Link } from "react-router";

export default function Header() {
  const { user } = useAuth();
  const utils = trpc.useUtils();

  const { data: botConfig } = trpc.config.getBotConfig.useQuery(undefined, {
    refetchInterval: 5000,
  });

  const { data: appointmentStats } = trpc.appointment.stats.useQuery(undefined, {
    refetchInterval: 5000,
  });

  const updateBotMutation = trpc.config.updateBotConfig.useMutation({
    onSuccess: (data) => {
      utils.config.getBotConfig.invalidate();
      if (data?.isActive) {
        toast.success("Bot activado: respondiendo clientas automáticamente.");
      } else {
        toast.warning("Bot pausado: atención en modo manual para el salón.");
      }
    },
    onError: (err) => {
      toast.error(err.message || "Error al cambiar el estado del bot.");
    },
  });

  const handleToggleBot = (checked: boolean) => {
    if (!botConfig) return;
    updateBotMutation.mutate({
      id: botConfig.id,
      isActive: checked,
    });
  };

  const pendingCount = appointmentStats?.pendientes || 0;

  return (
    <header className="h-14 bg-white/95 backdrop-blur-md border-b border-rose-100/80 flex items-center justify-between px-4 sm:px-6 shrink-0 shadow-xs z-10">
      {/* Brand & Bot Quick Toggle */}
      <div className="flex items-center gap-3 sm:gap-4">
        <div className="flex items-center gap-1.5">
          <span className="font-extrabold text-base tracking-tight bg-gradient-to-r from-rose-950 via-rose-800 to-pink-700 bg-clip-text text-transparent">
            Glam Nails
          </span>
          <span className="text-rose-500 font-bold text-sm tracking-wide">Maturín</span>
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-rose-50 text-[10px] font-semibold text-rose-600 border border-rose-200/60 shadow-2xs">
            <Sparkles className="w-3 h-3 text-rose-500" />
            <span className="hidden sm:inline">Boutique</span>
          </span>
        </div>

        {/* Quick Bot Connection Status with Emerald Pulse Indicator */}
        <div className="flex items-center gap-2 pl-2 sm:pl-3 border-l border-rose-100">
          <div
            className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-semibold border transition-all ${
              botConfig?.isActive
                ? "bg-emerald-50 text-emerald-800 border-emerald-200 shadow-2xs"
                : "bg-amber-50 text-amber-800 border-amber-200"
            }`}
          >
            {botConfig?.isActive ? (
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
            ) : (
              <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
            )}
            <span className="flex items-center gap-1 text-[11px] font-medium">
              <Bot className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden md:inline">{botConfig?.isActive ? "Bot Sofía Conectada" : "Bot en Pausa"}</span>
              <span className="md:hidden">{botConfig?.isActive ? "Activo" : "Pausa"}</span>
            </span>

            <Switch
              checked={botConfig?.isActive ?? true}
              onCheckedChange={handleToggleBot}
              disabled={updateBotMutation.isPending || !botConfig}
              className="scale-75 origin-right data-[state=checked]:bg-emerald-600 data-[state=unchecked]:bg-slate-400 ml-0.5"
              aria-label="Alternar estado del bot"
            />
          </div>
        </div>
      </div>

      {/* Right Controls: Pending badge, Simulator, Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Pending Appointments Direct Access Alert Badge */}
        {pendingCount > 0 ? (
          <Link
            to="/appointments"
            className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-300 hover:bg-amber-100 transition-colors shadow-xs group"
            title={`${pendingCount} citas requieren confirmación`}
          >
            <Calendar className="w-3.5 h-3.5 text-amber-600 group-hover:scale-110 transition-transform" />
            <span>{pendingCount} por confirmar</span>
          </Link>
        ) : (
          <Link
            to="/appointments"
            className="hidden lg:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-50/70 text-rose-700 border border-rose-200/50 hover:bg-rose-100/70 transition-colors shadow-2xs"
            title="Ver agenda de citas"
          >
            <Calendar className="w-3.5 h-3.5 text-rose-500" />
            <span>Agenda de Citas</span>
          </Link>
        )}

        {/* WhatsApp Simulator Direct Launcher */}
        <WhatsAppSimulator />

        {/* User Profile Pill */}
        <div className="flex items-center gap-2 sm:gap-2.5 pl-2 sm:pl-3 border-l border-rose-100">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-rose-500 via-pink-400 to-amber-200 flex items-center justify-center overflow-hidden shadow-xs ring-2 ring-rose-200 text-white font-bold text-xs">
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt={user.name || "Usuario"}
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <CircleUser className="w-5 h-5 text-slate-800" />
            )}
          </div>
          <div className="hidden md:block">
            <p className="text-xs font-bold text-slate-900 leading-tight">
              {user?.name || "Administrador"}
            </p>
            <p className="text-[10px] text-rose-600 font-semibold tracking-tight">
              {user?.role === "admin" ? "Directora Boutique" : "Recepcionista VIP"}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
