/** Sidebar navigation definition for the dashboard. */

export interface NavItem {
  label: string;
  href: string;
  /** lucide-react icon name (resolved via lib/icon). */
  icon: string;
}

export const NAV_ITEMS: NavItem[] = [
  { label: "Executive Overview", href: "/dashboard", icon: "LayoutDashboard" },
  { label: "Social Media", href: "/dashboard/social", icon: "Share2" },
  { label: "Google Maps", href: "/dashboard/google-maps", icon: "MapPinned" },
  { label: "Website", href: "/dashboard/website", icon: "Monitor" },
  { label: "Leads & Inquiries", href: "/dashboard/leads", icon: "Target" },
];
