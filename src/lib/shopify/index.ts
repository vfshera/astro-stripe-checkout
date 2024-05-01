const {
  SHOPIFY_ADMIN_API_KEY,
  SHOPIFY_ADMIN_API_SECRET_KEY,
  SHOPIFY_ADMIN_ACCESS_TOKEN,
  SHOPIFY_STORE_NAME,
} = import.meta.env;

import "@shopify/shopify-api/adapters/node";
import { shopifyApi, LATEST_API_VERSION } from "@shopify/shopify-api";
import { restResources } from "@shopify/shopify-api/rest/admin/2024-04";
import type { Product } from "./types";

const HOST_NAME = `https://${SHOPIFY_STORE_NAME}.myshopify.com`;

const shopify = shopifyApi({
  apiKey: SHOPIFY_ADMIN_API_KEY as string,
  apiSecretKey: SHOPIFY_ADMIN_API_SECRET_KEY as string,
  adminApiAccessToken: SHOPIFY_ADMIN_ACCESS_TOKEN as string,
  apiVersion: LATEST_API_VERSION,
  scopes: ["read_products"],
  hostName: HOST_NAME as string,
  isEmbeddedApp: false,
  isCustomStoreApp: true,
  restResources,
});

const session = shopify.session.customAppSession(
  `${SHOPIFY_STORE_NAME}.myshopify.com`
);

export async function getProductById(id: string) {
  const product = (await shopify.rest.Product.find({
    session,
    id: id,
    fields: "id,title,image,variants",
  })) as Product | null;

  return { product };
}
