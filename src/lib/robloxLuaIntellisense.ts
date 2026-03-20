import type { Monaco } from "@monaco-editor/react";

type SymbolKind = "function" | "property" | "class" | "module" | "variable" | "keyword" | "event";

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
  // Core Globals
  {
    label: "game",
    kind: "variable",
    insertText: "game",
    detail: "DataModel",
    documentation: "The top-level DataModel for the current Roblox experience. It provides access to all services.",
    aliases: ["DataModel"],
  },
  {
    label: "workspace",
    kind: "variable",
    insertText: "workspace",
    detail: "Workspace",
    documentation: "Contains 3D objects rendered in the world. It is the root of the physical world.",
  },
  {
    label: "script",
    kind: "variable",
    insertText: "script",
    detail: "LuaSourceContainer",
    documentation: "A reference to the current Lua script executing this code.",
  },
  {
    label: "shared",
    kind: "variable",
    insertText: "shared",
    detail: "table",
    documentation: "A table shared between all scripts of the same context (Client or Server).",
  },
  {
    label: "_G",
    kind: "variable",
    insertText: "_G",
    detail: "table",
    documentation: "A global table shared between all scripts of the same context (Client or Server).",
  },

  // Classes
  {
    label: "Instance",
    kind: "class",
    insertText: "Instance",
    detail: "class",
    documentation: "Base class for almost all Roblox objects. Used for creating new objects via `Instance.new`.",
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
    label: "Vector3",
    kind: "class",
    insertText: "Vector3",
    detail: "class",
    documentation: "A 3D vector used for positions and directions.",
  },
  {
    label: "Vector3.new",
    kind: "function",
    insertText: "Vector3.new(${1:0}, ${2:0}, ${3:0})",
    detail: "Vector3.new(x: number, y: number, z: number): Vector3",
    documentation: "Creates a new Vector3 with the given coordinates.",
    asSnippet: true,
  },
  {
    label: "Color3",
    kind: "class",
    insertText: "Color3",
    detail: "class",
    documentation: "Represents a color using RGB values.",
  },
  {
    label: "Color3.fromRGB",
    kind: "function",
    insertText: "Color3.fromRGB(${1:255}, ${2:255}, ${3:255})",
    detail: "Color3.fromRGB(r: number, g: number, b: number): Color3",
    documentation: "Creates a new Color3 from 0-255 RGB values.",
    asSnippet: true,
  },
  {
    label: "CFrame",
    kind: "class",
    insertText: "CFrame",
    detail: "class",
    documentation: "Coordinate Frame: represents a position and rotation in 3D space.",
  },
  {
    label: "CFrame.new",
    kind: "function",
    insertText: "CFrame.new(${1:0}, ${2:0}, ${3:0})",
    detail: "CFrame.new(pos: Vector3): CFrame",
    documentation: "Creates a new CFrame with the given position.",
    asSnippet: true,
  },

  // Services
  {
    label: "game:GetService",
    kind: "function",
    insertText: 'game:GetService("${1:Players}")',
    detail: "game:GetService(serviceName: string): Instance",
    documentation: "Returns a Roblox service singleton by name. Common services: Players, ReplicatedStorage, TweenService, HttpService.",
    aliases: ["GetService"],
    asSnippet: true,
  },
  {
    label: "Players",
    kind: "module",
    insertText: 'game:GetService("Players")',
    detail: "Service",
    documentation: "Roblox service responsible for player management, player joining/leaving, and local player access.",
  },
  {
    label: "TweenService",
    kind: "module",
    insertText: 'game:GetService("TweenService")',
    detail: "Service",
    documentation: "Service for smoothly interpolating properties of Roblox objects.",
  },
  {
    label: "ReplicatedStorage",
    kind: "module",
    insertText: 'game:GetService("ReplicatedStorage")',
    detail: "Service",
    documentation: "A service for storing objects that should be accessible from both the client and the server.",
  },
  {
    label: "HttpService",
    kind: "module",
    insertText: 'game:GetService("HttpService")',
    detail: "Service",
    documentation: "Service that allows making HTTP requests to external websites.",
  },

  // Properties & Events
  {
    label: "Players.LocalPlayer",
    kind: "property",
    insertText: "Players.LocalPlayer",
    detail: "Player (LocalScript only)",
    documentation: "The player running the current LocalScript. Nil on the server.",
    aliases: ["LocalPlayer"],
  },
  {
    label: "Players.PlayerAdded",
    kind: "event",
    insertText: "Players.PlayerAdded:Connect(function(${1:player})\n\t${0}\nend)",
    detail: "RBXScriptSignal",
    documentation: "Fires when a player joins the game.",
    aliases: ["PlayerAdded"],
    asSnippet: true,
  },
  {
    label: "Players.PlayerRemoving",
    kind: "event",
    insertText: "Players.PlayerRemoving:Connect(function(${1:player})\n\t${0}\nend)",
    detail: "RBXScriptSignal",
    documentation: "Fires when a player leaves the game.",
    aliases: ["PlayerRemoving"],
    asSnippet: true,
  },

  // Methods
  {
    label: "Instance:Destroy",
    kind: "function",
    insertText: "Destroy()",
    detail: "Instance:Destroy(): void",
    documentation: "Removes the instance from the world and locks its parent.",
    aliases: ["Destroy"],
  },
  {
    label: "Instance:Clone",
    kind: "function",
    insertText: "Clone()",
    detail: "Instance:Clone(): Instance",
    documentation: "Creates a copy of the instance and all its descendants.",
    aliases: ["Clone"],
  },
  {
    label: "Instance:FindFirstChild",
    kind: "function",
    insertText: 'FindFirstChild("${1:Name}")',
    detail: "Instance:FindFirstChild(name: string, recursive?: boolean): Instance?",
    documentation: "Searches for a child by name. Returns nil if not found.",
    aliases: ["FindFirstChild"],
    asSnippet: true,
  },
  {
    label: "Instance:WaitForChild",
    kind: "function",
    insertText: 'WaitForChild("${1:Name}")',
    detail: "Instance:WaitForChild(name: string, timeLimit?: number): Instance?",
    documentation: "Waits for a child to exist under the instance. Returns nil if the time limit is exceeded.",
    aliases: ["WaitForChild"],
    asSnippet: true,
  },

  // Task & Globals
  {
    label: "task.wait",
    kind: "function",
    insertText: "task.wait(${1:1})",
    detail: "task.wait(seconds?: number): number",
    documentation: "Yields the current thread for the specified duration. More accurate than `wait`.",
    asSnippet: true,
  },
  {
    label: "task.spawn",
    kind: "function",
    insertText: "task.spawn(function()\n\t${0}\nend)",
    detail: "task.spawn(callback: function, ...args): void",
    documentation: "Executes a function in a separate thread immediately.",
    asSnippet: true,
  },
  {
    label: "wait",
    kind: "function",
    insertText: "wait(${1:1})",
    detail: "wait(seconds?: number): (number, number)",
    documentation: "Yields the current thread for the specified duration.",
    asSnippet: true,
  },
  {
    label: "print",
    kind: "function",
    insertText: 'print("${1:message}")',
    detail: "print(...args): void",
    documentation: "Writes values to the output console.",
    asSnippet: true,
  },
  {
    label: "warn",
    kind: "function",
    insertText: 'warn("${1:warning}")',
    detail: "warn(...args): void",
    documentation: "Writes a warning message to the output console.",
    asSnippet: true,
  },
  {
    label: "error",
    kind: "function",
    insertText: 'error("${1:error message}")',
    detail: "error(message: string, level?: number): void",
    documentation: "Throws an error with the specified message.",
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
    case "keyword":
      return monaco.languages.CompletionItemKind.Keyword;
    case "event":
      return monaco.languages.CompletionItemKind.Event;
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

    const parts = symbol.label.split(/[.:]/);
    const dottedPart = parts.at(-1);
    if (dottedPart) {
      lookup.set(dottedPart, symbol);
    }

    if (parts.length > 1) {
       lookup.set(symbol.label, symbol);
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

      const lineContent = model.getLineContent(position.lineNumber).substring(0, position.column - 1);
      const isMethod = lineContent.endsWith(":");
      const isProperty = lineContent.endsWith(".");
      const isContext = isMethod || isProperty;

      const suggestions = [];

      if (!isContext) {
        suggestions.push(...LUA_KEYWORDS.map((keyword) => ({
          label: keyword,
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: keyword,
          range,
        })));

        suggestions.push(...ROBLOX_SYMBOLS
          .filter(s => !s.label.includes(".") && !s.label.includes(":"))
          .map(symbol => ({
            label: symbol.label,
            kind: getCompletionKind(monaco, symbol.kind),
            insertText: symbol.insertText,
            insertTextRules: symbol.asSnippet ? monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet : undefined,
            detail: symbol.detail,
            documentation: { value: symbol.documentation, isTrusted: true },
            range,
          }))
        );
      } else {
        const match = lineContent.match(/([a-zA-Z0-9_]+)[.:]$/);
        const parentName = match ? match[1] : null;

        suggestions.push(...ROBLOX_SYMBOLS
          .filter(symbol => {
            if (parentName) {
                if (symbol.label.startsWith(parentName + (isMethod ? ":" : "."))) return true;
                if (isMethod && symbol.label.startsWith("Instance:")) return true;
            }
            if (isMethod) return symbol.label.includes(":") || (symbol.kind === "function" && !symbol.label.includes("."));
            if (isProperty) return symbol.label.includes(".") || symbol.kind === "property" || symbol.kind === "event";
            return false;
          })
          .map((symbol) => {
            let insertText = symbol.insertText;
            const parts = symbol.label.split(/[.:]/);
            const prefix = parts[0] + (symbol.label.includes(":") ? ":" : ".");

            if (insertText.startsWith(prefix)) {
                insertText = insertText.substring(prefix.length);
            }

            return {
              label: parts.at(-1) || symbol.label,
              kind: getCompletionKind(monaco, symbol.kind),
              insertText: insertText,
              insertTextRules: symbol.asSnippet
                ? monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
                : undefined,
              detail: symbol.detail,
              documentation: {
                 value: symbol.documentation,
                 isTrusted: true
              },
              range,
            };
          })
        );
      }

      return { suggestions };
    },
  });

  const hoverProvider = monaco.languages.registerHoverProvider("lua", {
    provideHover: (model, position) => {
      const word = model.getWordAtPosition(position);
      if (!word) return null;

      const lineContent = model.getLineContent(position.lineNumber);
      const startIdx = Math.max(0, word.startColumn - 20);
      const contextText = lineContent.substring(startIdx, word.endColumn - 1);
      const pathMatch = contextText.match(/([a-zA-Z0-9_]+[:.][a-zA-Z0-9_]+)$/);
      const symbol = (pathMatch ? ROBLOX_LOOKUP.get(pathMatch[0]) : null) || ROBLOX_LOOKUP.get(word.word);

      if (!symbol) return null;

      return {
        range: new monaco.Range(position.lineNumber, word.startColumn, position.lineNumber, word.endColumn),
        contents: [
          { value: `**${symbol.label}**` },
          { value: `**Type**: ${symbol.kind}` },
          { value: "```lua\n" + symbol.detail + "\n```" },
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
    if (!registration) return;
    registration.refCount -= 1;
    if (registration.refCount <= 0) {
      registration.dispose();
      registrationStore.delete(monaco);
    }
  };
};
