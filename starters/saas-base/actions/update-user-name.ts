"use server";

import { getUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { userNameSchema } from "@/lib/validations/user";
import { revalidatePath } from "next/cache";

export type FormData = {
  name: string;
};

export async function updateUserName(userId: string, data: FormData) {
  try {
    const user = await getUser()

    if (!user || user.id !== userId) {
      throw new Error("Unauthorized");
    }

    const { name } = userNameSchema.parse(data);

    // Update the user name.
    const supabase = await createClient();
    const { error } = await supabase
      .from("profiles")
      .update({ name })
      .eq("id", userId);

    if (error) {
      throw error;
    }

    revalidatePath('/dashboard/settings');
    return { status: "success" };
  } catch (error) {
    // console.log(error)
    return { status: "error" }
  }
}