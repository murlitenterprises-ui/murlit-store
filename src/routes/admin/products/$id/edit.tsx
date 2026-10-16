import { createFileRoute, Link } from "@tanstack/react-router";
import { getAdminProduct, getAdminCategories } from "@/fns/admin/products";
import { ProductForm } from "@/components/admin/ProductForm";
import { ChevronLeft } from "lucide-react";

export const Route = createFileRoute("/admin/products/$id/edit")({
  loader: async ({ params }) => {
    const [product, allCategories] = await Promise.all([
      getAdminProduct({ data: { id: params.id } }),
      getAdminCategories(),
    ]);
    return { product, allCategories };
  },
  component: EditProductPage,
});

function EditProductPage() {
  const { product, allCategories } = Route.useLoaderData();
  return (
    <div className="space-y-4 max-w-3xl">
      <div className="flex items-center gap-2">
        <Link to="/admin/products" className="text-gray-400 hover:text-gray-600">
          <ChevronLeft size={18} />
        </Link>
        <h1 className="text-xl font-semibold text-gray-900">Edit: {product.name}</h1>
      </div>
      <ProductForm product={product} allCategories={allCategories} />
    </div>
  );
}
