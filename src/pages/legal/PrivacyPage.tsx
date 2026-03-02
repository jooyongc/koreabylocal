import { Helmet } from "react-helmet-async";

export default function PrivacyPage() {
  return (
    <>
      <Helmet>
        <title>Privacy Policy | Korea By Local</title>
        <meta name="description" content="Read our privacy policy to understand how we handle your data." />
      </Helmet>
      <div className="mx-auto max-w-7xl px-4 py-12">
        <h1 className="text-3xl font-bold text-primary">Privacy Policy</h1>
      </div>
    </>
  );
}
