"use client";

import React, { useEffect, useRef, useState } from "react";
interface Props {
  className?: string;
  wsUrl: string;
}

interface PeerConnections {
  [id: string]: RTCPeerConnection;
}

interface RemoteStreams {
  [id: string]: MediaStream;
}

const ICE_SERVERS = [{ urls: "stun:stun.l.google.com:19302" }];

export const WebRTCRoom: React.FC<Props> = ({ wsUrl }) => {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const [remoteStreams, setRemoteStreams] = useState<RemoteStreams>({});
  const peerConnections = useRef<PeerConnections>({});
  const ws = useRef<WebSocket | null>(null);
  const localStream = useRef<MediaStream | null>(null);
  const clientId = useRef<string>("");

  useEffect(() => {
    if (!wsUrl) return;

    ws.current = new WebSocket(wsUrl);

    ws.current.onopen = () => {
      console.log("WebSocket connected");
    };

    ws.current.onmessage = async (event) => {
      const data = JSON.parse(event.data);
      const { from, type, sdp, candidate } = data;

      // Игнорируем сообщения от себя
      if (from === clientId.current) return;

      if (type === "welcome") {
        clientId.current = data.id;
        console.log("Assigned client ID:", clientId.current);
        return;
      }

      // Обработка сигналов WebRTC
      if (type === "offer") {
        await handleOffer(from, sdp);
      } else if (type === "answer") {
        await handleAnswer(from, sdp);
      } else if (type === "candidate") {
        await handleCandidate(from, candidate);
      } else if (type === "new-peer") {
        // Создаем пира и отправляем offer новому участнику
        await createPeerConnection(from, true);
      }
    };

    ws.current.onclose = () => {
      console.log("WebSocket closed");
      // Очистить соединения
      Object.values(peerConnections.current).forEach((pc) => pc.close());
      peerConnections.current = {};
      setRemoteStreams({});
    };

    // Получаем локальный медиапоток (камера+микрофон)
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        localStream.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      });

    return () => {
      ws.current?.close();
      localStream.current?.getTracks().forEach((track) => track.stop());
      Object.values(peerConnections.current).forEach((pc) => pc.close());
      peerConnections.current = {};
      setRemoteStreams({});
    };
  }, [wsUrl]);

  // Создание RTCPeerConnection
  async function createPeerConnection(peerId: string, isOfferer: boolean) {
    if (peerConnections.current[peerId]) return;

    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

    // Добавляем локальный поток в пира
    if (localStream.current) {
      localStream.current
        .getTracks()
        .forEach((track) => pc.addTrack(track, localStream.current!));
    }

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        ws.current?.send(
          JSON.stringify({
            type: "candidate",
            to: peerId,
            candidate: event.candidate,
            from: clientId.current,
          })
        );
      }
    };

    pc.ontrack = (event) => {
      setRemoteStreams((prev) => {
        return { ...prev, [peerId]: event.streams[0] };
      });
    };

    peerConnections.current[peerId] = pc;

    if (isOfferer) {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      ws.current?.send(
        JSON.stringify({
          type: "offer",
          to: peerId,
          sdp: offer,
          from: clientId.current,
        })
      );
    }

    return pc;
  }

  async function handleOffer(from: string, sdp: RTCSessionDescriptionInit) {
    const pc = await createPeerConnection(from, false);
    if (!pc) return;
    await pc.setRemoteDescription(new RTCSessionDescription(sdp));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    ws.current?.send(
      JSON.stringify({
        type: "answer",
        to: from,
        sdp: answer,
        from: clientId.current,
      })
    );
  }

  async function handleAnswer(from: string, sdp: RTCSessionDescriptionInit) {
    const pc = peerConnections.current[from];
    if (!pc) return;
    await pc.setRemoteDescription(new RTCSessionDescription(sdp));
  }

  async function handleCandidate(from: string, candidate: RTCIceCandidateInit) {
    const pc = peerConnections.current[from];
    if (!pc) return;
    await pc.addIceCandidate(new RTCIceCandidate(candidate));
  }

  return (
    <div className="flex flex-col items-center space-y-4 p-4">
      <div>
        <h2 className="text-lg font-semibold">Your video</h2>
        <video
          ref={localVideoRef}
          autoPlay
          playsInline
          muted
          className="w-64 h-48 bg-black rounded"
        />
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-2">Remote videos</h2>
        <div className="flex flex-wrap gap-4">
          {Object.entries(remoteStreams).map(([peerId, stream]) => (
            <video
              key={peerId}
              autoPlay
              playsInline
              className="w-64 h-48 bg-black rounded"
              ref={(video) => {
                if (video && video.srcObject !== stream) {
                  video.srcObject = stream;
                }
              }}
            />
          ))}
          {Object.keys(remoteStreams).length === 0 && (
            <p>No other participants yet</p>
          )}
        </div>
      </div>
    </div>
  );
};
