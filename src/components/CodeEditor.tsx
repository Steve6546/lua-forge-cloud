import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Upload, Loader2, Link, Copy, Check, Save,
  AlertTriangle, ChevronDown, ChevronUp, Terminal, Wand2,
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
  onCodeChange?: (code: string) => void;
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

const CodeEditor = ({ onUpload, disabled, initialCode, initialFileName, onCodeChange }: CodeEditorProps) => {
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
    if (initialCode !== undefined) {
      setCode(initialCode);
      onCodeChange?.(initialCode);
    }
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
        "editor.background": "#0f1218",
        "editor.foreground": "#d4d4d4",
        "editor.lineHighlightBackground": "#151b24",
        "editor.selectionBackground": "#264f78",
        "editorCursor.foreground": "#58a6ff",
        "editorLineNumber.foreground": "#3b4048",
        "editorLineNumber.activeForeground": "#d4d4d4",
      },
    });
    monaco.editor.setTheme("lua-dark");

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
    const v = value || "";
    setCode(v);
    onCodeChange?.(v);
  }, [onCodeChange]);

  const errorCount = lintErrors.filter((e) => e.severity === "error").length;
  const warningCount = lintErrors.filter((e) => e.severity === "warning").length;

  return (
    <div className="flex flex-col h-full">
      {/* Editor toolbar */}
      <div className="h-9 flex items-center justify-between px-3 bg-card border-b border-border shrink-0">
        <div className="flex items-center gap-2">
          <Terminal className="w-3 h-3 text-primary" />
          <Input
            value={fileName}
            onChange={(e) => setFileName(e.target.value)}
            className="h-6 text-xs font-mono bg-transparent border-none px-1 w-40 focus-visible:ring-0"
            placeholder="script.lua"
          />
        </div>
        <div className="flex items-center gap-1.5">
          <AnimatePresence>
            {autoSaved && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-[9px] text-primary/50 flex items-center gap-1"
              >
                <Save className="w-2.5 h-2.5" /> saved
              </motion.span>
            )}
          </AnimatePresence>

          {lintErrors.length > 0 && (
            <button
              onClick={() => setShowErrors(!showErrors)}
              className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-secondary hover:bg-secondary/80 transition-colors"
            >
              {errorCount > 0 && <span className="text-destructive">{errorCount}E</span>}
              {warningCount > 0 && <span className="text-warning">{warningCount}W</span>}
              {showErrors ? <ChevronUp className="w-2.5 h-2.5" /> : <ChevronDown className="w-2.5 h-2.5" />}
            </button>
          )}

          <Button
            size="sm"
            onClick={handleUpload}
            disabled={disabled || !code.trim() || !fileName.trim() || uploading}
            className="h-6 text-[10px] px-2 gap-1"
          >
            {uploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
            رفع
          </Button>
        </div>
      </div>

      {/* Monaco Editor */}
      <div className="flex-1 min-h-0">
        <Editor
          height="100%"
          defaultLanguage="lua"
          value={code}
          onChange={handleEditorChange}
          onMount={handleEditorMount}
          options={{
            minimap: { enabled: false },
            fontSize: 13,
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

      {/* Lint errors panel */}
      <AnimatePresence>
        {showErrors && lintErrors.length > 0 && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            className="overflow-hidden border-t border-border shrink-0"
          >
            <div className="max-h-32 overflow-y-auto bg-card p-2 space-y-0.5">
              <p className="text-[10px] text-muted-foreground flex items-center gap-1 mb-1">
                <AlertTriangle className="w-3 h-3 text-warning" />
                تحليل ({lintErrors.length})
              </p>
              {lintErrors.map((err, i) => (
                <div
                  key={i}
                  className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                    err.severity === "error"
                      ? "bg-destructive/10 text-destructive"
                      : err.severity === "warning"
                      ? "bg-warning/10 text-warning"
                      : "text-muted-foreground"
                  }`}
                >
                  <span className="opacity-50">L{err.line}</span> {err.message}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upload result bar */}
      <AnimatePresence>
        {rawUrl && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-primary/20 shrink-0"
          >
            <div className="p-2 bg-primary/5 flex items-center gap-2 text-xs">
              <Link className="w-3 h-3 text-primary shrink-0" />
              <code className="text-[10px] text-accent truncate flex-1">{rawUrl}</code>
              <Button variant="ghost" size="sm" onClick={() => copyText(rawUrl, setCopied)} className="h-5 px-1.5 shrink-0">
                {copied ? <Check className="w-3 h-3 text-primary" /> : <Copy className="w-3 h-3" />}
              </Button>
              <div className="w-px h-4 bg-border" />
              <Wand2 className="w-3 h-3 text-warning shrink-0" />
              <code className="text-[10px] text-warning truncate">{`loadstring(game:HttpGet("${rawUrl}"))()`}</code>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyText(`loadstring(game:HttpGet("${rawUrl}"))()`, setCopiedLoadstring)}
                className="h-5 px-1.5 shrink-0"
              >
                {copiedLoadstring ? <Check className="w-3 h-3 text-primary" /> : <Copy className="w-3 h-3" />}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CodeEditor;
