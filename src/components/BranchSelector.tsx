import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GitBranch, Loader2 } from "lucide-react";
import * as github from "@/lib/github-api";
import { useEffect } from "react";

interface BranchSelectorProps {
  token: string;
  owner: string;
  repo: string;
  selectedBranch: string;
  onSelectBranch: (branch: string) => void;
}

const BranchSelector = ({ token, owner, repo, selectedBranch, onSelectBranch }: BranchSelectorProps) => {
  const [branches, setBranches] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    github.listBranches(token, owner, repo)
      .then((data) => {
        const names = Array.isArray(data) ? data.map((b: any) => b.name) : [];
        setBranches(names);
        if (names.length > 0 && !selectedBranch) {
          const def = names.includes("main") ? "main" : names.includes("master") ? "master" : names[0];
          onSelectBranch(def);
        }
      })
      .catch(() => setBranches([]))
      .finally(() => setLoading(false));
  }, [token, owner, repo]);

  if (loading) {
    return <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />;
  }

  if (branches.length === 0) return null;

  return (
    <Select value={selectedBranch} onValueChange={onSelectBranch}>
      <SelectTrigger className="h-7 text-[10px] bg-muted border-border max-w-[120px] gap-1">
        <GitBranch className="w-3 h-3 shrink-0" />
        <SelectValue placeholder="branch" />
      </SelectTrigger>
      <SelectContent className="bg-popover border-border">
        {branches.map((b) => (
          <SelectItem key={b} value={b} className="text-xs font-mono">{b}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default BranchSelector;
