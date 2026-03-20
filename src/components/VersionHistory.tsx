import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { decodeBase64Utf8 } from "@/lib/base64";
import * as github from "@/lib/github-api";
import { toast } from "sonner";
import { History, Loader2, RotateCcw } from "lucide-react";

interface Commit {
  sha: string;
  commit: {
    message: string;
    author: {
      name: string;
      date: string;
    };
  };
}

interface VersionHistoryProps {
  token: string;
  owner: string;
  repo: string;
  branch: string;
  filePath: string;
  onRestore: (content: string, sha: string) => void;
}

const VersionHistory = ({ token, owner, repo, branch, filePath, onRestore }: VersionHistoryProps) => {
  const [commits, setCommits] = useState<Commit[]>([]);
  const [loading, setLoading] = useState(false);
  const [restoring, setRestoring] = useState<string | null>(null);

  useEffect(() => {
    if (!filePath || !branch) {
      setCommits([]);
      return;
    }

    setLoading(true);
    github
      .listCommits(token, owner, repo, filePath, branch)
      .then((data) => setCommits(Array.isArray(data) ? data.slice(0, 12) : []))
      .catch(() => setCommits([]))
      .finally(() => setLoading(false));
  }, [branch, filePath, owner, repo, token]);

  const handleRestore = async (sha: string) => {
    setRestoring(sha);
    try {
      const data = await github.getCommitFile(token, owner, repo, filePath, sha);
      onRestore(decodeBase64Utf8(data.content ?? ""), data.sha ?? sha);
      toast.success("تم استرجاع هذه النسخة إلى مساحة العمل.");
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "تعذر استرجاع هذه النسخة.");
    } finally {
      setRestoring(null);
    }
  };

  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm font-semibold text-foreground flex items-center gap-2">
          <History className="h-4 w-4 text-primary" />
          Commit History
        </p>
        <p className="text-xs text-muted-foreground font-mono">{filePath || "اختر ملفاً لرؤية تاريخه"}</p>
      </div>

      <div className="rounded-2xl border border-border bg-secondary/20 p-2">
        {loading ? (
          <div className="flex min-h-36 items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        ) : commits.length === 0 ? (
          <div className="grid min-h-36 place-items-center text-sm text-muted-foreground">
            لا يوجد سجل تعديلات لهذا الملف على الفرع الحالي.
          </div>
        ) : (
          <div className="space-y-2">
            {commits.map((commit) => (
              <div
                key={commit.sha}
                className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-background/40 px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{commit.commit.message}</p>
                  <p className="truncate text-[11px] text-muted-foreground font-mono">
                    {commit.commit.author.name} • {new Date(commit.commit.author.date).toLocaleString("ar")}
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={() => handleRestore(commit.sha)} disabled={restoring === commit.sha}>
                  {restoring === commit.sha ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default VersionHistory;
