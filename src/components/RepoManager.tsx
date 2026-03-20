import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { GitBranch, Globe, Loader2, Lock, Plus, RefreshCw, FolderGit2 } from "lucide-react";

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

interface RepoManagerProps {
  repos: Repo[];
  branches: Branch[];
  selectedRepo: string;
  selectedBranch: string;
  onSelectRepo: (fullName: string) => void;
  onSelectBranch: (branch: string) => void;
  onCreateRepo: (name: string, isPrivate: boolean) => Promise<void>;
  onCreateBranch: (branch: string) => Promise<void>;
  onRefresh: () => void;
  loading: boolean;
  branchLoading: boolean;
}

const REPO_NAME_REGEX = /^[a-zA-Z0-9._-]+$/;
const BRANCH_NAME_REGEX = /^(?!\/)(?!.*\/\/)(?!.*\.$)[A-Za-z0-9._\-/]+$/;

const RepoManager = ({
  repos,
  branches,
  selectedRepo,
  selectedBranch,
  onSelectRepo,
  onSelectBranch,
  onCreateRepo,
  onCreateBranch,
  onRefresh,
  loading,
  branchLoading,
}: RepoManagerProps) => {
  const [newRepoName, setNewRepoName] = useState("");
  const [newBranchName, setNewBranchName] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [creatingRepo, setCreatingRepo] = useState(false);
  const [creatingBranch, setCreatingBranch] = useState(false);

  const selectedRepoData = useMemo(
    () => repos.find((repo) => repo.full_name === selectedRepo),
    [repos, selectedRepo],
  );

  const repoNameError = useMemo(() => {
    if (!newRepoName.trim()) {
      return "";
    }
    if (!REPO_NAME_REGEX.test(newRepoName)) {
      return "اسم المستودع يحتوي أحرف غير مدعومة.";
    }
    if (repos.some((repo) => repo.name.toLowerCase() === newRepoName.toLowerCase())) {
      return "يوجد مستودع بنفس الاسم بالفعل.";
    }
    return "";
  }, [newRepoName, repos]);

  const branchNameError = useMemo(() => {
    if (!newBranchName.trim()) {
      return "";
    }
    if (!BRANCH_NAME_REGEX.test(newBranchName)) {
      return "اسم الفرع غير صالح.";
    }
    if (branches.some((branch) => branch.name === newBranchName.trim())) {
      return "الفرع موجود بالفعل.";
    }
    return "";
  }, [branches, newBranchName]);

  const handleCreateRepo = async () => {
    if (!newRepoName.trim() || repoNameError) {
      return;
    }

    setCreatingRepo(true);
    try {
      await onCreateRepo(newRepoName.trim(), isPrivate);
      setNewRepoName("");
    } finally {
      setCreatingRepo(false);
    }
  };

  const handleCreateBranch = async () => {
    if (!newBranchName.trim() || branchNameError) {
      return;
    }

    setCreatingBranch(true);
    try {
      await onCreateBranch(newBranchName.trim());
      setNewBranchName("");
    } finally {
      setCreatingBranch(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-foreground flex items-center gap-2">
            <FolderGit2 className="h-4 w-4 text-primary" />
            التحكم بالمستودع
          </p>
          <p className="text-xs text-muted-foreground">
            اختر المستودع والفرع واشتغل مثل بيئة تحرير حقيقية.
          </p>
        </div>
        <Button variant="outline" size="icon" onClick={onRefresh} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      <div className="grid gap-3 md:grid-cols-[1.6fr_1fr]">
        <Select value={selectedRepo} onValueChange={onSelectRepo}>
          <SelectTrigger className="bg-secondary/70 font-mono">
            <SelectValue placeholder="اختر مستودع GitHub" />
          </SelectTrigger>
          <SelectContent className="max-h-64">
            {repos.map((repo) => (
              <SelectItem key={repo.full_name} value={repo.full_name} className="font-mono">
                {repo.private ? "Private" : "Public"} / {repo.full_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedBranch} onValueChange={onSelectBranch} disabled={!selectedRepo || branchLoading}>
          <SelectTrigger className="bg-secondary/70 font-mono">
            <SelectValue placeholder={branchLoading ? "جاري تحميل الفروع..." : "اختر الفرع"} />
          </SelectTrigger>
          <SelectContent className="max-h-64">
            {branches.map((branch) => (
              <SelectItem key={branch.name} value={branch.name} className="font-mono">
                {branch.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-3 xl:grid-cols-2">
        <div className="rounded-2xl border border-border bg-secondary/30 p-3 space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Plus className="h-4 w-4 text-primary" />
            إنشاء مستودع جديد
          </div>
          <div className="flex gap-2">
            <Input
              value={newRepoName}
              onChange={(event) => setNewRepoName(event.target.value)}
              placeholder="lua-forge-scripts"
              className="font-mono"
            />
            <Button onClick={handleCreateRepo} disabled={!newRepoName.trim() || !!repoNameError || creatingRepo}>
              {creatingRepo ? <Loader2 className="h-4 w-4 animate-spin" /> : "إنشاء"}
            </Button>
          </div>
          {repoNameError ? <p className="text-xs text-destructive">{repoNameError}</p> : null}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Switch checked={isPrivate} onCheckedChange={setIsPrivate} />
            {isPrivate ? <Lock className="h-3 w-3" /> : <Globe className="h-3 w-3" />}
            {isPrivate ? "Private repository" : "Public repository"}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-secondary/30 p-3 space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <GitBranch className="h-4 w-4 text-primary" />
            إدارة الفروع
          </div>
          <div className="flex gap-2">
            <Input
              value={newBranchName}
              onChange={(event) => setNewBranchName(event.target.value)}
              placeholder={selectedRepo ? "feature/roblox-editor" : "اختر مستودع أولاً"}
              className="font-mono"
              disabled={!selectedRepo}
            />
            <Button
              onClick={handleCreateBranch}
              disabled={!selectedRepo || !newBranchName.trim() || !!branchNameError || creatingBranch}
            >
              {creatingBranch ? <Loader2 className="h-4 w-4 animate-spin" /> : "فرع جديد"}
            </Button>
          </div>
          {branchNameError ? <p className="text-xs text-destructive">{branchNameError}</p> : null}
          <p className="text-xs text-muted-foreground">
            الفرع الأساسي: <span className="font-mono text-foreground">{selectedRepoData?.default_branch ?? "-"}</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RepoManager;
