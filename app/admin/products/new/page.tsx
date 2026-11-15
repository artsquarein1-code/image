import AdminPage from "../../page";

export const dynamic = "force-dynamic";

export default function NewAdminProductPage() {
  return <AdminPage section="products" initialProductMode="new" />;
}
