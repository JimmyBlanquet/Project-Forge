import { Database } from "@/lib/supabase/types";
import * as z from "zod";

type UserRole = Database["public"]["Enums"]["user_role"];

export const userNameSchema = z.object({
  name: z.string().min(3).max(32),
});

export const userRoleSchema = z.object({
  role: z.enum(["ADMIN", "USER"]),
});
