import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Upload, Loader2, FileCode2, Link, Copy, Check, Save, Wand2, AlertTriangle,
  Terminal, ChevronDown, ChevronUp,
} from "lucide-react";
import Editor, { type Monaco } from "@monaco-editor/react";
import { setupMonacoLua, runLuaLint } from "@/lib/setup-monaco-lua";
import { type LintError } from "@/lib/lua-intellisense";
import { motion, AnimatePresence } from "framer-motion";

interface CodeEditorProps {
  onUpload: (fileName: string, content: string) => Promise<string>;
  disabled: boolean;
  initialCode?: string;
  initialFileName?: string;
}

const DEFAULT_LUA = `-- Lua Script
-- Write your code here

local Players = game:GetService("Players")
local player = Players.LocalPlayer

function hello(name)
    print("Hello, " .. name .. "!")
end

hello("World")
`;

const AUTOSAVE_KEY = "lua_autosave";
const AUTOSAVE_INTERVAL = 5000;

const CodeEditor = ({ onUpload, disabled, initialCode, initialFileName }: CodeEditorProps) => {
  const [code, setCode] = useState(() => {
    const saved = localStorage.getItem(AUTOSAVE_KEY);
    if (saved) {
      try { return JSON.parse(saved).code || DEFAULT_LUA; }
      catch { return DEFAULT_LUA; }
    }
    return DEFAULT_LUA;
  });
  const [fileName, setFileName] = useState(() => {
    const saved = localStorage.getItem(AUTOSAVE_KEY);
    if (saved) {
      try { return JSON.parse(saved).fileName || "script.lua"; }
      catch { return "script.lua"; }
    }
    return "script.lua";
  });
  const [uploading, setUploading] = useState(false);
  const [rawUrl, setRawUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [copiedLoadstring, setCopiedLoadstring] = useState(false);
  const [autoSaved, setAutoSaved] = useState(false);
  const [lintErrors, setLintErrors] = useState<LintError[]>([]);
  const [showErrors, setShowErrors] = useState(false);
  const lastSaveRef = useRef<string>("");
  const monacoRef = useRef<Monaco | null>(null);
  const editorRef = useRef<any>(null);

  useEffect(() => {
    if (initialCode !== undefined) setCode(initialCode);
  }, [initialCode]);

  useEffect(() => {
    if (initialFileName !== undefined) setFileName(initialFileName);
  }, [initialFileName]);

  // Auto-save
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

  // Lint on code change
  useEffect(() => {
    if (monacoRef.current && editorRef.current) {
      const model = editorRef.current.getModel();
      if (model) {
        const errors = runLuaLint(monacoRef.current, model);
        setLintErrors(errors);
      }
    }
  }, [code]);

  const handleEditorMount = useCallback((editor: any, monaco: Monaco) => {
    monacoRef.current = monaco;
    editorRef.current = editor;
    setupMonacoLua(monaco);

    // Define custom dark theme
    monaco.editor.defineTheme("lua-dark", {
      base: "vs-dark",
      inherit: true,
      rules: [
        { token: "keyword", foreground: "c586c0" },
        { token: "string", foreground: "ce9178" },
        { token: "number", foreground: "b5cea8" },
        { token: "comment", foreground: "6a9955" },
        { token: "type", foreground: "4ec9b0" },
      ],
      colors: {
        "editor.background": "#0d1117",
        "editor.foreground": "#e6edf3",
        "editor.lineHighlightBackground": "#161b22",
        "editor.selectionBackground": "#264f78",
        "editorCursor.foreground": "#58a6ff",
        "editorLineNumber.foreground": "#484f58",
        "editorLineNumber.activeForeground": "#e6edf3",
      },
    });
    monaco.editor.setTheme("lua-dark");

    // Initial lint
    const model = editor.getModel();
    if (model) {
      const errors = runLuaLint(monaco, model);
      setLintErrors(errors);
    }
  }, []);

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

  const copyText = (text: string, setter: (v: boolean) => void) => {
    navigator.clipboard.writeText(text);
    setter(true);
    setTimeout(() => setter(false), 2000);
  };

  const handleEditorChange = useCallback((value: string | undefined) => {
    setCode(value || "");
  }, []);

  const errorCount = lintErrors.filter((e) => e.severity === "error").length;
  const warningCount = lintErrors.filter((e) => e.severity === "warning").length;

  return (
    <motion.div
      className="space-y-3"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <label className="text-sm font-mono text-muted-foreground flex items-center gap-2">
          <FileCode2 className="w-4 h-4 text-primary" />
          محرر الكود
          <span className="text-[10px] text-muted-foreground/50">IntelliSense + Roblox API</span>
        </label>
        <div className="flex items-center gap-2">
          <AnimatePresence>
            {autoSaved && (
              <motion.span
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="text-[10px] text-primary/60 flex items-center gap-1"
              >
                <Save className="w-2.5 h-2.5" /> حفظ تلقائي
              </motion.span>
            )}
          </AnimatePresence>
          {lintErrors.length > 0 && (
            <button
              onClick={() => setShowErrors(!showErrors)}
              className="flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-secondary border border-border hover:bg-secondary/80 transition-colors"
            >
              {errorCount > 0 && <span className="text-destructive">{errorCount} ❌</span>}
              {warningCount > 0 && <span className="text-warning">{warningCount} ⚠️</span>}
              {showErrors ? <ChevronUp className="w-2.5 h-2.5" /> : <ChevronDown className="w-2.5 h-2.5" />}
            </button>
          )}
        </div>
      </div>

      {/* File name + upload */}
      <div className="flex gap-2">
        <Input
          placeholder="script.lua"
          value={fileName}
          onChange={(e) => setFileName(e.target.value)}
          className="font-mono bg-muted border-border max-w-xs"
        />
        <Button onClick={handleUpload} disabled={disabled || !code.trim() || !fileName.trim() || uploading}>
          {uploading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Upload className="w-4 h-4 mr-1" />}
          رفع
        </Button>
      </div>

      {/* Editor */}
      <div className="border border-border rounded-lg overflow-hidden">
        <div className="h-8 bg-secondary/80 flex items-center justify-between px-3 border-b border-border">
          <span className="text-xs font-mono text-muted-foreground flex items-center gap-1.5">
            <Terminal className="w-3 h-3 text-primary" />
            {fileName}
          </span>
          <span className="text-[9px] font-mono text-muted-foreground/40">Lua + Roblox</span>
        </div>
        <Editor
          height="400px"
          defaultLanguage="lua"
          value={code}
          onChange={handleEditorChange}
          onMount={handleEditorMount}
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            fontFamily: "'JetBrains Mono', monospace",
            lineNumbers: "on",
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 4,
            wordWrap: "on",
            padding: { top: 8 },
            suggestOnTriggerCharacters: true,
            quickSuggestions: true,
            snippetSuggestions: "top",
            formatOnPaste: true,
            bracketPairColorization: { enabled: true },
            smoothScrolling: true,
            cursorBlinking: "smooth",
            cursorSmoothCaretAnimation: "on",
            renderWhitespace: "boundary",
          }}
        />
      </div>

      {/* Lint Errors Panel */}
      <AnimatePresence>
        {showErrors && lintErrors.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="p-3 rounded-lg bg-secondary/50 border border-border space-y-1 max-h-40 overflow-y-auto">
              <p className="text-xs font-mono text-muted-foreground flex items-center gap-1 mb-2">
                <AlertTriangle className="w-3 h-3 text-warning" />
                تحليل الكود ({lintErrors.length} ملاحظة)
              </p>
              {lintErrors.map((err, i) => (
                <div
                  key={i}
                  className={`text-[11px] font-mono px-2 py-1 rounded flex items-start gap-2 ${
                    err.severity === "error"
                      ? "bg-destructive/10 text-destructive"
                      : err.severity === "warning"
                      ? "bg-warning/10 text-warning"
                      : "bg-primary/5 text-muted-foreground"
                  }`}
                >
                  <span className="shrink-0">سطر {err.line}:</span>
                  <span>{err.message}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upload Result */}
      <AnimatePresence>
        {rawUrl && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="p-4 rounded-lg bg-secondary border border-primary/30 space-y-3"
          >
            <p className="text-xs font-mono text-primary flex items-center gap-1">
              <Link className="w-3 h-3" />
              ✓ تم الرفع! رابط الملف:
            </p>
            <div className="flex gap-2 items-center">
              <code className="text-xs font-mono text-accent bg-muted px-2 py-1 rounded flex-1 overflow-x-auto">
                {rawUrl}
              </code>
              <Button variant="outline" size="sm" onClick={() => copyText(rawUrl, setCopied)}>
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              </Button>
            </div>
            <div className="pt-2 border-t border-border">
              <p className="text-xs font-mono text-muted-foreground mb-1 flex items-center gap-1">
                <Wand2 className="w-3 h-3 text-warning" />
                كود التشغيل:
              </p>
              <div className="flex gap-2 items-center">
                <code className="text-xs font-mono text-warning bg-muted px-2 py-1 rounded flex-1 overflow-x-auto">
                  {`loadstring(game:HttpGet("${rawUrl}"))()`}
                </code>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyText(`loadstring(game:HttpGet("${rawUrl}"))()`, setCopiedLoadstring)}
                >
                  {copiedLoadstring ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default CodeEditor;
