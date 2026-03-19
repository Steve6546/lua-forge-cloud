import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, Loader2, FileCode2, Link, Copy, Check } from "lucide-react";
import Editor from "@monaco-editor/react";

interface CodeEditorProps {
  onUpload: (fileName: string, content: string) => Promise<string>;
  disabled: boolean;
}

const DEFAULT_LUA = `-- Lua Script
-- Write your code here

function hello(name)
    print("Hello, " .. name .. "!")
end

hello("World")
`;

const CodeEditor = ({ onUpload, disabled }: CodeEditorProps) => {
  const [code, setCode] = useState(DEFAULT_LUA);
  const [fileName, setFileName] = useState("script.lua");
  const [uploading, setUploading] = useState(false);
  const [rawUrl, setRawUrl] = useState("");
  const [copied, setCopied] = useState(false);

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

  const copyUrl = () => {
    navigator.clipboard.writeText(rawUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const copyLoadstring = () => {
    const cmd = `loadstring(game:HttpGet("${rawUrl}"))()`;
    navigator.clipboard.writeText(cmd);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleEditorChange = useCallback((value: string | undefined) => {
    setCode(value || "");
  }, []);

  return (
    <div className="space-y-3">
      <label className="text-sm font-mono text-muted-foreground flex items-center gap-2">
        <FileCode2 className="w-4 h-4 text-primary" />
        محرر الكود (Lua Editor)
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

      <div className="border border-border rounded-md overflow-hidden">
        <div className="h-8 bg-secondary/80 flex items-center px-3 border-b border-border">
          <span className="text-xs font-mono text-muted-foreground">{fileName}</span>
        </div>
        <Editor
          height="350px"
          defaultLanguage="lua"
          theme="vs-dark"
          value={code}
          onChange={handleEditorChange}
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
          }}
        />
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
            <Button variant="outline" size="sm" onClick={copyUrl}>
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            </Button>
          </div>
          <div className="pt-2 border-t border-border">
            <p className="text-xs font-mono text-muted-foreground mb-1">🎮 كود التشغيل:</p>
            <div className="flex gap-2 items-center">
              <code className="text-xs font-mono text-warning bg-muted px-2 py-1 rounded flex-1 overflow-x-auto">
                {`loadstring(game:HttpGet("${rawUrl}"))()`}
              </code>
              <Button variant="outline" size="sm" onClick={copyLoadstring}>
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
