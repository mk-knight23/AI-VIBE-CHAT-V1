import type { FetchError } from 'ofetch'

export default defineNuxtPlugin(() => {
  // Vue error handler
  const handler = (error: unknown, instance: unknown, info: string) => {
    console.error('Vue Error:', error)
    console.error('Component:', instance)
    console.error('Info:', info)
  }

  // Global error handler for unhandled promise rejections
  const rejectionHandler = (event: PromiseRejectionEvent) => {
    console.error('Unhandled Promise Rejection:', event.reason)

    const error = event.reason
    if (error instanceof Error) {
      console.error('Error stack:', error.stack)
    }
  }

  // Global error handler for synchronous errors
  const errorHandler = (event: ErrorEvent) => {
    console.error('Global Error:', event.error)
    console.error('Filename:', event.filename)
    console.error('Line:', event.lineno)
    console.error('Column:', event.colno)
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
export function showError(message: string) {
  console.error('Error:', message)
}

// Helper function to show success notification
export function showSuccess(message: string) {
  console.log('Success:', message)
}
