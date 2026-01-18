import KB from "@/components/KB";
import { headers } from "next/headers";
import { getKbIdFromHost } from "@/lib/utils";
import { fetchKnowledgeBase } from "@/services/kbServices";
import { Metadata } from "next";
import { notFound } from "next/navigation";

async function getKBData() {
  const headersList = await headers();
  const host = headersList.get("host") || "";

  const kbId = getKbIdFromHost(host);

  if (!kbId) {
    return null;
  }

  try {
    const data = await fetchKnowledgeBase(kbId);
    return { data, kbId };
  } catch {
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
  const result = await getKBData();

  if (!result || !result.data) {
    notFound();
  }

  const { data, kbId } = result;

  return <KB kbId={kbId} initialData={data} />;
}
