import { useState, useCallback } from "react";
import { toast } from "sonner";
import {
  Terminal, FolderGit2, FileCode2, GitBranch, History,
  Zap, Settings, LogOut, KeyRound, Loader2, CheckCircle2,
  Plus, RefreshCw, Lock, Globe, AlertCircle, Sparkles,
  PanelLeftClose, PanelLeft,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import CodeEditor from "@/components/CodeEditor";
import FileBrowser from "@/components/FileBrowser";
import VersionHistory from "@/components/VersionHistory";
import ScopeChecker from "@/components/ScopeChecker";
import BranchSelector from "@/components/BranchSelector";
import SmartLoader from "@/components/SmartLoader";
import DiffViewer from "@/components/DiffViewer";
import AiAssistant from "@/components/AiAssistant";
import * as github from "@/lib/github-api";

interface Repo {
  full_name: string;
  name: string;
  owner: { login: string };
  private: boolean;
}

const TOKEN_KEY = "github_pat_token";
const REPO_NAME_REGEX = /^[a-zA-Z0-9._-]+$/;

const Index = () => {
  // Auth state
  const [token, setToken] = useState("");
  const [username, setUsername] = useState("");
  const [scopes, setScopes] = useState("");
  const [connecting, setConnecting] = useState(false);
  const [tokenInput, setTokenInput] = useState("");

  // Repo state
  const [repos, setRepos] = useState<Repo[]>([]);
  const [selectedRepo, setSelectedRepo] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("");
  const [loadingRepos, setLoadingRepos] = useState(false);

  // Create repo
  const [showCreate, setShowCreate] = useState(false);
  const [newRepoName, setNewRepoName] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [nameError, setNameError] = useState("");

  // Editor state
  const [editingFile, setEditingFile] = useState<{ path: string; content: string; originalContent?: string } | null>(null);
  const [lastUploadUrl, setLastUploadUrl] = useState("");
  const [editorCode, setEditorCode] = useState("");

  // UI
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<"files" | "history" | "loader" | "ai">("files");
  const [showSettings, setShowSettings] = useState(false);

  const selectedRepoObj = repos.find((r) => r.full_name === selectedRepo);

  // Auto-connect
  useState(() => {
    const saved = localStorage.getItem(TOKEN_KEY);
    if (saved) {
      setTokenInput(saved);
      handleConnect(saved);
    }
  });

  async function handleConnect(t?: string) {
    const tok = t || tokenInput.trim();
    if (!tok) return;
    setConnecting(true);
    try {
      const scopeData = await github.checkScopes(tok);
      setScopes(scopeData.scopes || "");
      setUsername(scopeData.user.login);
      setToken(tok);
      localStorage.setItem(TOKEN_KEY, tok);
      toast.success(`مرحباً ${scopeData.user.login}!`);
      setLoadingRepos(true);
      const repoList = await github.fetchRepos(tok);
      setRepos(repoList);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "مفتاح غير صالح";
      toast.error(msg);
      localStorage.removeItem(TOKEN_KEY);
    } finally {
      setConnecting(false);
      setLoadingRepos(false);
    }
  }

  const handleDisconnect = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setToken("");
    setUsername("");
    setScopes("");
    setRepos([]);
    setSelectedRepo("");
    setSelectedBranch("");
    setEditingFile(null);
    setLastUploadUrl("");
    setTokenInput("");
    setShowSettings(false);
    toast.info("تم قطع الاتصال");
  }, []);

  const handleRefreshRepos = useCallback(async () => {
    if (!token) return;
    setLoadingRepos(true);
    try {
      const repoList = await github.fetchRepos(token);
      setRepos(repoList);
    } catch {
      toast.error("خطأ في التحديث");
    } finally {
      setLoadingRepos(false);
    }
  }, [token]);

  const validateRepoName = (name: string) => {
    if (!name.trim()) { setNameError(""); return; }
    if (!REPO_NAME_REGEX.test(name)) { setNameError("أحرف غير مسموحة"); return; }
    if (repos.some((r) => r.name.toLowerCase() === name.toLowerCase())) { setNameError("الاسم مستخدم"); return; }
    setNameError("");
  };

  const handleCreateRepo = async () => {
    if (!newRepoName.trim() || nameError) return;
    setCreating(true);
    try {
      const repo = await github.createRepo(token, newRepoName.trim(), isPrivate);
      toast.success(`تم إنشاء ${repo.name}`);
      setRepos((prev) => [repo, ...prev]);
      setSelectedRepo(repo.full_name);
      setNewRepoName("");
      setShowCreate(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "خطأ في الإنشاء";
      toast.error(msg);
    } finally {
      setCreating(false);
    }
  };

  const handleUpload = useCallback(
    async (fileName: string, content: string): Promise<string> => {
      const repo = repos.find((r) => r.full_name === selectedRepo);
      if (!repo) { toast.error("اختر مستودع أولاً"); return ""; }
      try {
        await github.uploadFile(token, repo.owner.login, repo.name, fileName, content, undefined, selectedBranch || undefined);
        const branch = selectedBranch || "main";
        const rawUrl = `https://raw.githubusercontent.com/${repo.full_name}/${branch}/${fileName}`;
        toast.success("تم الرفع بنجاح!");
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
    setEditorCode(content);
  }, []);

  const handleRestoreVersion = useCallback((content: string) => {
    setEditingFile((prev) => prev ? { ...prev, content } : null);
    setEditorCode(content);
  }, []);

  // ──────────── Not connected: Login screen ────────────
  if (!token) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-sm space-y-6"
        >
          <div className="text-center space-y-2">
            <div className="inline-flex p-3 rounded-xl bg-primary/10 mb-2">
              <Terminal className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-xl font-bold text-foreground">Lua Script Manager</h1>
            <p className="text-xs text-muted-foreground">إدارة سكريبتات Lua عبر GitHub</p>
          </div>

          <div className="space-y-3 p-4 rounded-lg bg-card border border-border">
            <label className="text-xs text-muted-foreground flex items-center gap-2">
              <KeyRound className="w-3.5 h-3.5 text-primary" />
              GitHub Personal Access Token
            </label>
            <Input
              type="password"
              placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleConnect()}
              className="font-mono text-sm bg-muted border-border"
            />
            <Button
              onClick={() => handleConnect()}
              disabled={!tokenInput.trim() || connecting}
              className="w-full"
            >
              {connecting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <KeyRound className="w-4 h-4 mr-2" />}
              اتصال
            </Button>
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              تأكد من تفعيل صلاحية <span className="text-warning font-bold">repo</span> في المفتاح
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  // ──────────── Connected: IDE Layout ────────────
  const sidebarTabs = [
    { id: "files" as const, icon: FileCode2, label: "الملفات" },
    { id: "history" as const, icon: History, label: "السجل" },
    { id: "ai" as const, icon: Sparkles, label: "AI" },
    { id: "loader" as const, icon: Zap, label: "التحميل" },
  ];

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* ── Top Bar ── */}
      <header className="h-10 flex items-center justify-between px-3 bg-card border-b border-border shrink-0">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="h-7 w-7 p-0"
          >
            {sidebarOpen ? <PanelLeftClose className="w-3.5 h-3.5" /> : <PanelLeft className="w-3.5 h-3.5" />}
          </Button>
          <Terminal className="w-4 h-4 text-primary" />
          <span className="text-xs font-bold text-foreground hidden sm:inline">Lua Script Manager</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Repo selector */}
          <Select value={selectedRepo} onValueChange={(r) => { setSelectedRepo(r); setSelectedBranch(""); }}>
            <SelectTrigger className="h-7 text-xs bg-muted border-border max-w-[180px] sm:max-w-[240px]">
              <FolderGit2 className="w-3 h-3 mr-1 shrink-0" />
              <SelectValue placeholder="اختر مستودع..." />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border max-h-60">
              {repos.map((repo) => (
                <SelectItem key={repo.full_name} value={repo.full_name} className="text-xs font-mono">
                  {repo.private ? "🔒 " : ""}{repo.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button variant="ghost" size="sm" onClick={handleRefreshRepos} disabled={loadingRepos} className="h-7 w-7 p-0">
            <RefreshCw className={`w-3 h-3 ${loadingRepos ? "animate-spin" : ""}`} />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setShowCreate(!showCreate)} className="h-7 w-7 p-0">
            <Plus className="w-3 h-3" />
          </Button>

          {/* Branch */}
          {selectedRepoObj && (
            <BranchSelector
              token={token}
              owner={selectedRepoObj.owner.login}
              repo={selectedRepoObj.name}
              selectedBranch={selectedBranch}
              onSelectBranch={setSelectedBranch}
            />
          )}

          <div className="w-px h-5 bg-border mx-1 hidden sm:block" />

          {/* User info */}
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3 h-3 text-primary" />
            <span className="text-[10px] text-muted-foreground hidden sm:inline">{username}</span>
          </div>

          <Button variant="ghost" size="sm" onClick={() => setShowSettings(!showSettings)} className="h-7 w-7 p-0">
            <Settings className="w-3.5 h-3.5 text-muted-foreground" />
          </Button>
        </div>
      </header>

      {/* Settings dropdown */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="absolute right-3 top-11 z-50 p-3 rounded-lg bg-card border border-border shadow-xl space-y-3 w-64"
          >
            <div className="text-xs text-muted-foreground space-y-2">
              <p>الحساب: <span className="text-accent">{username}</span></p>
              <ScopeChecker scopes={scopes} />
            </div>
            <Button variant="destructive" size="sm" onClick={handleDisconnect} className="w-full text-xs gap-1.5">
              <LogOut className="w-3 h-3" />
              تغيير المفتاح
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create repo bar */}
      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="border-b border-border bg-card overflow-hidden"
          >
            <div className="flex items-center gap-2 p-2">
              <Input
                placeholder="اسم المستودع الجديد"
                value={newRepoName}
                onChange={(e) => { setNewRepoName(e.target.value); validateRepoName(e.target.value); }}
                onKeyDown={(e) => e.key === "Enter" && handleCreateRepo()}
                className={`h-7 text-xs font-mono bg-muted border-border max-w-xs ${nameError ? "border-destructive" : ""}`}
              />
              <div className="flex items-center gap-1.5">
                <Switch checked={isPrivate} onCheckedChange={setIsPrivate} className="scale-75" />
                <span className="text-[10px] text-muted-foreground">
                  {isPrivate ? <Lock className="w-3 h-3 inline" /> : <Globe className="w-3 h-3 inline" />}
                </span>
              </div>
              <Button size="sm" onClick={handleCreateRepo} disabled={!newRepoName.trim() || !!nameError || creating} className="h-7 text-xs">
                {creating ? <Loader2 className="w-3 h-3 animate-spin" /> : "إنشاء"}
              </Button>
              {nameError && (
                <span className="text-[10px] text-destructive flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {nameError}
                </span>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Main area ── */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.aside
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 280, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="border-r border-border bg-card flex flex-col overflow-hidden shrink-0"
            >
              {/* Sidebar tabs */}
              <div className="flex border-b border-border shrink-0">
                {sidebarTabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-[10px] transition-colors border-b-2 ${
                      activeTab === tab.id
                        ? "border-primary text-primary"
                        : "border-transparent text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <tab.icon className="w-3 h-3" />
                    <span className="hidden sm:inline">{tab.label}</span>
                  </button>
                ))}
              </div>

              {/* Sidebar content */}
              <div className="flex-1 overflow-y-auto p-2">
                {activeTab === "files" && selectedRepoObj && (
                  <FileBrowser
                    token={token}
                    owner={selectedRepoObj.owner.login}
                    repo={selectedRepoObj.name}
                    branch={selectedBranch}
                    onEditFile={handleEditFile}
                  />
                )}
                {activeTab === "files" && !selectedRepoObj && (
                  <p className="text-xs text-muted-foreground/50 text-center py-8">اختر مستودع أولاً</p>
                )}

                {activeTab === "history" && selectedRepoObj && editingFile?.path && (
                  <VersionHistory
                    token={token}
                    owner={selectedRepoObj.owner.login}
                    repo={selectedRepoObj.name}
                    filePath={editingFile.path}
                    onRestore={handleRestoreVersion}
                  />
                )}
                {activeTab === "history" && (!selectedRepoObj || !editingFile?.path) && (
                  <p className="text-xs text-muted-foreground/50 text-center py-8">افتح ملف لعرض السجل</p>
                )}

                {activeTab === "ai" && (
                  <AiAssistant
                    code={editorCode}
                    onApplyCode={(c) => {
                      setEditorCode(c);
                      setEditingFile((prev) => prev ? { ...prev, content: c } : { path: "script.lua", content: c });
                    }}
                  />
                )}

                {activeTab === "loader" && lastUploadUrl && (
                  <SmartLoader rawUrl={lastUploadUrl} />
                )}
                {activeTab === "loader" && !lastUploadUrl && (
                  <p className="text-xs text-muted-foreground/50 text-center py-8">ارفع ملف أولاً</p>
                )}
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Editor area */}
        <main className="flex-1 flex flex-col overflow-hidden">
          <CodeEditor
            onUpload={handleUpload}
            disabled={!selectedRepo}
            initialCode={editingFile?.content}
            initialFileName={editingFile?.path}
            onCodeChange={setEditorCode}
          />
        </main>
      </div>
    </div>
  );
};

export default Index;
