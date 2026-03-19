import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  FileCode2,
  Folder,
  Trash2,
  Edit3,
  Loader2,
  RefreshCw,
  ChevronRight,
  ArrowLeft,
} from "lucide-react";
import * as github from "@/lib/github-api";
import { toast } from "sonner";

interface FileItem {
  name: string;
  path: string;
  type: "file" | "dir";
  sha: string;
  size?: number;
}

interface FileBrowserProps {
  token: string;
  owner: string;
  repo: string;
  onEditFile: (path: string, content: string) => void;
}

const FileBrowser = ({ token, owner, repo, onEditFile }: FileBrowserProps) => {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPath, setCurrentPath] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);

  const loadFiles = useCallback(async (path?: string) => {
    setLoading(true);
    try {
      const data = await github.listFiles(token, owner, repo, path);
      const items = Array.isArray(data) ? data : [];
      setFiles(items.map((f: any) => ({
        name: f.name,
        path: f.path,
        type: f.type,
        sha: f.sha,
        size: f.size,
      })));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "خطأ في تحميل الملفات";
      toast.error(msg);
      setFiles([]);
    } finally {
      setLoading(false);
    }
  }, [token, owner, repo]);

  useEffect(() => {
    loadFiles(currentPath || undefined);
  }, [currentPath, loadFiles]);

  const handleEdit = async (filePath: string) => {
    try {
      const data = await github.getFile(token, owner, repo, filePath);
      const content = decodeURIComponent(escape(atob(data.content.replace(/\n/g, ""))));
      onEditFile(filePath, content);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "خطأ في تحميل الملف";
      toast.error(msg);
    }
  };

  const handleDelete = async (filePath: string, sha: string) => {
    setDeleting(filePath);
    try {
      await github.deleteFile(token, owner, repo, filePath, sha);
      toast.success(`تم حذف ${filePath}`);
      loadFiles(currentPath || undefined);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "خطأ في الحذف";
      toast.error(msg);
    } finally {
      setDeleting(null);
    }
  };

  const navigateToDir = (path: string) => setCurrentPath(path);
  const navigateUp = () => {
    const parts = currentPath.split("/");
    parts.pop();
    setCurrentPath(parts.join("/"));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-mono text-muted-foreground flex items-center gap-2">
          <Folder className="w-4 h-4 text-primary" />
          ملفات المستودع
        </label>
        <Button variant="ghost" size="sm" onClick={() => loadFiles(currentPath || undefined)} disabled={loading}>
          <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {currentPath && (
        <Button variant="ghost" size="sm" onClick={navigateUp} className="text-xs gap-1 text-muted-foreground">
          <ArrowLeft className="w-3 h-3" />
          رجوع
        </Button>
      )}

      {currentPath && (
        <p className="text-xs font-mono text-muted-foreground/60">📁 {currentPath}</p>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
        </div>
      ) : files.length === 0 ? (
        <p className="text-xs font-mono text-muted-foreground text-center py-4">لا توجد ملفات</p>
      ) : (
        <div className="space-y-1">
          {files
            .sort((a, b) => (a.type === b.type ? a.name.localeCompare(b.name) : a.type === "dir" ? -1 : 1))
            .map((file) => (
              <div
                key={file.path}
                className="flex items-center justify-between p-2 rounded-md hover:bg-secondary/50 transition-colors group"
              >
                <div
                  className={`flex items-center gap-2 flex-1 min-w-0 ${file.type === "dir" ? "cursor-pointer" : ""}`}
                  onClick={() => file.type === "dir" && navigateToDir(file.path)}
                >
                  {file.type === "dir" ? (
                    <Folder className="w-4 h-4 text-warning shrink-0" />
                  ) : (
                    <FileCode2 className="w-4 h-4 text-primary shrink-0" />
                  )}
                  <span className="text-sm font-mono text-foreground truncate">{file.name}</span>
                  {file.type === "dir" && <ChevronRight className="w-3 h-3 text-muted-foreground" />}
                  {file.size !== undefined && file.type === "file" && (
                    <span className="text-xs text-muted-foreground/50">{(file.size / 1024).toFixed(1)}KB</span>
                  )}
                </div>
                {file.type === "file" && (
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(file.path)} className="h-7 px-2">
                      <Edit3 className="w-3 h-3 text-accent" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(file.path, file.sha)}
                      disabled={deleting === file.path}
                      className="h-7 px-2"
                    >
                      {deleting === file.path ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Trash2 className="w-3 h-3 text-destructive" />
                      )}
                    </Button>
                  </div>
                )}
              </div>
            ))}
        </div>
      )}
    </div>
  );
};

export default FileBrowser;
