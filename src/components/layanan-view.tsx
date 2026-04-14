"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, MessageCircle, User } from "lucide-react";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const QUICK_QUESTIONS = [
  "Alat apa saja yang tersedia?",
  "Berapa harga sewa scaffolding?",
  "Bagaimana cara menyewa?",
  "Area layanan di mana saja?",
];

const WELCOME_MESSAGE: ChatMessage = {
  id: "welcome",
  role: "assistant",
  content:
    "Halo! 👋 Saya Zahra, asisten virtual MITRA SEWA. Saya siap membantu Anda dengan informasi penyewaan alat konstruksi. Silakan tanyakan apa saja!",
  timestamp: new Date(),
};

function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex items-end gap-2.5 mb-4"
    >
      <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-white text-xs font-bold bg-gradient-to-br from-emerald-400 to-emerald-600">
        Z
      </div>
      <div className="bg-gray-100 rounded-2xl rounded-bl-md px-4 py-3">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
          <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
          <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
        </div>
      </div>
    </motion.div>
  );
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function LayananView() {
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isTypingRef = useRef(false);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isTyping]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      const maxHeight = 3 * 24; // 3 lines
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, maxHeight)}px`;
    }
  }, [input]);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isTypingRef.current) return;

      const userMessage: ChatMessage = {
        id: `user_${Date.now()}`,
        role: "user",
        content: text.trim(),
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setHasStarted(true);
      setInput("");
      setIsTyping(true);
      isTypingRef.current = true;

      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }

      try {
        const chatHistory = [...messages, userMessage]
          .filter((m) => m.id !== "welcome")
          .map((m) => ({ role: m.role, content: m.content }));

        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: chatHistory }),
        });

        const data = await response.json();

        const assistantMessage: ChatMessage = {
          id: `assistant_${Date.now()}`,
          role: "assistant",
          content:
            data.success && data.message
              ? data.message
              : "Maaf, saya sedang mengalami gangguan. Silakan coba lagi atau hubungi kami via WhatsApp di 0851-8592-4243. 🙏",
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, assistantMessage]);
      } catch {
        const errorMessage: ChatMessage = {
          id: `error_${Date.now()}`,
          role: "assistant",
          content:
            "Maaf, terjadi kesalahan koneksi. Silakan coba lagi nanti atau hubungi kami via WhatsApp di 0851-8592-4243. 🙏",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      } finally {
        setIsTyping(false);
        isTypingRef.current = false;
      }
    },
    [messages]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const handleQuickQuestion = (question: string) => {
    sendMessage(question);
  };

  // Welcome state - show when no user messages yet
  if (!hasStarted) {
    return (
      <div className="flex flex-col h-[calc(100vh-200px)] sm:h-[calc(100vh-180px)]">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4 px-1">
          <div className="w-1 h-6 bg-emerald-500 rounded-full" />
          <div>
            <h3 className="text-lg font-bold text-gray-900">Layanan</h3>
            <div className="flex items-center gap-1.5">
              <MessageCircle className="w-3.5 h-3.5 text-emerald-500" />
              <span className="text-xs text-gray-500">Chat dengan Zahra</span>
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-[10px] text-emerald-600 font-medium">Online</span>
            </div>
          </div>
        </div>

        {/* Welcome Card */}
        <div className="flex-1 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-md"
          >
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 text-center">
              {/* Zahra Avatar */}
              <div className="mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center mb-4 shadow-lg shadow-emerald-200">
                <span className="text-3xl font-bold text-white">Z</span>
              </div>
              <h4 className="text-lg font-bold text-gray-900 mb-1">
                Halo, saya Zahra! 👋
              </h4>
              <p className="text-sm text-gray-500 mb-5 leading-relaxed">
                Asisten virtual MITRA SEWA. Saya siap membantu Anda dengan
                informasi penyewaan alat konstruksi.
              </p>

              {/* Quick Questions */}
              <div className="space-y-2">
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-2">
                  Pertanyaan populer
                </p>
                {QUICK_QUESTIONS.map((q, i) => (
                  <motion.button
                    key={q}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 * i + 0.3 }}
                    onClick={() => handleQuickQuestion(q)}
                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 bg-gray-50 hover:bg-emerald-50 hover:text-emerald-700 rounded-xl transition-all border border-gray-100 hover:border-emerald-200"
                  >
                    {q}
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Input Area */}
        <div className="pt-4">
          <div className="flex items-end gap-2 bg-white rounded-2xl border border-gray-200 p-2 shadow-sm">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Tulis pesan..."
              rows={1}
              className="flex-1 resize-none bg-transparent text-sm text-gray-900 placeholder:text-gray-400 px-2 py-1.5 focus:outline-none max-h-[72px]"
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim()}
              className="w-9 h-9 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white flex items-center justify-center hover:from-emerald-600 hover:to-emerald-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0 shadow-sm"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Active chat view
  return (
    <div className="flex flex-col h-[calc(100vh-200px)] sm:h-[calc(100vh-180px)]">
      {/* Header */}
      <div className="flex items-center gap-3 mb-3 px-1">
        <div className="w-1 h-6 bg-emerald-500 rounded-full" />
        <div>
          <h3 className="text-lg font-bold text-gray-900">Layanan</h3>
          <div className="flex items-center gap-1.5">
            <MessageCircle className="w-3.5 h-3.5 text-emerald-500" />
            <span className="text-xs text-gray-500">Chat dengan Zahra</span>
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-[10px] text-emerald-600 font-medium">Online</span>
          </div>
        </div>
      </div>

      {/* Chat Messages Area */}
      <div className="flex-1 overflow-y-auto px-1 pb-3 space-y-1 min-h-0">
        <AnimatePresence initial={false}>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className={`flex items-end gap-2.5 mb-3 ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {/* Zahra Avatar */}
              {message.role === "assistant" && (
                <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-white text-xs font-bold bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-sm">
                  Z
                </div>
              )}

              {/* Message Bubble */}
              <div className="max-w-[80%] sm:max-w-[70%]">
                <div
                  className={`px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap break-words ${
                    message.role === "user"
                      ? "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-2xl rounded-br-md shadow-sm"
                      : "bg-gray-100 text-gray-800 rounded-2xl rounded-bl-md"
                  }`}
                >
                  {message.content}
                </div>
                <p
                  className={`text-[10px] text-gray-400 mt-1 ${
                    message.role === "user" ? "text-right" : "text-left"
                  }`}
                >
                  {formatTime(message.timestamp)}
                </p>
              </div>

              {/* User Avatar */}
              {message.role === "user" && (
                <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-gray-200 text-gray-500 shadow-sm">
                  <User className="w-4 h-4" />
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Typing Indicator */}
        <AnimatePresence>
          {isTyping && <TypingIndicator />}
        </AnimatePresence>

        <div ref={chatEndRef} />
      </div>

      {/* Quick Questions (show only after welcome, if few messages) */}
      {messages.length <= 3 && (
        <div className="flex gap-2 overflow-x-auto pb-2 px-1 scrollbar-hide">
          {QUICK_QUESTIONS.map((q) => (
            <button
              key={q}
              onClick={() => handleQuickQuestion(q)}
              className="flex-shrink-0 px-3 py-1.5 text-xs text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-full transition-all border border-emerald-200 hover:border-emerald-300 whitespace-nowrap"
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Input Area */}
      <div className="pt-2">
        <div className="flex items-end gap-2 bg-white rounded-2xl border border-gray-200 p-2 shadow-sm">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Tulis pesan..."
            rows={1}
            disabled={isTyping}
            className="flex-1 resize-none bg-transparent text-sm text-gray-900 placeholder:text-gray-400 px-2 py-1.5 focus:outline-none max-h-[72px] disabled:opacity-50"
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || isTyping}
            className="w-9 h-9 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white flex items-center justify-center hover:from-emerald-600 hover:to-emerald-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0 shadow-sm"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
