import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <>
      <Helmet>
        <title>404 - Page Not Found | Korea By Local</title>
        <meta name="description" content="The page you are looking for does not exist." />
      </Helmet>
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-20 text-center">
        <h1 className="text-7xl font-bold text-primary">404</h1>
        <p className="mt-4 text-xl text-text-secondary">
          Page not found
        </p>
        <p className="mt-2 text-text-secondary">
          The page you are looking for doesn't exist or has been moved.
        </p>
        <Link
          to="/"
          className="mt-8 inline-block rounded-lg bg-primary px-6 py-3 font-semibold text-white hover:bg-primary-light transition-colors"
        >
          Back to Home
        </Link>
      </div>
    </>
  );
}
