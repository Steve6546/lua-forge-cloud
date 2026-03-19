import { CheckCircle2, XCircle, ShieldCheck } from "lucide-react";

interface ScopeCheckerProps {
  scopes: string;
}

const REQUIRED_SCOPES = ["repo"];
const RECOMMENDED_SCOPES = ["repo", "delete_repo"];

const ScopeChecker = ({ scopes }: ScopeCheckerProps) => {
  if (!scopes) return null;

  const scopeList = scopes.split(",").map((s) => s.trim()).filter(Boolean);
  const hasAll = REQUIRED_SCOPES.every((s) => scopeList.includes(s));

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <ShieldCheck className="w-4 h-4 text-primary" />
        <span className="text-xs font-mono text-muted-foreground">صلاحيات المفتاح:</span>
      </div>
      <div className="flex flex-wrap gap-1">
        {RECOMMENDED_SCOPES.map((scope) => {
          const has = scopeList.includes(scope);
          return (
            <span
              key={scope}
              className={`text-[10px] font-mono px-2 py-0.5 rounded-full flex items-center gap-1 ${
                has
                  ? "bg-primary/10 text-primary"
                  : "bg-destructive/10 text-destructive"
              }`}
            >
              {has ? <CheckCircle2 className="w-2.5 h-2.5" /> : <XCircle className="w-2.5 h-2.5" />}
              {scope}
            </span>
          );
        })}
      </div>
      {!hasAll && (
        <p className="text-[10px] font-mono text-destructive">
          ⚠️ المفتاح يحتاج صلاحية repo لإنشاء المستودعات ورفع الملفات
        </p>
      )}
    </div>
  );
};

export default ScopeChecker;
