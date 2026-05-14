import { z } from 'zod';

const schema = z.object({
  VITE_API_BASE_URL: z.string().min(1),
  VITE_APP_VERSION: z.string().default('0.0.0'),
});

export const env = schema.parse(import.meta.env);
