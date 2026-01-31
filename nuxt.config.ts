// Nuxt 3 Configuration for AI-VIBE-CHAT-V1
export default defineNuxtConfig({
  // Source directory
  srcDir: 'app/',

  // Development
  devtools: { enabled: true },

  // Runtime Config (environment variables)
  runtimeConfig: {
    // Server-side only
    openrouterApiKey: process.env.NUXT_OPENROUTER_API_KEY,
    megallmApiKey: process.env.NUXT_MEGALLM_API_KEY,
    agentrouterApiKey: process.env.NUXT_AGENTROUTER_API_KEY,
    routewayApiKey: process.env.NUXT_ROUTEWAY_API_KEY,

    // Public (client-side)
    public: {
      appName: 'AI-VIBE-CHAT-V1',
      appUrl: process.env.NUXT_PUBLIC_APP_URL || 'http://localhost:3000'
    }
  },

  // CSS (relative to srcDir)
  css: ['../assets/styles/global.scss'],

  // Modules
  modules: [
    '@pinia/nuxt',
    '@vueuse/nuxt',
    '@nuxtjs/color-mode'
  ],

  // Pinia configuration
  pinia: {
    storesDirs: ['./stores/**']
  },

  // Color mode
  colorMode: {
    preference: 'system',
    fallback: 'dark',
    classSuffix: ''
  },

  // Nitro configuration
  nitro: {
    preset: 'node-server'
  },

  // TypeScript
  typescript: {
    strict: true,
    typeCheck: false
  },

  // Build
  build: {
    transpile: ['naive-ui', 'vueuc', '@css-render/vue3-ssr']
  },

  // Vite configuration
  vite: {
    optimizeDeps: {
      include: ['naive-ui', 'vueuc']
    }
  },

  // App configuration
  app: {
    head: {
      title: 'AI-VIBE-CHAT-V1',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'Multi-provider AI chat application' }
      ]
    }
  },

  // Route rules
  routeRules: {
    '/api/**': { cors: true }
  },

  // Compatibility
  compatibilityDate: '2025-01-31',

  // Enable pages
  pages: true
})
