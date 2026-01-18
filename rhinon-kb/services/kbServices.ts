const API_URL = process.env.NEXT_PUBLIC_API_URL;

export const fetchKnowledgeBase = async (identifier: string) => {
  if (!API_URL) throw new Error("API_URL is not defined");

  const res = await fetch(`${API_URL}/kb/${identifier}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    next: { revalidate: 3600 },
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
    },
    next: { revalidate: 3600 },
  });

  if (!res.ok) {
    if (res.status === 404) {
      throw new Error("ARTICLE_NOT_FOUND");
    }
    throw new Error(`Failed to fetch Article: ${res.statusText}`);
  }

  return res.json();
};

