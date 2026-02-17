// Server-side: use direct URL, Client-side: use proxy to avoid CORS/blocking
const API_URL = typeof window === "undefined"
  ? process.env.NEXT_PUBLIC_API_URL
  : "/api";

export const fetchKnowledgeBase = async (identifier: string) => {
  if (!API_URL) throw new Error("API_URL is not defined");

  const url = `${API_URL}/kb/${identifier}`;
  console.log("Fetching KB from:", url);

  const res = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "User-Agent": "RhinonKB/1.0",
    },
    cache: "no-store",
    // next: { revalidate: 3600 },
  });

  if (!res.ok) {
    if (res.status === 404) {
      throw new Error("KB_NOT_FOUND");
    }
    throw new Error(`Failed to fetch KB: ${res.statusText}`);
  }

  return res.json();
};

export const getArticle = async (articleId: string) => {
  if (!API_URL) throw new Error("API_URL is not defined");

  const res = await fetch(`${API_URL}/articles/${articleId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "User-Agent": "RhinonKB/1.0",
    },
    cache: "no-store",
    // next: { revalidate: 3600 },
  });

  if (!res.ok) {
    if (res.status === 404) {
      throw new Error("ARTICLE_NOT_FOUND");
    }
    throw new Error(`Failed to fetch Article: ${res.statusText}`);
  }

  return res.json();
};

export const getPresignedUrl = async (key: string): Promise<string> => {
  if (!API_URL) throw new Error("API_URL is not defined");

  try {
    const res = await fetch(`${API_URL}/aws/presigned-url`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ key }),
    });

    if (!res.ok) {
      throw new Error(`Failed to get presigned URL: ${res.statusText}`);
    }

    const data = await res.json();
    return data.downloadUrl || "";
  } catch (error) {
    console.error("Error getting presigned URL:", error);
    return "";
  }
};


interface PostArticalStatesProps {
  articleId: string;
  action: string;
  previous?: string;
}

export const postArticalStats = async ({articleId, action, previous }: PostArticalStatesProps) =>{
  if (!API_URL) throw new Error("API_URL is not defined");

  const res = await fetch(`${API_URL}/articles/stats`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({articleId, action, previous }),
  });

  if (!res.ok) {
    throw new Error(`Failed to post article states: ${res.statusText}`);
  }

  return res.json();
}
