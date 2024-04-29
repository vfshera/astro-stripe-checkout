import { stripe } from "@/lib/stripe";
import type { APIRoute } from "astro";

export const POST: APIRoute = async ({ request, site }) => {
  const baseUrl = site || new URL(request.url).origin;
  const return_url = new URL(
    `/checkout/confirm?session_id={CHECKOUT_SESSION_ID}`,
    baseUrl
  );

  const session = await stripe.checkout.sessions.create({
    ui_mode: "embedded",
    line_items: [
      {
        price: "price_1MkfFaC2E9PG9OjQBxEmv6VU",
        quantity: 1,
      },
      {
        price: "price_1MS2qqC2E9PG9OjQg4dszKGy",
        quantity: 1,
      },
    ],
    mode: "payment",
    return_url: return_url.toString(),
  });

  return new Response(JSON.stringify({ clientSecret: session.client_secret }));
};
