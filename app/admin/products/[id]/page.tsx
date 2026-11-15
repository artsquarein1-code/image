import AdminPage from "../../page";

type Props = { params: Promise<{ id: string }> };
export const dynamic = "force-dynamic";

export default async function EditAdminProductPage({ params }: Props) {
  const { id } = await params;
  return <AdminPage section="products" initialProductMode="edit" initialProductId={id} />;
}
