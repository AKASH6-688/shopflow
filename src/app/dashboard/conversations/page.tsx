"use client";

import { useState, useEffect, useRef } from "react";
import Header from "@/components/Header";
import { cn, formatDate } from "@/lib/utils";
import { MessageSquare, Send, User, Bot, UserCircle, AlertTriangle } from "lucide-react";

export default function ConversationsPage() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function fetchConversations() {
    const res = await fetch("/api/chat");
    const data = await res.json();
    setConversations(Array.isArray(data) ? data : []);
  }

  async function selectConversation(conv: any) {
    setSelected(conv);
    const res = await fetch(`/api/chat?conversationId=${conv.id}`);
    const data = await res.json();
    setMessages(data?.messages || []);
  }

  async function sendSellerMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!newMessage.trim() || !selected) return;
    setSending(true);

    await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        conversationId: selected.id,
        message: newMessage,
        sellerOverride: true,
      }),
    });

    setNewMessage("");
    setSending(false);

    // Refresh messages
    const res = await fetch(`/api/chat?conversationId=${selected.id}`);
    const data = await res.json();
    setMessages(data?.messages || []);
  }

  return (
    <div>
      <Header title="Conversations" />
      <div className="flex h-[calc(100vh-64px)]">
        {/* Conversation List */}
        <div className="w-80 border-r bg-white overflow-y-auto">
          <div className="p-4 border-b">
            <h3 className="font-semibold text-gray-900 text-sm">All Conversations</h3>
            <p className="text-xs text-gray-500 mt-0.5">View AI-customer chats and respond manually</p>
          </div>
          {conversations.map((conv) => (
            <button
              key={conv.id}
              onClick={() => selectConversation(conv)}
              className={cn(
                "w-full text-left p-4 border-b hover:bg-gray-50 transition-colors",
                selected?.id === conv.id && "bg-brand-50 border-l-2 border-l-brand-600"
              )}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-900 text-sm truncate">
                  {conv.customer?.name || "Anonymous"}
                </span>
                <span className={cn("badge text-[10px]", conv.isAI ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700")}>
                  {conv.isAI ? "AI" : "Manual"}
                </span>
              </div>
              <p className="text-xs text-gray-500 truncate mt-1">
                {conv.messages?.[0]?.content || "No messages"}
              </p>
              <div className="flex items-center justify-between mt-1">
                <span className="text-[10px] text-gray-400">{conv.customer?.phone}</span>
                <span className="text-[10px] text-gray-400">{conv._count?.messages || 0} messages</span>
              </div>
            </button>
          ))}
          {conversations.length === 0 && (
            <div className="p-8 text-center text-gray-400 text-sm">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
              No conversations yet
            </div>
          )}
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col bg-gray-50">
          {selected ? (
            <>
              {/* Chat Header */}
              <div className="px-6 py-3 bg-white border-b flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">{selected.customer?.name || "Customer"}</h3>
                  <p className="text-xs text-gray-500">{selected.customer?.phone}</p>
                </div>
                {selected.customer?.isBlacklisted && (
                  <span className="badge bg-red-100 text-red-700 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> Blacklisted
                  </span>
                )}
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={cn(
                      "flex gap-3 max-w-[70%]",
                      msg.sender === "CUSTOMER" ? "mr-auto" : "ml-auto flex-row-reverse"
                    )}
                  >
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                      msg.sender === "CUSTOMER" ? "bg-gray-200" :
                      msg.sender === "AI" ? "bg-purple-100" : "bg-brand-100"
                    )}>
                      {msg.sender === "CUSTOMER" ? <User className="w-4 h-4 text-gray-600" /> :
                       msg.sender === "AI" ? <Bot className="w-4 h-4 text-purple-600" /> :
                       <UserCircle className="w-4 h-4 text-brand-600" />}
                    </div>
                    <div>
                      <div className={cn(
                        "rounded-xl px-4 py-2.5 text-sm",
                        msg.sender === "CUSTOMER" ? "bg-white border" :
                        msg.sender === "AI" ? "bg-purple-50 border border-purple-100" :
                        "bg-brand-600 text-white"
                      )}>
                        {msg.content}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-gray-400">
                          {msg.sender === "AI" ? "AI Bot" : msg.sender === "SELLER" ? "You" : "Customer"}
                        </span>
                        <span className="text-[10px] text-gray-300">
                          {new Date(msg.createdAt).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Seller Input */}
              <form onSubmit={sendSellerMessage} className="p-4 bg-white border-t">
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a manual response..."
                    className="input-field flex-1"
                    disabled={sending}
                  />
                  <button type="submit" disabled={sending || !newMessage.trim()} className="btn-primary flex items-center gap-2 disabled:opacity-50">
                    <Send className="w-4 h-4" />
                    Send
                  </button>
                </div>
                <p className="text-[10px] text-gray-400 mt-2">
                  Your message will appear in the conversation. The AI will not respond to seller messages.
                </p>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400">
              <div className="text-center">
                <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Select a conversation to view</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
