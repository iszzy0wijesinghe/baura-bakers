/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VERCEL?: string;
  readonly VITE_GIT_SHA?: string;
  readonly VITE_DEPLOY_ID?: string;
}
