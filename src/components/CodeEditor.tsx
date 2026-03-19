import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, Loader2, FileCode2, Link, Copy, Check } from "lucide-react";

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
      <div className="relative">
        <div className="absolute top-0 left-0 right-0 h-8 bg-secondary/80 rounded-t-md flex items-center px-3 border-b border-border">
          <span className="text-xs font-mono text-muted-foreground">{fileName}</span>
        </div>
        <textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="w-full h-80 bg-muted border border-border rounded-md p-3 pt-10 font-mono text-sm text-foreground resize-y focus:outline-none focus:ring-1 focus:ring-primary leading-relaxed"
          spellCheck={false}
        />
      </div>
      {rawUrl && (
        <div className="p-3 rounded-md bg-secondary border border-primary/30 space-y-2">
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
        </div>
      )}
    </div>
  );
};

export default CodeEditor;
