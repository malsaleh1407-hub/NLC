import { redirect } from "next/navigation";
import RedirectHome from "./RedirectHome";

// The dashboard lives under /dashboard. In SSR/dev we redirect on the server.
// In static-export builds (GitHub Pages) server redirect isn't available, so we
// fall back to a client-side redirect component.
export default function Home() {
  if (process.env.STATIC_EXPORT !== "true") {
    redirect("/dashboard");
  }
  return <RedirectHome />;
}
