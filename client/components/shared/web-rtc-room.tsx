"use client";
import { useEffect, useRef, useState } from "react";

type Props = {
  wsUrl: string;
};

export const WebRTCRoom: React.FC<Props> = ({ wsUrl }) => {
  const socketRef = useRef<WebSocket | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<MediaStream[]>([]);

  useEffect(() => {
    const init = async () => {
      // 1. Создаём WebSocket
      socketRef.current = new WebSocket(wsUrl);

      // 2. Создаём PeerConnection
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
      });
      peerConnectionRef.current = pc;

      // 3. Получаем локальную камеру и микрофон
      const localStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      localStreamRef.current = localStream;

      // 4. Привязываем видео к элементу
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = localStream;
      }

      // 5. Добавляем треки в peer connection
      localStream.getTracks().forEach((track) => {
        pc.addTrack(track, localStream);
      });

      // 6. Обрабатываем входящие сообщения
      socketRef.current.onmessage = async (event) => {
        const msg = JSON.parse(event.data);

        if (msg.event === "offer") {
          const offer = JSON.parse(msg.data);
          await pc.setRemoteDescription(offer);
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          socketRef.current?.send(
            JSON.stringify({ event: "answer", data: JSON.stringify(answer) })
          );
        } else if (msg.event === "candidate") {
          const candidate = JSON.parse(msg.data);
          await pc.addIceCandidate(candidate);
        }
      };

      // 7. ICE кандидаты
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socketRef.current?.send(
            JSON.stringify({
              event: "candidate",
              data: JSON.stringify(event.candidate),
            })
          );
        }
      };

      // 8. Когда приходит удалённый поток
      pc.ontrack = (event) => {
        const incomingStream = event.streams[0];
        setRemoteStreams((prev) => {
          if (!prev.find((s) => s.id === incomingStream.id)) {
            return [...prev, incomingStream];
          }
          return prev;
        });
      };
    };

    init();

    return () => {
      peerConnectionRef.current?.close();
      socketRef.current?.close();
      localStreamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, [wsUrl]);

  return (
    <div>
      <div>
        <h3>Local Camera</h3>
        <video ref={localVideoRef} autoPlay playsInline muted />
        {/* <button onClick={startCamera}>Start Camera</button> */}
      </div>

      <div>
        <h3>Remote Streams</h3>
        {remoteStreams
          .filter((stream) => stream.active)
          .map((stream, idx) => (
            <div className="" key={stream.id}>
              <h4>Remote Stream {idx + 1}</h4>
              <p>Stream ID: {stream.id}</p>
              <video
                autoPlay
                playsInline
                ref={(video) => {
                  if (video && stream.active) video.srcObject = stream;
                }}
              />
            </div>
          ))}
      </div>
    </div>
  );
};
