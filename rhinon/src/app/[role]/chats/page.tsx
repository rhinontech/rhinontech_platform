// "use client";

// import Loading from "@/app/loading";
// import { useRouter } from "next/navigation";
// import { useEffect } from "react";

// export default function Page() {
//   const router = useRouter();
//   useEffect(() => {
//     router.push("chats/messenger"); //chats/messenger
//   }, []);
//   return <Loading areaOnly />;
// }


"use client";

import Chats from "@/components/Pages/Chats/Chats";
import React from "react";

const page = () => {
  return <Chats />;
};

export default page;
