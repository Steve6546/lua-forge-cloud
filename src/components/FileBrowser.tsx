import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { decodeBase64Utf8 } from "@/lib/base64";
import * as github from "@/lib/github-api";
import { toast } from "sonner";
import {
  ArrowLeft,
  Edit3,
  FileCode2,
  Folder,
  Loader2,
  RefreshCw,
  Trash2,
} from "lucide-react";

interface FileItem {
  name: string;
  path: string;
  type: "file" | "dir";
  sha: string;
  size?: number;
}

export interface LoadedRepoFile {
  path: string;
  content: string;
  sha?: string;
}

interface FileBrowserProps {
  token: string;
  owner: string;
  repo: string;
  branch: string;
  onEditFile: (file: LoadedRepoFile) => void;
}

const FileBrowser = ({ token, owner, repo, branch, onEditFile }: FileBrowserProps) => {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPath, setCurrentPath] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);

  const loadFiles = useCallback(async (path?: string) => {
    if (!branch) {
      setFiles([]);
      return;
    }

    setLoading(true);
    try {
      const data = await github.listFiles(token, owner, repo, path, branch);
      const items = Array.isArray(data) ? data : [];
      setFiles(items.map((file: FileItem) => ({
        name: file.name,
        path: file.path,
        type: file.type,
        sha: file.sha,
        size: file.size,
      })));
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "تعذر تحميل ملفات المستودع.");
      setFiles([]);
    } finally {
      setLoading(false);
    }
  }, [branch, owner, repo, token]);

  useEffect(() => {
    setCurrentPath("");
  }, [repo, branch]);

  useEffect(() => {
    void loadFiles(currentPath || undefined);
  }, [currentPath, loadFiles]);

  const handleEdit = async (path: string) => {
    try {
      const data = await github.getFile(token, owner, repo, path, branch);
      onEditFile({
        path,
        sha: data.sha,
        content: decodeBase64Utf8(data.content ?? ""),
      });
      toast.success(`تم فتح ${path} من الفرع ${branch}.`);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "تعذر فتح الملف.");
    }
  };

  const handleDelete = async (path: string, sha: string) => {
    setDeleting(path);
    try {
      await github.deleteFile(token, owner, repo, path, sha, `Delete ${path}`, branch);
      toast.success(`تم حذف ${path} من ${branch}.`);
      await loadFiles(currentPath || undefined);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "تعذر حذف الملف.");
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-foreground">File Browser</p>
          <p className="text-xs text-muted-foreground font-mono">{branch || "No branch selected"}</p>
        </div>
        <Button variant="outline" size="icon" onClick={() => loadFiles(currentPath || undefined)} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {currentPath ? (
        <Button variant="ghost" size="sm" onClick={() => setCurrentPath(currentPath.split("/").slice(0, -1).join("/"))}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          رجوع
        </Button>
      ) : null}

      <div className="rounded-2xl border border-border bg-secondary/20 p-2">
        {loading ? (
          <div className="flex min-h-40 items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        ) : files.length === 0 ? (
          <div className="min-h-40 grid place-items-center text-sm text-muted-foreground">
            لا توجد ملفات في هذا المسار.
          </div>
        ) : (
          <div className="space-y-1">
            {files
              .sort((left, right) => {
                if (left.type !== right.type) {
                  return left.type === "dir" ? -1 : 1;
                }
                return left.name.localeCompare(right.name);
              })
              .map((file) => (
                <div
                  key={file.path}
                  className="flex items-center justify-between gap-3 rounded-xl px-3 py-2 hover:bg-secondary/70"
                >
                  <button
                    type="button"
                    className="flex flex-1 items-center gap-3 text-left"
                    onClick={() => file.type === "dir" ? setCurrentPath(file.path) : handleEdit(file.path)}
                  >
                    {file.type === "dir" ? (
                      <Folder className="h-4 w-4 text-amber-400" />
                    ) : (
                      <FileCode2 className="h-4 w-4 text-primary" />
                    )}
                    <div className="min-w-0">
                      <p className="truncate font-mono text-sm">{file.name}</p>
                      <p className="truncate text-[11px] text-muted-foreground">{file.path}</p>
                    </div>
                  </button>

                  {file.type === "file" ? (
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(file.path)}>
                        <Edit3 className="h-4 w-4 text-cyan-400" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(file.path, file.sha)}
                        disabled={deleting === file.path}
                      >
                        {deleting === file.path ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4 text-destructive" />
                        )}
                      </Button>
                    </div>
                  ) : null}
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FileBrowser;
