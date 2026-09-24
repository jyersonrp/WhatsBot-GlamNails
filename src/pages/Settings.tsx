import { useState, useEffect } from "react";
import { trpc } from "@/providers/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  MessageCircle,
  Bot,
  Clock,
  Save,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Link2,
  Copy,
  Sparkles,
} from "lucide-react";

export default function SettingsPage() {
  const utils = trpc.useUtils();

  const { data: botConfig, isLoading: botLoading } =
    trpc.config.getBotConfig.useQuery();
  const { data: whatsappConfig, isLoading: waLoading } =
    trpc.config.getWhatsappConfig.useQuery();

  const updateBot = trpc.config.updateBotConfig.useMutation({
    onSuccess: () => {
      utils.config.getBotConfig.invalidate();
      toast.success("Configuración del bot actualizada");
    },
  });

  const updateWa = trpc.config.updateWhatsappConfig.useMutation({
    onSuccess: () => {
      utils.config.getWhatsappConfig.invalidate();
      toast.success("Configuración de WhatsApp actualizada");
    },
  });

  // Bot form state
  const [botActive, setBotActive] = useState(true);
  const [welcomeMessage, setWelcomeMessage] = useState("");
  const [awayMessage, setAwayMessage] = useState("");
  const [businessStart, setBusinessStart] = useState("09:00");
  const [businessEnd, setBusinessEnd] = useState("18:00");

  // WhatsApp form state
  const [phoneNumberId, setPhoneNumberId] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [wabaId, setWabaId] = useState("");
  const [verifyToken, setVerifyToken] = useState("");

  useEffect(() => {
    if (botConfig) {
      setBotActive(botConfig.isActive);
      setWelcomeMessage(botConfig.welcomeMessage || "");
      setAwayMessage(botConfig.awayMessage || "");
      setBusinessStart(botConfig.businessHoursStart || "09:00");
      setBusinessEnd(botConfig.businessHoursEnd || "18:00");
    }
  }, [botConfig]);

  useEffect(() => {
    if (whatsappConfig) {
      setPhoneNumberId(whatsappConfig.phoneNumberId || "");
      setAccessToken(whatsappConfig.accessToken || "");
      setWabaId(whatsappConfig.wabaId || "");
      setVerifyToken(whatsappConfig.verifyToken || "");
    }
  }, [whatsappConfig]);

  const handleSaveBot = () => {
    if (!botConfig) return;
    updateBot.mutate({
      id: botConfig.id,
      isActive: botActive,
      welcomeMessage,
      awayMessage,
      businessHoursStart: businessStart,
      businessHoursEnd: businessEnd,
    });
  };

  const handleSaveWa = () => {
    updateWa.mutate({
      phoneNumberId,
      accessToken,
      wabaId,
      verifyToken,
    });
  };

  const webhookUrl = `${window.location.origin}/api/webhook`;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copiado al portapapeles");
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16">
      {/* Header */}
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
          Configuración del Sistema <Sparkles className="w-5 h-5 text-rose-500" />
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Gestiona los parámetros automáticos de Bot Sofía y la conexión oficial con WhatsApp Cloud API.
        </p>
      </div>

      {/* Bot Configuration */}
      <Card className="border-slate-200 shadow-xs bg-white">
        <CardHeader>
          <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Bot className="w-5 h-5 text-rose-600" />
            Configuración del Bot
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {botLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
            </div>
          ) : (
            <>
              {/* Bot Active Toggle */}
              <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                <div>
                  <p className="text-sm font-bold text-slate-900">
                    Bot activo
                  </p>
                  <p className="text-xs text-slate-500">
                    El bot responderá automáticamente a los mensajes entrantes de clientas
                  </p>
                </div>
                <Switch checked={botActive} onCheckedChange={setBotActive} />
              </div>

              {/* Welcome Message */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <Label htmlFor="welcome" className="text-xs font-bold text-slate-700">
                    Mensaje de bienvenida y menú principal
                  </Label>
                  <span className="text-[11px] text-slate-400">
                    Se envía en el primer saludo o al escribir "Hola" / "Menu"
                  </span>
                </div>
                <Textarea
                  id="welcome"
                  value={welcomeMessage}
                  onChange={(e) => setWelcomeMessage(e.target.value)}
                  rows={12}
                  className="min-h-[260px] leading-relaxed text-xs sm:text-sm font-sans border-slate-300 focus-visible:ring-rose-500"
                  placeholder="Mensaje que enviará el bot al recibir un nuevo mensaje..."
                />
              </div>

              {/* Away Message */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <Label htmlFor="away" className="text-xs font-bold text-slate-700">
                    Mensaje fuera de horario
                  </Label>
                  <span className="text-[11px] text-slate-400">
                    Se envía si escriben fuera del horario comercial
                  </span>
                </div>
                <Textarea
                  id="away"
                  value={awayMessage}
                  onChange={(e) => setAwayMessage(e.target.value)}
                  rows={4}
                  className="min-h-[110px] leading-relaxed text-xs sm:text-sm font-sans border-slate-300 focus-visible:ring-rose-500"
                  placeholder="Mensaje cuando esté fuera del horario de atención..."
                />
              </div>

              {/* Business Hours */}
              <div>
                <Label className="flex items-center gap-2 mb-2 text-xs font-bold text-slate-700">
                  <Clock className="w-4 h-4 text-slate-500" />
                  Horario de atención
                </Label>
                <div className="flex items-end gap-3 max-w-md">
                  <div className="flex-1 min-w-[150px] whitespace-nowrap">
                    <Label className="text-xs text-slate-500 mb-1 block">Inicio</Label>
                    <Input
                      type="time"
                      value={businessStart}
                      onChange={(e) => setBusinessStart(e.target.value)}
                      className="h-10 text-sm font-medium w-full min-w-[140px] px-3 whitespace-nowrap"
                    />
                  </div>
                  <span className="text-slate-400 pb-2.5 font-medium text-sm">a</span>
                  <div className="flex-1 min-w-[150px] whitespace-nowrap">
                    <Label className="text-xs text-slate-500 mb-1 block">Fin</Label>
                    <Input
                      type="time"
                      value={businessEnd}
                      onChange={(e) => setBusinessEnd(e.target.value)}
                      className="h-10 text-sm font-medium w-full min-w-[140px] px-3 whitespace-nowrap"
                    />
                  </div>
                </div>
              </div>

              <Button
                onClick={handleSaveBot}
                disabled={updateBot.isPending}
                className="bg-rose-600 hover:bg-rose-700 text-white shadow-xs font-medium"
              >
                {updateBot.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Guardar configuración del bot
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* WhatsApp API Configuration */}
      <Card className="border-slate-200 shadow-xs bg-white">
        <CardHeader>
          <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-emerald-600" />
            Integración con WhatsApp Cloud API
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {waLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
            </div>
          ) : (
            <>
              {/* Connection Status */}
              <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg">
                {whatsappConfig?.isConnected ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    <div>
                      <p className="text-sm font-medium text-emerald-700">
                        Conectado
                      </p>
                      <p className="text-xs text-[#64748B]">
                        La integración con WhatsApp está funcionando
                        correctamente
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-5 h-5 text-amber-500" />
                    <div>
                      <p className="text-sm font-medium text-amber-700">
                        No conectado
                      </p>
                      <p className="text-xs text-[#64748B]">
                        Configura tus credenciales de WhatsApp Cloud API
                      </p>
                    </div>
                  </>
                )}
              </div>

              {/* Phone Number ID */}
              <div>
                <Label htmlFor="phoneId">Phone Number ID</Label>
                <Input
                  id="phoneId"
                  value={phoneNumberId}
                  onChange={(e) => setPhoneNumberId(e.target.value)}
                  placeholder="123456789012345"
                />
                <p className="text-xs text-[#64748B] mt-1">
                  ID del número de teléfono en WhatsApp Business API
                </p>
              </div>

              {/* Access Token */}
              <div>
                <Label htmlFor="token">Access Token</Label>
                <Input
                  id="token"
                  type="password"
                  value={accessToken}
                  onChange={(e) => setAccessToken(e.target.value)}
                  placeholder="EAAB..."
                />
                <p className="text-xs text-[#64748B] mt-1">
                  Token de acceso permanente de Meta
                </p>
              </div>

              {/* WABA ID */}
              <div>
                <Label htmlFor="waba">WABA ID</Label>
                <Input
                  id="waba"
                  value={wabaId}
                  onChange={(e) => setWabaId(e.target.value)}
                  placeholder="1234567890"
                />
                <p className="text-xs text-[#64748B] mt-1">
                  WhatsApp Business Account ID
                </p>
              </div>

              {/* Verify Token */}
              <div>
                <Label htmlFor="verify">Verify Token (Webhook)</Label>
                <Input
                  id="verify"
                  value={verifyToken}
                  onChange={(e) => setVerifyToken(e.target.value)}
                  placeholder="mi_token_secreto"
                />
                <p className="text-xs text-[#64748B] mt-1">
                  Token para verificar el webhook con Meta
                </p>
              </div>

              <Separator />

              {/* Webhook URL */}
              <div>
                <Label className="flex items-center gap-2">
                  <Link2 className="w-4 h-4 text-[#64748B]" />
                  URL del Webhook
                </Label>
                <div className="flex gap-2 mt-1">
                  <Input value={webhookUrl} readOnly className="bg-slate-50" />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copyToClipboard(webhookUrl)}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-xs text-[#64748B] mt-1">
                  Copia esta URL y configúrala en el panel de desarrolladores de
                  Meta
                </p>
              </div>

              <Button
                onClick={handleSaveWa}
                disabled={updateWa.isPending}
                className="bg-[#25D366] hover:bg-[#128C7E] text-white"
              >
                {updateWa.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Guardar configuración de WhatsApp
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
