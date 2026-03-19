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
import { FolderGit2, Plus, Loader2, RefreshCw } from "lucide-react";

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

const RepoManager = ({
  repos,
  selectedRepo,
  onSelectRepo,
  onCreateRepo,
  onRefresh,
  loading,
}: RepoManagerProps) => {
  const [newRepoName, setNewRepoName] = useState("");
  const [creating, setCreating] = useState(false);
  const [showCreate, setShowCreate] = useState(false);

  const handleCreate = async () => {
    if (!newRepoName.trim()) return;
    setCreating(true);
    try {
      await onCreateRepo(newRepoName.trim(), false);
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
                {repo.full_name} {repo.private ? "🔒" : ""}
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
        <div className="flex gap-2 p-3 rounded-md bg-muted border border-border">
          <Input
            placeholder="اسم المستودع الجديد"
            value={newRepoName}
            onChange={(e) => setNewRepoName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            className="font-mono bg-secondary border-border"
          />
          <Button onClick={handleCreate} disabled={!newRepoName.trim() || creating}>
            {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : "إنشاء"}
          </Button>
        </div>
      )}
    </div>
  );
};

export default RepoManager;
