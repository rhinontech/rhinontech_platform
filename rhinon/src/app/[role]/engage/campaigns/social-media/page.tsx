"use client";

import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";
import { useEffect } from "react";

export default function SocialMediaPage() {
  const router = useRouter();
  const params = useParams();
  const role = params.role as string;

  useEffect(() => {
    router.replace(`/${role}/engage/campaigns/social-media/linkedin`);
  }, [router, role]);

  return null;
}
