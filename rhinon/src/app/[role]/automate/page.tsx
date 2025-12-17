"use client";

import Loading from "@/app/loading";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Page() {
  const router = useRouter();
  useEffect(() => {
    router.push("automate/overview"); //knowledge-hub
  }, []);
  return <Loading areaOnly />;
}
