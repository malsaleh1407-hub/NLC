/** @type {import('next').NextConfig} */

// When STATIC_EXPORT=true (used by the GitHub Pages workflow) the app is built
// as a fully static site. In normal dev/SSR (e.g. Netlify) it keeps server
// features like the /api/gbp route and live Google Business Profile fetching.
const isStatic = process.env.STATIC_EXPORT === "true";

// GitHub Pages serves a project site under /<repo>, so assets need that prefix.
const basePath = process.env.PAGES_BASE_PATH || "";

const nextConfig = {
  reactStrictMode: true,
  ...(isStatic
    ? {
        output: "export",
        trailingSlash: true,
        images: { unoptimized: true },
        ...(basePath
          ? { basePath, assetPrefix: `${basePath}/` }
          : {}),
      }
    : {}),
};

module.exports = nextConfig;
