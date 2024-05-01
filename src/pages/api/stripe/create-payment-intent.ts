import { product } from "@/data/products";
import { stripe } from "@/lib/stripe";
import type { APIRoute } from "astro";
import { z } from "astro/zod";

export const POST: APIRoute = async () => {
  try {
    const { price, items } = product.variants[0];
    const PRICE = Math.round(parseFloat(price) * 100 * items);

    const intent = await stripe.paymentIntents.create({
      amount: PRICE,
      currency: "usd",
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        product_id: product.id,
      },
    });

    return new Response(
      JSON.stringify({ clientSecret: intent.client_secret, id: intent.id }),
      { status: 200 }
    );
  } catch (e) {
    console.log(e);

    return new Response(JSON.stringify({ error: "" }), { status: 400 });
  }
};

const updateSchema = z.object({
  variantId: z.string(),
  intentId: z.string(),
});

export const PUT: APIRoute = async ({ request }) => {
  if (request.headers.get("Content-Type") !== "application/json") {
    return new Response(JSON.stringify({ error: "Invalid request" }), {
      status: 400,
    });
  }

  try {
    const body: { variantId?: string; intentId?: string } =
      await request.json();

    const result = updateSchema.safeParse(body);

    if (result.error) {
      return new Response(JSON.stringify({ error: "Invalid input!" }), {
        status: 400,
      });
    }

    const { variantId, intentId } = result.data;

    const variant = product.variants.find((v) => v.variant_id === variantId);

    if (!variant) {
      return new Response(JSON.stringify({ error: "Invalid variant!" }), {
        status: 400,
      });
    }
    const PRICE = Math.round(parseFloat(variant.price) * 100 * variant.items);

    await stripe.paymentIntents.update(intentId, {
      amount: PRICE,
      metadata: {
        variant_id: variant.variant_id,
      },
    });

    return new Response(JSON.stringify({ message: "Variant selected!" }), {
      status: 200,
    });
  } catch (e) {
    let message = "Something went wrong!";

    if (e instanceof Error) {
      message = e.message;
    }

    return new Response(JSON.stringify({ error: message }), { status: 400 });
  }
};
