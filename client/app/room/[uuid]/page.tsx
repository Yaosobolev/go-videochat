"use client";

import axios from "axios";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ChatBox } from "@/components/shared/chat-box";
import { ViewerStats } from "@/components/shared/viewer-stats";
import { WebRTCRoom } from "@/components/shared/web-rtc-room";

type RoomData = {
  ChatWebSocketAddr: string;
  RoomLink: string;
  RoomWebSocketAddr: string;
  StreamLink: string;
  Type: string;
  ViewerWebSocketAddr: string;
};
type StreamData = {
  ChatWebSocketAddr: string;
  StreamWebSocketAddr: string;
  Type: string;
  ViewerWebSocketAddr: string;
};

export default function RoomPage({}: { params: { uuid: string } }) {
  const { uuid } = useParams();
  const [room, setRoom] = useState<RoomData>();
  const [stream, setStream] = useState<StreamData>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!uuid || typeof uuid !== "string") return;

    const fetchRoom = async () => {
      try {
        const res = await axios.get<RoomData>(
          `http://localhost:8080/room/${uuid}`
        );

        setRoom(res.data);
        const streamRes = await axios.get<StreamData>(res.data.StreamLink);
        setStream(streamRes.data);
      } catch (err: any) {
        setError("Комната не найдена или произошла ошибка");
      } finally {
        setLoading(false);
      }
    };

    fetchRoom();
  }, [uuid]);

  if (loading) return <div className="p-4">Загрузка...</div>;
  if (error) return <div className="p-4 text-red-600">{error}</div>;
  if (!room) return null;
  if (!stream) return null;

  return (
    <main className="p-4">
      <h1 className="text-2xl font-bold mb-2">Комната: {uuid}</h1>
      <p className="text-gray-600 mb-4">Стрим: {stream.StreamWebSocketAddr}</p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <WebRTCRoom wsUrl={room.RoomWebSocketAddr} />

        <div className="col-span-1 space-y-4">
          <ChatBox wsUrl={stream.ChatWebSocketAddr} />
          <ViewerStats wsUrl={stream.ViewerWebSocketAddr} />
        </div>
      </div>
    </main>
  );
}
