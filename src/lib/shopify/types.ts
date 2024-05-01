import { type RestResources } from "@shopify/shopify-api/rest/admin/2024-04";

type ResolveType<T extends (...args: any) => any> = NonNullable<
  Awaited<ReturnType<T>>
>;

export type Product = Pick<
  ResolveType<RestResources["Product"]["find"]>,
  "id" | "title" | "image" | "variants"
>;

export type ProductVariant = ResolveType<RestResources["Variant"]["find"]>;
