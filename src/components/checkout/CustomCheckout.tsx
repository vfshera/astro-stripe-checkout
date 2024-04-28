import { useEffect, useState, type FormEvent } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  useStripe,
  useElements,
  PaymentElement,
  AddressElement,
} from "@stripe/react-stripe-js";

const stripePromise = loadStripe(import.meta.env.PUBLIC_STRIPE_API_KEY!);

export default function CustomCheckout() {
  const [clientSecret, setClientSecret] = useState("");

  useEffect(() => {
    fetch("/api/stripe/create-payment-intent", {
      method: "POST",
    })
      .then((res) => res.json())
      .then((data) => {
        setClientSecret(data.clientSecret);
      });
  }, []);

  return (
    <div>
      {stripePromise && !!clientSecret && (
        <Elements stripe={stripePromise} options={{ clientSecret }}>
          <CustomCheckoutForm />
        </Elements>
      )}
    </div>
  );
}

function CustomCheckoutForm() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState("");
  const stripe = useStripe();
  const elements = useElements();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setMessage("");

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: "if_required",
    });

    if (error) {
      if (
        (error.type === "card_error" || error.type === "validation_error") &&
        error?.message
      ) {
        setMessage(error.message);

        return;
      }

      setMessage("An unexpected error occurred.");
    }

    if (paymentIntent) {
      switch (paymentIntent.status) {
        case "succeeded":
          setMessage("Payment succeeded!");
          break;
        case "processing":
          setMessage("Your payment is processing.");
          break;
        case "requires_payment_method":
          setMessage("Your payment was not successful, please try again.");
          break;
        default:
          setMessage("Something went wrong.");
          break;
      }
    }

    setIsProcessing(false);
  }

  return (
    <div className="p-20">
      <form className="w-2/5 mx-auto space-y-5 " onSubmit={handleSubmit}>
        <div className="space-y-3">
          <div>
            <p>Shipping address</p>
            <p className="text-sm text-gray-600">Enter your shipping details</p>
          </div>
          <AddressElement options={{ mode: "shipping" }} />
        </div>

        <div className="space-y-3">
          <div>
            <p>Payment</p>
          </div>
          <PaymentElement id="payment-element" />
        </div>

        <button
          disabled={isProcessing || !stripe || !elements}
          className="w-full bg-blue-700 text-white mt-5 py-3 rounded shadow-lg"
        >
          {isProcessing ? "Processing..." : "Pay now"}
        </button>
        {message && (
          <div id="payment-message" className="">
            {message}
          </div>
        )}
      </form>
    </div>
  );
}
