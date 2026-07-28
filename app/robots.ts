import type { MetadataRoute } from "next";
import { resolveBaseUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = resolveBaseUrl();
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/dashboard", "/dashboard/*", "/api/*"] }],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
