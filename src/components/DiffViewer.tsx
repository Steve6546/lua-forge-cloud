import { useMemo } from "react";
import { motion } from "framer-motion";
import { GitCompareArrows } from "lucide-react";

interface DiffViewerProps {
  oldCode: string;
  newCode: string;
  fileName: string;
}

interface DiffLine {
  type: "added" | "removed" | "unchanged";
  content: string;
  oldNum?: number;
  newNum?: number;
}

function computeDiff(oldText: string, newText: string): DiffLine[] {
  const oldLines = oldText.split("\n");
  const newLines = newText.split("\n");
  const result: DiffLine[] = [];

  // Simple LCS-based diff
  const m = oldLines.length;
  const n = newLines.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = oldLines[i - 1] === newLines[j - 1]
        ? dp[i - 1][j - 1] + 1
        : Math.max(dp[i - 1][j], dp[i][j - 1]);
    }
  }

  let i = m, j = n;
  const stack: DiffLine[] = [];
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldLines[i - 1] === newLines[j - 1]) {
      stack.push({ type: "unchanged", content: oldLines[i - 1], oldNum: i, newNum: j });
      i--; j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      stack.push({ type: "added", content: newLines[j - 1], newNum: j });
      j--;
    } else {
      stack.push({ type: "removed", content: oldLines[i - 1], oldNum: i });
      i--;
    }
  }

  return stack.reverse();
}

const DiffViewer = ({ oldCode, newCode, fileName }: DiffViewerProps) => {
  const diff = useMemo(() => computeDiff(oldCode, newCode), [oldCode, newCode]);
  const hasChanges = diff.some((d) => d.type !== "unchanged");

  if (!hasChanges) {
    return (
      <div className="p-3 rounded-lg bg-secondary/50 border border-border text-center">
        <p className="text-xs font-mono text-muted-foreground">لا توجد تغييرات</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className="rounded-lg border border-border overflow-hidden"
    >
      <div className="h-8 bg-secondary/80 flex items-center px-3 border-b border-border gap-2">
        <GitCompareArrows className="w-3.5 h-3.5 text-primary" />
        <span className="text-xs font-mono text-muted-foreground">مقارنة: {fileName}</span>
      </div>
      <div className="max-h-60 overflow-auto bg-[#0d1117] font-mono text-xs">
        {diff.map((line, idx) => (
          <div
            key={idx}
            className={`flex ${
              line.type === "added"
                ? "bg-primary/10"
                : line.type === "removed"
                ? "bg-destructive/10"
                : ""
            }`}
          >
            <span className="w-8 text-right px-1 text-muted-foreground/40 select-none shrink-0 border-r border-border/30">
              {line.oldNum || ""}
            </span>
            <span className="w-8 text-right px-1 text-muted-foreground/40 select-none shrink-0 border-r border-border/30">
              {line.newNum || ""}
            </span>
            <span
              className={`px-2 flex-1 ${
                line.type === "added"
                  ? "text-primary"
                  : line.type === "removed"
                  ? "text-destructive"
                  : "text-foreground/70"
              }`}
            >
              {line.type === "added" ? "+ " : line.type === "removed" ? "- " : "  "}
              {line.content}
            </span>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

export default DiffViewer;
