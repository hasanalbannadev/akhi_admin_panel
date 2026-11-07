import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";

// সার্চ ইঞ্জিনকে বলা: কোন পেজ index করবে, কোনটা না
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/account", "/checkout", "/cart", "/login", "/order/"] }],
    sitemap: `${SITE.url}/sitemap.xml`,
  };
}
