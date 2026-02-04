import KB from "@/components/KB";
import { headers } from "next/headers";
import { getKbIdFromHost } from "@/lib/utils";
import { fetchKnowledgeBase } from "@/services/kbServices";
import { Metadata } from "next";
import { notFound } from "next/navigation";

async function getKBData() {
  console.log("-----------------------------------------");
  console.log("Server Component: getKBData started");
  const headersList = await headers();
  const host = headersList.get("host") || "";
  console.log("Incoming Host:", host);

  const kbId = getKbIdFromHost(host);
  console.log("Extracted KB ID:", kbId);

  if (!kbId) {
    console.log("No KB ID found from host, returning null");
    return null;
  }

  try {
    console.log(`Calling fetchKnowledgeBase with ID: ${kbId}`);
    const data = await fetchKnowledgeBase(kbId);
    console.log("fetchKnowledgeBase response received:", data ? "Data Present" : "No Data");
    return { data, kbId };
  } catch (error) {
    console.error("Error fetching knowledge base:", error);
    return { data: null, kbId };
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const result = await getKBData();
  if (!result || !result.data) return {};

  const { theme } = result.data;
  return {
    title: theme.seo.title || "Rhinon Tech | Knowledge Base",
    description: theme.seo.description || "Knowledge Base",
    icons: theme.favicon ? [
      {
        rel: "icon",
        url: theme.favicon,
      },
    ] : undefined,
    openGraph: {
      title: theme.seo.title || "Rhinon Tech | Knowledge Base",
      description: theme.seo.description || "Knowledge Base",
      images: theme.preview_image ? [{ url: theme.preview_image }] : undefined,
    },
  };
}

export default async function Home() {
  console.log("Server Component: Home Page Rendering");
  const result = await getKBData();
  console.log("Home Page: getKBData result:", result ? "Found Data" : "Result is Null");

  if (!result || !result.data) {
    console.log("Home Page: triggering notFound() because result or result.data is missing");
    notFound();
  }

  const { data, kbId } = result;
  console.log("Home Page: Rendering KB component with ID:", kbId);

  return <KB kbId={kbId} initialData={data} />;
}
