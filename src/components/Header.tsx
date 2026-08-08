import { useAuth } from "@/hooks/useAuth";
import { Bell, CircleUser } from "lucide-react";
import { trpc } from "@/providers/trpc";

export default function Header() {
  const { user } = useAuth();
  const { data: botConfig } = trpc.config.getBotConfig.useQuery();

  return (
    <header className="h-14 bg-white border-b border-[#E2E8F0] flex items-center justify-between px-6 shrink-0">
      <div className="flex items-center gap-4">
        <h1 className="text-lg font-semibold text-[#0F172A]">
          Panel de Administración
        </h1>
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
              botConfig?.isActive
                ? "bg-emerald-50 text-emerald-700"
                : "bg-amber-50 text-amber-700"
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                botConfig?.isActive ? "bg-emerald-500" : "bg-amber-500"
              }`}
            />
            Bot {botConfig?.isActive ? "Activo" : "Inactivo"}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button className="relative p-2 text-[#64748B] hover:text-[#0F172A] hover:bg-slate-100 rounded-lg transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
        </button>

        <div className="flex items-center gap-2 pl-3 border-l border-[#E2E8F0]">
          <div className="w-8 h-8 rounded-full bg-[#10B981] flex items-center justify-center">
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt={user.name || "User"}
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <CircleUser className="w-5 h-5 text-white" />
            )}
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-[#0F172A]">
              {user?.name || "Administrador"}
            </p>
            <p className="text-xs text-[#64748B]">
              {user?.role === "admin" ? "Administrador" : "Agente"}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
