"use client";

import { useEffect, useRef, useState, useCallback } from "react";

interface ChatMessage {
  id: string;
  user: string;
  text: string;
  timestamp: number;
}

interface ChatProps {
  onViewerCount?: (count: number) => void;
}

const ADJECTIVES = ["Swift", "Cosmic", "Neon", "Chill", "Vivid", "Lunar", "Zen", "Echo"];
const NOUNS = ["Panda", "Fox", "Owl", "Wolf", "Cat", "Hawk", "Bear", "Lynx"];

function generateUsername() {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  const num = Math.floor(Math.random() * 100);
  return `${adj}${noun}${num}`;
}

export default function Chat({ onViewerCount }: ChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [username] = useState(generateUsername);
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const cleanupRef = useRef(false);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    cleanupRef.current = false;

    function connect() {
      // Close any stale connection before opening a new one
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close();
      }

      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const ws = new WebSocket(`${protocol}//${window.location.host}/ws`);

      ws.onopen = () => {
        setConnected(true);
        ws.send(JSON.stringify({ type: "join", user: username }));
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);

        if (data.type === "chat") {
          setMessages((prev) => [...prev.slice(-100), data]);
        } else if (data.type === "viewers") {
          onViewerCount?.(data.count);
        } else if (data.type === "system") {
          setMessages((prev) => [
            ...prev.slice(-100),
            {
              id: crypto.randomUUID(),
              user: "SYSTEM",
              text: data.text,
              timestamp: Date.now(),
            },
          ]);
        }
      };

      ws.onclose = () => {
        setConnected(false);
        if (!cleanupRef.current) {
          reconnectTimerRef.current = setTimeout(connect, 2000);
        }
      };

      wsRef.current = ws;
    }

    connect();

    return () => {
      cleanupRef.current = true;
      clearTimeout(reconnectTimerRef.current);
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !wsRef.current) return;

    wsRef.current.send(
      JSON.stringify({
        type: "chat",
        user: username,
        text: input.trim(),
      })
    );
    setInput("");
  };

  return (
    <div className="chat-container">
      <div className="chat-header">
        <span className="chat-title">LIVE CHAT</span>
        <span className={`connection-status ${connected ? "connected" : ""}`}>
          {connected ? "CONNECTED" : "RECONNECTING..."}
        </span>
      </div>

      <div className="chat-messages">
        {messages.length === 0 && (
          <div className="chat-empty">No messages yet. Say hello!</div>
        )}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`chat-message ${msg.user === "SYSTEM" ? "system-message" : ""}`}
          >
            <span className="chat-user">{msg.user}</span>
            <span className="chat-text">{msg.text}</span>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={sendMessage} className="chat-input-form">
        <div className="chat-username-tag">{username}</div>
        <div className="chat-input-row">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Send a message..."
            className="chat-input"
            maxLength={200}
          />
          <button type="submit" className="chat-send-btn" disabled={!connected}>
            SEND
          </button>
        </div>
      </form>
    </div>
  );
}
