import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import {
  User,
  ShoppingBag,
  Lock,
  Loader2,
  Eye,
  EyeOff,
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuthStore } from "@/stores/useAuthStore";

interface ProfileFormData {
  name: string;
  phone: string;
}

interface PasswordFormData {
  password: string;
  confirmPassword: string;
}

export default function AccountPage() {
  const user = useAuthStore((s) => s.user);
  const updateProfile = useAuthStore((s) => s.updateProfile);
  const updatePassword = useAuthStore((s) => s.updatePassword);

  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register: registerProfile,
    handleSubmit: handleProfile,
    formState: { errors: profileErrors },
  } = useForm<ProfileFormData>({
    defaultValues: {
      name: user?.name ?? "",
      phone: user?.phone ?? "",
    },
  });

  const {
    register: registerPwd,
    handleSubmit: handlePwd,
    watch,
    reset: resetPwd,
    formState: { errors: pwdErrors },
  } = useForm<PasswordFormData>();

  const password = watch("password");

  const onSaveProfile = handleProfile(async (data) => {
    setIsSavingProfile(true);
    const { error } = await updateProfile(data);
    setIsSavingProfile(false);

    if (error) {
      toast.error(error);
      return;
    }
    toast.success("Profile updated!");
  });

  const onSavePassword = handlePwd(async (data) => {
    setIsSavingPassword(true);
    const { error } = await updatePassword(data.password);
    setIsSavingPassword(false);

    if (error) {
      toast.error(error);
      return;
    }
    toast.success("Password updated!");
    resetPwd();
  });

  return (
    <>
      <Helmet>
        <title>My Account | Korea By Local</title>
        <meta
          name="description"
          content="Manage your Korea By Local account and view your orders."
        />
      </Helmet>

      <div className="mx-auto max-w-3xl px-4 py-8 lg:py-12">
        <h1 className="text-2xl font-bold text-primary lg:text-3xl">
          My Account
        </h1>
        <p className="mt-2 text-text-secondary">
          Welcome, {user?.name ?? user?.email}
        </p>

        {/* Quick links */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <Link
            to="/account/orders"
            className="flex items-center gap-4 rounded-xl border border-gray-200 p-5 transition-all hover:border-primary-light hover:shadow-sm"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/5">
              <ShoppingBag className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold text-primary">Order History</h2>
              <p className="text-sm text-text-secondary">
                View your past orders
              </p>
            </div>
          </Link>
        </div>

        {/* Profile Section */}
        <section className="mt-10 rounded-xl border border-gray-200 bg-white p-6">
          <div className="mb-4 flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-bold text-primary">Profile</h2>
          </div>

          <form onSubmit={onSaveProfile} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-primary">
                Email
              </label>
              <input
                type="email"
                value={user?.email ?? ""}
                disabled
                className="w-full rounded-lg border border-gray-200 bg-background-gray px-4 py-2.5 text-sm text-text-secondary"
              />
            </div>

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
                {...registerProfile("name", {
                  required: "Name is required",
                })}
                className={`w-full rounded-lg border px-4 py-2.5 text-sm outline-none transition-colors focus:ring-1 ${
                  profileErrors.name
                    ? "border-red-400 focus:border-red-400 focus:ring-red-400"
                    : "border-gray-200 focus:border-primary focus:ring-primary"
                }`}
              />
              {profileErrors.name && (
                <p className="mt-1 text-xs text-red-500">
                  {profileErrors.name.message}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="phone"
                className="mb-1 block text-sm font-medium text-primary"
              >
                Phone{" "}
                <span className="font-normal text-text-secondary">
                  (optional)
                </span>
              </label>
              <input
                id="phone"
                type="tel"
                {...registerProfile("phone")}
                className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
                placeholder="+82 10-1234-5678"
              />
            </div>

            <button
              type="submit"
              disabled={isSavingProfile}
              className="flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-dark disabled:opacity-50"
            >
              {isSavingProfile && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              Save Changes
            </button>
          </form>
        </section>

        {/* Password Section */}
        <section className="mt-6 rounded-xl border border-gray-200 bg-white p-6">
          <div className="mb-4 flex items-center gap-2">
            <Lock className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-bold text-primary">Change Password</h2>
          </div>

          <form onSubmit={onSavePassword} className="space-y-4">
            <div>
              <label
                htmlFor="new-password"
                className="mb-1 block text-sm font-medium text-primary"
              >
                New Password
              </label>
              <div className="relative">
                <input
                  id="new-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  {...registerPwd("password", {
                    required: "Password is required",
                    minLength: {
                      value: 6,
                      message: "Password must be at least 6 characters",
                    },
                  })}
                  className={`w-full rounded-lg border px-4 py-2.5 pr-10 text-sm outline-none transition-colors focus:ring-1 ${
                    pwdErrors.password
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
              {pwdErrors.password && (
                <p className="mt-1 text-xs text-red-500">
                  {pwdErrors.password.message}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="confirm-new-password"
                className="mb-1 block text-sm font-medium text-primary"
              >
                Confirm New Password
              </label>
              <input
                id="confirm-new-password"
                type="password"
                autoComplete="new-password"
                {...registerPwd("confirmPassword", {
                  required: "Please confirm your password",
                  validate: (v) =>
                    v === password || "Passwords do not match",
                })}
                className={`w-full rounded-lg border px-4 py-2.5 text-sm outline-none transition-colors focus:ring-1 ${
                  pwdErrors.confirmPassword
                    ? "border-red-400 focus:border-red-400 focus:ring-red-400"
                    : "border-gray-200 focus:border-primary focus:ring-primary"
                }`}
                placeholder="Re-enter your new password"
              />
              {pwdErrors.confirmPassword && (
                <p className="mt-1 text-xs text-red-500">
                  {pwdErrors.confirmPassword.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSavingPassword}
              className="flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-dark disabled:opacity-50"
            >
              {isSavingPassword && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              Update Password
            </button>
          </form>
        </section>
      </div>
    </>
  );
}
