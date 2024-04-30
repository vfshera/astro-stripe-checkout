import { stripe } from "@/lib/stripe";
import type { APIRoute } from "astro";

export const POST: APIRoute = async ({ request }) => {
  try {
    const intent = await stripe.paymentIntents.create({
      amount: 100,
      currency: "usd",
      automatic_payment_methods: {
        enabled: true,
      },
    });

    return new Response(JSON.stringify({ clientSecret: intent.client_secret }));
  } catch (e) {
    console.log(e);

    return new Response(JSON.stringify({ error: "" }), { status: 400 });
  }
};

export const PUT: APIRoute = async ({ request }) => {
  if (request.headers.get("Content-Type") !== "application/json") {
    return new Response(JSON.stringify({ error: "Invalit request" }), {
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
