import { useState } from "react";
import { trpc } from "@/providers/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  FileText,
  Plus,
  Pencil,
  Trash2,
  Copy,
  Send,
  Loader2,
  CheckCircle2,
  Clock,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

const categoryColors: Record<string, string> = {
  marketing: "bg-pink-50 text-pink-600",
  utility: "bg-blue-50 text-blue-600",
  authentication: "bg-violet-50 text-violet-600",
};

const categoryLabels: Record<string, string> = {
  marketing: "Marketing",
  utility: "Utilidad",
  authentication: "Autenticación",
};

const statusConfig: Record<string, { icon: typeof CheckCircle2; color: string; label: string }> = {
  approved: { icon: CheckCircle2, color: "text-emerald-600", label: "Aprobada" },
  pending: { icon: Clock, color: "text-amber-600", label: "Pendiente" },
  draft: { icon: FileText, color: "text-slate-500", label: "Borrador" },
  rejected: { icon: AlertCircle, color: "text-red-600", label: "Rechazada" },
};

export default function Templates() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<any>(null);

  const utils = trpc.useUtils();
  const { data: templates, isLoading } = trpc.template.list.useQuery();

  const createTemplate = trpc.template.create.useMutation({
    onSuccess: () => {
      utils.template.list.invalidate();
      setIsDialogOpen(false);
      toast.success("Plantilla creada exitosamente");
    },
  });

  const updateTemplate = trpc.template.update.useMutation({
    onSuccess: () => {
      utils.template.list.invalidate();
      setIsDialogOpen(false);
      setEditingTemplate(null);
      toast.success("Plantilla actualizada");
    },
  });

  const deleteTemplate = trpc.template.delete.useMutation({
    onSuccess: () => {
      utils.template.list.invalidate();
      toast.success("Plantilla eliminada");
    },
  });

  const submitTemplate = trpc.template.submit.useMutation({
    onSuccess: () => {
      utils.template.list.invalidate();
      toast.success("Plantilla enviada a aprobación");
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name") as string,
      category: formData.get("category") as "marketing" | "utility" | "authentication",
      language: "es",
      content: formData.get("content") as string,
    };

    if (editingTemplate) {
      updateTemplate.mutate({ id: editingTemplate.id, data });
    } else {
      createTemplate.mutate(data);
    }
  };

  const duplicateTemplate = (t: any) => {
    createTemplate.mutate({
      name: `${t.name}_copia`,
      category: t.category,
      language: t.language,
      content: t.content,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#0F172A]">
            Plantillas de Mensajes
          </h1>
          <p className="text-sm text-[#64748B] mt-1">
            Gestiona las plantillas aprobadas para envío masivo
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              className="bg-[#10B981] hover:bg-[#059669] text-white"
              onClick={() => setEditingTemplate(null)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Nueva Plantilla
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editingTemplate ? "Editar Plantilla" : "Nueva Plantilla"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Nombre</Label>
                <Input
                  id="name"
                  name="name"
                  defaultValue={editingTemplate?.name || ""}
                  placeholder="bienvenida_cliente"
                  required
                />
              </div>
              <div>
                <Label htmlFor="category">Categoría</Label>
                <Select
                  name="category"
                  defaultValue={editingTemplate?.category || "utility"}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="utility">Utilidad</SelectItem>
                    <SelectItem value="marketing">Marketing</SelectItem>
                    <SelectItem value="authentication">
                      Autenticación
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="content">Contenido</Label>
                <Textarea
                  id="content"
                  name="content"
                  defaultValue={editingTemplate?.content || ""}
                  placeholder="Usa {{1}}, {{2}} para variables..."
                  rows={5}
                  required
                />
                <p className="text-xs text-[#64748B] mt-1">
                  Usa {"{{1}}"}, {"{{2}}"}, etc. para variables dinámicas
                </p>
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
                  {editingTemplate ? "Guardar" : "Crear Plantilla"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Templates Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-[#64748B]" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {templates?.map((template) => {
            const statusInfo = statusConfig[template.status] || statusConfig.draft;
            const StatusIcon = statusInfo.icon;

            return (
              <Card
                key={template.id}
                className="hover:shadow-md transition-shadow group"
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase",
                          categoryColors[template.category]
                        )}
                      >
                        {categoryLabels[template.category]}
                      </span>
                      <span className={cn("flex items-center gap-1 text-xs", statusInfo.color)}>
                        <StatusIcon className="w-3 h-3" />
                        {statusInfo.label}
                      </span>
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => duplicateTemplate(template)}
                      >
                        <Copy className="w-3.5 h-3.5 text-[#64748B]" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => {
                          setEditingTemplate(template);
                          setIsDialogOpen(true);
                        }}
                      >
                        <Pencil className="w-3.5 h-3.5 text-[#64748B]" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => {
                          if (confirm("¿Eliminar esta plantilla?")) {
                            deleteTemplate.mutate({ id: template.id });
                          }
                        }}
                      >
                        <Trash2 className="w-3.5 h-3.5 text-[#64748B]" />
                      </Button>
                    </div>
                  </div>

                  <h3 className="text-sm font-semibold text-[#0F172A] mb-2">
                    {template.name}
                  </h3>

                  <div className="bg-slate-50 rounded-lg p-3 mb-3">
                    <p className="text-xs text-[#64748B] whitespace-pre-wrap">
                      {template.content}
                    </p>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[#94A3B8]">
                      {template.language === "es" ? "Español" : template.language}
                    </span>
                    {template.status === "draft" && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => submitTemplate.mutate({ id: template.id })}
                      >
                        <Send className="w-3 h-3 mr-1" />
                        Enviar a aprobación
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {!isLoading && (!templates || templates.length === 0) && (
        <div className="text-center py-12">
          <FileText className="w-12 h-12 text-[#E2E8F0] mx-auto mb-3" />
          <p className="text-sm text-[#64748B]">No hay plantillas creadas</p>
          <p className="text-xs text-[#94A3B8] mt-1">
            Crea tu primera plantilla de mensaje
          </p>
        </div>
      )}
    </div>
  );
}
