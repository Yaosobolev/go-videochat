"use client";

import React, { useEffect, useRef, useState } from "react";

interface Props {
  className?: string;
  wsUrl: string;
}

export const StreamPublisher: React.FC<Props> = ({ wsUrl }) => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    async function startCapture() {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        setStream(mediaStream);

        const ws = new WebSocket(wsUrl);
        ws.binaryType = "arraybuffer";
        ws.onopen = () => {
          console.log("WebSocket connected");
          const mediaRecorder = new MediaRecorder(mediaStream, {
            mimeType: "video/webm; codecs=vp8,opus",
          });

          mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0 && ws.readyState === WebSocket.OPEN) {
              event.data.arrayBuffer().then((buffer) => {
                ws.send(buffer);
              });
            }
          };

          mediaRecorder.start(1000); // каждые 1 секунду отправляем chunk
          mediaRecorderRef.current = mediaRecorder;
        };

        ws.onclose = () => {
          console.log("WebSocket closed");
          mediaRecorderRef.current?.stop();
        };

        ws.onerror = (e) => {
          console.error("WebSocket error", e);
          mediaRecorderRef.current?.stop();
        };

        wsRef.current = ws;
      } catch (err) {
        console.error("Error accessing media devices.", err);
      }
    }

    startCapture();

    return () => {
      mediaRecorderRef.current?.stop();
      stream?.getTracks().forEach((track) => track.stop());
      wsRef.current?.close();
    };
  }, [wsUrl]);

  return (
    <div>
      <h2>Stream Publisher</h2>
      <video
        autoPlay
        muted
        playsInline
        ref={(videoEl) => {
          if (videoEl && stream) videoEl.srcObject = stream;
        }}
        style={{ width: "100%", maxHeight: "400px", backgroundColor: "black" }}
      />
    </div>
  );
};
