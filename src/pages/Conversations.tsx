import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router";
import { trpc } from "@/providers/trpc";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import {
  Send,
  Archive,
  User,
  Bot,
  Headset,
  Phone,
  MoreVertical,
  Search,
  Sparkles,
  Loader2,
  MessageSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

export default function Conversations() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const [selectedId, setSelectedId] = useState<number | null>(
    id ? parseInt(id) : null
  );
  const [messageInput, setMessageInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const utils = trpc.useUtils();

  const { data: conversations, isLoading: convLoading } =
    trpc.conversation.list.useQuery({ status: "active" });

  const { data: chatMessages, isLoading: msgLoading } =
    trpc.message.list.useQuery(
      { conversationId: selectedId || 0 },
      { enabled: !!selectedId }
    );

  const { data: activeConversation } =
    trpc.conversation.byId.useQuery(
      { id: selectedId || 0 },
      { enabled: !!selectedId }
    );

  const sendMessage = trpc.message.create.useMutation({
    onSuccess: () => {
      utils.message.list.invalidate({ conversationId: selectedId || 0 });
      utils.conversation.list.invalidate();
      utils.conversation.recent.invalidate();
      utils.dashboard.stats.invalidate();
    },
  });

  const archiveConv = trpc.conversation.archive.useMutation({
    onSuccess: () => {
      utils.conversation.list.invalidate();
      setSelectedId(null);
      navigate("/conversations");
      toast.success("Conversación archivada");
    },
  });

  const resetUnread = trpc.conversation.resetUnread.useMutation({
    onSuccess: () => {
      utils.conversation.list.invalidate();
    },
  });

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  // Reset unread when selecting conversation
  useEffect(() => {
    if (selectedId) {
      resetUnread.mutate({ id: selectedId });
    }
  }, [selectedId]);

  // Update URL when selecting
  const handleSelectConversation = (convId: number) => {
    setSelectedId(convId);
    navigate(`/conversations/${convId}`);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !selectedId) return;

    sendMessage.mutate({
      conversationId: selectedId,
      content: messageInput.trim(),
      sender: "agent",
    });
    setMessageInput("");
    inputRef.current?.focus();
  };

  const filteredConversations = conversations?.filter((conv) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      conv.contactName?.toLowerCase().includes(query) ||
      conv.phoneNumber.includes(query) ||
      conv.lastMessage?.toLowerCase().includes(query)
    );
  });

  const getSenderIcon = (sender: string) => {
    switch (sender) {
      case "bot":
        return <Bot className="w-3.5 h-3.5" />;
      case "agent":
        return <Headset className="w-3.5 h-3.5" />;
      default:
        return <User className="w-3.5 h-3.5" />;
    }
  };

  const getSenderColor = (sender: string) => {
    switch (sender) {
      case "bot":
        return "bg-violet-100 text-violet-700";
      case "agent":
        return "bg-blue-100 text-blue-700";
      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  return (
    <div className="h-[calc(100vh-6rem)] flex gap-4">
      {/* Conversations List */}
      <Card className="w-80 flex flex-col overflow-hidden shrink-0">
        <div className="p-3 border-b border-[#E2E8F0]">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B]" />
            <Input
              placeholder="Buscar conversación..."
              className="pl-9 text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <ScrollArea className="flex-1">
          {convLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-[#64748B]" />
            </div>
          ) : (
            <div className="divide-y divide-[#E2E8F0]">
              {filteredConversations?.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => handleSelectConversation(conv.id)}
                  className={cn(
                    "w-full flex items-start gap-3 p-3 text-left transition-colors hover:bg-slate-50",
                    selectedId === conv.id && "bg-emerald-50 hover:bg-emerald-50"
                  )}
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#10B981] to-[#059669] flex items-center justify-center text-white font-semibold shrink-0">
                    {conv.contactName?.charAt(0) || "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-[#0F172A] truncate">
                        {conv.contactName || conv.phoneNumber}
                      </p>
                      <span className="text-xs text-[#64748B] shrink-0">
                        {conv.lastMessageAt
                          ? formatDistanceToNow(new Date(conv.lastMessageAt), {
                              addSuffix: true,
                              locale: es,
                            })
                          : ""}
                      </span>
                    </div>
                    <p className="text-xs text-[#64748B] truncate mt-0.5">
                      {conv.lastMessage || "Sin mensajes"}
                    </p>
                  </div>
                  {conv.unreadCount > 0 && (
                    <span className="w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center shrink-0">
                      {conv.unreadCount}
                    </span>
                  )}
                </button>
              ))}
              {filteredConversations?.length === 0 && (
                <p className="text-sm text-[#64748B] py-8 text-center">
                  No hay conversaciones
                </p>
              )}
            </div>
          )}
        </ScrollArea>
      </Card>

      {/* Chat Area */}
      <Card className="flex-1 flex flex-col overflow-hidden">
        {selectedId && activeConversation ? (
          <>
            {/* Chat Header */}
            <div className="h-14 border-b border-[#E2E8F0] flex items-center justify-between px-4 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#10B981] to-[#059669] flex items-center justify-center text-white font-semibold text-sm">
                  {activeConversation.contactName?.charAt(0) || "?"}
                </div>
                <div>
                  <p className="text-sm font-medium text-[#0F172A]">
                    {activeConversation.contactName || activeConversation.phoneNumber}
                  </p>
                  <div className="flex items-center gap-1 text-xs text-[#64748B]">
                    <Phone className="w-3 h-3" />
                    {activeConversation.phoneNumber}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-[#64748B] hover:text-emerald-600"
                  onClick={() => {
                    toast.info("Bot responderá a la siguiente pregunta");
                  }}
                >
                  <Sparkles className="w-4 h-4 mr-1" />
                  Bot
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-[#64748B] hover:text-amber-600"
                  onClick={() => archiveConv.mutate({ id: selectedId })}
                >
                  <Archive className="w-4 h-4 mr-1" />
                  Archivar
                </Button>
                <Button variant="ghost" size="icon" className="text-[#64748B]">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              {msgLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-5 h-5 animate-spin text-[#64748B]" />
                </div>
              ) : (
                <div className="space-y-3">
                  {chatMessages?.map((msg) => (
                    <div
                      key={msg.id}
                      className={cn(
                        "flex",
                        msg.sender === "customer"
                          ? "justify-start"
                          : "justify-end"
                      )}
                    >
                      <div
                        className={cn(
                          "max-w-[70%] rounded-2xl px-4 py-2.5 text-sm",
                          msg.sender === "customer"
                            ? "bg-slate-100 text-[#0F172A] rounded-bl-sm"
                            : msg.sender === "bot"
                            ? "bg-violet-500 text-white rounded-br-sm"
                            : "bg-[#10B981] text-white rounded-br-sm"
                        )}
                      >
                        <div className="flex items-center gap-1.5 mb-1">
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium",
                              getSenderColor(msg.sender)
                            )}
                          >
                            {getSenderIcon(msg.sender)}
                            {msg.sender === "bot"
                              ? "Bot"
                              : msg.sender === "agent"
                              ? "Agente"
                              : "Cliente"}
                          </span>
                        </div>
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                        <p
                          className={cn(
                            "text-[10px] mt-1",
                            msg.sender === "customer"
                              ? "text-[#64748B]"
                              : "text-white/70"
                          )}
                        >
                          {msg.createdAt
                            ? formatDistanceToNow(new Date(msg.createdAt), {
                                addSuffix: true,
                                locale: es,
                              })
                            : ""}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </ScrollArea>

            {/* Input */}
            <form
              onSubmit={handleSendMessage}
              className="p-3 border-t border-[#E2E8F0] flex items-center gap-2 shrink-0"
            >
              <Input
                ref={inputRef}
                placeholder="Escribe un mensaje..."
                className="flex-1"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
              />
              <Button
                type="submit"
                size="icon"
                className="bg-[#10B981] hover:bg-[#059669] text-white"
                disabled={!messageInput.trim()}
              >
                <Send className="w-4 h-4" />
              </Button>
            </form>
          </>
        ) : (
          /* Empty State */
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mb-4">
              <MessageSquare className="w-8 h-8 text-[#10B981]" />
            </div>
            <h3 className="text-lg font-medium text-[#0F172A] mb-1">
              Selecciona una conversación
            </h3>
            <p className="text-sm text-[#64748B] max-w-sm">
              Elige una conversación de la lista para ver los mensajes y
              responder a tus clientes.
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}


