"use client";

import { useEffect, useRef, useState } from "react";

interface Props {
  className?: string;
  wsUrl: string;
}

export const ViewerStats: React.FC<Props> = ({ wsUrl }) => {
  const [viewers, setViewers] = useState<number>(0);
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const socket = new WebSocket(wsUrl);
    socketRef.current = socket;

    socket.onmessage = (event) => {
      const count = parseInt(event.data);
      if (!isNaN(count)) {
        setViewers(count);
      }
    };

    socket.onerror = (e) => {
      console.error("WebSocket error:", e);
    };

    return () => {
      socket.close();
    };
  }, [wsUrl]);

  return (
    <div className="bg-white border rounded p-3 shadow-sm">
      <h2 className="text-lg font-semibold mb-2">Зрители</h2>
      <p className="text-2xl font-bold text-blue-600">{viewers}</p>
    </div>
  );
};
