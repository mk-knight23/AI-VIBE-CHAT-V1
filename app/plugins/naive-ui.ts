export default defineNuxtPlugin((nuxtApp) => {
  // Theme configuration matching Glassmorphism design
  const theme = {
    common: {
      primaryColor: '#8b5cf6',
      primaryColorHover: '#7c3aed',
      primaryColorPressed: '#6d28d9',
      infoColor: '#06b6d4',
      successColor: '#22c55e',
      warningColor: '#f59e0b',
      errorColor: '#ef4444',
      textColorBase: '#f1f5f9',
      textColor1: '#f1f5f9',
      textColor2: '#94a3b8',
      textColor3: '#64748b',
      bodyColor: '#0f172a',
      cardColor: 'rgba(30, 41, 59, 0.7)',
      modalColor: 'rgba(30, 41, 59, 0.95)',
      borderRadius: '12px',
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    },
    Button: {
      textColor: '#f1f5f9',
      colorPrimary: '#8b5cf6',
      colorPrimaryHover: '#7c3aed',
      borderRadiusMedium: '8px',
    },
    Input: {
      color: 'rgba(15, 23, 42, 0.6)',
      colorFocus: 'rgba(15, 23, 42, 0.8)',
      borderColor: 'rgba(255, 255, 255, 0.1)',
      borderHover: 'rgba(139, 92, 246, 0.5)',
      borderFocus: '#8b5cf6',
      textColor: '#f1f5f9',
      placeholderColor: '#64748b',
      borderRadius: '12px',
    },
    Card: {
      color: 'rgba(30, 41, 59, 0.7)',
      borderColor: 'rgba(255, 255, 255, 0.1)',
      borderRadius: '16px',
    },
    Modal: {
      color: 'rgba(30, 41, 59, 0.95)',
      borderColor: 'rgba(255, 255, 255, 0.1)',
      borderRadius: '16px',
    },
    Menu: {
      color: 'rgba(30, 41, 59, 0.95)',
    },
    Dropdown: {
      color: 'rgba(30, 41, 59, 0.95)',
      borderRadius: '8px',
    },
    Tooltip: {
      color: 'rgba(30, 41, 59, 0.95)',
      textColor: '#f1f5f9',
    },
  }

  return {
    provide: {
      naiveTheme: theme,
    },
  }
})
