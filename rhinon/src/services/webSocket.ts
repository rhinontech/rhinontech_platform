// utils/socket.ts
import { io, Socket } from "socket.io-client";
import { useUserStore } from "@/utils/store";

let socket: Socket | null = null;

export const getSocket = () => {
  if (!socket) {
    // Get chatbot_id from user store for dashboard room joining
    const { userData } = useUserStore.getState();
    const chatbotId = userData?.chatbotId;

    socket = io(process.env.NEXT_PUBLIC_SOCKET_URL!, {
      transports: ["websocket"],
      query: {
        dashboard: "true",
        chatbot_id: chatbotId || "",
      },
    });

    socket.on("connect", () => {
      console.log("WebSocket connected", { chatbotId, dashboard: true });
    });

    socket.on("disconnect", () => {
      console.log("WebSocket disconnected");
    });
  }

  return socket;
};
