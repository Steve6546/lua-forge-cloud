import { useState, useCallback } from "react";
import { toast } from "sonner";
import { Terminal } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import TokenInput from "@/components/TokenInput";
import RepoManager from "@/components/RepoManager";
import CodeEditor from "@/components/CodeEditor";
import FileBrowser from "@/components/FileBrowser";
import VersionHistory from "@/components/VersionHistory";
import ScopeChecker from "@/components/ScopeChecker";
import BranchSelector from "@/components/BranchSelector";
import SmartLoader from "@/components/SmartLoader";
import DiffViewer from "@/components/DiffViewer";
import * as github from "@/lib/github-api";

interface Repo {
  full_name: string;
  name: string;
  owner: { login: string };
  private: boolean;
}

const fadeUp = {
  initial: { opacity: 0, y: 15 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
  transition: { duration: 0.3 },
};

const Index = () => {
  const [token, setToken] = useState("");
  const [username, setUsername] = useState("");
  const [scopes, setScopes] = useState("");
  const [repos, setRepos] = useState<Repo[]>([]);
  const [selectedRepo, setSelectedRepo] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("");
  const [loadingRepos, setLoadingRepos] = useState(false);
  const [editingFile, setEditingFile] = useState<{ path: string; content: string; originalContent?: string } | null>(null);
  const [lastUploadUrl, setLastUploadUrl] = useState("");
  const [showDiff, setShowDiff] = useState(false);

  const selectedRepoObj = repos.find((r) => r.full_name === selectedRepo);

  const handleConnect = useCallback(async (t: string) => {
    try {
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
    setSelectedBranch("");
    setEditingFile(null);
    setLastUploadUrl("");
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
        await github.uploadFile(token, repo.owner.login, repo.name, fileName, content, undefined, selectedBranch || undefined);
        const branch = selectedBranch || "main";
        const rawUrl = `https://raw.githubusercontent.com/${repo.full_name}/${branch}/${fileName}`;
        toast.success("تم رفع الملف بنجاح!");
        setLastUploadUrl(rawUrl);
        return rawUrl;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "خطأ في الرفع";
        toast.error(msg);
        return "";
      }
    },
    [token, selectedRepo, repos, selectedBranch]
  );

  const handleEditFile = useCallback((path: string, content: string) => {
    setEditingFile({ path, content, originalContent: content });
    setShowDiff(false);
    toast.info(`تم تحميل ${path} في المحرر`);
  }, []);

  const handleRestoreVersion = useCallback((content: string) => {
    setEditingFile((prev) => prev ? { ...prev, content } : null);
  }, []);

  return (
    <div className="min-h-screen bg-background p-3 sm:p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
        {/* Header */}
        <motion.div
          className="flex items-center gap-3 pb-4 border-b border-border"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="p-2 sm:p-2.5 rounded-lg bg-primary/10 animate-pulse-glow">
            <Terminal className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-mono font-bold text-foreground">
              Lua Script Manager
            </h1>
            <p className="text-[10px] sm:text-xs font-mono text-muted-foreground">
              رفع وإدارة سكريبتات Lua عبر GitHub • IntelliSense + Roblox API
            </p>
          </div>
        </motion.div>

        {/* Token */}
        <motion.div {...fadeUp} className="p-3 sm:p-4 rounded-lg bg-card border border-border space-y-3">
          <TokenInput
            onConnect={handleConnect}
            onDisconnect={handleDisconnect}
            isConnected={!!token}
            username={username}
          />
          {token && scopes !== undefined && <ScopeChecker scopes={scopes} />}
        </motion.div>

        {/* Repos */}
        <AnimatePresence>
          {token && (
            <motion.div {...fadeUp} className="p-3 sm:p-4 rounded-lg bg-card border border-border space-y-3">
              <RepoManager
                repos={repos}
                selectedRepo={selectedRepo}
                onSelectRepo={(r) => { setSelectedRepo(r); setSelectedBranch(""); }}
                onCreateRepo={handleCreateRepo}
                onRefresh={handleRefreshRepos}
                loading={loadingRepos}
              />
              {/* Branch Selector */}
              {selectedRepoObj && (
                <BranchSelector
                  token={token}
                  owner={selectedRepoObj.owner.login}
                  repo={selectedRepoObj.name}
                  selectedBranch={selectedBranch}
                  onSelectBranch={setSelectedBranch}
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* File Browser */}
        <AnimatePresence>
          {token && selectedRepoObj && (
            <motion.div {...fadeUp} className="p-3 sm:p-4 rounded-lg bg-card border border-border">
              <FileBrowser
                token={token}
                owner={selectedRepoObj.owner.login}
                repo={selectedRepoObj.name}
                onEditFile={handleEditFile}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Editor */}
        <AnimatePresence>
          {token && (
            <motion.div {...fadeUp} className="p-3 sm:p-4 rounded-lg bg-card border border-border">
              <CodeEditor
                onUpload={handleUpload}
                disabled={!selectedRepo}
                initialCode={editingFile?.content}
                initialFileName={editingFile?.path}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Diff Viewer */}
        <AnimatePresence>
          {token && editingFile?.originalContent && showDiff && (
            <motion.div {...fadeUp} className="p-3 sm:p-4 rounded-lg bg-card border border-border">
              <DiffViewer
                oldCode={editingFile.originalContent}
                newCode={editingFile.content}
                fileName={editingFile.path}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Smart Loader */}
        <AnimatePresence>
          {token && lastUploadUrl && (
            <motion.div {...fadeUp} className="p-3 sm:p-4 rounded-lg bg-card border border-border">
              <SmartLoader rawUrl={lastUploadUrl} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Version History */}
        <AnimatePresence>
          {token && selectedRepoObj && editingFile?.path && (
            <motion.div {...fadeUp} className="p-3 sm:p-4 rounded-lg bg-card border border-border">
              <VersionHistory
                token={token}
                owner={selectedRepoObj.owner.login}
                repo={selectedRepoObj.name}
                filePath={editingFile.path}
                onRestore={handleRestoreVersion}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Index;
