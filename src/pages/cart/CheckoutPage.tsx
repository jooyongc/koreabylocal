import { Helmet } from "react-helmet-async";

export default function CheckoutPage() {
  return (
    <>
      <Helmet>
        <title>Checkout | Korea By Local</title>
        <meta name="description" content="Complete your purchase securely." />
      </Helmet>
      <div className="mx-auto max-w-7xl px-4 py-12">
        <h1 className="text-3xl font-bold text-primary">Checkout</h1>
        <p className="mt-2 text-text-secondary">Complete your order.</p>
      </div>
    </>
  );
}
