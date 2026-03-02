import { Helmet } from "react-helmet-async";

export default function AskALocalPage() {
  return (
    <>
      <Helmet>
        <title>Ask a Local | Korea By Local</title>
        <meta name="description" content="Have a question about Korea? Ask a local for personalized recommendations." />
      </Helmet>
      <div className="mx-auto max-w-7xl px-4 py-12">
        <h1 className="text-3xl font-bold text-primary">Ask a Local</h1>
        <p className="mt-2 text-text-secondary">Get personalized recommendations from Korean locals.</p>
      </div>
    </>
  );
}
