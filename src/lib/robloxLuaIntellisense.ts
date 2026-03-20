import type { Monaco } from "@monaco-editor/react";

type SymbolKind = "function" | "property" | "class" | "module" | "variable";

type RobloxSymbol = {
  label: string;
  kind: SymbolKind;
  insertText: string;
  detail: string;
  documentation: string;
  aliases?: string[];
  asSnippet?: boolean;
};

const LUA_KEYWORDS = [
  "and", "break", "do", "else", "elseif", "end", "false", "for", "function", "if",
  "in", "local", "nil", "not", "or", "repeat", "return", "then", "true", "until", "while",
];

const ROBLOX_SYMBOLS: RobloxSymbol[] = [
  {
    label: "game",
    kind: "variable",
    insertText: "game",
    detail: "DataModel",
    documentation: "The top-level DataModel for the current Roblox experience.",
    aliases: ["DataModel"],
  },
  {
    label: "workspace",
    kind: "variable",
    insertText: "workspace",
    detail: "Workspace",
    documentation: "Contains 3D objects rendered in the world.",
  },
  {
    label: "Instance",
    kind: "class",
    insertText: "Instance",
    detail: "class",
    documentation: "Base class for almost all Roblox objects.",
  },
  {
    label: "Instance.new",
    kind: "function",
    insertText: 'Instance.new("${1:Part}")',
    detail: "Instance.new(className: string, parent?: Instance): Instance",
    documentation: "Creates a new Instance of the given Roblox class.",
    aliases: ["new"],
    asSnippet: true,
  },
  {
    label: "game:GetService",
    kind: "function",
    insertText: 'game:GetService("${1:Players}")',
    detail: "game:GetService(serviceName: string): Instance",
    documentation: "Returns a Roblox service singleton by name.",
    aliases: ["GetService"],
    asSnippet: true,
  },
  {
    label: "Players",
    kind: "module",
    insertText: 'game:GetService("Players")',
    detail: "Service",
    documentation: "Roblox service responsible for player management.",
  },
  {
    label: "Players.LocalPlayer",
    kind: "property",
    insertText: "Players.LocalPlayer",
    detail: "Player (LocalScript only)",
    documentation: "The player running the current LocalScript.",
    aliases: ["LocalPlayer"],
  },
  {
    label: "Players.PlayerAdded",
    kind: "property",
    insertText: "Players.PlayerAdded",
    detail: "RBXScriptSignal",
    documentation: "Fires when a player joins the game.",
    aliases: ["PlayerAdded"],
  },
  {
    label: "workspace:FindFirstChild",
    kind: "function",
    insertText: 'workspace:FindFirstChild("${1:Name}")',
    detail: "workspace:FindFirstChild(name: string, recursive?: boolean): Instance?",
    documentation: "Searches for a child by name under the current instance.",
    aliases: ["FindFirstChild"],
    asSnippet: true,
  },
  {
    label: "print",
    kind: "function",
    insertText: 'print("${1:value}")',
    detail: "print(...args): nil",
    documentation: "Writes values to the output console.",
    asSnippet: true,
  },
];

const getCompletionKind = (monaco: Monaco, kind: SymbolKind) => {
  switch (kind) {
    case "function":
      return monaco.languages.CompletionItemKind.Function;
    case "property":
      return monaco.languages.CompletionItemKind.Property;
    case "class":
      return monaco.languages.CompletionItemKind.Class;
    case "module":
      return monaco.languages.CompletionItemKind.Module;
    default:
      return monaco.languages.CompletionItemKind.Variable;
  }
};

const buildLookupTable = () => {
  const lookup = new Map<string, RobloxSymbol>();

  for (const symbol of ROBLOX_SYMBOLS) {
    lookup.set(symbol.label, symbol);

    for (const alias of symbol.aliases ?? []) {
      lookup.set(alias, symbol);
    }

    const dottedPart = symbol.label.split(/[.:]/).at(-1);
    if (dottedPart) {
      lookup.set(dottedPart, symbol);
    }
  }

  return lookup;
};

const ROBLOX_LOOKUP = buildLookupTable();

type IntellisenseRegistration = {
  refCount: number;
  dispose: () => void;
};

const registrationStore = new WeakMap<Monaco, IntellisenseRegistration>();

export const configureRobloxLuaIntellisense = (monaco: Monaco) => {
  const existingRegistration = registrationStore.get(monaco);
  if (existingRegistration) {
    existingRegistration.refCount += 1;
    return () => {
      existingRegistration.refCount -= 1;
      if (existingRegistration.refCount <= 0) {
        existingRegistration.dispose();
        registrationStore.delete(monaco);
      }
    };
  }

  const completionProvider = monaco.languages.registerCompletionItemProvider("lua", {
    triggerCharacters: [".", ":"],
    provideCompletionItems: (model, position) => {
      const word = model.getWordUntilPosition(position);
      const range = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endColumn: word.endColumn,
      };

      const keywordSuggestions = LUA_KEYWORDS.map((keyword) => ({
        label: keyword,
        kind: monaco.languages.CompletionItemKind.Keyword,
        insertText: keyword,
        range,
      }));

      const robloxSuggestions = ROBLOX_SYMBOLS.map((symbol) => ({
        label: symbol.label,
        kind: getCompletionKind(monaco, symbol.kind),
        insertText: symbol.insertText,
        insertTextRules: symbol.asSnippet
          ? monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
          : undefined,
        detail: symbol.detail,
        documentation: symbol.documentation,
        range,
      }));

      return { suggestions: [...keywordSuggestions, ...robloxSuggestions] };
    },
  });

  const hoverProvider = monaco.languages.registerHoverProvider("lua", {
    provideHover: (model, position) => {
      const word = model.getWordAtPosition(position);
      if (!word) return null;

      const symbol = ROBLOX_LOOKUP.get(word.word);
      if (!symbol) return null;

      return {
        range: new monaco.Range(position.lineNumber, word.startColumn, position.lineNumber, word.endColumn),
        contents: [
          { value: `**${symbol.label}**` },
          { value: `\`${symbol.detail}\`` },
          { value: symbol.documentation },
        ],
      };
    },
  });

  const dispose = () => {
    completionProvider.dispose();
    hoverProvider.dispose();
  };

  registrationStore.set(monaco, {
    refCount: 1,
    dispose,
  });

  return () => {
    const registration = registrationStore.get(monaco);
    if (!registration) {
      return;
    }

    registration.refCount -= 1;

    if (registration.refCount <= 0) {
      registration.dispose();
      registrationStore.delete(monaco);
    }
  };
};
