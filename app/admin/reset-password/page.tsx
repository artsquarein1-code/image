import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { ResetPasswordForm } from "@/components/admin/reset-password-form";

export const metadata: Metadata = {
  title: "Reset password | ART SQUARE Admin",
  description: "Securely reset your ART SQUARE staff account password.",
};

type ResetPasswordPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  const [{ error }, supabase] = await Promise.all([searchParams, createClient()]);
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <ResetPasswordForm
      initiallyAuthenticated={Boolean(user)}
      linkError={error === "expired" || error === "invalid"}
    />
  );
}
