// Prettier Configuration for CHUTES AI Chat v5
// Enhanced formatting with security and consistency focus

module.exports = {
  // Basic formatting
  semi: true,
  singleQuote: true,
  tabWidth: 2,
  useTabs: false,
  trailingComma: 'es5',
  printWidth: 100,
  quoteProps: 'as-needed',
  bracketSpacing: true,
  bracketSameLine: false,
  
  // TypeScript and React specific
  arrowParens: 'avoid',
  endOfLine: 'lf',
  embeddedLanguageFormatting: 'auto',
  
  // Security-focused formatting
  jsxSingleQuote: false,
  
  // Plugin configuration
  plugins: [
    'prettier-plugin-organize-imports',
    'prettier-plugin-tailwindcss'
  ],
  
  // Tailwind CSS class sorting
  tailwindcss: {
    experimentalTernaries: true
  },
  
  // Organize imports
  organizeImports: {
    removeUnusedImports: true,
    ignoreCase: false,
    ignoreDeclarationSort: false
  },
  
  // File overrides
  overrides: [
    {
      files: '*.json',
      options: {
        printWidth: 80
      }
    },
    {
      files: '*.md',
      options: {
        printWidth: 80,
        proseWrap: 'always'
      }
    },
    {
      files: '*.yml',
      options: {
        tabWidth: 2
      }
    },
    {
      files: '*.yaml',
      options: {
        tabWidth: 2
      }
    }
  ]
};