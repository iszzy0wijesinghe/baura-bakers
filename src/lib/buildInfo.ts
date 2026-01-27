// src/lib/buildInfo.ts

// Vercel sets `VERCEL` automatically (not VITE_ prefixed)
export const isVercel = import.meta.env.VERCEL === "1";

// Your own build-time vars (only if you define them)
export const buildInfo = {
  commit: import.meta.env.VITE_GIT_SHA ?? "",
  deployId: import.meta.env.VITE_DEPLOY_ID ?? "",
};
