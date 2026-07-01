import { AdminPanel } from "@/components/admin-panel";

export const metadata = {
  title: "AuraFind Admin",
  description: "Remove reported missing-person cases from the admin page.",
};

export default function AdminPage() {
  return <AdminPanel />;
}
