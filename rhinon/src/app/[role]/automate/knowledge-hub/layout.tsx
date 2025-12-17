import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Rhinontech - Your One Stop Solution",
  description:
    "Rhinontech is your one-stop solution for all your business needs, offering a wide range of services to help you succeed.",
};

import KnowledgeHubLayout from "@/components/Pages/Automate/Knowledgehub/Layout/KnowledgeHubLayout";

export default function AutomateLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <KnowledgeHubLayout>{children}</KnowledgeHubLayout>;
}
