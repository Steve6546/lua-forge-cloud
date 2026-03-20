import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Editor, { DiffEditor, type Monaco, type OnMount } from "@monaco-editor/react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useIsMobile } from "@/hooks/use-mobile";
import { configureRobloxLuaIntellisense } from "@/lib/robloxLuaIntellisense";
import { analyzeLuaWorkspace, applyAutoFixes, type WorkspaceFile } from "@/lib/luaDiagnostics";
import { generateLoader, type LoaderMode } from "@/lib/loaderGenerator";
import {
  AlertTriangle,
  Check,
  Copy,
  FileCode2,
  GitCompare,
  Loader2,
  Package2,
  Save,
  Sparkles,
  Wand2,
} from "lucide-react";

export interface EditorWorkspaceFile extends WorkspaceFile {
  sha?: string;
  originalContent: string;
}

interface CodeEditorProps {
  workspaceFiles: EditorWorkspaceFile[];
  activeFilePath: string;
  selectedBranch: string;
  selectedRepo?: {
    owner: string;
    name: string;
  };
  disabled: boolean;
  onSelectFile: (path: string) => void;
  onChangeFile: (path: string, content: string) => void;
  onRenameFile: (path: string, nextPath: string) => void;
  onSaveFile: (path: string, content: string, message: string) => Promise<string>;
  onCreateModuleWorkspace: () => void;
}

const DEFAULT_SNIPPETS = [
  {
    label: "for loop",
    code: "for i = 1, 10 do\n\tprint(i)\nend",
  },
  {
    label: "function",
    code: "local function handlePlayer(player)\n\tprint(player.Name)\nend",
  },
  {
    label: "remote event",
    code: "local RemoteEvent = Instance.new(\"RemoteEvent\")\nRemoteEvent.Name = \"ActionEvent\"\nRemoteEvent.Parent = game:GetService(\"ReplicatedStorage\")",
  },
];

const loaderModes: Array<{ value: LoaderMode; label: string }> = [
  { value: "standard", label: "Standard" },
  { value: "obfuscated", label: "Obfuscated" },
  { value: "multi-file", label: "Multi-file" },
];

const CodeEditor = ({
  workspaceFiles,
  activeFilePath,
  selectedBranch,
  selectedRepo,
  disabled,
  onSelectFile,
  onChangeFile,
  onRenameFile,
  onSaveFile,
  onCreateModuleWorkspace,
}: CodeEditorProps) => {
  const activeFile = useMemo(
    () => workspaceFiles.find((file) => file.path === activeFilePath) ?? workspaceFiles[0],
    [activeFilePath, workspaceFiles],
  );
  const [commitMessage, setCommitMessage] = useState("Update script");
  const [loaderMode, setLoaderMode] = useState<LoaderMode>("standard");
  const [copiedLoader, setCopiedLoader] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showDiff, setShowDiff] = useState(false);
  const editorRef = useRef<Parameters<OnMount>[0] | null>(null);
  const monacoRef = useRef<Monaco | null>(null);
  const disposeIntellisenseRef = useRef<null | (() => void)>(null);
  const isMobile = useIsMobile();

  const analysis = useMemo(
    () => analyzeLuaWorkspace(workspaceFiles, activeFile?.path ?? ""),
    [activeFile?.path, workspaceFiles],
  );

  const loader = useMemo(() => {
    if (!selectedRepo || !selectedBranch || workspaceFiles.length === 0) {
      return "";
    }
    return generateLoader({
      owner: selectedRepo.owner,
      repo: selectedRepo.name,
      branch: selectedBranch,
      files: workspaceFiles.map((file) => ({ path: file.path })),
      mode: loaderMode,
    });
  }, [loaderMode, selectedBranch, selectedRepo, workspaceFiles]);

  const dirtyCount = workspaceFiles.filter((file) => file.content !== file.originalContent).length;

  useEffect(() => {
    const monaco = monacoRef.current;
    const editor = editorRef.current;
    if (!monaco || !editor || !activeFile) {
      return;
    }

    const model = editor.getModel();
    if (!model) {
      return;
    }

    const markers = analysis.issues
      .filter((issue) => issue.line >= 1)
      .map((issue) => ({
        startLineNumber: issue.line,
        endLineNumber: issue.line,
        startColumn: issue.startColumn,
        endColumn: issue.endColumn,
        severity:
          issue.severity === "error"
            ? monaco.MarkerSeverity.Error
            : issue.severity === "warning"
              ? monaco.MarkerSeverity.Warning
              : monaco.MarkerSeverity.Info,
        message: issue.hint ? `${issue.message} ${issue.hint}` : issue.message,
        code: issue.code,
      }));

    monaco.editor.setModelMarkers(model, "luaforge-analysis", markers);
  }, [activeFile, analysis]);

  const handleBeforeMount = useCallback((monaco: Monaco) => {
    monacoRef.current = monaco;

    monaco.editor.defineTheme("lua-forge", {
      base: "vs-dark",
      inherit: true,
      rules: [
        { token: "keyword", foreground: "ff8a65" },
        { token: "string", foreground: "c5e478" },
        { token: "number", foreground: "ffd54f" },
      ],
      colors: {
        "editor.background": "#0d111f",
        "editor.lineHighlightBackground": "#151c32",
        "editorCursor.foreground": "#00d4ff",
      },
    });

    if (!disposeIntellisenseRef.current) {
      disposeIntellisenseRef.current = configureRobloxLuaIntellisense(monaco);
    }
  }, []);

  const handleMount: OnMount = useCallback((editor) => {
    editorRef.current = editor;
    editor.focus();
  }, []);

  useEffect(() => () => disposeIntellisenseRef.current?.(), []);

  const insertSnippet = (snippet: string) => {
    const editor = editorRef.current;
    if (!editor) {
      return;
    }
    const selection = editor.getSelection();
    if (!selection) {
      return;
    }
    editor.executeEdits("lua-snippets", [{ range: selection, text: snippet }]);
    editor.focus();
  };

  const copyLoader = async () => {
    if (!loader) {
      return;
    }
    await navigator.clipboard.writeText(loader);
    setCopiedLoader(true);
    window.setTimeout(() => setCopiedLoader(false), 1500);
  };

  const saveActiveFile = async () => {
    if (!activeFile) {
      return;
    }
    setSaving(true);
    try {
      await onSaveFile(activeFile.path, activeFile.content, commitMessage.trim() || `Update ${activeFile.path}`);
    } finally {
      setSaving(false);
    }
  };

  const runAutoFix = () => {
    if (!activeFile) {
      return;
    }
    onChangeFile(activeFile.path, applyAutoFixes(activeFile.content));
  };

  if (!activeFile) {
    return (
      <div className="rounded-[28px] border border-dashed border-border bg-card/40 p-8 text-center">
        <p className="text-lg font-semibold">ابدأ مساحة عمل جديدة</p>
        <p className="mt-2 text-sm text-muted-foreground">
          أنشئ مشروع modules افتراضي أو افتح ملفاً من GitHub لبدء التحرير.
        </p>
        <Button className="mt-5" onClick={onCreateModuleWorkspace}>
          <Package2 className="mr-2 h-4 w-4" />
          Create Module Workspace
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-[28px] border border-border bg-card/90 p-4 shadow-[0_24px_80px_rgba(0,0,0,0.28)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold text-foreground flex items-center gap-2">
              <FileCode2 className="h-4 w-4 text-primary" />
              Roblox Lua Workspace
            </p>
            <p className="text-xs text-muted-foreground">
              Monaco + Roblox IntelliSense + live diagnostics + multi-file workspace
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="rounded-full border border-border px-3 py-1 text-foreground/80">
              {analysis.summary.errors} errors
            </span>
            <span className="rounded-full border border-border px-3 py-1 text-foreground/80">
              {analysis.summary.warnings} warnings
            </span>
            <span className="rounded-full border border-border px-3 py-1 text-foreground/80">
              {dirtyCount} dirty files
            </span>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {workspaceFiles.map((file) => {
            const active = file.path === activeFile.path;
            const dirty = file.content !== file.originalContent;
            return (
              <button
                type="button"
                key={file.path}
                onClick={() => onSelectFile(file.path)}
                className={`rounded-full border px-3 py-1 text-xs font-mono transition ${
                  active
                    ? "border-primary bg-primary/15 text-primary"
                    : "border-border bg-secondary/40 text-muted-foreground hover:bg-secondary/70"
                }`}
              >
                {file.path}
                {dirty ? " *" : ""}
              </button>
            );
          })}
          <Button variant="outline" size="sm" onClick={onCreateModuleWorkspace}>
            <Package2 className="mr-2 h-4 w-4" />
            Modules
          </Button>
        </div>

        <div className="mt-4 grid gap-3 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-3">
            <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_260px]">
              <Input
                value={activeFile.path}
                onChange={(event) => onRenameFile(activeFile.path, event.target.value)}
                className="font-mono"
              />
              <Input
                value={commitMessage}
                onChange={(event) => setCommitMessage(event.target.value)}
                placeholder="Commit message"
                disabled={disabled}
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <Button onClick={saveActiveFile} disabled={disabled || saving}>
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Save / Commit
              </Button>
              <Button variant="outline" onClick={() => setShowDiff(true)}>
                <GitCompare className="mr-2 h-4 w-4" />
                Diff
              </Button>
              <Button variant="outline" onClick={runAutoFix}>
                <Wand2 className="mr-2 h-4 w-4" />
                Fix Errors
              </Button>
            </div>

            <div className="overflow-hidden rounded-[24px] border border-border bg-[#0d111f]">
              <Editor
                height={isMobile ? "56vh" : "68vh"}
                theme="lua-forge"
                path={activeFile.path}
                defaultLanguage="lua"
                value={activeFile.content}
                beforeMount={handleBeforeMount}
                onMount={handleMount}
                onChange={(value) => onChangeFile(activeFile.path, value ?? "")}
                options={{
                  minimap: { enabled: !isMobile },
                  fontSize: isMobile ? 13 : 15,
                  fontFamily: "'JetBrains Mono', monospace",
                  lineNumbers: "on",
                  automaticLayout: true,
                  scrollBeyondLastLine: false,
                  tabSize: 2,
                  wordWrap: "on",
                  quickSuggestions: true,
                  suggestOnTriggerCharacters: true,
                  inlineSuggest: { enabled: false },
                  smoothScrolling: true,
                  cursorSmoothCaretAnimation: "on",
                  bracketPairColorization: { enabled: true },
                  parameterHints: { enabled: true },
                  padding: { top: 16, bottom: 16 },
                }}
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="rounded-[24px] border border-border bg-secondary/30 p-3">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Sparkles className="h-4 w-4 text-primary" />
                Snippets
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {DEFAULT_SNIPPETS.map((snippet) => (
                  <Button key={snippet.label} size="sm" variant="outline" onClick={() => insertSnippet(snippet.code)}>
                    {snippet.label}
                  </Button>
                ))}
              </div>
            </div>

            <div className="rounded-[24px] border border-border bg-secondary/30 p-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">Loader Generator</p>
                  <p className="text-xs text-muted-foreground">Auto update + multi-file + obfuscated link mode</p>
                </div>
                <div className="flex gap-1 rounded-full bg-background/70 p-1">
                  {loaderModes.map((mode) => (
                    <button
                      type="button"
                      key={mode.value}
                      onClick={() => setLoaderMode(mode.value)}
                      className={`rounded-full px-3 py-1 text-[11px] ${
                        loaderMode === mode.value ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                      }`}
                    >
                      {mode.label}
                    </button>
                  ))}
                </div>
              </div>
              <Textarea value={loader} readOnly className="mt-3 min-h-32 font-mono text-xs" />
              <Button className="mt-3 w-full" variant="outline" onClick={copyLoader} disabled={!loader}>
                {copiedLoader ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
                Copy Loader
              </Button>
            </div>

            <div className="rounded-[24px] border border-border bg-secondary/30 p-3">
              <p className="text-sm font-semibold">Static Analysis</p>
              <div className="mt-3 space-y-2 max-h-80 overflow-auto">
                {analysis.issues.length === 0 ? (
                  <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
                    No findings in the active script.
                  </div>
                ) : (
                  analysis.issues.map((issue, index) => (
                    <div
                      key={`${issue.code}-${index}`}
                      className={`rounded-xl border px-3 py-2 text-sm ${
                        issue.severity === "error"
                          ? "border-red-500/30 bg-red-500/10"
                          : issue.severity === "warning"
                            ? "border-amber-500/30 bg-amber-500/10"
                            : "border-cyan-500/30 bg-cyan-500/10"
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                        <div>
                          <p className="font-medium">{issue.message}</p>
                          <p className="text-[11px] opacity-80">Line {issue.line} • {issue.code}</p>
                          {issue.hint ? <p className="mt-1 text-[12px] opacity-80">{issue.hint}</p> : null}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={showDiff} onOpenChange={setShowDiff}>
        <DialogContent className="max-w-6xl">
          <DialogHeader>
            <DialogTitle>Diff Viewer</DialogTitle>
          </DialogHeader>
          <DiffEditor
            height={isMobile ? "60vh" : "70vh"}
            theme="vs-dark"
            original={activeFile.originalContent}
            modified={activeFile.content}
            language="lua"
            options={{
              readOnly: true,
              renderSideBySide: !isMobile,
              minimap: { enabled: false },
              fontSize: isMobile ? 12 : 14,
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CodeEditor;
