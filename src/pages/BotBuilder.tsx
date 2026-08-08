import { useState } from "react";
import { trpc } from "@/providers/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Bot,
  Plus,
  Pencil,
  Trash2,
  MessageSquare,
  TestTube,
  Loader2,
  GripVertical,
} from "lucide-react";
import { cn } from "@/lib/utils";

const triggerTypes = [
  { value: "keyword", label: "Palabras clave (separadas por coma)" },
  { value: "exact", label: "Coincidencia exacta" },
  { value: "contains", label: "Contiene texto" },
  { value: "regex", label: "Expresión regular" },
  { value: "default", label: "Respuesta por defecto" },
];

export default function BotBuilder() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<any>(null);
  const [testMessage, setTestMessage] = useState("");
  const [testResult, setTestResult] = useState<any>(null);

  const utils = trpc.useUtils();

  const { data: rules, isLoading } = trpc.bot.list.useQuery({});

  const createRule = trpc.bot.create.useMutation({
    onSuccess: () => {
      utils.bot.list.invalidate();
      setIsDialogOpen(false);
      toast.success("Regla creada exitosamente");
    },
  });

  const updateRule = trpc.bot.update.useMutation({
    onSuccess: () => {
      utils.bot.list.invalidate();
      setIsDialogOpen(false);
      setEditingRule(null);
      toast.success("Regla actualizada");
    },
  });

  const deleteRule = trpc.bot.delete.useMutation({
    onSuccess: () => {
      utils.bot.list.invalidate();
      toast.success("Regla eliminada");
    },
  });

  const toggleRule = trpc.bot.toggle.useMutation({
    onSuccess: () => {
      utils.bot.list.invalidate();
    },
  });

  const handleTest = async () => {
    if (!testMessage.trim()) return;
    const result = await utils.bot.match.fetch({ message: testMessage });
    setTestResult(result);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name") as string,
      triggerType: formData.get("triggerType") as any,
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

  const openEditDialog = (rule: any) => {
    setEditingRule(rule);
    setIsDialogOpen(true);
  };

  const openCreateDialog = () => {
    setEditingRule(null);
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#0F172A]">Bot Builder</h1>
          <p className="text-sm text-[#64748B] mt-1">
            Configura las reglas de respuesta automática de tu bot
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              className="bg-[#10B981] hover:bg-[#059669] text-white"
              onClick={openCreateDialog}
            >
              <Plus className="w-4 h-4 mr-2" />
              Nueva Regla
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editingRule ? "Editar Regla" : "Nueva Regla del Bot"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Nombre de la regla</Label>
                <Input
                  id="name"
                  name="name"
                  defaultValue={editingRule?.name || ""}
                  placeholder="Ej: Saludo de bienvenida"
                  required
                />
              </div>
              <div>
                <Label htmlFor="triggerType">Tipo de activador</Label>
                <Select
                  name="triggerType"
                  defaultValue={editingRule?.triggerType || "keyword"}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {triggerTypes.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="triggerValue">Valor del activador</Label>
                <Input
                  id="triggerValue"
                  name="triggerValue"
                  defaultValue={editingRule?.triggerValue || ""}
                  placeholder="hola, buenos días, hey"
                  required
                />
                <p className="text-xs text-[#64748B] mt-1">
                  Para palabras clave, sepáralas con comas
                </p>
              </div>
              <div>
                <Label htmlFor="responseContent">Respuesta del bot</Label>
                <Textarea
                  id="responseContent"
                  name="responseContent"
                  defaultValue={editingRule?.responseContent || ""}
                  placeholder="Escribe la respuesta que dará el bot..."
                  rows={4}
                  required
                />
              </div>
              <div>
                <Label htmlFor="priority">Prioridad (menor = primero)</Label>
                <Input
                  id="priority"
                  name="priority"
                  type="number"
                  defaultValue={editingRule?.priority || 0}
                  min={0}
                  max={1000}
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="bg-[#10B981] hover:bg-[#059669] text-white"
                >
                  {editingRule ? "Guardar Cambios" : "Crear Regla"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Test Bot Section */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <TestTube className="w-4 h-4 text-[#64748B]" />
            Probar Bot
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="Escribe un mensaje para probar el bot..."
              value={testMessage}
              onChange={(e) => setTestMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleTest()}
            />
            <Button
              onClick={handleTest}
              className="bg-[#3B82F6] hover:bg-blue-600 text-white"
            >
              <Bot className="w-4 h-4 mr-2" />
              Probar
            </Button>
          </div>
          {testResult && (
            <div className="mt-3 p-3 bg-slate-50 rounded-lg">
              {testResult ? (
                <div>
                  <p className="text-sm font-medium text-[#0F172A] mb-1">
                    Regla detectada: "{testResult.name}"
                  </p>
                  <p className="text-sm text-[#64748B] bg-white p-2 rounded border">
                    {testResult.responseContent}
                  </p>
                  <p className="text-xs text-[#64748B] mt-1">
                    Tipo: {testResult.triggerType} | Prioridad:{" "}
                    {testResult.priority}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-[#64748B]">
                  No se encontró una regla para ese mensaje
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Rules List */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-[#64748B]" />
            Reglas Configuradas ({rules?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-[#64748B]" />
            </div>
          ) : (
            <div className="space-y-2">
              {rules?.map((rule) => (
                <div
                  key={rule.id}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg border transition-colors",
                    rule.isActive
                      ? "bg-white border-[#E2E8F0]"
                      : "bg-slate-50 border-slate-200 opacity-70"
                  )}
                >
                  <GripVertical className="w-4 h-4 text-[#94A3B8] cursor-grab" />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-[#0F172A]">
                        {rule.name}
                      </p>
                      <span
                        className={cn(
                          "px-1.5 py-0.5 rounded text-[10px] font-medium",
                          rule.triggerType === "keyword"
                            ? "bg-blue-50 text-blue-600"
                            : rule.triggerType === "exact"
                            ? "bg-emerald-50 text-emerald-600"
                            : rule.triggerType === "default"
                            ? "bg-slate-100 text-slate-600"
                            : "bg-amber-50 text-amber-600"
                        )}
                      >
                        {rule.triggerType}
                      </span>
                      <span className="text-[10px] text-[#94A3B8]">
                        P:{rule.priority}
                      </span>
                    </div>
                    <p className="text-xs text-[#64748B] truncate mt-0.5">
                      <span className="font-medium">Trigger:</span>{" "}
                      {rule.triggerValue}
                    </p>
                    <p className="text-xs text-[#64748B] truncate">
                      <span className="font-medium">Respuesta:</span>{" "}
                      {rule.responseContent.slice(0, 80)}
                      {rule.responseContent.length > 80 ? "..." : ""}
                    </p>
                  </div>

                  <div className="flex items-center gap-1">
                    <Switch
                      checked={rule.isActive}
                      onCheckedChange={() => toggleRule.mutate({ id: rule.id })}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-[#64748B] hover:text-blue-600"
                      onClick={() => openEditDialog(rule)}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-[#64748B] hover:text-red-600"
                      onClick={() => {
                        if (confirm("¿Eliminar esta regla?")) {
                          deleteRule.mutate({ id: rule.id });
                        }
                      }}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
              {(!rules || rules.length === 0) && (
                <div className="text-center py-8">
                  <Bot className="w-12 h-12 text-[#E2E8F0] mx-auto mb-3" />
                  <p className="text-sm text-[#64748B]">
                    No hay reglas configuradas
                  </p>
                  <p className="text-xs text-[#94A3B8] mt-1">
                    Crea tu primera regla para empezar
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
