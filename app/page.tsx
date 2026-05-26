/**
 * Home (page.tsx)
 *
 * The single-page entry point. By separating this page component as a Server Component
 * and embedding the client-side state within the BriefingDashboard component, we adhere
 * to Next.js best practices and guarantee correct environment isolation.
 */

import { BriefingDashboard } from "@/components/BriefingDashboard";

export default function HomePage() {
  return <BriefingDashboard />;
}

