import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  FileCode2, Folder, Trash2, Edit3, Loader2, RefreshCw,
  ChevronRight, ArrowLeft, FolderPlus, Plus,
} from "lucide-react";
import * as github from "@/lib/github-api";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

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
  branch?: string;
  onEditFile: (path: string, content: string) => void;
}

const QUICK_FOLDERS = ["hub", "scripts", "private", "modules", "config"];

const FileBrowser = ({ token, owner, repo, branch, onEditFile }: FileBrowserProps) => {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPath, setCurrentPath] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [creatingFolder, setCreatingFolder] = useState(false);

  const loadFiles = useCallback(async (path?: string) => {
    setLoading(true);
    try {
      const data = await github.listFiles(token, owner, repo, path, branch);
      const items = Array.isArray(data) ? data : [];
      setFiles(items.map((f: any) => ({
        name: f.name,
        path: f.path,
        type: f.type,
        sha: f.sha,
        size: f.size,
      })));
    } catch {
      setFiles([]);
    } finally {
      setLoading(false);
    }
  }, [token, owner, repo, branch]);

  useEffect(() => {
    loadFiles(currentPath || undefined);
  }, [currentPath, loadFiles]);

  const handleEdit = async (filePath: string) => {
    try {
      const data = await github.getFile(token, owner, repo, filePath, branch);
      const content = decodeURIComponent(escape(atob(data.content.replace(/\n/g, ""))));
      onEditFile(filePath, content);
    } catch {
      toast.error("خطأ في تحميل الملف");
    }
  };

  const handleDelete = async (filePath: string, sha: string) => {
    setDeleting(filePath);
    try {
      await github.deleteFile(token, owner, repo, filePath, sha);
      toast.success(`تم حذف ${filePath.split("/").pop()}`);
      loadFiles(currentPath || undefined);
    } catch {
      toast.error("خطأ في الحذف");
    } finally {
      setDeleting(null);
    }
  };

  const handleCreateFolder = async (name?: string) => {
    const folderName = name || newFolderName.trim();
    if (!folderName) return;
    setCreatingFolder(true);
    try {
      const fullPath = currentPath ? `${currentPath}/${folderName}` : folderName;
      await github.createFolder(token, owner, repo, fullPath, branch);
      toast.success(`تم إنشاء مجلد ${folderName}`);
      setNewFolderName("");
      setShowCreateFolder(false);
      loadFiles(currentPath || undefined);
    } catch {
      toast.error("خطأ في إنشاء المجلد");
    } finally {
      setCreatingFolder(false);
    }
  };

  const navigateToDir = (path: string) => setCurrentPath(path);
  const navigateUp = () => {
    const parts = currentPath.split("/");
    parts.pop();
    setCurrentPath(parts.join("/"));
  };

  const sortedFiles = files.sort((a, b) =>
    a.type === b.type ? a.name.localeCompare(b.name) : a.type === "dir" ? -1 : 1
  );

  return (
    <div className="space-y-2">
      {/* Header bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          {currentPath && (
            <Button variant="ghost" size="sm" onClick={navigateUp} className="h-6 px-1.5 shrink-0">
              <ArrowLeft className="w-3 h-3" />
            </Button>
          )}
          <span className="text-xs font-mono text-muted-foreground truncate">
            {currentPath || "/"}
          </span>
        </div>
        <div className="flex gap-1 shrink-0">
          <Button variant="ghost" size="sm" onClick={() => setShowCreateFolder(!showCreateFolder)} className="h-6 px-1.5">
            <FolderPlus className="w-3 h-3" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => loadFiles(currentPath || undefined)} disabled={loading} className="h-6 px-1.5">
            <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {/* Create folder */}
      <AnimatePresence>
        {showCreateFolder && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden space-y-2"
          >
            <div className="flex gap-1.5">
              <Input
                placeholder="اسم المجلد..."
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreateFolder()}
                className="h-7 text-xs font-mono bg-muted border-border"
              />
              <Button
                size="sm"
                onClick={() => handleCreateFolder()}
                disabled={!newFolderName.trim() || creatingFolder}
                className="h-7 px-2 text-xs"
              >
                {creatingFolder ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
              </Button>
            </div>
            {/* Quick folder buttons */}
            {!currentPath && (
              <div className="flex gap-1 flex-wrap">
                {QUICK_FOLDERS.filter(f => !files.some(fi => fi.name === f)).map((f) => (
                  <Button
                    key={f}
                    variant="outline"
                    size="sm"
                    onClick={() => handleCreateFolder(f)}
                    disabled={creatingFolder}
                    className="h-5 px-2 text-[10px] font-mono gap-1 border-border text-muted-foreground hover:text-foreground"
                  >
                    <Folder className="w-2.5 h-2.5" />
                    {f}/
                  </Button>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Files list */}
      {loading ? (
        <div className="flex justify-center py-6">
          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
        </div>
      ) : sortedFiles.length === 0 ? (
        <p className="text-xs font-mono text-muted-foreground/50 text-center py-4">مجلد فارغ</p>
      ) : (
        <div className="space-y-px">
          {sortedFiles.map((file) => (
            <div
              key={file.path}
              className="flex items-center justify-between px-2 py-1.5 rounded hover:bg-secondary/60 transition-colors group cursor-default"
            >
              <div
                className={`flex items-center gap-2 flex-1 min-w-0 ${file.type === "dir" ? "cursor-pointer" : ""}`}
                onClick={() => file.type === "dir" && navigateToDir(file.path)}
              >
                {file.type === "dir" ? (
                  <Folder className="w-3.5 h-3.5 text-warning shrink-0" />
                ) : (
                  <FileCode2 className="w-3.5 h-3.5 text-accent shrink-0" />
                )}
                <span className="text-xs font-mono text-foreground truncate">{file.name}</span>
                {file.type === "dir" && <ChevronRight className="w-3 h-3 text-muted-foreground/40" />}
                {file.size !== undefined && file.type === "file" && (
                  <span className="text-[10px] text-muted-foreground/40 ml-auto shrink-0">
                    {(file.size / 1024).toFixed(1)}K
                  </span>
                )}
              </div>
              {file.type === "file" && (
                <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  <Button variant="ghost" size="sm" onClick={() => handleEdit(file.path)} className="h-6 w-6 p-0">
                    <Edit3 className="w-3 h-3 text-accent" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(file.path, file.sha)}
                    disabled={deleting === file.path}
                    className="h-6 w-6 p-0"
                  >
                    {deleting === file.path ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Trash2 className="w-3 h-3 text-destructive/70" />
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
