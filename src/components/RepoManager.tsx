import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FolderGit2, Plus, Loader2, RefreshCw, AlertCircle, Lock, Globe } from "lucide-react";
import { Switch } from "@/components/ui/switch";

interface Repo {
  full_name: string;
  name: string;
  owner: { login: string };
  private: boolean;
}

interface RepoManagerProps {
  repos: Repo[];
  selectedRepo: string;
  onSelectRepo: (fullName: string) => void;
  onCreateRepo: (name: string, isPrivate: boolean) => Promise<void>;
  onRefresh: () => void;
  loading: boolean;
}

const REPO_NAME_REGEX = /^[a-zA-Z0-9._-]+$/;

const RepoManager = ({
  repos,
  selectedRepo,
  onSelectRepo,
  onCreateRepo,
  onRefresh,
  loading,
}: RepoManagerProps) => {
  const [newRepoName, setNewRepoName] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [nameError, setNameError] = useState("");

  const validateName = (name: string) => {
    if (!name.trim()) {
      setNameError("");
      return;
    }
    if (!REPO_NAME_REGEX.test(name)) {
      setNameError("الاسم يحتوي على أحرف غير مسموحة");
      return;
    }
    if (repos.some((r) => r.name.toLowerCase() === name.toLowerCase())) {
      setNameError("يوجد مستودع بنفس الاسم بالفعل");
      return;
    }
    setNameError("");
  };

  const handleNameChange = (val: string) => {
    setNewRepoName(val);
    validateName(val);
  };

  const handleCreate = async () => {
    if (!newRepoName.trim() || nameError) return;
    setCreating(true);
    try {
      await onCreateRepo(newRepoName.trim(), isPrivate);
      setNewRepoName("");
      setShowCreate(false);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-3">
      <label className="text-sm font-mono text-muted-foreground flex items-center gap-2">
        <FolderGit2 className="w-4 h-4 text-primary" />
        المستودعات (Repositories)
        <span className="text-xs text-muted-foreground/60">({repos.length})</span>
      </label>
      <div className="flex gap-2">
        <Select value={selectedRepo} onValueChange={onSelectRepo}>
          <SelectTrigger className="bg-muted border-border font-mono">
            <SelectValue placeholder="اختر مستودع..." />
          </SelectTrigger>
          <SelectContent className="bg-popover border-border max-h-60">
            {repos.map((repo) => (
              <SelectItem
                key={repo.full_name}
                value={repo.full_name}
                className="font-mono"
              >
                {repo.private ? "🔒" : "🌐"} {repo.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline" size="icon" onClick={onRefresh} disabled={loading}>
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </Button>
        <Button variant="outline" size="icon" onClick={() => setShowCreate(!showCreate)}>
          <Plus className="w-4 h-4" />
        </Button>
      </div>
      {showCreate && (
        <div className="p-3 rounded-md bg-muted border border-border space-y-3">
          <div className="flex gap-2">
            <Input
              placeholder="اسم المستودع الجديد"
              value={newRepoName}
              onChange={(e) => handleNameChange(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              className={`font-mono bg-secondary border-border ${nameError ? "border-destructive" : ""}`}
            />
            <Button onClick={handleCreate} disabled={!newRepoName.trim() || !!nameError || creating}>
              {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : "إنشاء"}
            </Button>
          </div>
          {nameError && (
            <p className="text-xs text-destructive font-mono flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {nameError}
            </p>
          )}
          <div className="flex items-center gap-2">
            <Switch checked={isPrivate} onCheckedChange={setIsPrivate} />
            <span className="text-xs font-mono text-muted-foreground flex items-center gap-1">
              {isPrivate ? <Lock className="w-3 h-3" /> : <Globe className="w-3 h-3" />}
              {isPrivate ? "خاص (Private)" : "عام (Public)"}
            </span>
          </div>
          <p className="text-xs text-muted-foreground font-mono">
            ⚠️ إذا ظهر خطأ 403، تأكد من صلاحية <span className="text-warning">repo</span> في المفتاح
          </p>
        </div>
      )}
    </div>
  );
};

export default RepoManager;
