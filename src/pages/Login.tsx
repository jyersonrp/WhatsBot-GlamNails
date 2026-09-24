import { useState } from "react";
import { useNavigate } from "react-router";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/providers/trpc";
import { Sparkles, Lock, Mail, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export default function Login() {
  const navigate = useNavigate();
  const utils = trpc.useUtils();

  const [email, setEmail] = useState("admin@glamnails.com");
  const [password, setPassword] = useState("admin123456");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: async () => {
      await utils.auth.me.invalidate();
      toast.success("¡Bienvenida a Glam Nails Maturín!");
      navigate("/dashboard");
    },
    onError: (err) => {
      setErrorMessage(err.message || "Error al iniciar sesión.");
    },
  });

  const seedMutation = trpc.auth.seedAdmin.useMutation({
    onSuccess: (data) => {
      if (data.created) {
        toast.success("Cuenta de Administrador inicial creada con éxito.");
      } else {
        toast.info(data.message || "La base de datos ya contiene usuarios.");
      }
    },
    onError: (err) => {
      toast.error(err.message || "Error al inicializar admin.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    loginMutation.mutate({ email, password });
  };

  const handleFillDemo = (role: "admin" | "agent") => {
    if (role === "admin") {
      setEmail("admin@glamnails.com");
      setPassword("admin123456");
    } else {
      setEmail("recepcion@glamnails.com");
      setPassword("agente123456");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-rose-950 p-4">
      <Card className="w-full max-w-md border-rose-900/30 bg-slate-900/90 text-slate-100 shadow-2xl backdrop-blur-sm">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-tr from-rose-600 to-pink-500 flex items-center justify-center shadow-lg shadow-rose-500/25 mb-3">
            <Sparkles className="w-7 h-7 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-white flex items-center justify-center gap-2">
            Glam Nails <span className="text-rose-400 font-light text-xl">Maturín</span>
          </CardTitle>
          <CardDescription className="text-slate-400 text-sm">
            WhatsBot CRM — Panel de Control y Atención al Cliente
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-4">
          {errorMessage && (
            <div className="mb-4 p-3 rounded-lg bg-rose-950/60 border border-rose-800 text-rose-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-medium text-slate-300">
                Correo Electrónico
              </Label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@glamnails.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-9 bg-slate-800/80 border-slate-700 text-white placeholder:text-slate-500 focus-visible:ring-rose-500"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs font-medium text-slate-300">
                Contraseña
              </Label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-9 bg-slate-800/80 border-slate-700 text-white placeholder:text-slate-500 focus-visible:ring-rose-500"
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-medium shadow-md shadow-rose-900/20"
              size="lg"
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Iniciando sesión...
                </>
              ) : (
                "Ingresar al CRM"
              )}
            </Button>
          </form>

          {/* Demo helper */}
          <div className="mt-6 pt-4 border-t border-slate-800">
            <p className="text-xs text-slate-400 text-center mb-2">Acceso Rápido de Prueba:</p>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleFillDemo("admin")}
                className="flex-1 text-xs border-slate-700 bg-slate-800/50 hover:bg-slate-700 text-slate-200"
              >
                👑 Directora (Admin)
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleFillDemo("agent")}
                className="flex-1 text-xs border-slate-700 bg-slate-800/50 hover:bg-slate-700 text-slate-200"
              >
                💅 Recepcionista
              </Button>
            </div>

            <div className="mt-3 text-center">
              <button
                type="button"
                onClick={() => seedMutation.mutate({})}
                disabled={seedMutation.isPending}
                className="text-[11px] text-slate-500 hover:text-rose-400 transition-colors underline"
              >
                {seedMutation.isPending ? "Inicializando..." : "¿Base de datos vacía? Inicializar Admin"}
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
