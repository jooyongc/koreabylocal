import { Helmet } from "react-helmet-async";

export default function HomePage() {
  return (
    <>
      <Helmet>
        <title>Korea By Local - Authentic Korean Experiences by Locals</title>
        <meta
          name="description"
          content="Discover authentic Korean travel experiences curated by locals"
        />
      </Helmet>
      <div className="min-h-screen flex items-center justify-center bg-background-gray">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-primary mb-4">
            Korea By Local
          </h1>
          <p className="text-text-secondary text-lg">
            Discover authentic Korean travel experiences curated by locals
          </p>
          <div className="mt-8 inline-block bg-gradient-to-r from-accent-indigo via-accent-purple to-accent text-white px-6 py-3 rounded-lg font-semibold">
            Coming Soon
          </div>
        </div>
      </div>
    </>
  );
}
