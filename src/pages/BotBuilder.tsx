import { useState } from "react";
import { trpc } from "@/providers/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Bot,
  Plus,
  Pencil,
  Trash2,
  MessageSquare,
  TestTube,
  Loader2,
  Sparkles,
  Zap,
  Play,
  CheckCircle2,
  AlertCircle,
  Hash,
} from "lucide-react";
import { cn } from "@/lib/utils";

type TriggerType = "keyword" | "exact" | "contains" | "regex" | "default";

interface BotRuleItem {
  id: number;
  name: string;
  triggerType: TriggerType;
  triggerValue: string;
  responseType: "text" | "template" | "flow";
  responseContent: string;
  templateName?: string | null;
  isActive: boolean;
  priority: number;
  createdAt: Date | string;
}

const triggerTypes: { value: TriggerType; label: string; desc: string }[] = [
  {
    value: "keyword",
    label: "Palabras clave",
    desc: "Se activa si el mensaje contiene alguna de las palabras separadas por comas",
  },
  {
    value: "contains",
    label: "Contiene texto",
    desc: "Se activa si el mensaje contiene la frase exacta",
  },
  {
    value: "exact",
    label: "Coincidencia exacta",
    desc: "El mensaje debe ser idéntico al texto configurado",
  },
  {
    value: "regex",
    label: "Expresión regular",
    desc: "Patrón avanzado regex",
  },
  {
    value: "default",
    label: "Respuesta por defecto",
    desc: "Se activa si ninguna otra regla coincide",
  },
];

const TEST_PRESETS = [
  { label: "👋 Hola", text: "Hola buenas tardes" },
  { label: "💅 Precios", text: "¿Cuánto cuesta el set de acrílico?" },
  { label: "💳 Pago Móvil", text: "¿Me das los datos de pago móvil?" },
  { label: "📍 Ubicación", text: "¿Dónde están ubicados?" },
  { label: "🕒 Horario", text: "¿A qué hora abren?" },
  { label: "📅 Agendar", text: "Quiero agendar una cita" },
  { label: "❌ Cancelar", text: "Quiero cancelar mi cita" },
];

export default function BotBuilder() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<BotRuleItem | null>(null);
  const [selectedTriggerType, setSelectedTriggerType] =
    useState<TriggerType>("keyword");
  const [testMessage, setTestMessage] = useState("");
  const [testResult, setTestResult] = useState<BotRuleItem | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [filterActive, setFilterActive] = useState<"all" | "active" | "inactive">(
    "all"
  );

  const utils = trpc.useUtils();

  const { data: rules, isLoading } = trpc.bot.list.useQuery({});

  const createRule = trpc.bot.create.useMutation({
    onSuccess: () => {
      utils.bot.list.invalidate();
      setIsDialogOpen(false);
      toast.success("Regla creada exitosamente");
    },
    onError: (err) => {
      toast.error(err.message || "Error al crear la regla");
    },
  });

  const updateRule = trpc.bot.update.useMutation({
    onSuccess: () => {
      utils.bot.list.invalidate();
      setIsDialogOpen(false);
      setEditingRule(null);
      toast.success("Regla actualizada");
    },
    onError: (err) => {
      toast.error(err.message || "Error al actualizar la regla");
    },
  });

  const deleteRule = trpc.bot.delete.useMutation({
    onSuccess: () => {
      utils.bot.list.invalidate();
      toast.success("Regla eliminada");
    },
  });

  const toggleRule = trpc.bot.toggle.useMutation({
    onSuccess: (updated) => {
      utils.bot.list.invalidate();
      if (updated?.isActive) {
        toast.success(`Regla "${updated.name}" activada.`);
      } else {
        toast.info(`Regla "${updated?.name}" desactivada.`);
      }
    },
  });

  const handleTest = async (messageToTest?: string) => {
    const text = messageToTest !== undefined ? messageToTest : testMessage;
    if (!text.trim()) return;
    setIsTesting(true);
    try {
      const result = await utils.bot.match.fetch({ message: text });
      setTestResult((result as unknown as BotRuleItem) || null);
    } catch {
      toast.error("Error al probar regla");
    } finally {
      setIsTesting(false);
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name") as string,
      triggerType: selectedTriggerType,
      triggerValue: formData.get("triggerValue") as string,
      responseType: "text" as const,
      responseContent: formData.get("responseContent") as string,
      priority: parseInt(formData.get("priority") as string) || 0,
    };

    if (editingRule) {
      updateRule.mutate({ id: editingRule.id, data });
    } else {
      createRule.mutate(data);
    }
  };

  const openEditDialog = (rule: BotRuleItem) => {
    setEditingRule(rule);
    setSelectedTriggerType(rule.triggerType);
    setIsDialogOpen(true);
  };

  const openCreateDialog = () => {
    setEditingRule(null);
    setSelectedTriggerType("keyword");
    setIsDialogOpen(true);
  };

  const handleTestFromRule = (rule: BotRuleItem) => {
    const firstWord = rule.triggerValue.split(",")[0]?.trim() || rule.triggerValue;
    setTestMessage(firstWord);
    handleTest(firstWord);
  };

  const filteredRules = rules?.filter((r) => {
    if (filterActive === "active") return r.isActive;
    if (filterActive === "inactive") return !r.isActive;
    return true;
  });

  const activeRulesCount = rules?.filter((r) => r.isActive).length || 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            Bot Builder <Sparkles className="w-5 h-5 text-rose-500" />
          </h1>
          <p className="text-sm text-slate-500">
            Reglas de respuestas automáticas por WhatsApp para el salón Glam Nails Maturín.
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              className="bg-rose-600 hover:bg-rose-700 text-white font-semibold gap-1.5 shadow-sm"
              onClick={openCreateDialog}
            >
              <Plus className="w-4 h-4" />
              Nueva Regla
            </Button>
          </DialogTrigger>

          <DialogContent className="max-w-lg bg-white text-slate-900">
            <DialogHeader>
              <DialogTitle className="text-base font-bold flex items-center gap-2">
                <Bot className="w-4 h-4 text-rose-600" />
                {editingRule ? "Editar Regla de Respuesta" : "Nueva Regla del Bot"}
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-3.5 pt-2">
              <div className="space-y-1">
                <Label htmlFor="name" className="text-xs font-semibold">
                  Nombre descriptivo de la regla
                </Label>
                <Input
                  id="name"
                  name="name"
                  defaultValue={editingRule?.name || ""}
                  placeholder="Ej: Información de Precios y Acrílicas"
                  required
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="triggerType" className="text-xs font-semibold">
                  Tipo de activador
                </Label>
                <Select
                  value={selectedTriggerType}
                  onValueChange={(val) => setSelectedTriggerType(val as TriggerType)}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {triggerTypes.map((t) => (
                      <SelectItem key={t.value} value={t.value} className="text-xs">
                        <span className="font-semibold">{t.label}</span> — {t.desc}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="triggerValue" className="text-xs font-semibold">
                  Palabras o frases que activan la regla
                </Label>
                <Input
                  id="triggerValue"
                  name="triggerValue"
                  defaultValue={editingRule?.triggerValue || ""}
                  placeholder={
                    selectedTriggerType === "keyword"
                      ? "precio, precios, acrilico, cuanto cuesta, costo"
                      : "Mensaje a coincidir"
                  }
                  required
                  className="h-9 text-xs font-mono"
                />
                <p className="text-[11px] text-slate-400">
                  {selectedTriggerType === "keyword"
                    ? "Escribe las palabras separadas por comas. El bot responderá si la clienta incluye alguna."
                    : "Texto contra el que se evaluará el mensaje entrante."}
                </p>
              </div>

              <div className="space-y-1">
                <Label htmlFor="responseContent" className="text-xs font-semibold">
                  Respuesta automática que enviará el Bot por WhatsApp
                </Label>
                <Textarea
                  id="responseContent"
                  name="responseContent"
                  defaultValue={editingRule?.responseContent || ""}
                  placeholder="Escribe la respuesta. Puedes usar emojis 💅 y formato de WhatsApp (*negrita*, _cursiva_)..."
                  rows={5}
                  required
                  className="text-xs leading-relaxed"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="priority" className="text-xs font-semibold">
                  Prioridad de ejecución (menor número = se evalúa primero)
                </Label>
                <Input
                  id="priority"
                  name="priority"
                  type="number"
                  defaultValue={editingRule?.priority ?? 10}
                  min={0}
                  max={1000}
                  className="h-9 text-xs w-32"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={createRule.isPending || updateRule.isPending}
                  className="bg-rose-600 hover:bg-rose-700 text-white font-medium"
                >
                  {editingRule ? "Guardar Cambios" : "Crear Regla"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Interactive Tester Section */}
      <Card className="border-slate-200 shadow-xs bg-slate-50/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-bold flex items-center justify-between text-slate-900">
            <span className="flex items-center gap-2">
              <TestTube className="w-4 h-4 text-rose-600" />
              Probador de Reglas en Vivo
            </span>
            <span className="text-[11px] font-normal text-slate-500">
              Prueba cómo reaccionará el bot ante cualquier mensaje de clienta
            </span>
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-3">
          {/* Quick preset chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1">
            <span className="text-[11px] font-semibold text-slate-500 shrink-0">
              Probar rápido:
            </span>
            {TEST_PRESETS.map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => {
                  setTestMessage(p.text);
                  handleTest(p.text);
                }}
                className="px-2.5 py-1 rounded-full bg-white hover:bg-rose-50 hover:text-rose-700 text-slate-700 border border-slate-200 text-[11px] font-medium whitespace-nowrap shadow-xs transition-colors shrink-0"
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Test Input bar */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input
                placeholder="Escribe como una clienta (ej: ¿Tienen cupo para acrílicas mañana?)..."
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleTest()}
                className="h-9 text-xs bg-white border-slate-300 focus-visible:ring-rose-500"
              />
            </div>
            <Button
              onClick={() => handleTest()}
              disabled={isTesting || !testMessage.trim()}
              className="bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs gap-1.5 h-9"
            >
              {isTesting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Play className="w-3.5 h-3.5" />
              )}
              Evaluar
            </Button>
          </div>

          {/* Test Result View */}
          {testResult !== null && (
            <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-bold text-slate-900">
                    Regla coincidente: "{testResult.name}"
                  </span>
                  <Badge variant="outline" className="text-[10px] text-rose-600 border-rose-200 bg-rose-50">
                    {testResult.triggerType}
                  </Badge>
                </div>

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => openEditDialog(testResult)}
                  className="h-7 text-xs text-rose-600 hover:bg-rose-50"
                >
                  <Pencil className="w-3 h-3 mr-1" />
                  Editar Regla
                </Button>
              </div>

              {/* Formatted WhatsApp reply preview */}
              <div className="p-3 bg-[#EFEAE2]/70 rounded-lg border border-slate-200">
                <div className="max-w-lg bg-[#202C33] text-white p-2.5 rounded-xl rounded-tl-none text-xs shadow-xs space-y-1">
                  <div className="flex items-center gap-1 text-[10px] text-rose-300 font-semibold mb-1">
                    <Bot className="w-3 h-3" />
                    Respuesta Simulada del Bot Sofía:
                  </div>
                  <p className="whitespace-pre-line leading-relaxed">
                    {testResult.responseContent}
                  </p>
                </div>
              </div>
            </div>
          )}

          {testResult === null && testMessage && !isTesting && (
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                Ninguna regla específica coincidió. El bot enviará la respuesta por defecto o consultará con inteligencia artificial.
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Rules List Header & Filter */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-rose-500" />
          <h2 className="text-sm font-bold text-slate-900">
            Reglas del Bot ({rules?.length || 0})
          </h2>
          <span className="text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-semibold border border-emerald-200">
            {activeRulesCount} activas
          </span>
        </div>

        <div className="flex gap-1.5 text-xs">
          <button
            onClick={() => setFilterActive("all")}
            className={`px-3 py-1 rounded-lg transition-colors ${
              filterActive === "all"
                ? "bg-slate-900 text-white font-bold"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Todas
          </button>
          <button
            onClick={() => setFilterActive("active")}
            className={`px-3 py-1 rounded-lg transition-colors ${
              filterActive === "active"
                ? "bg-emerald-600 text-white font-bold"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Activas
          </button>
          <button
            onClick={() => setFilterActive("inactive")}
            className={`px-3 py-1 rounded-lg transition-colors ${
              filterActive === "inactive"
                ? "bg-slate-700 text-white font-bold"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Inactivas
          </button>
        </div>
      </div>

      {/* Rules Cards List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="flex items-center justify-center py-12 text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
            Cargando reglas del bot...
          </div>
        ) : (
          filteredRules?.map((rule) => {
            const ruleItem = rule as unknown as BotRuleItem;
            const keywords =
              rule.triggerType === "keyword"
                ? rule.triggerValue.split(",").map((k) => k.trim())
                : [];

            return (
              <Card
                key={rule.id}
                className={cn(
                  "border transition-all",
                  rule.isActive
                    ? "border-slate-200 bg-white hover:border-rose-300 shadow-xs"
                    : "border-slate-200 bg-slate-50/70 opacity-60"
                )}
              >
                <CardContent className="p-4 space-y-3">
                  {/* Top Bar: Name, Switch, Priority, Actions */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Switch
                        checked={rule.isActive}
                        onCheckedChange={() => toggleRule.mutate({ id: rule.id })}
                        disabled={toggleRule.isPending}
                        className="data-[state=checked]:bg-emerald-600"
                        title={rule.isActive ? "Desactivar regla" : "Activar regla"}
                      />

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-bold text-sm text-slate-900">
                            {rule.name}
                          </h3>
                          <Badge
                            variant="secondary"
                            className={cn(
                              "text-[10px] font-semibold",
                              rule.triggerType === "keyword"
                                ? "bg-blue-50 text-blue-700 border-blue-200"
                                : rule.triggerType === "exact"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : rule.triggerType === "default"
                                ? "bg-slate-100 text-slate-700 border-slate-300"
                                : "bg-amber-50 text-amber-700 border-amber-200"
                            )}
                          >
                            {rule.triggerType}
                          </Badge>
                          <span className="text-[10px] text-slate-400 flex items-center font-mono">
                            <Hash className="w-2.5 h-2.5" />
                            Prioridad: {rule.priority}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs text-rose-600 border-rose-200 hover:bg-rose-50 gap-1"
                        onClick={() => handleTestFromRule(ruleItem)}
                        title="Probar esta regla en el probador"
                      >
                        <Zap className="w-3 h-3 text-rose-500" />
                        <span className="hidden sm:inline">Probar</span>
                      </Button>

                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-slate-500 hover:text-blue-600"
                        onClick={() => openEditDialog(ruleItem)}
                        title="Editar regla"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>

                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-slate-400 hover:text-rose-600"
                        onClick={() => {
                          if (confirm(`¿Eliminar la regla "${rule.name}"?`)) {
                            deleteRule.mutate({ id: rule.id });
                          }
                        }}
                        title="Eliminar regla"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>

                  {/* Trigger Keywords Chips */}
                  <div className="space-y-1">
                    <p className="text-[11px] font-semibold text-slate-500">
                      Palabras que la activan:
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {keywords.length > 0 ? (
                        keywords.map((kw, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-mono border border-slate-200"
                          >
                            {kw}
                          </span>
                        ))
                      ) : (
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-mono border border-slate-200">
                          {rule.triggerValue}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Response Preview Box */}
                  <div className="space-y-1">
                    <p className="text-[11px] font-semibold text-slate-500">
                      Respuesta del Bot:
                    </p>
                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-800 whitespace-pre-line leading-relaxed font-sans">
                      {rule.responseContent}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}

        {(!rules || rules.length === 0) && !isLoading && (
          <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-2xl bg-white p-8">
            <Bot className="w-12 h-12 text-slate-300 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-slate-800">
              No hay reglas configuradas
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Crea tu primera regla para que el bot responda automáticamente dudas sobre precios, horarios o citas.
            </p>
            <Button
              onClick={openCreateDialog}
              className="mt-4 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold"
            >
              <Plus className="w-4 h-4 mr-1" />
              Crear Primera Regla
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
