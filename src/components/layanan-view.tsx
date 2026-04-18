"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, User, RotateCcw, Sparkles, Trash2 } from "lucide-react";
import Image from "next/image";

const STORAGE_KEY = "mitrasewa-chat-history";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

const WELCOME_MESSAGE: ChatMessage = {
  id: "welcome",
  role: "assistant",
  content:
    "Assalamualaikum! 👋 Saya Zahra, asisten virtual MITRA SEWA. Saya siap membantu Anda dengan informasi penyewaan alat konstruksi. Silakan tanyakan apa saja!",
  timestamp: new Date().toISOString(),
};

function loadChatHistory(): ChatMessage[] {
  if (typeof window === "undefined") return [WELCOME_MESSAGE];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {
    // ignore
  }
  return [WELCOME_MESSAGE];
}

function saveChatHistory(messages: ChatMessage[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  } catch {
    // ignore
  }
}

function ZahraAvatar({ size = "sm" }: { size?: "sm" | "md" | "lg" }) {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-11 h-11",
    lg: "w-24 h-24",
  };
  const ringClasses = {
    sm: "ring-2 ring-emerald-200",
    md: "ring-2 ring-emerald-200",
    lg: "ring-4 ring-emerald-100 shadow-lg shadow-emerald-200/50",
  };

  return (
    <div
      className={`${sizeClasses[size]} rounded-full overflow-hidden flex-shrink-0 ${ringClasses[size]}`}
    >
      <Image
        src="/zahra-avatar.png"
        alt="Zahra"
        width={size === "lg" ? 96 : size === "md" ? 44 : 32}
        height={size === "lg" ? 96 : size === "md" ? 44 : 32}
        className="w-full h-full object-cover"
        unoptimized
      />
    </div>
  );
}

function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex items-end gap-2.5 mb-4"
    >
      <ZahraAvatar size="sm" />
      <div className="bg-gray-100 rounded-2xl rounded-bl-md px-4 py-3">
        <div className="flex items-center gap-1.5">
          <span
            className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
            style={{ animationDelay: "0ms" }}
          />
          <span
            className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
            style={{ animationDelay: "150ms" }}
          />
          <span
            className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
            style={{ animationDelay: "300ms" }}
          />
        </div>
      </div>
    </motion.div>
  );
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function LayananView() {
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isTypingRef = useRef(false);

  // Load chat history from localStorage on mount
  useEffect(() => {
    const history = loadChatHistory();
    setMessages(history);
    if (history.length > 1) {
      setHasStarted(true);
    }
    setIsLoaded(true);
  }, []);

  // Save to localStorage whenever messages change (after initial load)
  useEffect(() => {
    if (isLoaded) {
      saveChatHistory(messages);
    }
  }, [messages, isLoaded]);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isTyping]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      const maxHeight = 3 * 24;
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        maxHeight
      )}px`;
    }
  }, [input]);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isTypingRef.current) return;

      const userMessage: ChatMessage = {
        id: `user_${Date.now()}`,
        role: "user",
        content: text.trim(),
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setHasStarted(true);
      setInput("");
      setIsTyping(true);
      isTypingRef.current = true;

      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }

      try {
        const chatHistory = [...messages, userMessage]
          .filter((m) => m.id !== "welcome")
          .map((m) => ({ role: m.role, content: m.content }));

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);

        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: chatHistory }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        const data = await response.json();

        let replyContent: string;
        if (data.success && data.message) {
          replyContent = data.message;
        } else {
          replyContent =
            "Maaf, saya sedang mengalami gangguan teknis. Silakan coba lagi atau hubungi kami langsung via WhatsApp di 0851-8592-4243 ya! 🙏";
        }

        const assistantMessage: ChatMessage = {
          id: `assistant_${Date.now()}`,
          role: "assistant",
          content: replyContent,
          timestamp: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, assistantMessage]);
      } catch {
        const errorMessage: ChatMessage = {
          id: `error_${Date.now()}`,
          role: "assistant",
          content:
            "Maaf, koneksi bermasalah nih. Coba lagi ya, atau hubungi kami via WhatsApp di 0851-8592-4243! 🙏",
          timestamp: new Date().toISOString(),
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

  const handleClearChat = () => {
    const newMessages = [WELCOME_MESSAGE];
    setMessages(newMessages);
    setHasStarted(false);
    setInput("");
    saveChatHistory(newMessages);
  };

  // Welcome state — only show on first visit (no history)
  if (!hasStarted) {
    return (
      <div className="flex flex-col h-[calc(100vh-200px)] sm:h-[calc(100vh-180px)]">
        <div className="flex items-center gap-3 mb-4 px-1">
          <div className="w-1 h-6 bg-emerald-500 rounded-full" />
          <div className="flex items-center gap-2.5">
            <ZahraAvatar size="md" />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-gray-900">Zahra</h3>
                <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-medium">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                  Online
                </span>
              </div>
              <p className="text-xs text-gray-500">
                Asisten virtual MITRA SEWA
              </p>
            </div>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-md px-2"
          >
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 sm:p-8 text-center">
              <div className="mx-auto mb-4 relative">
                <ZahraAvatar size="lg" />
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center shadow-md">
                  <Sparkles className="w-3.5 h-3.5 text-white" />
                </div>
              </div>
              <h4 className="text-lg font-bold text-gray-900 mb-1">
                Assalamualaikum, saya Zahra! 👋
              </h4>
              <p className="text-sm text-gray-500 leading-relaxed">
                Asisten virtual MITRA SEWA yang siap membantu Anda dengan
                informasi penyewaan alat konstruksi.
              </p>
            </div>
          </motion.div>
        </div>

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
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-3">
          <div className="w-1 h-6 bg-emerald-500 rounded-full" />
          <div className="flex items-center gap-2.5">
            <ZahraAvatar size="md" />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-gray-900">Zahra</h3>
                <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-medium">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                  Online
                </span>
              </div>
              <p className="text-xs text-gray-500">
                Asisten virtual MITRA SEWA
              </p>
            </div>
          </div>
        </div>
        <button
          onClick={handleClearChat}
          className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-red-500 px-2.5 py-1.5 rounded-lg hover:bg-red-50 transition-all"
          title="Hapus semua chat"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Hapus</span>
        </button>
      </div>

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
              {message.role === "assistant" && <ZahraAvatar size="sm" />}

              <div className="max-w-[80%] sm:max-w-[70%]">
                {message.role === "assistant" && (
                  <p className="text-[10px] text-emerald-600 font-medium mb-0.5 ml-1">
                    Zahra
                  </p>
                )}
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
                    message.role === "user" ? "text-right" : "text-left ml-1"
                  }`}
                >
                  {formatTime(message.timestamp)}
                </p>
              </div>

              {message.role === "user" && (
                <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-gray-200 text-gray-500 shadow-sm">
                  <User className="w-4 h-4" />
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        <AnimatePresence>
          {isTyping && <TypingIndicator />}
        </AnimatePresence>

        <div ref={chatEndRef} />
      </div>

      <div className="pt-2">
        <div className="flex items-end gap-2 bg-white rounded-2xl border border-gray-200 p-2 shadow-sm">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Tulis pesan ke Zahra..."
            rows={1}
            disabled={isTyping}
            className="flex-1 resize-none bg-transparent text-sm text-gray-900 placeholder:text-gray-400 px-2 py-1.5 focus:outline-none max-h-[72px] disabled:opacity-50"
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || isTyping}
            className="w-9 h-9 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white flex items-center justify-center hover:from-emerald-600 hover:to-emerald-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0 shadow-sm"
          >
            {isTyping ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              >
                <Send className="w-4 h-4" />
              </motion.div>
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
