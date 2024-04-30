import { useEffect, useState, type FormEvent } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  useStripe,
  useElements,
  PaymentElement,
  AddressElement,
} from "@stripe/react-stripe-js";
import { product } from "@/data/products";

const stripePromise = loadStripe(import.meta.env.PUBLIC_STRIPE_API_KEY!);

export default function CustomCheckout() {
  const [clientSecret, setClientSecret] = useState("");
  const [intentId, setIntentId] = useState("");

  useEffect(() => {
    fetch("/api/stripe/create-payment-intent", {
      method: "POST",
    })
      .then((res) => res.json())
      .then(({ id, clientSecret }) => {
        setIntentId(id);
        setClientSecret(clientSecret);
      });
  }, []);

  return (
    <div>
      {stripePromise && !!clientSecret && (
        <Elements stripe={stripePromise} options={{ clientSecret }}>
          <CustomCheckoutForm intentId={intentId} />
        </Elements>
      )}
    </div>
  );
}

function CustomCheckoutForm(props: { intentId: string }) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState("");
  const stripe = useStripe();
  const elements = useElements();

  const [succeeded, setSucceeded] = useState(false);

  const [selectedVariant, setSelectedVariant] = useState(
    product.variants[0] /** we know reccommended is always first */
  );

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    if (!stripe || !elements || !selectedVariant) {
      return;
    }
    setIsProcessing(true);
    setMessage("");

    try {
      const res = await fetch("/api/stripe/create-payment-intent", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          intentId: props.intentId,
          variantId: selectedVariant.variant_id,
        }),
      });

      if (!res.ok) {
        return;
      }

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
          setIsProcessing(false);
          console.log("here");

          return;
        }

        setMessage("An unexpected error occurred.");
      }

      if (paymentIntent) {
        switch (paymentIntent.status) {
          case "succeeded":
            setMessage("Payment succeeded!");
            setSucceeded(true);
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
    } catch (e) {
      console.log(e);
    }

    setIsProcessing(false);
  }

  return (
    <div className="py-10">
      {succeeded ? (
        <div className="w-3/5 mx-auto  flex flex-col items-center text-green-500">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-20 h-auto "
            viewBox="0 0 24 24"
          >
            <path
              fill="currentColor"
              d="m10.6 13.8l-2.15-2.15q-.275-.275-.7-.275t-.7.275t-.275.7t.275.7L9.9 15.9q.3.3.7.3t.7-.3l5.65-5.65q.275-.275.275-.7t-.275-.7t-.7-.275t-.7.275zM12 22q-2.075 0-3.9-.788t-3.175-2.137T2.788 15.9T2 12t.788-3.9t2.137-3.175T8.1 2.788T12 2t3.9.788t3.175 2.137T21.213 8.1T22 12t-.788 3.9t-2.137 3.175t-3.175 2.138T12 22"
            ></path>
          </svg>

          <p className="text-2xl font-bold text-center ">Success!</p>

          <button
            onClick={() => window.location.reload()}
            className="px-5 py-2.5 block w-max bg-blue-600 rounded shadow-lg text-white min-w-[300px] text-center mt-20"
          >
            Back to Shopping...
          </button>
        </div>
      ) : (
        <form
          className="w-4/5 lg:w-3/4 xl:w-3/5 gap-20 mx-auto grid grid-cols-2  "
          onSubmit={handleSubmit}
        >
          <div className="space-y-5">
            <div className="relative w-full drop-shadow-md overflow-hidden rounded">
              <img src={product.photo.src} alt={product.title} />

              <div className="absolute bottom-0 right-0 transition-all bg-white/80 px-4 rounded-tl-3xl leading-none py-2 flex flex-col text-right min-w-[120px]">
                <span>Total</span>
                <span className="font-semibold text-blue-800 text-2xl/none">
                  ${parseFloat(selectedVariant.price) * selectedVariant.items}
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <p className="font-semibold">Choose package</p>
              <div className="flex flex-col gap-2">
                {product.variants.map((variant) => (
                  <div
                    key={variant.variant_id}
                    className="relative"
                    onClick={() => {
                      setSelectedVariant(variant);
                    }}
                  >
                    <input
                      className="absolute top-1/2 -translate-y-1/2 left-5 peer accent-blue-800"
                      type="radio"
                      name="product"
                      value={variant.variant_id}
                      id={variant.variant_id}
                      checked={
                        selectedVariant.variant_id === variant.variant_id
                      }
                      required
                    />
                    <label
                      htmlFor={product.id}
                      className="w-full peer-checked:[&>div]:border-blue-800"
                    >
                      <div className="p-5 pl-10  border-2 rounded border-slate-200 transition-colors">
                        <div className="flex items-center justify-between">
                          <p>
                            <strong>Buy {variant.items}</strong> {product.title}
                          </p>
                          <p className="before:content-[''] before:absolute relative before:top-[11px] before:h-px before:w-[122%] before:-left-2 before:rotate-[352deg] before:bg-red-500">
                            ${(product.price * variant.items).toFixed(2)}
                          </p>
                        </div>
                        <div className="flex items-center justify-between">
                          <strong className="text-red-500 text-[15px]">
                            Save {variant.discount_percentage}% Off
                          </strong>

                          <strong>${variant.price}/each</strong>
                        </div>
                      </div>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-5">
            <div className="space-y-3">
              <div>
                <p className="font-semibold">Shipping address</p>
                <p className="text-sm text-gray-600">
                  Enter your shipping details
                </p>
              </div>
              <AddressElement options={{ mode: "shipping" }} />
            </div>

            <div className="space-y-3">
              <div>
                <p className="font-semibold">Payment</p>
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
          </div>
        </form>
      )}
    </div>
  );
}
