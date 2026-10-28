import { createFileRoute, ClientOnly } from "@tanstack/react-router";
import Game from "@/components/Game";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "BlockCraft 2D — Survive the Night" },
      { name: "description", content: "Mine, build, craft and survive zombie nights in a 2D blocky world. Plays in browser and on mobile." },
      { property: "og:title", content: "BlockCraft 2D — Survive the Night" },
      { property: "og:description", content: "Mine, build, craft and survive zombie nights in a 2D blocky world." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <ClientOnly fallback={<div className="fixed inset-0 bg-background" />}><Game /></ClientOnly>,
});
