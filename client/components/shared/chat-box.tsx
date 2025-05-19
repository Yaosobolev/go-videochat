"use client";

import { useEffect, useRef, useState } from "react";

interface Props {
  className?: string;
  wsUrl: string;
}

export const ChatBox: React.FC<Props> = ({ wsUrl }) => {
  const [messages, setMessages] = useState<string[]>([]);
  const [input, setInput] = useState("");
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const socket = new WebSocket(wsUrl);
    socketRef.current = socket;

    socket.onopen = () => {
      console.log("✅ WebSocket connected");
    };

    socket.onmessage = (event) => {
      setMessages((prev) => [...prev, event.data]);
    };

    socket.onerror = (err) => {
      console.error("❌ WebSocket error:", err);
    };

    socket.onclose = () => {
      console.warn("🔌 WebSocket closed");
    };

    return () => {
      socket?.close();
    };
  }, [wsUrl]);

  const sendMessage = () => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(input);
      setInput("");
    } else {
      console.warn("⚠️ WebSocket not connected");
    }
  };

  return (
    <div className="bg-white border rounded p-3 shadow-sm">
      <h2 className="text-lg font-semibold mb-2">Чат</h2>
      <div className="h-40 overflow-y-auto border p-2 mb-2 text-sm">
        {messages.map((msg, idx) => (
          <div key={idx} className="mb-1">
            {msg}
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          className="flex-1 border rounded px-2 py-1 text-sm"
          placeholder="Введите сообщение..."
        />
        <button
          onClick={sendMessage}
          className="bg-blue-600 text-white text-sm px-3 py-1 rounded hover:bg-blue-700"
        >
          Отправить
        </button>
      </div>
    </div>
  );
};
