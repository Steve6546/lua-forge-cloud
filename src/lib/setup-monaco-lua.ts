import type { Monaco } from "@monaco-editor/react";
import {
  ROBLOX_GLOBALS,
  ROBLOX_METHODS,
  ROBLOX_PROPERTIES,
  ROBLOX_TYPES,
  LUA_STDLIB,
  LUA_SNIPPETS,
  lintLuaCode,
} from "./lua-intellisense";

let registered = false;

export function setupMonacoLua(monaco: Monaco) {
  if (registered) return;
  registered = true;

  // Register completion provider
  monaco.languages.registerCompletionItemProvider("lua", {
    triggerCharacters: [".", ":", '"'],
    provideCompletionItems: (model, position) => {
      const word = model.getWordUntilPosition(position);
      const range = {
        startLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endLineNumber: position.lineNumber,
        endColumn: word.endColumn,
      };

      const lineContent = model.getLineContent(position.lineNumber);
      const beforeCursor = lineContent.substring(0, position.column - 1);

      const suggestions: any[] = [];

      // After colon → methods
      if (beforeCursor.endsWith(":") || beforeCursor.match(/:\w*$/)) {
        ROBLOX_METHODS.forEach((m) => {
          suggestions.push({
            label: m.label,
            kind: monaco.languages.CompletionItemKind.Method,
            detail: m.detail,
            documentation: { value: m.documentation },
            insertText: m.insertText,
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            range,
          });
        });
      }
      // After dot → properties + methods
      else if (beforeCursor.endsWith(".") || beforeCursor.match(/\.\w*$/)) {
        ROBLOX_PROPERTIES.forEach((p) => {
          suggestions.push({
            label: p.label,
            kind: monaco.languages.CompletionItemKind.Property,
            detail: p.detail,
            documentation: { value: p.documentation },
            insertText: p.insertText,
            range,
          });
        });
        ROBLOX_METHODS.forEach((m) => {
          suggestions.push({
            label: m.label,
            kind: monaco.languages.CompletionItemKind.Method,
            detail: m.detail,
            documentation: { value: m.documentation },
            insertText: m.insertText,
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            range,
          });
        });
      }
      // Default → globals + stdlib + types + snippets
      else {
        [...ROBLOX_GLOBALS, ...LUA_STDLIB, ...ROBLOX_TYPES].forEach((item) => {
          suggestions.push({
            label: item.label,
            kind: item.kind,
            detail: item.detail,
            documentation: { value: item.documentation },
            insertText: item.insertText,
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            range,
          });
        });

        // Snippets
        LUA_SNIPPETS.forEach((s) => {
          suggestions.push({
            label: s.prefix,
            kind: monaco.languages.CompletionItemKind.Snippet,
            detail: s.label,
            documentation: { value: s.description },
            insertText: s.body,
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            range,
          });
        });
      }

      return { suggestions };
    },
  });

  // Hover provider
  monaco.languages.registerHoverProvider("lua", {
    provideHover: (model, position) => {
      const word = model.getWordAtPosition(position);
      if (!word) return null;

      const allEntries = [...ROBLOX_GLOBALS, ...ROBLOX_METHODS, ...ROBLOX_PROPERTIES, ...LUA_STDLIB, ...ROBLOX_TYPES];
      const entry = allEntries.find(
        (e) => e.label === word.word || e.label.split(".").pop() === word.word
      );

      if (!entry) return null;

      return {
        range: new monaco.Range(
          position.lineNumber,
          word.startColumn,
          position.lineNumber,
          word.endColumn
        ),
        contents: [
          { value: `**${entry.label}**` },
          { value: `\`${entry.detail}\`` },
          { value: entry.documentation },
        ],
      };
    },
  });
}

// Run linting and set markers
export function runLuaLint(monaco: Monaco, model: any) {
  const code = model.getValue();
  const errors = lintLuaCode(code);

  const markers = errors.map((e) => ({
    severity:
      e.severity === "error"
        ? monaco.MarkerSeverity.Error
        : e.severity === "warning"
        ? monaco.MarkerSeverity.Warning
        : monaco.MarkerSeverity.Info,
    message: e.message,
    startLineNumber: e.line,
    startColumn: e.column,
    endLineNumber: e.line,
    endColumn: 1000,
  }));

  monaco.editor.setModelMarkers(model, "lua-lint", markers);
  return errors;
}
