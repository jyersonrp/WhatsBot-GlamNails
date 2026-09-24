import { useState } from "react";
import { trpc } from "@/providers/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Link } from "react-router";
import {
  Users,
  Plus,
  Pencil,
  Trash2,
  Phone,
  Mail,
  Search,
  Loader2,
  Tag,
  ExternalLink,
  MessageSquare,
  Copy,
  Sparkles,
} from "lucide-react";

interface ContactItem {
  id: number;
  phoneNumber: string;
  name?: string | null;
  email?: string | null;
  notes?: string | null;
  labels?: string | null;
  isOptedIn: boolean;
  createdAt: Date | string;
}

export default function Contacts() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<ContactItem | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const utils = trpc.useUtils();
  const { data: contacts, isLoading } = trpc.contact.list.useQuery(
    searchQuery ? { search: searchQuery } : undefined
  );

  const createContact = trpc.contact.create.useMutation({
    onSuccess: () => {
      utils.contact.list.invalidate();
      setIsDialogOpen(false);
      toast.success("Contacto creado");
    },
  });

  const updateContact = trpc.contact.update.useMutation({
    onSuccess: () => {
      utils.contact.list.invalidate();
      setIsDialogOpen(false);
      setEditingContact(null);
      toast.success("Contacto actualizado");
    },
  });

  const deleteContact = trpc.contact.delete.useMutation({
    onSuccess: () => {
      utils.contact.list.invalidate();
      toast.success("Contacto eliminado");
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      phoneNumber: formData.get("phoneNumber") as string,
      name: (formData.get("name") as string) || undefined,
      email: (formData.get("email") as string) || undefined,
      notes: (formData.get("notes") as string) || undefined,
    };

    if (editingContact) {
      const updateData: { name?: string; email?: string; notes?: string } = {};
      if (data.name) updateData.name = data.name;
      if (data.email) updateData.email = data.email;
      if (data.notes) updateData.notes = data.notes;
      updateContact.mutate({ id: editingContact.id, data: updateData });
    } else {
      createContact.mutate(data);
    }
  };

  const getInitials = (name: string | null) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getAvatarColor = (name: string | null) => {
    if (!name) return "bg-slate-400";
    const colors = [
      "bg-emerald-500",
      "bg-blue-500",
      "bg-violet-500",
      "bg-amber-500",
      "bg-rose-500",
      "bg-cyan-500",
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            Directorio de Clientas <Sparkles className="w-5 h-5 text-rose-500" />
          </h1>
          <p className="text-sm text-slate-500">
            Base de datos de clientas de Glam Nails Maturín con historial de citas y WhatsApp.
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              className="bg-rose-600 hover:bg-rose-700 text-white font-semibold gap-1.5 shadow-sm"
              onClick={() => setEditingContact(null)}
            >
              <Plus className="w-4 h-4 mr-1" />
              Nueva Clienta
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md bg-white">
            <DialogHeader>
              <DialogTitle className="text-base font-bold text-slate-900">
                {editingContact ? "Editar Clienta" : "Registrar Nueva Clienta"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="phoneNumber">Número de WhatsApp *</Label>
                <Input
                  id="phoneNumber"
                  name="phoneNumber"
                  defaultValue={editingContact?.phoneNumber || "+58412"}
                  placeholder="+584121234567"
                  required
                  disabled={!!editingContact}
                  className="font-mono"
                />
              </div>
              <div>
                <Label htmlFor="name">Nombre</Label>
                <Input
                  id="name"
                  name="name"
                  defaultValue={editingContact?.name || ""}
                  placeholder="Nombre completo"
                />
              </div>
              <div>
                <Label htmlFor="email">Correo electrónico</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  defaultValue={editingContact?.email || ""}
                  placeholder="correo@ejemplo.com"
                />
              </div>
              <div>
                <Label htmlFor="notes">Notas</Label>
                <Input
                  id="notes"
                  name="notes"
                  defaultValue={editingContact?.notes || ""}
                  placeholder="Notas adicionales..."
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
                  {editingContact ? "Guardar" : "Crear Contacto"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B]" />
        <Input
          placeholder="Buscar contactos por nombre..."
          className="pl-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Contacts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {isLoading ? (
          <div className="col-span-full flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-[#64748B]" />
          </div>
        ) : (
          contacts?.map((contact) => (
            <Card
              key={contact.id}
              className="hover:shadow-md transition-shadow group"
            >
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <div
                    className={`w-12 h-12 rounded-full ${getAvatarColor(
                      contact.name
                    )} flex items-center justify-center text-white font-semibold text-sm shrink-0`}
                  >
                    {getInitials(contact.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-sm font-semibold text-[#0F172A]">
                          {contact.name || "Sin nombre"}
                        </h3>
                        <div className="flex items-center gap-1 text-xs text-[#64748B] mt-0.5">
                          <Phone className="w-3 h-3" />
                          {contact.phoneNumber}
                        </div>
                        {contact.email && (
                          <div className="flex items-center gap-1 text-xs text-[#64748B] mt-0.5">
                            <Mail className="w-3 h-3" />
                            {contact.email}
                          </div>
                        )}
                      </div>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => {
                            setEditingContact(contact);
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
                            if (confirm("¿Eliminar este contacto?")) {
                              deleteContact.mutate({ id: contact.id });
                            }
                          }}
                        >
                          <Trash2 className="w-3.5 h-3.5 text-[#64748B]" />
                        </Button>
                      </div>
                    </div>

                    {contact.notes && (
                      <p className="text-xs text-[#64748B] mt-2 bg-slate-50 p-2 rounded">
                        {contact.notes}
                      </p>
                    )}

                    {(() => {
                      const labels = contact.labels;
                      if (labels && Array.isArray(labels)) {
                        return (
                          <div className="flex items-center gap-1 mt-2 flex-wrap">
                            <Tag className="w-3 h-3 text-[#94A3B8]" />
                            {(labels as string[]).map((label, i) => (
                              <span
                                key={i}
                                className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px]"
                              >
                                {label}
                              </span>
                            ))}
                          </div>
                        );
                      }
                      return null;
                    })()}

                    <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          contact.isOptedIn
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-red-50 text-red-700 border border-red-200"
                        }`}
                      >
                        {contact.isOptedIn ? "Opt-in ✓" : "Opt-out"}
                      </span>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(contact.phoneNumber);
                            toast.success("Teléfono copiado al portapapeles");
                          }}
                          className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors"
                          title="Copiar teléfono"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>

                        <a
                          href={`https://wa.me/${contact.phoneNumber.replace(/[^0-9]/g, "")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded-md border border-emerald-200 transition-colors"
                          title="Abrir chat en WhatsApp Web"
                        >
                          <Phone className="w-3 h-3 text-emerald-600" />
                          <span>WhatsApp</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>

                        <Button
                          asChild
                          size="sm"
                          variant="ghost"
                          className="h-6 text-[11px] font-medium text-rose-700 hover:bg-rose-50 px-2 gap-1"
                        >
                          <Link to="/conversations" title="Ver conversaciones en CRM">
                            <MessageSquare className="w-3 h-3 text-rose-600" />
                            <span>CRM</span>
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {!isLoading && (!contacts || contacts.length === 0) && (
        <div className="text-center py-12">
          <Users className="w-12 h-12 text-[#E2E8F0] mx-auto mb-3" />
          <p className="text-sm text-[#64748B]">No hay contactos registrados</p>
          <p className="text-xs text-[#94A3B8] mt-1">
            Agrega tu primer contacto de WhatsApp
          </p>
        </div>
      )}
    </div>
  );
}
