import type { APIRoute } from "astro";
import { getProductById } from "@/lib/shopify";
import type { ProductVariant } from "@/lib/shopify/types";
import { stripe } from "@/lib/stripe";
import { z } from "astro/zod";

export const POST: APIRoute = async ({ request }) => {
  if (request.headers.get("Content-Type") !== "application/json") {
    return new Response(JSON.stringify({ error: "Invalid request" }), {
      status: 400,
    });
  }

  try {
    const body: { id: string } = await request.json();

    if (!body.id) {
      return new Response(JSON.stringify({ error: "id is required!" }), {
        status: 400,
      });
    }

    const { product } = await getProductById(body.id);

    if (!product) {
      return new Response(JSON.stringify({ error: "Product not found!" }), {
        status: 400,
      });
    }

    const { price }: ProductVariant =
      product.variants &&
      Array.isArray(product.variants) &&
      product.variants[0];

    const PRICE = Math.round(parseFloat(price ?? "0") * 100);

    const intent = await stripe.paymentIntents.create({
      amount: PRICE,
      currency: "usd",
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        productId: product.id!,
      },
    });

    return new Response(
      JSON.stringify({
        clientSecret: intent.client_secret,
        id: intent.id,
        product,
      }),
      { status: 200 }
    );
  } catch (err) {
    let message = "unknown error";

    return new Response(JSON.stringify({ error: message }), {
      status: 400,
    });
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
    const body = await request.json();

    const result = updateSchema.safeParse(body);

    if (result.error) {
      return new Response(JSON.stringify({ error: "Invalid input!" }), {
        status: 400,
      });
    }

    const { variantId, intentId } = result.data;

    const paymentIntent = await stripe.paymentIntents.retrieve(intentId);

    if (!paymentIntent) {
      return new Response(
        JSON.stringify({ error: "Failed to complete payment!" }),
        {
          status: 400,
        }
      );
    }

    const { product } = await getProductById(paymentIntent.metadata.productId);

    if (!product) {
      return new Response(JSON.stringify({ error: "Invalid product!" }), {
        status: 400,
      });
    }

    const variant: ProductVariant | undefined =
      product.variants &&
      Array.isArray(product.variants) &&
      product.variants.find(
        (v: ProductVariant) => v.id?.toString() === variantId
      );

    if (!variant) {
      return new Response(JSON.stringify({ error: "Invalid variant!" }), {
        status: 400,
      });
    }

    const PRICE = Math.round(parseFloat(variant.price ?? "0") * 100);

    await stripe.paymentIntents.update(intentId, {
      amount: PRICE,
      metadata: {
        variantId: variant.id!,
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
