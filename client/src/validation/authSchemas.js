import { z } from 'zod';

// Schema for individual signup
export const individualSignupSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Confirm password is required'),
});

// Schema for vendor signup (basic fields - adjust as needed)
export const vendorSignupSchema = z.object({
  companyName: z.string().min(1, 'Company name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Confirm password is required'),
});

// Helper to turn Zod error into a simple map of field -> message
export function zodFieldErrors(zodError) {
  if (!zodError || !zodError.errors) return {};
  const mapped = {};
  for (const err of zodError.errors) {
    const key = err.path?.[0] || '_form';
    // Prefer to keep first error per field
    if (!mapped[key]) mapped[key] = err.message;
  }
  return mapped;
}
