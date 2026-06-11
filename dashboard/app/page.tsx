import { redirect } from "next/navigation";

// The dashboard lives under /dashboard. Send the root straight there.
export default function Home() {
  redirect("/dashboard");
}
