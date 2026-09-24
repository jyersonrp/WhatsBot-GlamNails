import { Outlet, useLocation } from "react-router";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { cn } from "@/lib/utils";

export default function AppLayout() {
  const location = useLocation();
  const isConversations = location.pathname.startsWith("/conversations");

  return (
    <div className="flex h-screen bg-[#FAF9F6] text-slate-800 antialiased font-sans selection:bg-rose-500 selection:text-white">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <Header />
        <main
          className={cn(
            "flex-1 custom-scrollbar",
            isConversations
              ? "overflow-hidden p-3 md:p-4 flex flex-col"
              : "overflow-y-auto p-4 md:p-6"
          )}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}
