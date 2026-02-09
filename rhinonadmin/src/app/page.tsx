"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Check cookies for authentication (matching rhinon pattern)
    const currentRole = Cookies.get("currentRole");
    const authToken = Cookies.get("auth-token");

    if (currentRole && authToken) {
      // User is logged in, redirect to their dashboard
      router.push(`/${currentRole}/dashboard`);
    } else {
      // Not logged in, redirect to login
      router.push("/login");
    }
  }, [router]);

  return null;
}
