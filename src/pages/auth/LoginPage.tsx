import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";

export default function LoginPage() {
  return (
    <>
      <Helmet>
        <title>Login | Korea By Local</title>
        <meta name="description" content="Sign in to your Korea By Local account." />
      </Helmet>
      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <h1 className="text-2xl font-bold text-primary text-center">Sign In</h1>
          <p className="mt-2 text-center text-text-secondary">
            Welcome back! Sign in to your account.
          </p>
          <div className="mt-8 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <p className="text-center text-text-secondary">Login form coming soon.</p>
          </div>
          <p className="mt-4 text-center text-sm text-text-secondary">
            Don't have an account?{" "}
            <Link to="/signup" className="font-medium text-primary-light hover:underline">
              Sign Up
            </Link>
          </p>
        </div>
      </div>
    </>
  );
}
