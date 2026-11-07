import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";

// মোবাইলে "Add to Home screen" করলে এই তথ্য ব্যবহার হয়
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE.name,
    short_name: SITE.name,
    description: SITE.description,
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#db1450",
    lang: "bn",
  };
}
