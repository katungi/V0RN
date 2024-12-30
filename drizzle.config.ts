import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

config({
  path: ".env.local",
});

export default defineConfig({
  schema: "./src/lib/db/schema/schema.ts",
  out: "./src/lib/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    // biome-ignore lint: Forbidden non-null assertion.
    url: "postgresql://katungi:Bg1o0lqPYjiJ@ep-white-cherry-480263.us-east-2.aws.neon.tech/neondb?sslmode=require",
  },
});
