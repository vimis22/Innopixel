/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string
  readonly VITE_API_PROXY_TARGET?: string
  // "api" uses Innopixel's chatbot backend (/api/chatbot); anything else runs the website-content demo
  readonly VITE_CHATBOT_MODE?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
