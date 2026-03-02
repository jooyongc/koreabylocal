import { Helmet } from "react-helmet-async";

export default function AboutPage() {
  return (
    <>
      <Helmet>
        <title>About Us | Korea By Local</title>
        <meta name="description" content="Learn about Korea By Local and our mission to share authentic Korean experiences." />
      </Helmet>
      <div className="mx-auto max-w-7xl px-4 py-12">
        <h1 className="text-3xl font-bold text-primary">About Us</h1>
        <p className="mt-2 text-text-secondary">Our mission to share authentic Korean experiences.</p>
      </div>
    </>
  );
}
