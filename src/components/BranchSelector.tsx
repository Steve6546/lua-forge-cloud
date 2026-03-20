import { useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GitBranch, Loader2 } from "lucide-react";
import * as github from "@/lib/github-api";
import { toast } from "sonner";

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
      .catch(() => {
        toast.error("خطأ في تحميل الفروع");
        setBranches([]);
      })
      .finally(() => setLoading(false));
  }, [token, owner, repo]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Loader2 className="w-3 h-3 animate-spin" />
        تحميل الفروع...
      </div>
    );
  }

  if (branches.length === 0) return null;

  return (
    <div className="flex items-center gap-2">
      <GitBranch className="w-3.5 h-3.5 text-primary shrink-0" />
      <Select value={selectedBranch} onValueChange={onSelectBranch}>
        <SelectTrigger className="bg-muted border-border font-mono h-8 text-xs max-w-[180px]">
          <SelectValue placeholder="اختر فرع..." />
        </SelectTrigger>
        <SelectContent className="bg-popover border-border">
          {branches.map((b) => (
            <SelectItem key={b} value={b} className="font-mono text-xs">
              {b}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default BranchSelector;
