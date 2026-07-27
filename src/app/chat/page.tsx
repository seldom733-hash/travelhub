"use client";

import { useState } from "react";
import { useI18n } from "@/lib/i18n-context";

interface Message {
  id: number;
  sender: "user" | "other";
  text: string;
  time: string;
}

interface Conversation {
  id: number;
  name: string;
  avatar: string;
  lastMessage: string;
  time: string;
  unread: number;
  online: boolean;
}

const conversations: Conversation[] = [
  {
    id: 1,
    name: "TravelPro Azerbaijan",
    avatar: "TP",
    lastMessage: "Ваш заказ подтвержден! Детали отправлены на почту.",
    time: "10:30",
    unread: 2,
    online: true,
  },
  {
    id: 2,
    name: "Ahmed (Гид)",
    avatar: "AH",
    lastMessage: "Давайте встретимся у отеля в 9:00",
    time: "Вчера",
    unread: 0,
    online: true,
  },
  {
    id: 3,
    name: "Elena (Фотограф)",
    avatar: "EL",
    lastMessage: "Фотографии готовы! Посмотрите в галерее.",
    time: "Вчера",
    unread: 1,
    online: false,
  },
  {
    id: 4,
    name: "Rixos Premium Support",
    avatar: "RX",
    lastMessage: "Спасибо за обращение! Мы ответим в течение часа.",
    time: "18 июл",
    unread: 0,
    online: true,
  },
];

const initialMessages: Record<number, Message[]> = {
  1: [
    { id: 1, sender: "other", text: "Здравствуйте! Ваш заказ #TH-123456 принят.", time: "10:15" },
    { id: 2, sender: "user", text: "Спасибо! Подтвердите, пожалуйста, даты.", time: "10:20" },
    { id: 3, sender: "other", text: "Ваш заказ подтвержден! Детали отправлены на почту.", time: "10:30" },
  ],
};

export default function ChatPage() {
  const { t } = useI18n();
  const [activeConversation, setActiveConversation] = useState<number | null>(1);
  const [newMessage, setNewMessage] = useState("");
  const [messages, setMessages] = useState(initialMessages);

  const sendMessage = () => {
    if (!newMessage.trim() || !activeConversation) return;
    const newMsg: Message = {
      id: Date.now(),
      sender: "user",
      text: newMessage,
      time: new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" }),
    };
    setMessages((prev) => ({
      ...prev,
      [activeConversation]: [...(prev[activeConversation] || []), newMsg],
    }));
    setNewMessage("");
  };

  return (
    <div className="min-h-[calc(100vh-120px)] bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-secondary mb-6">{t("chat.title")}</h1>

        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden h-[calc(100vh-200px)] flex">
          {/* Conversations List */}
          <div className="w-80 border-r border-gray-100 flex flex-col shrink-0">
            <div className="p-4 border-b border-gray-100">
              <input
                type="text"
                placeholder={t("chat.searchPlaceholder")}
                className="w-full h-10 px-4 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:border-primary outline-none"
              />
            </div>
            <div className="flex-1 overflow-y-auto">
              {conversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => setActiveConversation(conv.id)}
                  className={`w-full flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors ${
                    activeConversation === conv.id ? "bg-primary/5" : ""
                  }`}
                >
                  <div className="relative">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-sm font-bold text-primary">
                      {conv.avatar}
                    </div>
                    {conv.online && (
                      <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-success rounded-full border-2 border-white" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-secondary text-sm truncate">{conv.name}</span>
                      <span className="text-xs text-gray-400 shrink-0">{conv.time}</span>
                    </div>
                    <p className="text-xs text-gray-500 truncate mt-0.5">{conv.lastMessage}</p>
                  </div>
                  {conv.unread > 0 && (
                    <span className="w-5 h-5 bg-primary text-white text-[10px] rounded-full flex items-center justify-center font-bold shrink-0">
                      {conv.unread}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Chat Area */}
          {activeConversation ? (
            <div className="flex-1 flex flex-col">
              {/* Chat Header */}
              <div className="h-16 px-6 flex items-center justify-between border-b border-gray-100 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-sm font-bold text-primary">
                    {conversations.find((c) => c.id === activeConversation)?.avatar}
                  </div>
                  <div>
                    <div className="font-semibold text-secondary text-sm">
                      {conversations.find((c) => c.id === activeConversation)?.name}
                    </div>
                    <div className="text-xs text-success">{t("chat.online")}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors">📞</button>
                  <button className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors">📹</button>
                  <button className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors">⋮</button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {(messages[activeConversation] || []).map((msg) => (
                  <div key={msg.id} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[70%] px-4 py-3 rounded-2xl ${
                      msg.sender === "user"
                        ? "bg-primary text-white rounded-br-md"
                        : "bg-gray-100 text-secondary rounded-bl-md"
                    }`}>
                      <p className="text-sm">{msg.text}</p>
                      <p className={`text-[10px] mt-1 ${msg.sender === "user" ? "text-white/60" : "text-gray-400"}`}>
                        {msg.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Input */}
              <div className="p-4 border-t border-gray-100">
                <div className="flex items-center gap-3">
                  <button className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors text-lg">📎</button>
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                    placeholder={t("chat.writeMessage")}
                    className="flex-1 h-10 px-4 rounded-full bg-gray-50 border border-gray-200 text-sm focus:border-primary outline-none"
                  />
                  <button className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors text-lg">🎤</button>
                  <button
                    onClick={sendMessage}
                    className="w-10 h-10 bg-primary hover:bg-primary-dark rounded-full flex items-center justify-center transition-colors text-white"
                  >
                    ➤
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400">
              <div className="text-center">
                <div className="text-5xl mb-4">💬</div>
                <p>{t("chat.noChatSelected")}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
