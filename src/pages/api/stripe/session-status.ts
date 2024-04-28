import { stripe } from "@/lib/stripe";
import type { APIRoute } from "astro";

export const GET: APIRoute = async (req) => {
  const session_id = new URL(req.url).searchParams.get("session_id");

  if (!session_id) {
    return new Response(JSON.stringify({ error: "Missing session_id" }));
  }

  const session = await stripe.checkout.sessions.retrieve(session_id);

  return new Response(
    JSON.stringify({
      status: session.status,
      customer_email: session?.customer_details?.email,
    })
  );
};
