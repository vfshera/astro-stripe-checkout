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
