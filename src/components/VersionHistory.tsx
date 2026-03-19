import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { History, Loader2, RotateCcw } from "lucide-react";
import * as github from "@/lib/github-api";
import { toast } from "sonner";

interface Commit {
  sha: string;
  commit: {
    message: string;
    author: { name: string; date: string };
  };
}

interface VersionHistoryProps {
  token: string;
  owner: string;
  repo: string;
  filePath: string;
  onRestore: (content: string) => void;
}

const VersionHistory = ({ token, owner, repo, filePath, onRestore }: VersionHistoryProps) => {
  const [commits, setCommits] = useState<Commit[]>([]);
  const [loading, setLoading] = useState(false);
  const [restoring, setRestoring] = useState<string | null>(null);

  useEffect(() => {
    if (!filePath) return;
    setLoading(true);
    github
      .listCommits(token, owner, repo, filePath)
      .then((data) => setCommits(Array.isArray(data) ? data.slice(0, 10) : []))
      .catch(() => setCommits([]))
      .finally(() => setLoading(false));
  }, [token, owner, repo, filePath]);

  const handleRestore = async (sha: string) => {
    setRestoring(sha);
    try {
      const data = await github.getCommitFile(token, owner, repo, filePath, sha);
      const content = decodeURIComponent(escape(atob(data.content.replace(/\n/g, ""))));
      onRestore(content);
      toast.success("تم استعادة النسخة القديمة في المحرر");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "خطأ في الاستعادة";
      toast.error(msg);
    } finally {
      setRestoring(null);
    }
  };

  if (!filePath) return null;

  return (
    <div className="space-y-3">
      <label className="text-sm font-mono text-muted-foreground flex items-center gap-2">
        <History className="w-4 h-4 text-primary" />
        سجل التعديلات
      </label>
      {loading ? (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="w-4 h-4 animate-spin text-primary" />
        </div>
      ) : commits.length === 0 ? (
        <p className="text-xs font-mono text-muted-foreground text-center py-2">لا يوجد تعديلات</p>
      ) : (
        <div className="space-y-1 max-h-48 overflow-y-auto">
          {commits.map((c) => (
            <div
              key={c.sha}
              className="flex items-center justify-between p-2 rounded-md hover:bg-secondary/50 transition-colors group"
            >
              <div className="min-w-0 flex-1">
                <p className="text-xs font-mono text-foreground truncate">{c.commit.message}</p>
                <p className="text-[10px] font-mono text-muted-foreground">
                  {c.commit.author.name} • {new Date(c.commit.author.date).toLocaleDateString("ar")}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleRestore(c.sha)}
                disabled={restoring === c.sha}
                className="h-7 px-2 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                {restoring === c.sha ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <RotateCcw className="w-3 h-3 text-accent" />
                )}
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default VersionHistory;
