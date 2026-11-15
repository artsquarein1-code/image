import ProductPage, { generateMetadata } from "../../products/[slug]/page";

type Props = { params: Promise<{ slug: string }> };

export { generateMetadata };
export const dynamic = "force-dynamic";

export default function SingularProductPage(props: Props) {
  return <ProductPage {...props} />;
}
