import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, Wrench, BookOpen, Loader2, Copy, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

interface AiAssistantProps {
  code: string;
  onApplyCode: (code: string) => void;
}

type AiAction = "suggest" | "fix" | "explain";

const AiAssistant = ({ code, onApplyCode }: AiAssistantProps) => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [copied, setCopied] = useState(false);
  const [lastAction, setLastAction] = useState<AiAction | null>(null);

  const handleAction = async (action: AiAction) => {
    if (!code.trim()) {
      toast.error("اكتب كود أولاً");
      return;
    }
    setLoading(true);
    setLastAction(action);
    setResult("");
    try {
      const { data, error } = await supabase.functions.invoke("ai-assist", {
        body: { code, action },
      });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      setResult(data.result || "لا توجد نتيجة");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "خطأ في الذكاء الاصطناعي";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const extractCode = (text: string): string => {
    const match = text.match(/```(?:lua)?\n?([\s\S]*?)```/);
    return match ? match[1].trim() : text;
  };

  const handleApply = () => {
    const extracted = extractCode(result);
    onApplyCode(extracted);
    toast.success("تم تطبيق الكود");
    setResult("");
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(extractCode(result));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
        <Sparkles className="w-3.5 h-3.5 text-accent" />
        <span>مساعد AI</span>
      </div>

      <div className="flex gap-1.5 flex-wrap">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleAction("suggest")}
          disabled={loading}
          className="text-xs gap-1.5 h-7 border-border hover:bg-accent/10 hover:text-accent"
        >
          <Sparkles className="w-3 h-3" />
          اقتراح تحسينات
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleAction("fix")}
          disabled={loading}
          className="text-xs gap-1.5 h-7 border-border hover:bg-primary/10 hover:text-primary"
        >
          <Wrench className="w-3 h-3" />
          إصلاح الأخطاء
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleAction("explain")}
          disabled={loading}
          className="text-xs gap-1.5 h-7 border-border hover:bg-warning/10 hover:text-warning"
        >
          <BookOpen className="w-3 h-3" />
          شرح الكود
        </Button>
      </div>

      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-2 py-3 text-xs text-muted-foreground"
          >
            <Loader2 className="w-3.5 h-3.5 animate-spin text-accent" />
            <span>جاري التحليل...</span>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {result && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="rounded-lg border border-border bg-muted/50 overflow-hidden"
          >
            <div className="flex items-center justify-between px-3 py-1.5 bg-secondary/80 border-b border-border">
              <span className="text-[10px] font-mono text-muted-foreground">
                {lastAction === "suggest" ? "اقتراحات" : lastAction === "fix" ? "إصلاح" : "شرح"}
              </span>
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" onClick={handleCopy} className="h-5 px-1.5">
                  {copied ? <Check className="w-2.5 h-2.5 text-primary" /> : <Copy className="w-2.5 h-2.5" />}
                </Button>
              </div>
            </div>
            <pre className="p-3 text-xs font-mono text-foreground/90 overflow-auto max-h-52 whitespace-pre-wrap">
              {result}
            </pre>
            {lastAction !== "explain" && (
              <div className="px-3 py-2 border-t border-border bg-secondary/30">
                <Button
                  size="sm"
                  onClick={handleApply}
                  className="text-xs h-6 gap-1"
                >
                  <Check className="w-3 h-3" />
                  تطبيق الكود
                </Button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AiAssistant;
