"use client";

import axios from "axios";
import { useRouter } from "next/navigation";
import { useState } from "react";

export const RoomControls: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleCreateRoom = async () => {
    try {
      setLoading(true);
      const res = await axios.get("http://localhost:8080/room/create");
      const uuid = res.data.uuid;
      if (uuid) {
        router.push(`/room/${uuid}`);
      } else {
        console.error("UUID не получен");
      }
    } catch (error) {
      console.error("Ошибка при создании комнаты:", error);
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="mb-4">
      <button
        onClick={handleCreateRoom}
        disabled={loading}
        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
      >
        {loading ? "Создание..." : "Создать комнату"}
      </button>
    </div>
  );
};
