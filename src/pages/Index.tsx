import { useState, useCallback } from "react";
import { toast } from "sonner";
import { Terminal } from "lucide-react";
import TokenInput from "@/components/TokenInput";
import RepoManager from "@/components/RepoManager";
import CodeEditor from "@/components/CodeEditor";
import FileBrowser from "@/components/FileBrowser";
import VersionHistory from "@/components/VersionHistory";
import ScopeChecker from "@/components/ScopeChecker";
import * as github from "@/lib/github-api";

interface Repo {
  full_name: string;
  name: string;
  owner: { login: string };
  private: boolean;
}

const Index = () => {
  const [token, setToken] = useState("");
  const [username, setUsername] = useState("");
  const [scopes, setScopes] = useState("");
  const [repos, setRepos] = useState<Repo[]>([]);
  const [selectedRepo, setSelectedRepo] = useState("");
  const [loadingRepos, setLoadingRepos] = useState(false);
  const [editingFile, setEditingFile] = useState<{ path: string; content: string } | null>(null);

  const selectedRepoObj = repos.find((r) => r.full_name === selectedRepo);

  const handleConnect = useCallback(async (t: string) => {
    try {
      // Check scopes first
      const scopeData = await github.checkScopes(t);
      setScopes(scopeData.scopes || "");
      setUsername(scopeData.user.login);
      setToken(t);
      toast.success(`مرحباً ${scopeData.user.login}!`);
      setLoadingRepos(true);
      const repoList = await github.fetchRepos(t);
      setRepos(repoList);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "خطأ في الاتصال";
      toast.error(msg);
      throw err;
    } finally {
      setLoadingRepos(false);
    }
  }, []);

  const handleDisconnect = useCallback(() => {
    setToken("");
    setUsername("");
    setScopes("");
    setRepos([]);
    setSelectedRepo("");
    setEditingFile(null);
    toast.info("تم قطع الاتصال");
  }, []);

  const handleRefreshRepos = useCallback(async () => {
    if (!token) return;
    setLoadingRepos(true);
    try {
      const repoList = await github.fetchRepos(token);
      setRepos(repoList);
      toast.success("تم تحديث المستودعات");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "خطأ";
      toast.error(msg);
    } finally {
      setLoadingRepos(false);
    }
  }, [token]);

  const handleCreateRepo = useCallback(
    async (name: string, isPrivate: boolean) => {
      try {
        const repo = await github.createRepo(token, name, isPrivate);
        toast.success(`تم إنشاء المستودع: ${repo.full_name}`);
        setRepos((prev) => [repo, ...prev]);
        setSelectedRepo(repo.full_name);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "خطأ في الإنشاء";
        toast.error(msg);
      }
    },
    [token]
  );

  const handleUpload = useCallback(
    async (fileName: string, content: string): Promise<string> => {
      const repo = repos.find((r) => r.full_name === selectedRepo);
      if (!repo) {
        toast.error("اختر مستودع أولاً");
        return "";
      }
      try {
        await github.uploadFile(token, repo.owner.login, repo.name, fileName, content);
        const rawUrl = `https://raw.githubusercontent.com/${repo.full_name}/main/${fileName}`;
        toast.success("تم رفع الملف بنجاح!");
        return rawUrl;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "خطأ في الرفع";
        toast.error(msg);
        return "";
      }
    },
    [token, selectedRepo, repos]
  );

  const handleEditFile = useCallback((path: string, content: string) => {
    setEditingFile({ path, content });
    toast.info(`تم تحميل ${path} في المحرر`);
  }, []);

  const handleRestoreVersion = useCallback((content: string) => {
    setEditingFile((prev) => prev ? { ...prev, content } : null);
  }, []);

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3 pb-4 border-b border-border">
          <div className="p-2 rounded-md bg-primary/10 animate-pulse-glow">
            <Terminal className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-mono font-bold text-foreground">
              Lua Script Manager
            </h1>
            <p className="text-xs font-mono text-muted-foreground">
              رفع وإدارة سكريبتات Lua عبر GitHub
            </p>
          </div>
        </div>

        {/* Token */}
        <div className="p-4 rounded-lg bg-card border border-border space-y-3">
          <TokenInput
            onConnect={handleConnect}
            onDisconnect={handleDisconnect}
            isConnected={!!token}
            username={username}
          />
          {token && scopes !== undefined && <ScopeChecker scopes={scopes} />}
        </div>

        {/* Repos */}
        {token && (
          <div className="p-4 rounded-lg bg-card border border-border">
            <RepoManager
              repos={repos}
              selectedRepo={selectedRepo}
              onSelectRepo={setSelectedRepo}
              onCreateRepo={handleCreateRepo}
              onRefresh={handleRefreshRepos}
              loading={loadingRepos}
            />
          </div>
        )}

        {/* File Browser */}
        {token && selectedRepoObj && (
          <div className="p-4 rounded-lg bg-card border border-border">
            <FileBrowser
              token={token}
              owner={selectedRepoObj.owner.login}
              repo={selectedRepoObj.name}
              onEditFile={handleEditFile}
            />
          </div>
        )}

        {/* Editor */}
        {token && (
          <div className="p-4 rounded-lg bg-card border border-border">
            <CodeEditor
              onUpload={handleUpload}
              disabled={!selectedRepo}
              initialCode={editingFile?.content}
              initialFileName={editingFile?.path}
            />
          </div>
        )}

        {/* Version History */}
        {token && selectedRepoObj && editingFile?.path && (
          <div className="p-4 rounded-lg bg-card border border-border">
            <VersionHistory
              token={token}
              owner={selectedRepoObj.owner.login}
              repo={selectedRepoObj.name}
              filePath={editingFile.path}
              onRestore={handleRestoreVersion}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
