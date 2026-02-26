"use client";

import { useState } from "react";
import { Bot, Send } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export default function AgentsPage() {
  const [message, setMessage] = useState("");

  return (
    <div className="p-6 flex flex-col h-[calc(100vh-0px)]">
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Bot className="h-6 w-6 text-[#ec4899]" />
          Creator Agents
        </h1>
        <p className="text-sm text-muted-foreground">
          AI-powered assistant for content strategy
        </p>
      </div>

      {/* Chat area */}
      <Card className="bg-[#1a1a2e] border-white/5 flex-1 flex flex-col">
        <CardContent className="flex-1 flex flex-col p-4">
          {/* Messages */}
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center space-y-3">
              <Bot className="h-12 w-12 text-[#ec4899]/30 mx-auto" />
              <p className="text-muted-foreground text-sm max-w-md">
                Ask me anything about your content strategy. I can analyze
                trends, generate ideas, write scripts, and review your content.
              </p>
            </div>
          </div>

          {/* Input */}
          <div className="flex gap-2 pt-4 border-t border-white/5">
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Ask about trends, generate ideas, write scripts..."
              className="bg-[#0a0a0a] border-white/10 resize-none min-h-[44px] max-h-[120px]"
              rows={1}
            />
            <Button
              className="bg-[#ec4899] hover:bg-[#be185d] text-white px-4 self-end"
              disabled={!message.trim()}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
