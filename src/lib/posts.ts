import { supabase } from "@/integrations/supabase/client";

export type Post = {
  id: string;
  slug: string;
  title: string;
  dek: string | null;
  body_md: string;
  category: string;
  tags: string[];
  hero_url: string | null;
  read_minutes: number | null;
  published_at: string | null;
  author_id: string | null;
};

export async function fetchPublishedPosts(): Promise<Post[]> {
  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .eq("status", "published")
    .order("published_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Post[];
}

export async function fetchPostBySlug(slug: string): Promise<Post | null> {
  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  return (data as Post) ?? null;
}

export function formatDate(iso: string | null) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
