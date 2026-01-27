const isVercel = Boolean(import.meta.env.VITE_VERCEL);

export const buildInfo = {
  commit: import.meta.env.VITE_GIT_SHA ?? "",
  deployId: import.meta.env.VITE_DEPLOY_ID ?? "",
};


