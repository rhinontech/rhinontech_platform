"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Accounts from "@/components/Pages/Settings/Accounts/Accounts";
import Cookies from "js-cookie";
import Loading from "@/app/loading";

export default function Page() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const [isRedirecting, setIsRedirecting] = useState(false);

  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const role = Cookies.get("currentRole");

  useEffect(() => {
    if ((code || state) && role) {
      // Start redirect
      setIsRedirecting(true);

      // Redirect keeping code & state
      router.replace(`/${role}/settings/accounts?code=${code}&state=${state}`);
    }
  }, [code, state, role, router]);

  // Reset loading after redirect finishes
  useEffect(() => {
    if (isRedirecting && pathname === `/${role}/settings/accounts`) {
      setIsRedirecting(false);
    }
  }, [pathname, role, isRedirecting]);

  if (isRedirecting) {
    return <Loading />;
  }

  return <Accounts />;
}
