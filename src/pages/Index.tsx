import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Blocks, Github, MonitorSmartphone, Sparkles, Wand2 } from "lucide-react";
import TokenInput from "@/components/TokenInput";
import RepoManager from "@/components/RepoManager";
import CodeEditor, { type EditorWorkspaceFile } from "@/components/CodeEditor";
import FileBrowser, { type LoadedRepoFile } from "@/components/FileBrowser";
import VersionHistory from "@/components/VersionHistory";
import ScopeChecker from "@/components/ScopeChecker";
import { useIsMobile } from "@/hooks/use-mobile";
import * as github from "@/lib/github-api";

interface Repo {
  full_name: string;
  name: string;
  owner: { login: string };
  private: boolean;
  default_branch?: string;
}

interface Branch {
  name: string;
}

const MODULE_WORKSPACE: EditorWorkspaceFile[] = [
  {
    path: "main.lua",
    content: [
      "local Utils = require(script.Parent.utils)",
      "local Config = require(script.Parent.config)",
      "",
      "local Players = game:GetService(\"Players\")",
      "",
      "Players.PlayerAdded:Connect(function(player)",
      "\tprint(Utils.greet(player.Name, Config.prefix))",
      "end)",
    ].join("\n"),
    originalContent: [
      "local Utils = require(script.Parent.utils)",
      "local Config = require(script.Parent.config)",
      "",
      "local Players = game:GetService(\"Players\")",
      "",
      "Players.PlayerAdded:Connect(function(player)",
      "\tprint(Utils.greet(player.Name, Config.prefix))",
      "end)",
    ].join("\n"),
  },
  {
    path: "utils.lua",
    content: [
      "local Utils = {}",
      "",
      "function Utils.greet(playerName, prefix)",
      "\treturn string.format(\"%s %s\", prefix, playerName)",
      "end",
      "",
      "return Utils",
    ].join("\n"),
    originalContent: [
      "local Utils = {}",
      "",
      "function Utils.greet(playerName, prefix)",
      "\treturn string.format(\"%s %s\", prefix, playerName)",
      "end",
      "",
      "return Utils",
    ].join("\n"),
  },
  {
    path: "config.lua",
    content: [
      "return {",
      "\tprefix = \"Welcome\",",
      "\tanalyticsEnabled = true,",
      "}",
    ].join("\n"),
    originalContent: [
      "return {",
      "\tprefix = \"Welcome\",",
      "\tanalyticsEnabled = true,",
      "}",
    ].join("\n"),
  },
];

const Index = () => {
  const [token, setToken] = useState("");
  const [username, setUsername] = useState("");
  const [scopes, setScopes] = useState("");
  const [repos, setRepos] = useState<Repo[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedRepo, setSelectedRepo] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("");
  const [loadingRepos, setLoadingRepos] = useState(false);
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [workspaceFiles, setWorkspaceFiles] = useState<EditorWorkspaceFile[]>(MODULE_WORKSPACE);
  const [activeFilePath, setActiveFilePath] = useState("main.lua");
  const isMobile = useIsMobile();

  const selectedRepoObj = useMemo(
    () => repos.find((repo) => repo.full_name === selectedRepo),
    [repos, selectedRepo],
  );

  const upsertWorkspaceFile = useCallback((file: LoadedRepoFile) => {
    setWorkspaceFiles((current) => {
      const nextFile: EditorWorkspaceFile = {
        path: file.path,
        content: file.content,
        sha: file.sha,
        originalContent: file.content,
      };
      const existingIndex = current.findIndex((entry) => entry.path === file.path);
      if (existingIndex === -1) {
        return [nextFile, ...current];
      }
      const clone = [...current];
      clone[existingIndex] = nextFile;
      return clone;
    });
    setActiveFilePath(file.path);
  }, []);

  const loadBranches = useCallback(async (repo: Repo) => {
    setLoadingBranches(true);
    try {
      const [repoInfo, branchList] = await Promise.all([
        github.getRepo(token, repo.owner.login, repo.name),
        github.listBranches(token, repo.owner.login, repo.name),
      ]);
      const normalizedBranches = Array.isArray(branchList) ? branchList : [];
      setBranches(normalizedBranches);
      setSelectedBranch(repoInfo.default_branch ?? repo.default_branch ?? normalizedBranches[0]?.name ?? "");
    } catch (error: unknown) {
      setBranches([]);
      setSelectedBranch("");
      toast.error(error instanceof Error ? error.message : "تعذر تحميل فروع المستودع.");
    } finally {
      setLoadingBranches(false);
    }
  }, [token]);

  const handleConnect = useCallback(async (nextToken: string) => {
    try {
      const scopeData = await github.checkScopes(nextToken);
      setScopes(scopeData.scopes || "");
      setUsername(scopeData.user.login);
      setToken(nextToken);
      setLoadingRepos(true);
      const repoList = await github.fetchRepos(nextToken);
      setRepos(repoList);
      toast.success(`مرحباً ${scopeData.user.login}`);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "فشل الاتصال بـ GitHub.";
      toast.error(message);
      throw error;
    } finally {
      setLoadingRepos(false);
    }
  }, []);

  const handleDisconnect = useCallback(() => {
    setToken("");
    setUsername("");
    setScopes("");
    setRepos([]);
    setBranches([]);
    setSelectedRepo("");
    setSelectedBranch("");
    setWorkspaceFiles(MODULE_WORKSPACE);
    setActiveFilePath("main.lua");
    toast.info("تم قطع الاتصال.");
  }, []);

  const handleRefreshRepos = useCallback(async () => {
    if (!token) {
      return;
    }
    setLoadingRepos(true);
    try {
      const repoList = await github.fetchRepos(token);
      setRepos(repoList);
      toast.success("تم تحديث المستودعات.");
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "تعذر تحديث المستودعات.");
    } finally {
      setLoadingRepos(false);
    }
  }, [token]);

  const handleCreateRepo = useCallback(async (name: string, isPrivate: boolean) => {
    if (!token) {
      return;
    }
    const repo = await github.createRepo(token, name, isPrivate);
    setRepos((current) => [repo, ...current]);
    setSelectedRepo(repo.full_name);
    toast.success(`تم إنشاء ${repo.full_name}`);
  }, [token]);

  const handleCreateBranch = useCallback(async (branch: string) => {
    if (!token || !selectedRepoObj || !selectedBranch) {
      return;
    }
    await github.createBranch(token, selectedRepoObj.owner.login, selectedRepoObj.name, branch, selectedBranch);
    setBranches((current) => [{ name: branch }, ...current]);
    setSelectedBranch(branch);
    toast.success(`تم إنشاء الفرع ${branch}`);
  }, [selectedBranch, selectedRepoObj, token]);

  useEffect(() => {
    if (!selectedRepoObj || !token) {
      setBranches([]);
      setSelectedBranch("");
      return;
    }
    void loadBranches(selectedRepoObj);
  }, [loadBranches, selectedRepoObj, token]);

  const handleSelectRepo = (fullName: string) => {
    setSelectedRepo(fullName);
    setBranches([]);
    setSelectedBranch("");
  };

  const handleChangeFile = useCallback((path: string, content: string) => {
    setWorkspaceFiles((current) =>
      current.map((file) => (file.path === path ? { ...file, content } : file)),
    );
  }, []);

  const handleRenameFile = useCallback((path: string, nextPath: string) => {
    setWorkspaceFiles((current) =>
      current.map((file) => (file.path === path ? { ...file, path: nextPath } : file)),
    );
    if (activeFilePath === path) {
      setActiveFilePath(nextPath);
    }
  }, [activeFilePath]);

  const handleSaveFile = useCallback(async (path: string, content: string, message: string) => {
    if (!token || !selectedRepoObj || !selectedBranch) {
      toast.error("اختر مستودعاً وفرعاً قبل الحفظ.");
      return "";
    }

    const file = workspaceFiles.find((entry) => entry.path === path);
    try {
      if (!file?.sha) {
        try {
          const remoteFile = await github.getFile(token, selectedRepoObj.owner.login, selectedRepoObj.name, path, selectedBranch);
          if (remoteFile?.sha) {
            toast.error("الملف موجود على GitHub بالفعل. افتحه أولاً أو حدّث مساحة العمل قبل الكتابة فوقه.");
            return "";
          }
        } catch {
          // File does not exist remotely. Safe to continue.
        }
      }

      const response = await github.uploadFile(
        token,
        selectedRepoObj.owner.login,
        selectedRepoObj.name,
        path,
        content,
        message,
        selectedBranch,
        file?.sha,
      );
      setWorkspaceFiles((current) =>
        current.map((entry) =>
          entry.path === path
            ? {
                ...entry,
                sha: response.content?.sha ?? entry.sha,
                originalContent: content,
                content,
              }
            : entry,
        ),
      );
      const rawUrl = `https://raw.githubusercontent.com/${selectedRepoObj.full_name}/${selectedBranch}/${path}`;
      toast.success(`تم حفظ ${path} على ${selectedBranch}`);
      return rawUrl;
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "تعذر حفظ الملف.");
      return "";
    }
  }, [selectedBranch, selectedRepoObj, token, workspaceFiles]);

  const restoreCommitVersion = useCallback((content: string, sha: string) => {
    setWorkspaceFiles((current) =>
      current.map((file) =>
        file.path === activeFilePath
          ? {
              ...file,
              content,
              sha: file.sha ?? sha,
            }
          : file,
      ),
    );
    toast.info("تم تحميل هذه النسخة إلى المحرر. احفظها إذا أردت commit جديد.");
  }, [activeFilePath]);

  const createModuleWorkspace = useCallback(() => {
    setWorkspaceFiles(MODULE_WORKSPACE.map((file) => ({ ...file })));
    setActiveFilePath("main.lua");
    toast.success("تم تجهيز main.lua / utils.lua / config.lua");
  }, []);

  const surfaceStyle = isMobile
    ? "space-y-4"
    : "grid gap-4 xl:grid-cols-[360px_minmax(0,1fr)]";

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(0,212,255,0.16),transparent_36%),linear-gradient(180deg,#07111f_0%,#09101b_30%,#05070f_100%)] px-4 py-4 md:px-8 md:py-8">
      <div className="mx-auto max-w-[1500px] space-y-4">
        <section className="overflow-hidden rounded-[32px] border border-white/10 bg-[linear-gradient(135deg,rgba(4,14,27,0.95),rgba(14,22,40,0.88))] p-5 shadow-[0_28px_120px_rgba(0,0,0,0.34)] md:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-xs uppercase tracking-[0.22em] text-cyan-200">
                <Sparkles className="h-3.5 w-3.5" />
                Lua Forge Cloud
              </div>
              <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white md:text-5xl">
                محرر Roblox Lua احترافي مع GitHub وDiff وModules وتحليل مباشر
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 md:text-base">
                التطبيق صار مساحة عمل واحدة تجمع Monaco Editor وIntelliSense خاص بـ Roblox وتحليل فوري للأخطاء
                وسجل commits وفروع GitHub وLoader generator متجاوب للجوال والتابلت والكمبيوتر.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                <div className="flex items-center gap-2 text-sm font-medium text-white">
                  <MonitorSmartphone className="h-4 w-4 text-cyan-300" />
                  Adaptive UI
                </div>
                <p className="mt-2 text-xs text-slate-300">Layouts مختلفة للموبايل والتابلت والديسكتوب.</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                <div className="flex items-center gap-2 text-sm font-medium text-white">
                  <Github className="h-4 w-4 text-cyan-300" />
                  GitHub Deep Link
                </div>
                <p className="mt-2 text-xs text-slate-300">Branches, commit history, overwrite protection, direct editing.</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                <div className="flex items-center gap-2 text-sm font-medium text-white">
                  <Wand2 className="h-4 w-4 text-cyan-300" />
                  Auto Fix Flow
                </div>
                <p className="mt-2 text-xs text-slate-300">تصحيح سريع للأخطاء الشائعة وتحسينات تحليلية في نفس الواجهة.</p>
              </div>
            </div>
          </div>
        </section>

        <div className={surfaceStyle}>
          <div className="space-y-4">
            <section className="rounded-[28px] border border-border bg-card/95 p-4 md:p-5">
              <TokenInput
                onConnect={handleConnect}
                onDisconnect={handleDisconnect}
                isConnected={!!token}
                username={username}
              />
              {token ? <div className="mt-3"><ScopeChecker scopes={scopes} /></div> : null}
            </section>

            {token ? (
              <section className="rounded-[28px] border border-border bg-card/95 p-4 md:p-5">
                <RepoManager
                  repos={repos}
                  branches={branches}
                  selectedRepo={selectedRepo}
                  selectedBranch={selectedBranch}
                  onSelectRepo={handleSelectRepo}
                  onSelectBranch={setSelectedBranch}
                  onCreateRepo={handleCreateRepo}
                  onCreateBranch={handleCreateBranch}
                  onRefresh={handleRefreshRepos}
                  loading={loadingRepos}
                  branchLoading={loadingBranches}
                />
              </section>
            ) : null}

            {token && selectedRepoObj && selectedBranch ? (
              <section className="rounded-[28px] border border-border bg-card/95 p-4 md:p-5">
                <FileBrowser
                  token={token}
                  owner={selectedRepoObj.owner.login}
                  repo={selectedRepoObj.name}
                  branch={selectedBranch}
                  onEditFile={upsertWorkspaceFile}
                />
              </section>
            ) : null}

            {token && selectedRepoObj && activeFilePath ? (
              <section className="rounded-[28px] border border-border bg-card/95 p-4 md:p-5">
                <VersionHistory
                  token={token}
                  owner={selectedRepoObj.owner.login}
                  repo={selectedRepoObj.name}
                  branch={selectedBranch}
                  filePath={activeFilePath}
                  onRestore={restoreCommitVersion}
                />
              </section>
            ) : null}

            <section className="rounded-[28px] border border-border bg-card/95 p-4 md:p-5">
              <div className="flex items-start gap-3">
                <Blocks className="mt-1 h-4 w-4 text-primary" />
                <div>
                  <p className="text-sm font-semibold">Execution Notes</p>
                  <p className="text-xs text-muted-foreground">
                    التحليل الحالي Live داخل الواجهة. تكامل Lua Language Server الحقيقي يحتاج worker أو backend
                    مخصص لنفس المحرك، لذلك تم وضع بديل تحليلي مباشر الآن داخل التطبيق.
                  </p>
                </div>
              </div>
            </section>
          </div>

          <section>
            <CodeEditor
              workspaceFiles={workspaceFiles}
              activeFilePath={activeFilePath}
              selectedBranch={selectedBranch}
              selectedRepo={selectedRepoObj ? { owner: selectedRepoObj.owner.login, name: selectedRepoObj.name } : undefined}
              disabled={!token || !selectedRepo || !selectedBranch}
              onSelectFile={setActiveFilePath}
              onChangeFile={handleChangeFile}
              onRenameFile={handleRenameFile}
              onSaveFile={handleSaveFile}
              onCreateModuleWorkspace={createModuleWorkspace}
            />
          </section>
        </div>
      </div>
    </div>
  );
};

export default Index;
