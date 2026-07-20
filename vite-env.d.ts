/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VERCEL?: string;
  readonly VITE_GIT_SHA?: string;
  readonly VITE_DEPLOY_ID?: string;
  readonly VITE_LARAVEL_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
