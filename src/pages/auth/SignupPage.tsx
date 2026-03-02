import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";

export default function SignupPage() {
  return (
    <>
      <Helmet>
        <title>Sign Up | Korea By Local</title>
        <meta name="description" content="Create a Korea By Local account to book tours and shop Korean goods." />
      </Helmet>
      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <h1 className="text-2xl font-bold text-primary text-center">Create Account</h1>
          <p className="mt-2 text-center text-text-secondary">
            Join Korea By Local for authentic Korean experiences.
          </p>
          <div className="mt-8 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <p className="text-center text-text-secondary">Sign up form coming soon.</p>
          </div>
          <p className="mt-4 text-center text-sm text-text-secondary">
            Already have an account?{" "}
            <Link to="/login" className="font-medium text-primary-light hover:underline">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </>
  );
}
