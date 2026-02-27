"use client";

import { useState, useRef, useEffect } from "react";
import { Bot, Send, Loader2, User } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function AgentsPage() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend() {
    if (!message.trim() || loading) return;

    const userMessage = message.trim();
    setMessage("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setLoading(true);

    try {
      const res = await fetch("/api/agents/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage,
          conversationId,
        }),
      });

      const data = await res.json();

      if (data.response) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.response },
        ]);
        if (data.conversationId) {
          setConversationId(data.conversationId);
        }
      } else if (data.error) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: `Error: ${data.error}`,
          },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Failed to connect. Check your connection.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="p-6 flex flex-col h-screen">
      <div className="mb-4">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Bot className="h-6 w-6 text-[#ec4899]" />
          Creator Agents
        </h1>
        <p className="text-sm text-muted-foreground">
          AI-powered content strategy assistant
        </p>
      </div>

      <Card className="bg-[#1a1a2e] border-white/5 flex-1 flex flex-col min-h-0">
        <CardContent className="flex-1 flex flex-col p-4 min-h-0">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto space-y-4 pb-4">
            {messages.length === 0 ? (
              <div className="flex-1 flex items-center justify-center h-full">
                <div className="text-center space-y-3">
                  <Bot className="h-12 w-12 text-[#ec4899]/30 mx-auto" />
                  <p className="text-lg font-medium">
                    I&apos;m Morpheus
                  </p>
                  <p className="text-muted-foreground text-sm max-w-md">
                    Your content intelligence AI. Ask me about trends, generate
                    ideas, write scripts, or review your content.
                  </p>
                  <div className="flex flex-wrap justify-center gap-2 mt-4">
                    {[
                      "What's trending right now?",
                      "Generate 5 TikTok ideas",
                      "Write a hook for fitness content",
                      "Review my script",
                    ].map((suggestion) => (
                      <button
                        key={suggestion}
                        onClick={() => setMessage(suggestion)}
                        className="px-3 py-1.5 text-xs rounded-full border border-white/10 text-muted-foreground hover:text-white hover:border-[#ec4899]/30 transition-colors"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex gap-3 ${
                    msg.role === "user" ? "justify-end" : ""
                  }`}
                >
                  {msg.role === "assistant" && (
                    <div className="w-8 h-8 rounded-full bg-[#ec4899]/20 flex items-center justify-center shrink-0">
                      <Bot className="h-4 w-4 text-[#ec4899]" />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] rounded-lg px-4 py-3 text-sm leading-relaxed ${
                      msg.role === "user"
                        ? "bg-[#ec4899]/20 text-white"
                        : "bg-[#0a0a0a]"
                    }`}
                  >
                    <pre className="whitespace-pre-wrap font-sans">
                      {msg.content}
                    </pre>
                  </div>
                  {msg.role === "user" && (
                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                      <User className="h-4 w-4" />
                    </div>
                  )}
                </div>
              ))
            )}
            {loading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-[#ec4899]/20 flex items-center justify-center shrink-0">
                  <Bot className="h-4 w-4 text-[#ec4899]" />
                </div>
                <div className="bg-[#0a0a0a] rounded-lg px-4 py-3">
                  <Loader2 className="h-4 w-4 animate-spin text-[#ec4899]" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="flex gap-2 pt-3 border-t border-white/5">
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about trends, generate ideas, write scripts..."
              className="bg-[#0a0a0a] border-white/10 resize-none min-h-[44px] max-h-[120px]"
              rows={1}
            />
            <Button
              onClick={handleSend}
              className="bg-[#ec4899] hover:bg-[#be185d] text-white px-4 self-end"
              disabled={!message.trim() || loading}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
