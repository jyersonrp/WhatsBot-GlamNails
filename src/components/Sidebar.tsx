import { Link, useLocation } from "react-router";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import {
  LayoutDashboard,
  MessageSquare,
  Bot,
  FileText,
  Users,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  MessageCircle,
} from "lucide-react";
import { useState } from "react";
import { trpc } from "@/providers/trpc";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
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

  const unreadTotal = conversations?.reduce(
    (sum, c) => sum + (c.unreadCount || 0),
    0
  ) || 0;

  return (
    <aside
      className={cn(
        "bg-[#0F172A] text-white flex flex-col transition-all duration-300 relative",
        collapsed ? "w-16" : "w-60"
      )}
    >
      {/* Logo */}
      <div className="h-14 flex items-center px-4 border-b border-slate-700">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-[#25D366] flex items-center justify-center shrink-0">
            <MessageCircle className="w-5 h-5 text-white" />
          </div>
          {!collapsed && (
            <span className="font-semibold text-lg tracking-tight truncate">
              WhatsBot
            </span>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.pathname.startsWith(item.path);
          const isConversations = item.path === "/conversations";

          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors relative",
                isActive
                  ? "bg-[#10B981]/20 text-[#10B981]"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              )}
              title={collapsed ? item.label : undefined}
            >
              <item.icon className="w-5 h-5 shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
              {isConversations && unreadTotal > 0 && (
                <span
                  className={cn(
                    "bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center",
                    collapsed ? "w-4 h-4 absolute -top-1 -right-1" : "w-5 h-5 ml-auto"
                  )}
                >
                  {unreadTotal}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-2 border-t border-slate-700 space-y-1">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-slate-800 transition-colors w-full"
        >
          {collapsed ? (
            <ChevronRight className="w-5 h-5" />
          ) : (
            <>
              <ChevronLeft className="w-5 h-5" />
              <span>Colapsar</span>
            </>
          )}
        </button>
        <button
          onClick={logout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors w-full"
        >
          <LogOut className="w-5 h-5" />
          {!collapsed && <span>Cerrar sesión</span>}
        </button>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 w-6 h-6 bg-[#10B981] rounded-full flex items-center justify-center shadow-md hover:bg-[#059669] transition-colors z-10"
      >
        {collapsed ? (
          <ChevronRight className="w-3 h-3 text-white" />
        ) : (
          <ChevronLeft className="w-3 h-3 text-white" />
        )}
      </button>
    </aside>
  );
}
