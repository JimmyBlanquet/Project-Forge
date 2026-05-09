# Zod Validation Patterns Skill

## Objective

Implement Zod schema validation patterns for:
- Form validation with react-hook-form
- Server-side validation in API routes and Server Actions
- Type-safe data validation with TypeScript inference
- Reusable validation schemas

## Prerequisites

1. ✅ TypeScript configured
2. ✅ Next.js 14+ (for server actions)

## Implementation Steps

### Step 1: Install Dependencies

```bash
pnpm add zod
pnpm add react-hook-form @hookform/resolvers # For form validation
```

### Step 2: Create Base Validation Schemas

Create `lib/validations/` directory for organizing schemas.

**File: `lib/validations/user.ts`**

```typescript
import { UserRole } from "@prisma/client";
import * as z from "zod";

export const userNameSchema = z.object({
  name: z.string().min(3).max(32),
});

export const userEmailSchema = z.object({
  email: z.string().email(),
});

export const userRoleSchema = z.object({
  role: z.nativeEnum(UserRole),
});

// Compose schemas
export const userUpdateSchema = z.object({
  name: z.string().min(3).max(32).optional(),
  email: z.string().email().optional(),
});

// Infer types
export type UserNameInput = z.infer<typeof userNameSchema>;
export type UserEmailInput = z.infer<typeof userEmailSchema>;
export type UserUpdateInput = z.infer<typeof userUpdateSchema>;
```

**File: `lib/validations/auth.ts`**

```typescript
import * as z from "zod";

export const userAuthSchema = z.object({
  email: z.string().email(),
});

export const userLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const userRegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(100),
  name: z.string().min(3).max(32),
});

export type UserAuthInput = z.infer<typeof userAuthSchema>;
export type UserLoginInput = z.infer<typeof userLoginSchema>;
export type UserRegisterInput = z.infer<typeof userRegisterSchema>;
```

### Step 3: Form Validation with react-hook-form

**Example: User settings form**

```typescript
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { userNameSchema, type UserNameInput } from "@/lib/validations/user";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function UserNameForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<UserNameInput>({
    resolver: zodResolver(userNameSchema),
    defaultValues: {
      name: "",
    },
  });

  async function onSubmit(data: UserNameInput) {
    // Server action or API call
    console.log(data);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          {...register("name")}
          placeholder="Enter your name"
        />
        {errors.name && (
          <p className="text-sm text-red-500">{errors.name.message}</p>
        )}
      </div>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Saving..." : "Save"}
      </Button>
    </form>
  );
}
```

### Step 4: Server-Side Validation

**Server Action with validation:**

```typescript
"use server";

import { revalidatePath } from "next/cache";
import { userNameSchema } from "@/lib/validations/user";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";

export async function updateUserName(formData: FormData) {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  // Parse and validate
  const result = userNameSchema.safeParse({
    name: formData.get("name"),
  });

  if (!result.success) {
    return {
      error: "Invalid name",
      issues: result.error.issues,
    };
  }

  // Update database
  await prisma.user.update({
    where: { id: session.user.id },
    data: { name: result.data.name },
  });

  revalidatePath("/dashboard/settings");
  return { success: true };
}
```

**API Route with validation:**

```typescript
import { NextResponse } from "next/server";
import { userUpdateSchema } from "@/lib/validations/user";

export async function POST(req: Request) {
  try {
    const json = await req.json();

    // Validate request body
    const body = userUpdateSchema.parse(json);

    // Process validated data
    // ...

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", issues: error.issues },
        { status: 422 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
```

## Common Validation Patterns

### Email Validation

```typescript
const emailSchema = z.object({
  email: z.string().email("Invalid email address"),
});
```

### Password Validation

```typescript
const passwordSchema = z.object({
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(100, "Password must be less than 100 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
});
```

### Enum Validation

```typescript
import { UserRole } from "@prisma/client";

const roleSchema = z.object({
  role: z.nativeEnum(UserRole),
});
```

### Optional Fields

```typescript
const updateSchema = z.object({
  name: z.string().min(3).optional(),
  bio: z.string().max(500).optional(),
});
```

### Nested Objects

```typescript
const addressSchema = z.object({
  street: z.string(),
  city: z.string(),
  country: z.string(),
  postalCode: z.string(),
});

const userWithAddressSchema = z.object({
  name: z.string(),
  address: addressSchema,
});
```

### Arrays

```typescript
const tagsSchema = z.object({
  tags: z.array(z.string()).min(1).max(5),
});
```

### Custom Validation

```typescript
const usernameSchema = z.object({
  username: z
    .string()
    .min(3)
    .max(20)
    .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores")
    .refine(
      async (username) => {
        // Check if username is available
        const exists = await checkUsernameExists(username);
        return !exists;
      },
      { message: "Username is already taken" }
    ),
});
```

### Schema Composition

```typescript
const baseUserSchema = z.object({
  name: z.string(),
  email: z.string().email(),
});

const userWithPasswordSchema = baseUserSchema.extend({
  password: z.string().min(8),
});

const adminUserSchema = baseUserSchema.extend({
  role: z.literal("ADMIN"),
  permissions: z.array(z.string()),
});
```

### Transform Data

```typescript
const formSchema = z.object({
  age: z.string().transform((val) => parseInt(val, 10)),
  agree: z.string().transform((val) => val === "on"),
});
```

## Usage with shadcn/ui Form Component

```typescript
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

const formSchema = z.object({
  username: z.string().min(2).max(50),
  email: z.string().email(),
});

export function ProfileForm() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      email: "",
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    console.log(values);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input placeholder="Enter username" {...field} />
              </FormControl>
              <FormDescription>
                This is your public display name.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="Enter email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit">Submit</Button>
      </form>
    </Form>
  );
}
```

## Quality Gates

- ✅ Schemas validate data correctly
- ✅ TypeScript types inferred correctly from schemas
- ✅ Form validation displays errors properly
- ✅ Server-side validation works
- ✅ Custom error messages display

## References

- Zod Docs: https://zod.dev
- react-hook-form: https://react-hook-form.com
- shadcn/ui Form: https://ui.shadcn.com/docs/components/form
