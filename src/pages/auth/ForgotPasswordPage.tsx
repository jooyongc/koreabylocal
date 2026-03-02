import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { Loader2, Mail, ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";
import { useAuthStore } from "@/stores/useAuthStore";

export default function ForgotPasswordPage() {
  const resetPassword = useAuthStore((s) => s.resetPassword);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<{ email: string }>();

  const onSubmit = handleSubmit(async (data) => {
    setIsSubmitting(true);
    const { error } = await resetPassword(data.email);
    setIsSubmitting(false);

    if (error) {
      toast.error(error);
      return;
    }

    setEmailSent(true);
  });

  if (emailSent) {
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
              We&apos;ve sent a password reset link to your email address.
              Please click the link to set a new password.
            </p>
            <Link
              to="/login"
              className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-accent hover:underline"
            >
              <ArrowLeft className="h-4 w-4" />
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
        <title>Forgot Password | Korea By Local</title>
        <meta
          name="description"
          content="Reset your Korea By Local account password."
        />
      </Helmet>

      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <h1 className="text-center text-2xl font-bold text-primary">
            Forgot Password
          </h1>
          <p className="mt-2 text-center text-text-secondary">
            Enter your email and we&apos;ll send you a reset link.
          </p>

          <div className="mt-8 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <form onSubmit={onSubmit} className="space-y-4">
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

              <button
                type="submit"
                disabled={isSubmitting}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-dark disabled:opacity-50"
              >
                {isSubmitting && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
                Send Reset Link
              </button>
            </form>
          </div>

          <p className="mt-4 text-center">
            <Link
              to="/login"
              className="inline-flex items-center gap-1 text-sm font-medium text-text-secondary hover:text-primary"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to Sign In
            </Link>
          </p>
        </div>
      </div>
    </>
  );
}
