import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, Loader2, FileCode2, Link, Copy, Check, Save } from "lucide-react";
import Editor, { type Monaco, type OnMount } from "@monaco-editor/react";
import { configureRobloxLuaIntellisense } from "@/lib/robloxLuaIntellisense";

interface CodeEditorProps {
  onUpload: (fileName: string, content: string) => Promise<string>;
  disabled: boolean;
  initialCode?: string;
  initialFileName?: string;
}

const DEFAULT_LUA = `-- Roblox Lua Script
-- Write your code here

local Players = game:GetService("Players")
local workspace = game:GetService("Workspace")

print("Hello from Roblox Studio!")

Players.PlayerAdded:Connect(function(player)
    print(player.Name .. " joined the game!")
end)
`;

const AUTOSAVE_KEY = "lua_autosave";
const AUTOSAVE_INTERVAL = 5000;

const CodeEditor = ({ onUpload, disabled, initialCode, initialFileName }: CodeEditorProps) => {
  const [code, setCode] = useState(() => {
    const saved = localStorage.getItem(AUTOSAVE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved).code || DEFAULT_LUA;
      } catch { return DEFAULT_LUA; }
    }
    return DEFAULT_LUA;
  });
  const [fileName, setFileName] = useState(() => {
    const saved = localStorage.getItem(AUTOSAVE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved).fileName || "script.lua";
      } catch { return "script.lua"; }
    }
    return "script.lua";
  });
  const [uploading, setUploading] = useState(false);
  const [rawUrl, setRawUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [autoSaved, setAutoSaved] = useState(false);
  const lastSaveRef = useRef<string>("");
  const disposeIntellisenseRef = useRef<null | (() => void)>(null);
  const editorRef = useRef<Parameters<OnMount>[0] | null>(null);

  // Load initial code when editing from file browser
  useEffect(() => {
    if (initialCode !== undefined) setCode(initialCode);
  }, [initialCode]);

  useEffect(() => {
    if (initialFileName !== undefined) setFileName(initialFileName);
  }, [initialFileName]);

  // Auto-save to localStorage
  useEffect(() => {
    const timer = setInterval(() => {
      const data = JSON.stringify({ code, fileName });
      if (data !== lastSaveRef.current) {
        localStorage.setItem(AUTOSAVE_KEY, data);
        lastSaveRef.current = data;
        setAutoSaved(true);
        setTimeout(() => setAutoSaved(false), 1500);
      }
    }, AUTOSAVE_INTERVAL);
    return () => clearInterval(timer);
  }, [code, fileName]);

  const handleUpload = async () => {
    if (!code.trim() || !fileName.trim()) return;
    setUploading(true);
    setRawUrl("");
    try {
      const url = await onUpload(fileName, code);
      setRawUrl(url);
    } finally {
      setUploading(false);
    }
  };

  const copyText = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleEditorChange = useCallback((value: string | undefined) => {
    setCode(value || "");
  }, []);

  const handleBeforeMount = useCallback((monaco: Monaco) => {
    if (!disposeIntellisenseRef.current) {
      disposeIntellisenseRef.current = configureRobloxLuaIntellisense(monaco);
    }
  }, []);

  const handleEditorMount: OnMount = useCallback((editor, monaco) => {
    editorRef.current = editor;
    editor.focus();

    // ─── Fix suggestion widget positioning ───────────────────────────────────
    // Override the suggest widget DOM positioning so it always renders
    // *below* the cursor line (or flips above when near the bottom of the
    // viewport). We patch it via the editor's DOM container after Monaco
    // has built the widget.
    const fixSuggestWidgetPosition = () => {
      try {
        const editorDomNode = editor.getDomNode();
        if (!editorDomNode) return;

        // Walk up to find the Monaco editor container
        const container = editorDomNode.closest('.monaco-editor') as HTMLElement | null;
        if (!container) return;

        // Ensure the editor container is a positioned ancestor so that
        // the absolutely-positioned suggest widget is clipped correctly.
        container.style.position = 'relative';
        container.style.overflow = 'visible';

        // The suggest overlay uses this class
        const suggestWidget = container.querySelector('.suggest-widget') as HTMLElement | null;
        if (suggestWidget) {
          suggestWidget.style.zIndex = '1000';
          suggestWidget.style.position = 'absolute';
        }
      } catch (_) {
        // non-critical — ignore
      }
    };

    // Run once after mount and again after the first suggestion opens
    setTimeout(fixSuggestWidgetPosition, 300);
    editor.onDidChangeCursorPosition(fixSuggestWidgetPosition);

    // ─── Touch / Mobile support ───────────────────────────────────────────────
    // Monaco does not fire pointer events reliably on iOS/Android inside
    // the suggest widget.  We delegate touch-taps on suggestion rows to
    // the underlying click handler so users can tap to accept on mobile.
    const attachTouchDelegation = () => {
      try {
        const editorDomNode = editor.getDomNode();
        if (!editorDomNode) return;
        const container = editorDomNode.closest('.monaco-editor') as HTMLElement | null;
        if (!container) return;

        container.addEventListener('touchend', (e: TouchEvent) => {
          const target = e.target as HTMLElement;
          // Suggestion list rows have the class "monaco-list-row"
          const row = target.closest('.monaco-list-row') as HTMLElement | null;
          if (row) {
            e.preventDefault();
            row.click();
          }
        }, { passive: false });
      } catch (_) {
        // non-critical — ignore
      }
    };

    setTimeout(attachTouchDelegation, 500);

    // ─── Keyboard shortcut: Ctrl+Space / Cmd+Space to trigger suggestions ───
    editor.addCommand(
      monaco.KeyMod.CtrlCmd | monaco.KeyCode.Space,
      () => {
        editor.trigger('keyboard', 'editor.action.triggerSuggest', {});
      }
    );
  }, []);

  useEffect(() => {
    return () => {
      if (disposeIntellisenseRef.current) {
        disposeIntellisenseRef.current();
        disposeIntellisenseRef.current = null;
      }
    };
  }, []);

  return (
    <div className="space-y-3">
      <label className="text-sm font-mono text-muted-foreground flex items-center gap-2">
        <FileCode2 className="w-4 h-4 text-primary" />
        محرر الكود (Roblox Lua Editor)
        {autoSaved && (
          <span className="text-[10px] text-primary/60 flex items-center gap-1 animate-pulse">
            <Save className="w-2.5 h-2.5" /> حفظ تلقائي
          </span>
        )}
      </label>
      <div className="flex gap-2">
        <Input
          placeholder="script.lua"
          value={fileName}
          onChange={(e) => setFileName(e.target.value)}
          className="font-mono bg-muted border-border max-w-xs"
        />
        <Button
          onClick={handleUpload}
          disabled={disabled || !code.trim() || !fileName.trim() || uploading}
        >
          {uploading ? (
            <Loader2 className="w-4 h-4 animate-spin mr-1" />
          ) : (
            <Upload className="w-4 h-4 mr-1" />
          )}
          رفع الملف
        </Button>
      </div>

      {/* Hint bar for mobile users */}
      <p className="text-[11px] font-mono text-muted-foreground/70 flex items-center gap-1">
        <span>💡</span>
        <span>اكتب حرفين أو اضغط <kbd className="px-1 py-0.5 rounded bg-muted border border-border text-[10px]">Ctrl+Space</kbd> لفتح قائمة الاقتراحات</span>
      </p>

      <div className="border border-border rounded-md overflow-visible relative">
        <div className="h-8 bg-secondary/80 flex items-center px-3 border-b border-border">
          <span className="text-xs font-mono text-muted-foreground">{fileName}</span>
        </div>
        {/* overflow-visible is critical — it lets the suggest widget overflow
            the editor container without being clipped */}
        <div className="relative overflow-visible">
          <Editor
            height="400px"
            defaultLanguage="lua"
            theme="vs-dark"
            value={code}
            beforeMount={handleBeforeMount}
            onMount={handleEditorMount}
            onChange={handleEditorChange}
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              fontFamily: "'JetBrains Mono', 'Cascadia Mono', 'Consolas', monospace",
              lineNumbers: "on",
              scrollBeyondLastLine: false,
              automaticLayout: true,
              tabSize: 4,
              wordWrap: "on",
              padding: { top: 12, bottom: 12 },

              // ── Autocomplete: manual trigger only ──────────────────────────
              // Disable automatic insertion on first match — user must pick
              // an item explicitly from the dropdown.
              quickSuggestions: false,          // ← no auto-popup while typing
              suggestOnTriggerCharacters: true, // ← still show after "." and ":"
              acceptSuggestionOnEnter: "on",    // accept with Enter key
              acceptSuggestionOnCommitCharacter: false, // no auto-commit
              tabCompletion: "off",             // Tab does NOT auto-complete

              // Suggest widget sizing — larger rows help finger-tapping
              suggest: {
                showIcons: true,
                showStatusBar: true,
                preview: false,              // no inline ghost text
                previewMode: "prefix",
                insertMode: "replace",
                filterGraceful: true,
                // Increase item height for touch targets
                snippetsPreventQuickSuggestions: false,
              },

              // No inline ghost completions (Copilot-style)
              inlineSuggest: { enabled: false },

              renderWhitespace: "selection",
              bracketPairColorization: { enabled: true },
              guides: { bracketPairs: true },
              smoothScrolling: true,
              cursorBlinking: "smooth",
              cursorSmoothCaretAnimation: "on",
              parameterHints: { enabled: true },
              formatOnType: false,
              formatOnPaste: true,
            }}
          />
        </div>
      </div>

      {rawUrl && (
        <div className="p-3 rounded-md bg-secondary border border-primary/30 space-y-3">
          <p className="text-xs font-mono text-primary flex items-center gap-1">
            <Link className="w-3 h-3" />
            ✓ تم الرفع بنجاح! رابط الملف:
          </p>
          <div className="flex gap-2 items-center">
            <code className="text-xs font-mono text-accent bg-muted px-2 py-1 rounded flex-1 overflow-x-auto">
              {rawUrl}
            </code>
            <Button variant="outline" size="sm" onClick={() => copyText(rawUrl)}>
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            </Button>
          </div>
          <div className="pt-2 border-t border-border">
            <p className="text-xs font-mono text-muted-foreground mb-1">🎮 كود التشغيل:</p>
            <div className="flex gap-2 items-center">
              <code className="text-xs font-mono text-warning bg-muted px-2 py-1 rounded flex-1 overflow-x-auto">
                {`loadstring(game:HttpGet("${rawUrl}"))()`}
              </code>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyText(`loadstring(game:HttpGet("${rawUrl}"))()`)}
              >
                <Copy className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CodeEditor;