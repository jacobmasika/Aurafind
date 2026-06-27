import { AdminPanel } from "@/components/admin-panel";

export const metadata = {
  title: "AuraFind Admin",
  description: "Delete reported missing-person cases from the AuraFind admin console.",
};

export default function AdminPage() {
  return <AdminPanel />;
}
