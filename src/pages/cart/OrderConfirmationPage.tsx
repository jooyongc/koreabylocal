import { Helmet } from "react-helmet-async";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle, ArrowRight } from "lucide-react";

export default function OrderConfirmationPage() {
  const [searchParams] = useSearchParams();
  const orderNumber = searchParams.get("orderNumber");

  return (
    <>
      <Helmet>
        <title>Order Confirmed | Korea By Local</title>
        <meta
          name="description"
          content="Your order has been placed successfully."
        />
      </Helmet>

      <div className="mx-auto max-w-2xl px-4 py-16 text-center lg:py-24">
        {/* Success icon */}
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50">
          <CheckCircle className="h-10 w-10 text-emerald-500" />
        </div>

        <h1 className="text-2xl font-bold text-primary lg:text-3xl">
          Thank you for your order!
        </h1>

        {orderNumber && (
          <p className="mt-3 text-lg text-text-secondary">
            Order number:{" "}
            <span className="font-semibold text-primary">{orderNumber}</span>
          </p>
        )}

        <div className="mx-auto mt-8 max-w-md rounded-xl border border-gray-200 bg-white p-6 text-left">
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-text-secondary">
            What happens next?
          </h2>
          <ul className="space-y-3 text-sm text-text-secondary">
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
                1
              </span>
              <span>
                We&apos;ll send a confirmation email to your inbox shortly.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
                2
              </span>
              <span>
                Our team will contact you within 24 hours to confirm your
                booking details.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
                3
              </span>
              <span>
                You&apos;ll receive all necessary information before your
                experience date.
              </span>
            </li>
          </ul>
        </div>

        <p className="mt-6 text-sm text-text-secondary">
          If you have any questions, please reach out to us at{" "}
          <a
            href="mailto:info@koreabylocal.com"
            className="font-medium text-accent hover:underline"
          >
            info@koreabylocal.com
          </a>
        </p>

        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link
            to="/shop"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-dark"
          >
            Continue Shopping
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-6 py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-background-gray"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </>
  );
}
