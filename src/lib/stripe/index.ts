import Stripe from "stripe";

export const stripe = new Stripe(import.meta.env.STRIPE_SECRET_API_KEY!);
