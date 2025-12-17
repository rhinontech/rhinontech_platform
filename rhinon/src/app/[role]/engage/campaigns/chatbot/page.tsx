"use client";

import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";
import { useEffect } from "react";

export default function ChatbotPage() {
  const router = useRouter();
  const params = useParams();
  const role = params.role as string;

  useEffect(() => {
    router.replace(`/${role}/engage/campaigns/chatbot/recurring`);
  }, [router, role]);

  return null;
}
