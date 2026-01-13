import { z } from "zod";

// Allow letters, spaces, hyphens, apostrophes.
export const nameSchema = z
  .string()
  .trim()
  .min(2, "Must be at least 2 characters")
  .max(50, "Must be 50 characters or less")
  .regex(/^[A-Za-z][A-Za-z' -]*$/, "Only letters, spaces, apostrophes, and hyphens are allowed");

// Company name: allow letters/numbers/spaces and common punctuation
export const companyNameSchema = z
  .string()
  .trim()
  .min(2, "Company name must be at least 2 characters")
  .max(80, "Company name must be 80 characters or less")
  .regex(/^[A-Za-z0-9][A-Za-z0-9&'().,\-\/ ]*$/, "Company name contains invalid characters");

// Company address: allow typical address chars
export const addressSchema = z
  .string()
  .trim()
  .min(5, "Address must be at least 5 characters")
  .max(120, "Address must be 120 characters or less")
  .regex(/^[A-Za-z0-9#][A-Za-z0-9#'().,\-\/ ]*$/, "Address contains invalid characters");

// Strong password: 6+ chars, uppercase, lowercase, number, special
export const passwordSchema = z.string().refine((value) => {
  const regex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/;
  return regex.test(value);
}, {
  message:
    "Password must be 6+ chars and include uppercase, lowercase, number, and special character."
});

export const individualSignupSchema = z
  .object({
    firstName: nameSchema,
    lastName: nameSchema,
    email: z.string().trim().toLowerCase().email("Enter a valid email"),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .superRefine((data, ctx) => {
    if (data.password !== data.confirmPassword) {
      ctx.addIssue({
        code: "custom",
        message: "Passwords do not match",
        path: ["confirmPassword"],
      });
    }
  });

//  NEW: Vendor schema
export const vendorSignupSchema = z
  .object({
    companyName: companyNameSchema,
    companyAddress: addressSchema,
    email: z.string().trim().toLowerCase().email("Enter a valid email"),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .superRefine((data, ctx) => {
    if (data.password !== data.confirmPassword) {
      ctx.addIssue({
        code: "custom",
        message: "Passwords do not match",
        path: ["confirmPassword"],
      });
    }
  });

/**
 * Helper: convert ZodError -> { fieldName: message }
 */
export function zodFieldErrors(error) {
  const fieldErrors = {};
  for (const issue of error.issues) {
    const key = issue.path?.[0] || "form";
    if (!fieldErrors[key]) fieldErrors[key] = issue.message;
  }
  return fieldErrors;
}
