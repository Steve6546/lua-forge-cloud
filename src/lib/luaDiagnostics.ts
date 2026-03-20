export type WorkspaceFile = {
  path: string;
  content: string;
};

export type DiagnosticSeverity = "error" | "warning" | "info";

export type DiagnosticIssue = {
  code: string;
  severity: DiagnosticSeverity;
  message: string;
  line: number;
  startColumn: number;
  endColumn: number;
  hint?: string;
};

export type WorkspaceAnalysis = {
  issues: DiagnosticIssue[];
  summary: {
    errors: number;
    warnings: number;
    infos: number;
    unusedLocals: string[];
    deprecatedCalls: string[];
    moduleImports: string[];
  };
};

const LOCAL_DECLARATION_REGEX = /\blocal\s+([A-Za-z_][A-Za-z0-9_]*)/g;
const IDENTIFIER_REGEX = /\b([A-Za-z_][A-Za-z0-9_]*)\b/g;
const MODULE_REQUIRE_REGEX = /require\s*\(\s*script\.Parent\.([A-Za-z_][A-Za-z0-9_]*)\s*\)/g;
const DEPRECATED_CALLS = [
  { pattern: /\bwait\s*\(/g, label: "wait()", hint: "Use task.wait() for better scheduler behavior." },
  { pattern: /\bspawn\s*\(/g, label: "spawn()", hint: "Use task.spawn() to avoid deferred execution surprises." },
  { pattern: /\bdelay\s*\(/g, label: "delay()", hint: "Use task.delay() instead of delay()." },
  { pattern: /\bloadstring\s*\(/g, label: "loadstring()", hint: "Dynamic execution is risky. Prefer structured module loading." },
];

const stripStringsAndComments = (line: string) => {
  const withoutComment = line.replace(/--.*$/g, "");
  return withoutComment.replace(/(["']).*?\1/g, "\"\"");
};

const getLineRange = (line: string) => ({
  startColumn: Math.max(1, line.search(/\S|$/) + 1),
  endColumn: Math.max(1, line.length + 1),
});

const pushIssue = (
  issues: DiagnosticIssue[],
  issue: Omit<DiagnosticIssue, "startColumn" | "endColumn"> & { startColumn?: number; endColumn?: number },
  sourceLine: string,
) => {
  const range = getLineRange(sourceLine);
  issues.push({
    startColumn: issue.startColumn ?? range.startColumn,
    endColumn: issue.endColumn ?? range.endColumn,
    ...issue,
  });
};

const detectBlockBalance = (lines: string[], issues: DiagnosticIssue[]) => {
  const stack: Array<{ token: string; line: number }> = [];

  lines.forEach((rawLine, index) => {
    const line = stripStringsAndComments(rawLine);
    const lineNumber = index + 1;

    if (/\brepeat\b/.test(line)) {
      stack.push({ token: "repeat", line: lineNumber });
    }

    if (/\b(function|then|do)\b/.test(line) || /\b(for|while)\b/.test(line)) {
      if (!/\bend\b/.test(line)) {
        const token = line.includes("function")
          ? "function"
          : line.includes("then")
            ? "if"
            : line.includes("for")
              ? "for"
              : line.includes("while")
                ? "while"
                : "do";
        stack.push({ token, line: lineNumber });
      }
    }

    if (/\buntil\b/.test(line)) {
      const repeatIndex = [...stack].reverse().findIndex((entry) => entry.token === "repeat");
      if (repeatIndex === -1) {
        pushIssue(issues, {
          code: "unexpected-until",
          severity: "error",
          message: "Found `until` without a matching `repeat` block.",
          line: lineNumber,
        }, rawLine);
      } else {
        stack.splice(stack.length - 1 - repeatIndex, 1);
      }
    }

    const endCount = (line.match(/\bend\b/g) ?? []).length;
    for (let count = 0; count < endCount; count += 1) {
      const last = stack.pop();
      if (!last || last.token === "repeat") {
        pushIssue(issues, {
          code: "unexpected-end",
          severity: "error",
          message: "Found `end` without a matching block opener.",
          line: lineNumber,
        }, rawLine);
        break;
      }
    }
  });

  stack.forEach((entry) => {
    pushIssue(issues, {
      code: "missing-end",
      severity: entry.token === "repeat" ? "error" : "warning",
      message: entry.token === "repeat"
        ? "Block opened with `repeat` is missing a closing `until`."
        : `Block opened here is missing a closing \`end\`.`,
      line: entry.line,
      hint: entry.token === "repeat" ? "Add `until condition` to close the loop." : "Add an `end` to close the block.",
    }, lines[entry.line - 1] ?? "");
  });
};

const detectBracketBalance = (lines: string[], issues: DiagnosticIssue[]) => {
  const pairs: Record<string, string> = { "(": ")", "[": "]", "{": "}" };
  const opening = new Set(Object.keys(pairs));
  const closing = new Map(Object.entries(pairs).map(([key, value]) => [value, key]));
  const stack: Array<{ char: string; line: number; column: number }> = [];

  lines.forEach((rawLine, lineIndex) => {
    const line = stripStringsAndComments(rawLine);
    for (let index = 0; index < line.length; index += 1) {
      const char = line[index];
      if (opening.has(char)) {
        stack.push({ char, line: lineIndex + 1, column: index + 1 });
      } else if (closing.has(char)) {
        const expected = closing.get(char);
        const last = stack.pop();
        if (!last || last.char !== expected) {
          issues.push({
            code: "unbalanced-bracket",
            severity: "error",
            message: `Unexpected closing \`${char}\`.`,
            line: lineIndex + 1,
            startColumn: index + 1,
            endColumn: index + 2,
          });
        }
      }
    }
  });

  stack.forEach((entry) => {
    issues.push({
      code: "unclosed-bracket",
      severity: "error",
      message: `Opening \`${entry.char}\` is never closed.`,
      line: entry.line,
      startColumn: entry.column,
      endColumn: entry.column + 1,
    });
  });
};

const detectIncompleteLines = (lines: string[], issues: DiagnosticIssue[]) => {
  lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("--")) {
      return;
    }

    if (/=\s*$/.test(trimmed) || /,\s*$/.test(trimmed) || /\b(local|return)\s*$/.test(trimmed)) {
      pushIssue(issues, {
        code: "incomplete-expression",
        severity: "error",
        message: "This line ends with an incomplete expression.",
        line: index + 1,
        hint: "Finish the assignment or remove the trailing operator.",
      }, line);
    }
  });
};

const detectUnusedLocals = (content: string, lines: string[], issues: DiagnosticIssue[]) => {
  const locals = new Map<string, number[]>();

  lines.forEach((line, index) => {
    let match: RegExpExecArray | null;
    LOCAL_DECLARATION_REGEX.lastIndex = 0;
    while ((match = LOCAL_DECLARATION_REGEX.exec(line)) !== null) {
      const name = match[1];
      if (!locals.has(name)) {
        locals.set(name, []);
      }
      locals.get(name)?.push(index + 1);
    }
  });

  return [...locals.keys()].filter((name) => {
    const occurrences = content.match(new RegExp(`\\b${name}\\b`, "g"))?.length ?? 0;
    if (occurrences <= 1) {
      const line = locals.get(name)?.[0] ?? 1;
      pushIssue(issues, {
        code: "unused-local",
        severity: "warning",
        message: `Local variable \`${name}\` is declared but never used.`,
        line,
        hint: "Remove it or use it to avoid stale state in the script.",
      }, lines[line - 1] ?? "");
      return true;
    }
    return false;
  });
};

const detectDeprecatedCalls = (lines: string[], issues: DiagnosticIssue[]) => {
  const deprecatedCalls: string[] = [];

  lines.forEach((line, index) => {
    DEPRECATED_CALLS.forEach(({ pattern, label, hint }) => {
      pattern.lastIndex = 0;
      if (pattern.test(line)) {
        deprecatedCalls.push(label);
        pushIssue(issues, {
          code: "deprecated-call",
          severity: label === "loadstring()" ? "warning" : "info",
          message: `Detected deprecated or risky call: ${label}`,
          line: index + 1,
          hint,
        }, line);
      }
    });
  });

  return [...new Set(deprecatedCalls)];
};

const detectNilAccess = (lines: string[], issues: DiagnosticIssue[]) => {
  const nilVariables = new Set<string>();

  lines.forEach((line, index) => {
    const nilAssignment = line.match(/\b(?:local\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*nil\b/);
    if (nilAssignment) {
      nilVariables.add(nilAssignment[1]);
    }

    nilVariables.forEach((name) => {
      const access = line.match(new RegExp(`\\b${name}\\.[A-Za-z_][A-Za-z0-9_]*`));
      if (access) {
        issues.push({
          code: "possible-nil-access",
          severity: "warning",
          message: `Possible nil access on \`${name}\`.`,
          line: index + 1,
          startColumn: access.index! + 1,
          endColumn: access.index! + access[0].length + 1,
          hint: "Guard the value before indexing it.",
        });
      }
    });
  });
};

const detectInfiniteLoops = (lines: string[], issues: DiagnosticIssue[]) => {
  lines.forEach((line, index) => {
    if (!/\bwhile\s+true\s+do\b/.test(line)) {
      return;
    }

    const nextChunk = lines.slice(index + 1, Math.min(lines.length, index + 10)).join("\n");
    const hasEscape = /\bbreak\b|\breturn\b|task\.wait\s*\(|wait\s*\(|RunService\.[A-Za-z]+:Wait\s*\(/.test(nextChunk);
    if (!hasEscape) {
      pushIssue(issues, {
        code: "possible-infinite-loop",
        severity: "warning",
        message: "Potential infinite loop detected.",
        line: index + 1,
        hint: "Add a yielding call, break condition, or return path.",
      }, line);
    }
  });
};

const detectLogicSuggestions = (lines: string[], issues: DiagnosticIssue[]) => {
  lines.forEach((line, index) => {
    if (/\bgame\.Players\b/.test(line)) {
      pushIssue(issues, {
        code: "service-localization",
        severity: "info",
        message: "Prefer `local Players = game:GetService(\"Players\")` for service access.",
        line: index + 1,
      }, line);
    }

    if (/\bprint\s*\(/.test(line) && /\bPlayerAdded\b/.test(lines.slice(Math.max(0, index - 2), index + 2).join("\n"))) {
      pushIssue(issues, {
        code: "logging-suggestion",
        severity: "info",
        message: "Consider using a tagged logger for player lifecycle events instead of bare print calls.",
        line: index + 1,
      }, line);
    }
  });
};

export const analyzeLuaWorkspace = (files: WorkspaceFile[], activePath: string): WorkspaceAnalysis => {
  const activeFile = files.find((file) => file.path === activePath);
  const content = activeFile?.content ?? "";
  const lines = content.split(/\r?\n/);
  const issues: DiagnosticIssue[] = [];

  detectBlockBalance(lines, issues);
  detectBracketBalance(lines, issues);
  detectIncompleteLines(lines, issues);
  detectNilAccess(lines, issues);
  detectInfiniteLoops(lines, issues);
  detectLogicSuggestions(lines, issues);

  const unusedLocals = detectUnusedLocals(content, lines, issues);
  const deprecatedCalls = detectDeprecatedCalls(lines, issues);

  const moduleImports = [...content.matchAll(MODULE_REQUIRE_REGEX)].map((match) => `${match[1]}.lua`);
  const workspacePaths = new Set(files.map((file) => file.path.split("/").pop()));

  moduleImports.forEach((moduleName, index) => {
    if (!workspacePaths.has(moduleName)) {
      issues.push({
        code: "missing-module",
        severity: "warning",
        message: `Required module \`${moduleName}\` is not present in the workspace.`,
        line: 1 + index,
        startColumn: 1,
        endColumn: 1 + moduleName.length,
        hint: "Create the module file or update the require path.",
      });
    }
  });

  return {
    issues,
    summary: {
      errors: issues.filter((issue) => issue.severity === "error").length,
      warnings: issues.filter((issue) => issue.severity === "warning").length,
      infos: issues.filter((issue) => issue.severity === "info").length,
      unusedLocals,
      deprecatedCalls,
      moduleImports,
    },
  };
};

export const applyAutoFixes = (content: string) =>
  content
    .replace(/\bwait\s*\(/g, "task.wait(")
    .replace(/\bspawn\s*\(/g, "task.spawn(")
    .replace(/\bdelay\s*\(/g, "task.delay(")
    .replace(/[ \t]+$/gm, "");
