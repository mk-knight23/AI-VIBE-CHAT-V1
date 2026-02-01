import type { FetchError } from 'ofetch'

export default defineNuxtPlugin((nuxtApp) => {
  // Vue error handler - use Nuxt's error handling
  const handler = (error: unknown, _instance: unknown, _info: string) => {
    // Log to error tracking service in production
    // eslint-disable-next-line no-console
    console.error('[App Error]', error)
  }

  nuxtApp.vueApp.config.errorHandler = handler

  // Global error handler for unhandled promise rejections
  const rejectionHandler = (event: PromiseRejectionEvent) => {
    // eslint-disable-next-line no-console
    console.error('[Unhandled Rejection]', event.reason)
  }

  // Global error handler for synchronous errors
  const errorHandler = (event: ErrorEvent) => {
    // eslint-disable-next-line no-console
    console.error('[Global Error]', event.error)
  }

  if (process.client) {
    window.addEventListener('unhandledrejection', rejectionHandler)
    window.addEventListener('error', errorHandler)
  }

  return {
    provide: {
      errorHandler: handler,
    },
  }
})

// Helper function to handle API errors
export function handleApiError(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }

  if (typeof error === 'object' && error !== null) {
    const fetchError = error as FetchError
    if (fetchError.data?.error) {
      return fetchError.data.error
    }
    if (fetchError.message) {
      return fetchError.message
    }
  }

  return 'An unexpected error occurred'
}

// Helper function to show error notification
export function showError(message: string): void {
  // Use a toast/notification system instead of console
  // This is a placeholder for actual UI notification
  throw new Error(message)
}

// Helper function to show success notification
export function showSuccess(_message: string): void {
  // Use a toast/notification system instead of console
  // This is a placeholder for actual UI notification
}
