"use client";

import { useEffect, useRef } from "react";

interface Props {
  className?: string;
  socketAddr: string;
}

export const RoomSocketClient: React.FC<Props> = ({ socketAddr }) => {
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    ws.current = new WebSocket(socketAddr);

    ws.current.onopen = () => {
      console.log("Room socket connected");
    };

    ws.current.onmessage = (event) => {
      console.log("Room message:", event.data);
      // здесь можешь парсить JSON, если сервер шлёт structured данные
    };

    ws.current.onerror = (err) => {
      console.error("Room socket error:", err);
    };

    ws.current.onclose = () => {
      console.log("Room socket closed");
    };

    return () => {
      ws.current?.close();
    };
  }, [socketAddr]);

  return null;
};
