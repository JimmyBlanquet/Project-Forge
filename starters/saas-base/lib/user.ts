import { createClient } from "@/lib/supabase/server";

export const getUserByEmail = async (email: string) => {
  try {
    const supabase = await createClient();
    const { data: user, error } = await supabase
      .from("profiles")
      .select("name, email_verified")
      .eq("email", email)
      .single();

    if (error) return null;
    return user;
  } catch {
    return null;
  }
};

export const getUserById = async (id: string) => {
  try {
    const supabase = await createClient();
    const { data: user, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", id)
      .single();

    if (error) return null;
    return user;
  } catch {
    return null;
  }
};