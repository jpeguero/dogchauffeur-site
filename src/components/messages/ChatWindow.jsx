import React, { useState, useRef, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Loader2 } from "lucide-react";
import { format } from "date-fns";

export default function ChatWindow({ tripId, currentUser, messages, onNewMessage }) {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!text.trim()) return;
    setSending(true);
    await base44.entities.Message.create({
      trip_id: tripId,
      sender_email: currentUser.email,
      sender_name: currentUser.full_name || currentUser.email,
      content: text.trim(),
      sender_role: currentUser.role === "driver" ? "driver" : (currentUser.role === "admin" || currentUser.role === "super_admin") ? "admin" : "owner",
    });
    setText("");
    setSending(false);
    onNewMessage?.();
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {(!messages || messages.length === 0) && (
          <div className="text-center py-12 text-[#6B5B4F]/40">
            <p className="text-sm">No messages yet. Start the conversation!</p>
          </div>
        )}
        {messages?.map((msg) => {
          const isMe = msg.sender_email === currentUser.email;
          return (
            <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[75%] ${isMe ? "order-2" : ""}`}>
                <div className={`rounded-2xl px-4 py-2.5 ${
                  isMe
                    ? "bg-[#1B4332] text-white rounded-br-md"
                    : "bg-white border border-[#EDF7F0] text-[#1B4332] rounded-bl-md"
                }`}>
                  <p className="text-sm leading-relaxed">{msg.content}</p>
                </div>
                <div className={`flex items-center gap-1 mt-1 ${isMe ? "justify-end" : ""}`}>
                  <span className="text-[10px] text-[#6B5B4F]/40">
                    {msg.sender_name} {msg.sender_role === "admin" && "(Admin)"} · {format(new Date(msg.created_date), "h:mm a")}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
      <div className="border-t border-[#EDF7F0] p-3">
        <div className="flex gap-2">
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
            placeholder="Type a message..."
            className="rounded-xl border-[#D8F3DC] bg-[#F9F7F3]"
          />
          <Button
            onClick={handleSend}
            disabled={!text.trim() || sending}
            size="icon"
            className="bg-[#1B4332] hover:bg-[#2D6A4F] rounded-xl shrink-0"
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
}