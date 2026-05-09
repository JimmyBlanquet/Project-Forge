import "server-only";

import { cache } from "react";
import { getUser, getUserProfile } from "@/lib/auth";

export const getCurrentUser = cache(async () => {
  const user = await getUser();
  if (!user) {
    return undefined;
  }

  const profile = await getUserProfile();

  return {
    id: user.id,
    email: user.email,
    name: user.user_metadata?.name || null,
    image: user.user_metadata?.avatar_url || null,
    role: profile?.role || 'USER',
  };
});