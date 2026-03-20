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

  const loaders: Record<LoaderType, { label: string; icon: any; code: string; desc: string }> = {
    basic: {
      label: "أساسي",
      icon: Zap,
      desc: "تشغيل مباشر",
      code: `loadstring(game:HttpGet("${rawUrl}"))()`,
    },
    protected: {
      label: "محمي",
      icon: Shield,
      desc: "مع حماية من الأخطاء",
      code: `local success, err = pcall(function()
    loadstring(game:HttpGet("${rawUrl}"))()
end)
if not success then
    warn("[Loader Error]: " .. tostring(err))
end`,
    },
    "auto-update": {
      label: "تحديث تلقائي",
      icon: RefreshCw,
      desc: "يتحقق من التحديثات",
      code: `-- Auto Update Loader
local VERSION_URL = "${rawUrl}"
local function loadScript()
    local success, err = pcall(function()
        local code = game:HttpGet(VERSION_URL .. "?t=" .. tick())
        loadstring(code)()
    end)
    if not success then
        warn("[Auto-Loader]: " .. tostring(err))
        task.wait(5)
        loadScript()
    end
end
loadScript()`,
    },
  };

  const copyCode = (code: string, key: string) => {
    navigator.clipboard.writeText(code);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const active = loaders[activeType];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-3"
    >
      <label className="text-sm font-mono text-muted-foreground flex items-center gap-2">
        <Zap className="w-4 h-4 text-warning" />
        نظام التحميل الذكي
      </label>

      {/* Loader type tabs */}
      <div className="flex gap-1 p-1 rounded-lg bg-muted border border-border">
        {(Object.keys(loaders) as LoaderType[]).map((type) => {
          const l = loaders[type];
          const Icon = l.icon;
          return (
            <button
              key={type}
              onClick={() => setActiveType(type)}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono transition-all ${
                activeType === type
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              }`}
            >
              <Icon className="w-3 h-3" />
              {l.label}
            </button>
          );
        })}
      </div>

      {/* Active loader code */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeType}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -5 }}
          className="space-y-2"
        >
          <p className="text-[10px] font-mono text-muted-foreground/60">{active.desc}</p>
          <div className="relative">
            <pre className="text-xs font-mono text-warning bg-muted p-3 rounded-lg overflow-x-auto border border-border">
              {active.code}
            </pre>
            <Button
              variant="outline"
              size="sm"
              className="absolute top-2 right-2 h-6 px-2"
              onClick={() => copyCode(active.code, activeType)}
            >
              {copied === activeType ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            </Button>
          </div>
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
};

export default SmartLoader;
