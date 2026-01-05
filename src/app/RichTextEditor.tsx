/**
 * Rich Text Editor Component with Markdown, Code Highlighting, and LaTeX Support
 * For CHUTES AI Chat v5 - Enterprise Edition
 */

import React, { useCallback, useMemo, useRef, useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

// ============================================================================
// Types
// ============================================================================

export interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  className?: string;
  language?: string;
  readOnly?: boolean;
  maxHeight?: string;
  enableMarkdown?: boolean;
  enableSyntaxHighlighting?: boolean;
  enableLatex?: boolean;
  onSave?: () => void;
}

export interface CodeBlockProps {
  code: string;
  language?: string;
  showLineNumbers?: boolean;
  highlightLines?: number[];
  onCopy?: () => void;
}

export interface LatexBlockProps {
  formula: string;
  displayMode?: boolean;
}

export interface Selection {
  start: number;
  end: number;
  text: string;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Escape HTML special characters
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/\x27/g, '&#39;');
}

/**
 * Simple markdown to HTML converter
 */
function markdownToHtml(text: string): string {
  let html = escapeHtml(text);

  // Code blocks (```language\ncode\n```)
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) => {
    return `<pre class="code-block" data-language="${lang}"><code>${escapeHtml(code.trim())}</code></pre>`;
  });

  // Inline code (`code`)
  html = html.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');

  // Bold (**text**)
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

  // Italic (*text*)
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');

  // Strikethrough (~~text~~)
  html = html.replace(/~~([^~]+)~~/g, '<del>$1</del>');

  // Headers (# ## ### etc)
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');

  // Unordered lists
  html = html.replace(/^\* (.+)$/gm, '<li>$1</li>');
  html = html.replace(/^- (.+)$/gm, '<li>$1</li>');

  // Ordered lists
  html = html.replace(/^\d+\. (.+)$/gm, '<li>$1</li>');

  // Links [text](url)
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

  // Images ![alt](url)
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" loading="lazy" />');

  // Horizontal rules
  html = html.replace(/^---$/gm, '<hr />');

  // Blockquotes
  html = html.replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>');

  // Line breaks
  html = html.replace(/\n/g, '<br />');

  return html;
}

/**
 * Extract LaTeX formulas from text
 */
function extractLatex(text: string): { processed: string; formulas: Array<{ id: string; formula: string; displayMode: boolean }> } {
  const formulas: Array<{ id: string; formula: string; displayMode: boolean }> = [];
  let id = 0;

  // Display mode: $$formula$$
  let processed = text.replace(/\$\$([\s\S]*?)\$\$/g, (_, formula) => {
    formulas.push({ id: `latex-${++id}`, formula: formula.trim(), displayMode: true });
    return `%%LATEX-${id}%%`;
  });

  // Inline mode: $formula$
  processed = processed.replace(/\$([^$\n]+?)\$/g, (_, formula) => {
    formulas.push({ id: `latex-${++id}`, formula: formula.trim(), displayMode: false });
    return `%%LATEX-${id}%%`;
  });

  return { processed, formulas };
}

// ============================================================================
// Code Syntax Highlighting
// ============================================================================

const languageKeywords: Record<string, string[]> = {
  javascript: [
    'const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while', 'do',
    'switch', 'case', 'break', 'continue', 'new', 'this', 'class', 'extends', 'import',
    'export', 'default', 'async', 'await', 'try', 'catch', 'finally', 'throw', 'typeof',
    'instanceof', 'in', 'of', 'delete', 'void', 'yield', 'static', 'get', 'set', 'true', 'false', 'null', 'undefined'
  ],
  typescript: [
    'interface', 'type', 'enum', 'implements', 'private', 'public', 'protected',
    'abstract', 'readonly', 'override', 'never', 'unknown', 'any', 'void', 'boolean',
    'number', 'string', 'symbol', 'bigint', 'as', 'from', 'declare', 'module', 'namespace'
  ],
  python: [
    'def', 'return', 'if', 'elif', 'else', 'for', 'while', 'break', 'continue',
    'pass', 'class', 'import', 'from', 'as', 'try', 'except', 'finally', 'raise',
    'with', 'lambda', 'and', 'or', 'not', 'in', 'is', 'None', 'True', 'False', 'global', 'nonlocal'
  ],
  java: [
    'public', 'private', 'protected', 'static', 'final', 'abstract', 'class',
    'interface', 'extends', 'implements', 'new', 'this', 'super', 'return',
    'if', 'else', 'for', 'while', 'do', 'switch', 'case', 'break', 'continue',
    'try', 'catch', 'finally', 'throw', 'throws', 'void', 'int', 'long', 'boolean', 'char', 'byte', 'float', 'double'
  ],
  rust: [
    'fn', 'let', 'mut', 'const', 'if', 'else', 'match', 'for', 'while', 'loop',
    'break', 'continue', 'return', 'struct', 'enum', 'impl', 'trait', 'pub',
    'mod', 'use', 'as', 'self', 'super', 'where', 'async', 'await', 'move',
    'true', 'false', 'Some', 'None', 'Ok', 'Err', 'Box', 'Vec', 'String', '&str'
  ],
  go: [
    'func', 'var', 'const', 'type', 'struct', 'interface', 'map', 'chan',
    'if', 'else', 'for', 'range', 'switch', 'case', 'default', 'break', 'continue',
    'return', 'go', 'defer', 'select', 'package', 'import', 'nil', 'true', 'false'
  ],
  cpp: [
    'int', 'long', 'float', 'double', 'char', 'bool', 'void', 'auto', 'const',
    'static', 'class', 'struct', 'enum', 'public', 'private', 'protected',
    'virtual', 'override', 'final', 'template', 'typename', 'namespace',
    'if', 'else', 'for', 'while', 'do', 'switch', 'case', 'default', 'break', 'continue',
    'return', 'new', 'delete', 'this', 'nullptr', 'true', 'false', 'using', 'include'
  ],
  c: [
    'int', 'long', 'float', 'double', 'char', 'void', 'const', 'static',
    'struct', 'enum', 'union', 'typedef', 'sizeof', 'if', 'else', 'for',
    'while', 'do', 'switch', 'case', 'default', 'break', 'continue', 'return',
    'include', 'define', 'ifdef', 'ifndef', 'endif', 'NULL', 'printf', 'scanf'
  ],
  sql: [
    'SELECT', 'FROM', 'WHERE', 'AND', 'OR', 'NOT', 'IN', 'LIKE', 'BETWEEN',
    'INSERT', 'INTO', 'VALUES', 'UPDATE', 'SET', 'DELETE', 'CREATE', 'TABLE',
    'DROP', 'ALTER', 'INDEX', 'JOIN', 'LEFT', 'RIGHT', 'INNER', 'OUTER',
    'ON', 'AS', 'ORDER', 'BY', 'GROUP', 'HAVING', 'LIMIT', 'OFFSET',
    'COUNT', 'SUM', 'AVG', 'MIN', 'MAX', 'DISTINCT', 'NULL', 'IS', 'NULL'
  ],
  shell: [
    'if', 'then', 'else', 'elif', 'fi', 'case', 'esac', 'for', 'while', 'until',
    'do', 'done', 'in', 'function', 'return', 'exit', 'echo', 'read', 'local',
    'export', 'source', 'alias', 'unalias', 'cd', 'pwd', 'ls', 'mkdir', 'rm',
    'cp', 'mv', 'cat', 'grep', 'sed', 'awk', 'find', 'xargs', 'pipe', 'redirect'
  ],
};

const builtInFunctions: Record<string, RegExp[]> = {
  javascript: [
    /\b(console\.\w+)\b/g,
    /\b(JSON\.(parse|stringify))\b/g,
    /\b(Math\.(random|floor|ceil|round|abs|min|max|pow|sqrt|log|exp|sin|cos|tan))\b/g,
    /\b(Array\.(isArray|from|of))\b/g,
    /\b(Object\.(keys|values|entries|assign|create|freeze))\b/g,
    /\b(String\.(slice|substr|substring|replace|split|trim|toLowerCase|toUpperCase))\b/g,
  ],
  typescript: [
    /\b(console\.\w+)\b/g,
    /\b(React\.\w+)\b/g,
    /\b(useState|useEffect|useContext|useRef|useMemo|useCallback)\b/g,
  ],
  python: [
    /\b(print|len|str|int|float|list|dict|tuple|set|range|open|input)\b/g,
    /\b(map|filter|reduce|zip|enumerate|sorted|reversed)\b/g,
    /\b(os\.\w+|sys\.\w+|re\.\w+)\b/g,
  ],
};

const stringPattern = /(["'`])(?:(?!\1)[^\\]|\\.)*\1/g;
const numberPattern = /\b\d+\.?\d*(e[+-]?\d+)?\b/g;
const commentPattern = {
  single: /\/\/.*$/gm,
  multiStart: /\/\*/g,
  multiEnd: /\*\//g,
  python: /#.*$/gm,
  shell: /#.*$/gm,
  sql: /--.*$/gm,
};

/**
 * Highlight code syntax
 */
function highlightCode(code: string, language: string = ''): string {
  const lang = language.toLowerCase();
  const keywords = languageKeywords[lang] || [];
  const keywordsSet = new Set(keywords);
  
  let highlighted = escapeHtml(code);

  // Remove comments first (simplified)
  if (lang === 'python' || lang === 'shell' || lang === 'sql') {
    highlighted = highlighted.replace(commentPattern[lang as keyof typeof commentPattern] || commentPattern.single, '<span class="comment">$&</span>');
  } else {
    highlighted = highlighted.replace(commentPattern.single, '<span class="comment">$&</span>');
  }

  // Strings
  highlighted = highlighted.replace(stringPattern, '<span class="string">$&</span>');

  // Numbers
  highlighted = highlighted.replace(numberPattern, '<span class="number">$&</span>');

  // Keywords
  const words = highlighted.split(/(\b\w+\b)/g);
  highlighted = words.map(word => {
    if (keywordsSet.has(word)) {
      return `<span class="keyword">${word}</span>`;
    }
    return word;
  }).join('');

  // Built-in functions
  const functions = builtInFunctions[lang] || [];
  for (const pattern of functions) {
    highlighted = highlighted.replace(pattern, '<span class="function">$1</span>');
  }

  return highlighted;
}

// ============================================================================
// LaTeX Component
// ============================================================================

export const LatexBlock: React.FC<LatexBlockProps> = ({ formula, displayMode = true }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    // Dynamic load KaTeX if not available
    const loadKatex = async () => {
      if (typeof window !== 'undefined') {
        const win = window as unknown as { katex?: { renderToString: (formula: string, options: { displayMode: boolean; throwOnError: boolean; errorColor: string }) => string } };
        if (!win.katex) {
          try {
            const katexModule = await import('katex');
            setIsLoaded(true);
            win.katex = katexModule;
          } catch {
            setError(true);
          }
        } else {
          setIsLoaded(true);
        }
      }
    };
    loadKatex();
  }, []);

  if (error) {
    return (
      <div className={cn(
        "latex-fallback p-4 bg-muted rounded-md font-mono text-sm",
        displayMode ? "block text-center" : "inline"
      )}>
        {formula}
      </div>
    );
  }

  if (!isLoaded || typeof window === 'undefined') {
    return (
      <span className={cn("animate-pulse bg-muted rounded", displayMode ? "block h-8" : "inline-block w-20 h-4")} />
    );
  }

  try {
    const {katex} = (window as unknown as { katex: { renderToString: (formula: string, options: { displayMode: boolean; throwOnError: boolean; errorColor: string }) => string } });
    const html = katex.renderToString(formula, {
      displayMode,
      throwOnError: false,
      errorColor: '#cc0000',
    });

    return (
      <span
        className={cn(displayMode ? "latex-display block my-4 overflow-x-auto" : "latex-inline")}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  } catch {
    return <span className="text-red-500">{formula}</span>;
  }
};

// ============================================================================
// Code Block Component
// ============================================================================

export const CodeBlock: React.FC<CodeBlockProps> = ({
  code,
  language = '',
  showLineNumbers = true,
  highlightLines = [],
  onCopy
}) => {
  const [copied, setCopied] = useState(false);
  const lines = code.split('\n');
  const highlightedCode = useMemo(
    () => highlightCode(code, language),
    [code, language]
  );

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    onCopy?.();
  }, [code, onCopy]);

  return (
    <div className="code-block-wrapper relative group my-4 rounded-lg overflow-hidden bg-[#1e1e2e]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#2d2d3d] border-b border-[#3d3d4d]">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 font-medium uppercase">{language || 'text'}</span>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 px-2 py-1 text-xs text-gray-400 hover:text-white transition-colors rounded"
          title="Copy code"
        >
          {copied ? (
            <>
              <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-green-400">Copied!</span>
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Code */}
      <div className="relative overflow-x-auto">
        <pre className="p-4 text-sm font-mono leading-relaxed overflow-x-auto">
          <code
            className="syntax-highlighted"
            dangerouslySetInnerHTML={{
              __html: showLineNumbers
                ? lines.map((_, i) => {
                    const lineNum = i + 1;
                    const isHighlighted = highlightLines.includes(lineNum);
                    return `<div class="${isHighlighted ? 'bg-[#3d3d4d] border-l-2 border-blue-500 pl-2' : ''} flex"><span class="text-gray-500 select-none w-8 text-right pr-4 inline-block">${lineNum}</span><span>${highlightedCode.split('\n')[i] || ''}</span></div>`;
                  }).join('')
                : highlightedCode
            }}
          />
        </pre>
      </div>

      {/* Language indicator dots */}
      <div className="absolute top-2 left-2 flex gap-1.5">
        <span className="w-3 h-3 rounded-full bg-red-500" />
        <span className="w-3 h-3 rounded-full bg-yellow-500" />
        <span className="w-3 h-3 rounded-full bg-green-500" />
      </div>
    </div>
  );
};

// ============================================================================
// Rich Text Editor Component
// ============================================================================

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  content,
  onChange,
  placeholder = 'Type your message here...',
  className,
  language = 'plaintext',
  readOnly = false,
  maxHeight = '400px',
  enableMarkdown = true,
  enableSyntaxHighlighting = true,
  enableLatex = true,
  onSave
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [selection, setSelection] = useState<Selection | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [activeToolbar, setActiveToolbar] = useState<string | null>(null);

  // Handle text selection
  const getSelectionRange = useCallback((): Selection | null => {
    const textarea = textareaRef.current;
    if (!textarea) return null;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    if (start === end) return null;

    return {
      start,
      end,
      text: content.substring(start, end)
    };
  }, [content]);

  // Update selection on keyup/mouseup
  useEffect(() => {
    const handleSelectionChange = () => {
      setSelection(getSelectionRange());
    };

    document.addEventListener('selectionchange', handleSelectionChange);
    return () => document.removeEventListener('selectionchange', handleSelectionChange);
  }, [getSelectionRange]);

  // Insert text at cursor/selection
  const insertText = useCallback((before: string, after: string = '', placeholder: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end) || placeholder;
    const newText = content.substring(0, start) + before + selectedText + after + content.substring(end);

    onChange(newText);

    // Restore cursor position
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + before.length + selectedText.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  }, [content, onChange]);

  // Toolbar actions
  const toolbarActions: Record<string, () => void> = {
    bold: () => insertText('**', '**', 'bold text'),
    italic: () => insertText('*', '*', 'italic text'),
    strikethrough: () => insertText('~~', '~~', 'strikethrough'),
    code: () => insertText('`', '`', 'code'),
    codeblock: () => insertText(`\`\`\`${  language  }\n`, '\n```', 'code'),
    link: () => insertText('[', '](url)', 'link text'),
    image: () => insertText('![', '](url)', 'alt text'),
    heading1: () => insertText('# ', '', 'Heading 1'),
    heading2: () => insertText('## ', '', 'Heading 2'),
    heading3: () => insertText('### ', '', 'Heading 3'),
    quote: () => insertText('> ', '', 'Quote'),
    list: () => insertText('- ', '', 'List item'),
    numbered: () => insertText('1. ', '', '1. List item'),
    hr: () => insertText('\n---\n', '', ''),
    latexInline: () => insertText('$', '$', 'formula'),
    latexBlock: () => insertText('$$\n', '\n$$', 'formula'),
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case 'b':
            e.preventDefault();
            toolbarActions.bold();
            break;
          case 'i':
            e.preventDefault();
            toolbarActions.italic();
            break;
          case 'k':
            e.preventDefault();
            toolbarActions.link();
            break;
          case 's':
            e.preventDefault();
            onSave?.();
            break;
        }
      }

      // Tab handling for indentation
      if (e.key === 'Tab') {
        e.preventDefault();
        const textarea = textareaRef.current;
        if (textarea) {
          const start = textarea.selectionStart;
          const end = textarea.selectionEnd;
          const newText = `${content.substring(0, start)  }  ${  content.substring(end)}`;
          onChange(newText);
          setTimeout(() => {
            textarea.selectionStart = textarea.selectionEnd = start + 2;
          }, 0);
        }
      }
    };

    const textarea = textareaRef.current;
    textarea?.addEventListener('keydown', handleKeyDown);
    return () => textarea?.removeEventListener('keydown', handleKeyDown);
  }, [content, onChange, onSave, toolbarActions]);

  // Render preview
  const renderPreview = useMemo(() => {
    if (!enableMarkdown) return null;

    const { processed, formulas } = enableLatex ? extractLatex(content) : { processed: content, formulas: [] };
    let html = markdownToHtml(processed);

    // Replace LaTeX placeholders
    formulas.forEach(({ id, formula, displayMode }) => {
      html = html.replace(
        `%%${id}%%`,
        `<span class="latex-placeholder" data-formula="${encodeURIComponent(formula)}" data-display="${displayMode}">$${formula}$</span>`
      );
    });

    return html;
  }, [content, enableMarkdown, enableLatex]);

  return (
    <div className={cn("rich-text-editor flex flex-col border rounded-lg overflow-hidden", className)}>
      {/* Toolbar */}
      {!readOnly && (
        <div className="toolbar flex items-center gap-1 px-2 py-1 bg-muted border-b overflow-x-auto">
          <ToolbarButton
            icon="B"
            label="Bold (Ctrl+B)"
            onClick={toolbarActions.bold}
            active={selection?.text && /\*\*(.+?)\*\*/.test(selection.text)}
          />
          <ToolbarButton
            icon="I"
            label="Italic (Ctrl+I)"
            onClick={toolbarActions.italic}
            active={selection?.text && /\*(.+?)\*/.test(selection.text)}
          />
          <ToolbarButton
            icon="S"
            label="Strikethrough"
            onClick={toolbarActions.strikethrough}
          />
          <div className="w-px h-6 bg-border mx-1" />
          <ToolbarButton
            icon="<>"
            label="Inline Code"
            onClick={toolbarActions.code}
          />
          <ToolbarButton
            icon="{}"
            label="Code Block"
            onClick={toolbarActions.codeblock}
          />
          <div className="w-px h-6 bg-border mx-1" />
          <ToolbarButton
            icon="🔗"
            label="Link (Ctrl+K)"
            onClick={toolbarActions.link}
          />
          <ToolbarButton
            icon="🖼"
            label="Image"
            onClick={toolbarActions.image}
          />
          <div className="w-px h-6 bg-border mx-1" />
          <ToolbarButton
            icon="H1"
            label="Heading 1"
            onClick={toolbarActions.heading1}
          />
          <ToolbarButton
            icon="H2"
            label="Heading 2"
            onClick={toolbarActions.heading2}
          />
          <ToolbarButton
            icon="H3"
            label="Heading 3"
            onClick={toolbarActions.heading3}
          />
          <div className="w-px h-6 bg-border mx-1" />
          <ToolbarButton
            icon="❝"
            label="Quote"
            onClick={toolbarActions.quote}
          />
          <ToolbarButton
            icon="•"
            label="List"
            onClick={toolbarActions.list}
          />
          <ToolbarButton
            icon="1."
            label="Numbered List"
            onClick={toolbarActions.numbered}
          />
          <ToolbarButton
            icon="―"
            label="Horizontal Rule"
            onClick={toolbarActions.hr}
          />
          <div className="w-px h-6 bg-border mx-1" />
          <ToolbarButton
            icon="∑"
            label="Inline LaTeX"
            onClick={toolbarActions.latexInline}
          />
          <ToolbarButton
            icon="∫"
            label="Block LaTeX"
            onClick={toolbarActions.latexBlock}
          />
          <div className="flex-1" />
          <ToolbarButton
            icon={showPreview ? "✏" : "👁"}
            label={showPreview ? "Edit" : "Preview"}
            onClick={() => setShowPreview(!showPreview)}
            active={showPreview}
          />
        </div>
      )}

      {/* Editor/Preview Area */}
      <div className="flex-1 overflow-auto" style={{ maxHeight }}>
        {showPreview ? (
          <div
            className="preview p-4 prose prose-sm dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: renderPreview }}
          />
        ) : (
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            readOnly={readOnly}
            className="w-full h-full p-4 resize-none border-none outline-none bg-transparent font-mono text-sm"
            spellCheck={false}
          />
        )}
      </div>

      {/* Status Bar */}
      <div className="status-bar flex items-center justify-between px-3 py-1 bg-muted border-t text-xs text-muted-foreground">
        <span>{content.length} characters</span>
        <span>{content.split(/\s+/).filter(Boolean).length} words</span>
        <span className="uppercase">{language}</span>
      </div>
    </div>
  );
};

// ============================================================================
// Toolbar Button Component
// ============================================================================

interface ToolbarButtonProps {
  icon: string;
  label: string;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
}

const ToolbarButton: React.FC<ToolbarButtonProps> = ({
  icon,
  label,
  onClick,
  active,
  disabled
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      className={cn(
        "toolbar-btn flex items-center justify-center w-7 h-7 rounded text-sm font-medium transition-colors",
        active
          ? "bg-primary text-primary-foreground"
          : "hover:bg-accent hover:text-accent-foreground",
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      {icon}
    </button>
  );
};

// ============================================================================
// Export
// ============================================================================

export default RichTextEditor;
