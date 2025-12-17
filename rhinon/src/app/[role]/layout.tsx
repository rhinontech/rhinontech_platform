"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { io, Socket } from "socket.io-client";
import { toast } from "sonner";

import { RootSidebar } from "@/components/Common/Navigation/MainNavigation/RootSidebar";
import { SiteHeader } from "@/components/Common/Navigation/MainNavigation/SiteHeader";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { RhinonChatbot } from "@/components/Common/Chatbot/RhinonChatbot";

import { useUserStore } from "@/utils/store";
import { useBannerStore } from "@/store/useBannerStore";
import { useTokenManager } from "@/hooks/userTokenManager";
import { getOnboarding } from "@/services/dashborad/dashboardService";
import { CopilotProvider } from "@/context/CopilotContext";

import Cookies from "js-cookie";
import { jwtDecode } from "jwt-decode";
import { cn } from "@/lib/utils";
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const organizationId = useUserStore((state) => state.userData.orgId);
  const chatbotId = useUserStore((state) => state.userData.chatbotId);
  const isVisible = useBannerStore((state) => state.isVisible);

  const [isClient, setIsClient] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const lastAnnounced = useRef<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Unlock audio + speech permissions on first click
  useEffect(() => {
    const unlock = () => {
      try {
        speechSynthesis.getVoices();
        audioRef.current = new Audio("/confident-543.mp3");
        audioRef.current.volume = 0.7;
        audioRef.current.load();

        const AudioContextClass =
          window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioContextClass();
        if (ctx.state === "suspended") ctx.resume();

        console.log("🔓 Audio + Speech unlocked");
      } catch (err) {
        console.error("Audio unlock error:", err);
      }
      window.removeEventListener("click", unlock);
    };
    window.addEventListener("click", unlock);
  }, []);

  // Speak “New user came”
  function speakNewUser(visitorId: string) {
    if (!("speechSynthesis" in window)) return;
    if (lastAnnounced.current === visitorId) return;
    lastAnnounced.current = visitorId;

    const msg = new SpeechSynthesisUtterance("New user came");
    msg.lang = "en-US";
    msg.rate = 0.9;
    msg.pitch = 0.8;
    msg.volume = 0.8;

    const voices = speechSynthesis.getVoices();
    const preferred = voices.find((v) =>
      /Google UK English Female|Google US English Female|Microsoft Zira/.test(
        v.name
      )
    );
    if (preferred) msg.voice = preferred;

    try {
      speechSynthesis.speak(msg);
    } catch (err) {
      console.warn("Speech failed:", err);
    }
  }

  // Play sound safely
  function playSound() {
    if (!audioRef.current) return;
    audioRef.current.currentTime = 0;
    audioRef.current
      .play()
      .then(() => console.log(" Sound played"))
      .catch((err) => console.warn("Sound play blocked:", err));
  }

  // Initialize banner when user data is loaded
  useEffect(() => {
    const { orgPlan, planExpiryDate } = useUserStore.getState().userData;
    if (orgPlan || planExpiryDate) {
      useBannerStore.getState().initBanner();
    }
  }, [organizationId]); // Re-run when organization changes

  // Token validation
  useEffect(() => {
    const checkAuth = () => {
      const token = Cookies.get("authToken");
      if (!token) {
        router.replace("/auth/login");
        return;
      }

      try {
        const decoded: any = jwtDecode(token);
        const isExpired = decoded.exp * 1000 < Date.now();
        if (isExpired) {
          toast.info("Your session has expired. Please log in again.");
          Cookies.remove("authToken");
          Cookies.remove("currentRole");
          router.replace("/auth/login");
        }
      } catch {
        Cookies.remove("authToken");
        Cookies.remove("currentRole");
        router.replace("/auth/login");
      }
    };

    checkAuth();
    const interval = setInterval(checkAuth, 30 * 1000);
    return () => clearInterval(interval);
  }, [router]);

  // Socket setup
  useEffect(() => {
    setIsClient(true);
    if (!chatbotId || !organizationId) return;

    const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL!, {
      query: { chatbot_id: chatbotId, dashboard: true },
    });
    socketRef.current = socket;

    socket.on("connect", () => console.log("Socket connected:", socket.id));

    // Onboarding update
    socket.on("onboarding:updated", async ({ organization_id }) => {
      if (organization_id !== organizationId) return;
      try {
        const updatedOnboarding = await getOnboarding();
        useUserStore.getState().setUserData({ onboarding: updatedOnboarding });
      } catch (err) {
        console.error("Failed to fetch updated onboarding:", err);
      }
    });

    // Ticket created
    socket.on("ticket:created", ({ ticket }) => {
      if (ticket.organization_id !== organizationId) return;
      toast.info(`New ticket created: ${ticket.subject}`);
      const { userData, setUserData } = useUserStore.getState();
      setUserData({ newTicketCount: (userData.newTicketCount || 0) + 1 });
      playSound();
    });

    //Ticket updated
    socket.on("ticket:updated", ({ updatedTicket }) => {
      if (updatedTicket.organization_id !== organizationId) return;
      toast.info(`Ticket updated: ${updatedTicket.subject}`);
      playSound();
    });

    // New conversation
    socket.on("newConversation", (conversation) => {
      if (conversation.chatbot_id !== chatbotId) return;
      toast.info(`New conversation started with chatbot`);
      const { userData, setUserData } = useUserStore.getState();
      setUserData({ newChatCount: (userData.newChatCount || 0) + 1 });
      playSound();
    });

    // New message
    socket.on("message", (newMessage) => {
      if (newMessage.chatbot_id !== chatbotId || newMessage.role !== "user")
        return;
      toast.info(`New message received from chatbot`);
      playSound();
    });

    // WhatsApp message received
    socket.on("whatsapp:message:received", (data) => {
      // data.message contains the message object
      console.log("WhatsApp socket event received:", data);

      // Ensure we are in client side
      const { userData, setUserData } = useUserStore.getState();

      // Validate organization match (handle string/number difference)
      if (
        data.message?.organization_id?.toString() === organizationId?.toString()
      ) {
        toast.info("New WhatsApp message received", {
          description: `From: ${data.message.from_number}`,
          action: {
            label: "View",
            onClick: () =>
              router.push(`/${userData.currentRole}/chats/whatsapp`), // Navigate to WhatsApp chat
          },
        });

        // Update global count
        setUserData({ newChatCount: (userData.newChatCount || 0) + 1 });
        playSound();
      }
    });

    // Visitor updates
    socket.on("visitor_update", ({ type, visitor }) => {
      const { userData, setUserData } = useUserStore.getState();

      if (type === "connected" && visitor.is_online) {
        const count = (userData.trafficCount || 0) + 1;
        setUserData({ trafficCount: count });

        const createdDate = new Date(visitor.createdAt);
        const now = new Date();

        // Use .getTime() to convert Date → number (ms since epoch)
        const isNewVisitor = now.getTime() - createdDate.getTime() < 10_000;

        if (isNewVisitor) {
          speakNewUser(visitor.visitor_id);
          toast.info(`New visitor is browsing your site.`);
        } else {
          toast.info(`Returning visitor reconnected.`);
        }
      }

      if (type === "disconnected" && visitor.is_online === false) {
        setUserData({
          trafficCount: Math.max((userData.trafficCount || 1) - 1, 0),
        });
        toast.info(`A visitor left your site.`);
      }
    });

    // SEO PERFORMANCE events
    socket.off(`seo:performance:started:${organizationId}`);
    socket.off(`seo:performance:completed:${organizationId}`);
    socket.off(`seo:performance:error:${organizationId}`);

    socket.on(`seo:performance:started:${organizationId}`, (data: any) => {
      if (data.organization_id !== organizationId) return;
      const { estimated_time, started_at } = data;
      localStorage.setItem(
        "seoPerformance",
        JSON.stringify({ started_at, estimated_time })
      );
      toast.success("SEO Performance audit started.");
    });

    socket.on(`seo:performance:completed:${organizationId}`, (data: any) => {
      if (data.organization_id !== organizationId) return;
      localStorage.removeItem("seoPerformance");
      toast.success("SEO Performance audit completed.");
      playSound();
    });

    socket.on(`seo:performance:error:${organizationId}`, (data: any) => {
      if (data.organization_id !== organizationId) return;
      localStorage.removeItem("seoPerformance");
      toast.error(data.message || "SEO Performance audit failed.");
    });

    // SEO COMPLIANCE events
    socket.off(`seo:compliance:started:${organizationId}`);
    socket.off(`seo:compliance:completed:${organizationId}`);
    socket.off(`seo:compliance:error:${organizationId}`);

    socket.on(`seo:compliance:started:${organizationId}`, (data: any) => {
      if (data.organization_id !== organizationId) return;
      const { estimated_time, started_at } = data;
      localStorage.setItem(
        "seoCompliance",
        JSON.stringify({ started_at, estimated_time })
      );
      toast.success("SEO Compliance check started.");
    });

    socket.on(`seo:compliance:completed:${organizationId}`, (data: any) => {
      if (data.organization_id !== organizationId) return;
      localStorage.removeItem("seoCompliance");
      toast.success("SEO Compliance check completed.");
      playSound();
    });

    socket.on(`seo:compliance:error:${organizationId}`, (data: any) => {
      if (data.organization_id !== organizationId) return;
      localStorage.removeItem("seoCompliance");
      toast.error(data.message || "SEO Compliance check failed.");
    });

    socket.on("voice-call-started", () => {});

    // Cleanup
    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [organizationId, chatbotId]);

  // Token refresh
  useTokenManager("GOOGLE", () => console.log("Google token updated"));
  useTokenManager("MICROSOFT", () => console.log("Microsoft token updated"));

  return (
    <CopilotProvider>
      <main className="flex min-h-screen w-full flex-col">
        <div
          className={cn(
            isVisible
              ? "[--header-height:calc(--spacing(28))]"
              : "[--header-height:calc(--spacing(14))]"
          )}>
          <SidebarProvider className="flex flex-col">
            <SiteHeader />
            <div className="flex flex-1">
              <RootSidebar />
              <SidebarInset className="shadow-none flex-1 w-[calc(100vw-var(--sidebar-width))]">
                <div className="flex flex-1 flex-col gap-4">{children}</div>
              </SidebarInset>
            </div>
          </SidebarProvider>
        </div>

        {/* Public Chatbot Widget - Available globally */}
        {/* {isClient && process.env.NEXT_PUBLIC_CHATBOT_ID && (
          <RhinonChatbot
            appId={process.env.NEXT_PUBLIC_CHATBOT_ID}
            admin={false}
          />
        )} */}
      </main>
    </CopilotProvider>
  );
}
