import { Helmet } from "react-helmet-async";

export default function CartPage() {
  return (
    <>
      <Helmet>
        <title>Cart | Korea By Local</title>
        <meta name="description" content="Review your shopping cart before checkout." />
      </Helmet>
      <div className="mx-auto max-w-7xl px-4 py-12">
        <h1 className="text-3xl font-bold text-primary">Shopping Cart</h1>
        <p className="mt-2 text-text-secondary">Review your items before checkout.</p>
      </div>
    </>
  );
}
