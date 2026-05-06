import { createFileRoute } from "@tanstack/react-router";
import { PostEditor } from "@/components/PostEditor";

export const Route = createFileRoute("/admin/posts/$id")({
  component: RouteComp,
  head: () => ({ meta: [{ title: "Edit post — Editor-in-Chief" }] }),
});

function RouteComp() {
  const { id } = Route.useParams();
  return <PostEditor postId={id} />;
}
