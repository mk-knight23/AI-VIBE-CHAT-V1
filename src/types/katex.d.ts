declare module 'katex' {
  export function renderToString(
    formula: string,
    options?: {
      displayMode?: boolean;
      throwOnError?: boolean;
      errorColor?: string;
      macros?: Record<string, string>;
      strict?: boolean | 'ignore' | 'warn' | 'error';
      trust?: boolean | ((context: { command: string; url: string }) => boolean);
      globalGroup?: boolean;
    }
  ): string;

  export function render(
    element: HTMLElement,
    formula: string,
    options?: {
      displayMode?: boolean;
      throwOnError?: boolean;
      errorColor?: string;
      macros?: Record<string, string>;
      strict?: boolean | 'ignore' | 'warn' | 'error';
      trust?: boolean | ((context: { command: string; url: string }) => boolean);
      globalGroup?: boolean;
    }
  ): void;

  export const version: string;
  export const Settings: {
    new (options?: {
      displayMode?: boolean;
      throwOnError?: boolean;
      errorColor?: string;
      macros?: Record<string, string>;
      strict?: boolean | 'ignore' | 'warn' | 'error';
      trust?: boolean | ((context: { command: string; url: string }) => boolean);
      globalGroup?: boolean;
    }): any;
  };
}
