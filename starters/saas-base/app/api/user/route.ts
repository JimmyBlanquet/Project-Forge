import { getUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { withErrorHandler, apiSuccess, apiError } from "@/lib/api/error-handler";

export const DELETE = withErrorHandler(async () => {
  const user = await getUser();

  if (!user) {
    return apiError("UNAUTHORIZED");
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .delete()
    .eq("id", user.id);

  if (error) {
    throw error;
  }

  return apiSuccess({ message: "User deleted successfully" });
});
