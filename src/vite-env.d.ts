/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** "1" serves the admin API from the MSW mock; unset hits the real backend. */
  readonly VITE_MOCK?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
