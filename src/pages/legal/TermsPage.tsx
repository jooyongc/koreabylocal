import { Helmet } from "react-helmet-async";

export default function TermsPage() {
  return (
    <>
      <Helmet>
        <title>Terms of Service | Korea By Local</title>
        <meta name="description" content="Review our terms of service for using Korea By Local." />
      </Helmet>
      <div className="mx-auto max-w-7xl px-4 py-12">
        <h1 className="text-3xl font-bold text-primary">Terms of Service</h1>
      </div>
    </>
  );
}
