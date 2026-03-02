import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { Loader2, Eye, EyeOff, Mail } from "lucide-react";
import toast from "react-hot-toast";
import { useAuthStore } from "@/stores/useAuthStore";

interface SignupFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export default function SignupPage() {
  const navigate = useNavigate();
  const signUp = useAuthStore((s) => s.signUp);
  const signInWithGoogle = useAuthStore((s) => s.signInWithGoogle);
  const user = useAuthStore((s) => s.user);

  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<SignupFormData>();

  const password = watch("password");

  if (user) {
    navigate("/", { replace: true });
    return null;
  }

  const onSubmit = handleSubmit(async (data) => {
    setIsSubmitting(true);
    const result = await signUp(data.email, data.password, data.name);
    setIsSubmitting(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    if (result.needsVerification) {
      setVerificationSent(true);
      return;
    }

    toast.success("Account created!");
    navigate("/", { replace: true });
  });

  const handleGoogle = async () => {
    setIsGoogleLoading(true);
    const { error } = await signInWithGoogle();
    if (error) {
      toast.error(error);
      setIsGoogleLoading(false);
    }
  };

  // Email verification notice
  if (verificationSent) {
    return (
      <>
        <Helmet>
          <title>Check Your Email | Korea By Local</title>
        </Helmet>
        <div className="flex flex-1 items-center justify-center px-4 py-12">
          <div className="w-full max-w-md text-center">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50">
              <Mail className="h-8 w-8 text-emerald-500" />
            </div>
            <h1 className="text-2xl font-bold text-primary">
              Check your email
            </h1>
            <p className="mt-3 text-text-secondary">
              We&apos;ve sent a verification link to your email address. Please
              click the link to activate your account.
            </p>
            <Link
              to="/login"
              className="mt-6 inline-block text-sm font-medium text-accent hover:underline"
            >
              Back to Sign In
            </Link>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>Sign Up | Korea By Local</title>
        <meta
          name="description"
          content="Create a Korea By Local account to book tours and shop Korean goods."
        />
      </Helmet>

      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <h1 className="text-center text-2xl font-bold text-primary">
            Create Account
          </h1>
          <p className="mt-2 text-center text-text-secondary">
            Join Korea By Local for authentic Korean experiences.
          </p>

          <div className="mt-8 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            {/* Google OAuth */}
            <button
              onClick={handleGoogle}
              disabled={isGoogleLoading}
              className="flex w-full items-center justify-center gap-3 rounded-lg border border-gray-200 py-2.5 text-sm font-medium text-primary transition-colors hover:bg-background-gray disabled:opacity-50"
            >
              {isGoogleLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
              )}
              Continue with Google
            </button>

            <div className="my-6 flex items-center gap-3">
              <div className="h-px flex-1 bg-gray-200" />
              <span className="text-xs text-text-secondary">or</span>
              <div className="h-px flex-1 bg-gray-200" />
            </div>

            <form onSubmit={onSubmit} className="space-y-4">
              {/* Name */}
              <div>
                <label
                  htmlFor="name"
                  className="mb-1 block text-sm font-medium text-primary"
                >
                  Name
                </label>
                <input
                  id="name"
                  type="text"
                  autoComplete="name"
                  {...register("name", { required: "Name is required" })}
                  className={`w-full rounded-lg border px-4 py-2.5 text-sm outline-none transition-colors focus:ring-1 ${
                    errors.name
                      ? "border-red-400 focus:border-red-400 focus:ring-red-400"
                      : "border-gray-200 focus:border-primary focus:ring-primary"
                  }`}
                  placeholder="Your name"
                />
                {errors.name && (
                  <p className="mt-1 text-xs text-red-500">
                    {errors.name.message}
                  </p>
                )}
              </div>

              {/* Email */}
              <div>
                <label
                  htmlFor="email"
                  className="mb-1 block text-sm font-medium text-primary"
                >
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  {...register("email", {
                    required: "Email is required",
                    pattern: {
                      value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                      message: "Invalid email address",
                    },
                  })}
                  className={`w-full rounded-lg border px-4 py-2.5 text-sm outline-none transition-colors focus:ring-1 ${
                    errors.email
                      ? "border-red-400 focus:border-red-400 focus:ring-red-400"
                      : "border-gray-200 focus:border-primary focus:ring-primary"
                  }`}
                  placeholder="your@email.com"
                />
                {errors.email && (
                  <p className="mt-1 text-xs text-red-500">
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Password */}
              <div>
                <label
                  htmlFor="password"
                  className="mb-1 block text-sm font-medium text-primary"
                >
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    {...register("password", {
                      required: "Password is required",
                      minLength: {
                        value: 6,
                        message: "Password must be at least 6 characters",
                      },
                    })}
                    className={`w-full rounded-lg border px-4 py-2.5 pr-10 text-sm outline-none transition-colors focus:ring-1 ${
                      errors.password
                        ? "border-red-400 focus:border-red-400 focus:ring-red-400"
                        : "border-gray-200 focus:border-primary focus:ring-primary"
                    }`}
                    placeholder="At least 6 characters"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-primary"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-xs text-red-500">
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* Confirm password */}
              <div>
                <label
                  htmlFor="confirmPassword"
                  className="mb-1 block text-sm font-medium text-primary"
                >
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  {...register("confirmPassword", {
                    required: "Please confirm your password",
                    validate: (v) =>
                      v === password || "Passwords do not match",
                  })}
                  className={`w-full rounded-lg border px-4 py-2.5 text-sm outline-none transition-colors focus:ring-1 ${
                    errors.confirmPassword
                      ? "border-red-400 focus:border-red-400 focus:ring-red-400"
                      : "border-gray-200 focus:border-primary focus:ring-primary"
                  }`}
                  placeholder="Re-enter your password"
                />
                {errors.confirmPassword && (
                  <p className="mt-1 text-xs text-red-500">
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-dark disabled:opacity-50"
              >
                {isSubmitting && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
                Create Account
              </button>
            </form>
          </div>

          <p className="mt-4 text-center text-sm text-text-secondary">
            Already have an account?{" "}
            <Link
              to="/login"
              className="font-medium text-primary-light hover:underline"
            >
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </>
  );
}
