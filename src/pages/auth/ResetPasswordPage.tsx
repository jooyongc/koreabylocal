import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { Loader2, Eye, EyeOff, CheckCircle } from "lucide-react";
import toast from "react-hot-toast";
import { useAuthStore } from "@/stores/useAuthStore";

interface ResetFormData {
  password: string;
  confirmPassword: string;
}

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const updatePassword = useAuthStore((s) => s.updatePassword);

  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ResetFormData>();

  const password = watch("password");

  const onSubmit = handleSubmit(async (data) => {
    setIsSubmitting(true);
    const { error } = await updatePassword(data.password);
    setIsSubmitting(false);

    if (error) {
      toast.error(error);
      return;
    }

    setSuccess(true);
    setTimeout(() => navigate("/login", { replace: true }), 3000);
  });

  if (success) {
    return (
      <>
        <Helmet>
          <title>Password Reset | Korea By Local</title>
        </Helmet>
        <div className="flex flex-1 items-center justify-center px-4 py-12">
          <div className="w-full max-w-md text-center">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50">
              <CheckCircle className="h-8 w-8 text-emerald-500" />
            </div>
            <h1 className="text-2xl font-bold text-primary">
              Password updated!
            </h1>
            <p className="mt-3 text-text-secondary">
              Your password has been successfully reset. You&apos;ll be
              redirected to sign in shortly.
            </p>
            <Link
              to="/login"
              className="mt-6 inline-block text-sm font-medium text-accent hover:underline"
            >
              Go to Sign In
            </Link>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>Reset Password | Korea By Local</title>
        <meta
          name="description"
          content="Set a new password for your account."
        />
      </Helmet>

      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <h1 className="text-center text-2xl font-bold text-primary">
            Set New Password
          </h1>
          <p className="mt-2 text-center text-text-secondary">
            Enter your new password below.
          </p>

          <div className="mt-8 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <form onSubmit={onSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="password"
                  className="mb-1 block text-sm font-medium text-primary"
                >
                  New Password
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

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="mb-1 block text-sm font-medium text-primary"
                >
                  Confirm New Password
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
                  placeholder="Re-enter your new password"
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
                Update Password
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
