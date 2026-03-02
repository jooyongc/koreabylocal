import { create } from "zustand";
import { supabase } from "@/lib/supabase";

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  phone?: string;
  avatarUrl?: string;
  role: "customer" | "admin";
}

interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
}

interface AuthActions {
  setUser: (user: AuthUser | null) => void;
  setLoading: (loading: boolean) => void;
  initialize: () => () => void;
  signIn: (
    email: string,
    password: string,
  ) => Promise<{ error?: string }>;
  signUp: (
    email: string,
    password: string,
    name: string,
  ) => Promise<{ error?: string; needsVerification?: boolean }>;
  signInWithGoogle: () => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error?: string }>;
  updatePassword: (password: string) => Promise<{ error?: string }>;
  updateProfile: (data: {
    name?: string;
    phone?: string;
  }) => Promise<{ error?: string }>;
}

async function fetchProfile(userId: string): Promise<AuthUser | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, name, phone, avatar_url, role")
    .eq("id", userId)
    .single();

  if (error || !data) return null;

  return {
    id: data.id,
    email: data.email,
    name: data.name ?? undefined,
    phone: data.phone ?? undefined,
    avatarUrl: data.avatar_url ?? undefined,
    role: data.role === "admin" ? "admin" : "customer",
  };
}

export const useAuthStore = create<AuthState & AuthActions>((set, get) => ({
  user: null,
  isLoading: true,

  setUser: (user) => set({ user }),
  setLoading: (isLoading) => set({ isLoading }),

  initialize: () => {
    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const profile = await fetchProfile(session.user.id);
        set({ user: profile, isLoading: false });
      } else {
        set({ user: null, isLoading: false });
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (
        event === "SIGNED_IN" ||
        event === "TOKEN_REFRESHED" ||
        event === "USER_UPDATED"
      ) {
        if (session?.user) {
          const profile = await fetchProfile(session.user.id);
          set({ user: profile, isLoading: false });
        }
      } else if (event === "SIGNED_OUT") {
        set({ user: null, isLoading: false });
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  },

  signIn: async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) return { error: error.message };
    return {};
  },

  signUp: async (email, password, name) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
      },
    });
    if (error) return { error: error.message };

    // If email confirmation is required
    if (data.user && !data.session) {
      return { needsVerification: true };
    }

    return {};
  },

  signInWithGoogle: async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/`,
      },
    });
    if (error) return { error: error.message };
    return {};
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null });
  },

  resetPassword: async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) return { error: error.message };
    return {};
  },

  updatePassword: async (password) => {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) return { error: error.message };
    return {};
  },

  updateProfile: async (data) => {
    const user = get().user;
    if (!user) return { error: "Not authenticated" };

    const { error } = await supabase
      .from("profiles")
      .update({
        name: data.name,
        phone: data.phone,
      })
      .eq("id", user.id);

    if (error) return { error: error.message };

    // Update local state
    set({
      user: {
        ...user,
        name: data.name ?? user.name,
        phone: data.phone ?? user.phone,
      },
    });

    return {};
  },
}));
