import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Copy, Check, Zap, Shield, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface SmartLoaderProps {
  rawUrl: string;
}

type LoaderType = "basic" | "protected" | "auto-update";

const SmartLoader = ({ rawUrl }: SmartLoaderProps) => {
  const [copied, setCopied] = useState<string | null>(null);
  const [activeType, setActiveType] = useState<LoaderType>("basic");

  if (!rawUrl) return null;

  const loaders: Record<LoaderType, { label: string; icon: any; code: string }> = {
    basic: {
      label: "أساسي",
      icon: Zap,
      code: `loadstring(game:HttpGet("${rawUrl}"))()`,
    },
    protected: {
      label: "محمي",
      icon: Shield,
      code: `local ok, err = pcall(function()\n    loadstring(game:HttpGet("${rawUrl}"))()\nend)\nif not ok then warn("[Error]: " .. tostring(err)) end`,
    },
    "auto-update": {
      label: "تحديث",
      icon: RefreshCw,
      code: `local function load()\n    local ok, err = pcall(function()\n        loadstring(game:HttpGet("${rawUrl}?t=" .. tick()))()\n    end)\n    if not ok then warn(err); task.wait(5); load() end\nend\nload()`,
    },
  };

  const copyCode = (code: string, key: string) => {
    navigator.clipboard.writeText(code);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Zap className="w-3.5 h-3.5 text-warning" />
        <span>كود التحميل</span>
      </div>

      <div className="flex gap-1">
        {(Object.keys(loaders) as LoaderType[]).map((type) => {
          const l = loaders[type];
          const Icon = l.icon;
          return (
            <button
              key={type}
              onClick={() => setActiveType(type)}
              className={`flex-1 flex items-center justify-center gap-1 px-2 py-1 rounded text-[10px] transition-colors ${
                activeType === type
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="w-2.5 h-2.5" />
              {l.label}
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeType}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="relative"
        >
          <pre className="text-[10px] font-mono text-warning bg-muted p-2 rounded overflow-x-auto border border-border">
            {loaders[activeType].code}
          </pre>
          <Button
            variant="ghost"
            size="sm"
            className="absolute top-1 right-1 h-5 w-5 p-0"
            onClick={() => copyCode(loaders[activeType].code, activeType)}
          >
            {copied === activeType ? <Check className="w-2.5 h-2.5 text-primary" /> : <Copy className="w-2.5 h-2.5" />}
          </Button>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default SmartLoader;
