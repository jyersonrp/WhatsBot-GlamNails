import { Link, useLocation } from "react-router";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import {
  LayoutDashboard,
  Calendar,
  MessageSquare,
  Bot,
  FileText,
  Users,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Smartphone,
} from "lucide-react";
import { useState } from "react";
import { trpc } from "@/providers/trpc";
import { openWhatsAppSimulator } from "./WhatsAppSimulator";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
  { icon: Calendar, label: "Citas / Agenda", path: "/appointments" },
  { icon: MessageSquare, label: "Conversaciones", path: "/conversations" },
  { icon: Bot, label: "Bot Builder", path: "/bot-builder" },
  { icon: FileText, label: "Plantillas", path: "/templates" },
  { icon: Users, label: "Contactos", path: "/contacts" },
  { icon: Settings, label: "Configuración", path: "/settings" },
];

export default function Sidebar() {
  const location = useLocation();
  const { logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const { data: conversations } = trpc.conversation.list.useQuery(
    { status: "active" },
    { refetchInterval: 10000 }
  );

  const { data: appointmentStats } = trpc.appointment.stats.useQuery(undefined, {
    refetchInterval: 10000,
  });

  const unreadTotal =
    conversations?.reduce((sum, c) => sum + (c.unreadCount || 0), 0) || 0;

  const pendingAppointments = appointmentStats?.pendientes || 0;

  return (
    <aside
      className={cn(
        "bg-[#0B0F19] text-white flex flex-col transition-all duration-300 relative border-r border-slate-800/80 shadow-sm",
        collapsed ? "w-16" : "w-60"
      )}
    >
      {/* Boutique Logo */}
      <div className="h-14 flex items-center px-4 border-b border-slate-800/80 bg-[#0E1424]/40">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-rose-500 via-pink-400 to-amber-200 flex items-center justify-center shrink-0 shadow-md shadow-rose-500/20 ring-1 ring-white/20">
            <Sparkles className="w-4 h-4 text-slate-950 font-bold" />
          </div>
          {!collapsed && (
            <div className="flex flex-col min-w-0">
              <span className="font-extrabold text-sm tracking-tight bg-gradient-to-r from-white via-rose-100 to-amber-100 bg-clip-text text-transparent truncate">
                Glam Nails
              </span>
              <span className="text-[10px] text-rose-400/90 font-semibold tracking-wider uppercase -mt-0.5 flex items-center gap-1">
                <span>Maturín</span>
                <span className="w-1 h-1 rounded-full bg-rose-400" />
                <span className="text-[9px] text-slate-400">Boutique</span>
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto custom-scrollbar">
        {navItems.map((item) => {
          const isActive = location.pathname.startsWith(item.path);
          const isConversations = item.path === "/conversations";
          const isAppointments = item.path === "/appointments";

          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all relative group",
                isActive
                  ? "bg-gradient-to-r from-rose-500/20 via-pink-500/10 to-transparent text-rose-200 border-l-2 border-rose-400 shadow-xs"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/60"
              )}
              title={collapsed ? item.label : undefined}
            >
              <item.icon
                className={cn(
                  "w-4 h-4 shrink-0 transition-transform group-hover:scale-110",
                  isActive ? "text-rose-400" : "text-slate-400"
                )}
              />
              {!collapsed && <span className="truncate">{item.label}</span>}

              {/* Unread message count badge */}
              {isConversations && unreadTotal > 0 && (
                <span
                  className={cn(
                    "bg-gradient-to-r from-rose-600 to-pink-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-xs",
                    collapsed ? "w-4 h-4 absolute -top-1 -right-1" : "min-w-4 h-4 px-1 ml-auto"
                  )}
                >
                  {unreadTotal}
                </span>
              )}

              {/* Pending appointment badge */}
              {isAppointments && pendingAppointments > 0 && (
                <span
                  className={cn(
                    "bg-amber-400 text-slate-950 text-[10px] font-extrabold rounded-full flex items-center justify-center shadow-xs",
                    collapsed ? "w-4 h-4 absolute -top-1 -right-1" : "min-w-4 h-4 px-1 ml-auto"
                  )}
                >
                  {pendingAppointments}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* WhatsApp Simulator Quick Launcher */}
      <div className="px-2 pb-2">
        <button
          onClick={openWhatsAppSimulator}
          className={cn(
            "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-emerald-300 bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-500/30 transition-all shadow-xs cursor-pointer group hover:border-emerald-400/50",
            collapsed && "justify-center px-0"
          )}
          title="Abrir Simulador WhatsApp"
        >
          <Smartphone className="w-4 h-4 text-emerald-400 shrink-0 group-hover:scale-110 transition-transform" />
          {!collapsed && <span className="truncate">Simulador WhatsApp</span>}
        </button>
      </div>

      {/* Footer */}
      <div className="p-2 border-t border-slate-800 space-y-1">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-xs text-slate-400 hover:text-white hover:bg-slate-800 transition-colors w-full"
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <>
              <ChevronLeft className="w-4 h-4" />
              <span>Colapsar menú</span>
            </>
          )}
        </button>
        <button
          onClick={logout}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-xs text-slate-400 hover:text-rose-400 hover:bg-rose-950/20 transition-colors w-full"
        >
          <LogOut className="w-4 h-4" />
          {!collapsed && <span>Cerrar sesión</span>}
        </button>
      </div>

      {/* Collapse toggle button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 w-6 h-6 bg-rose-600 rounded-full flex items-center justify-center shadow-md hover:bg-rose-500 transition-colors z-10 text-white"
      >
        {collapsed ? (
          <ChevronRight className="w-3.5 h-3.5" />
        ) : (
          <ChevronLeft className="w-3.5 h-3.5" />
        )}
      </button>
    </aside>
  );
}
