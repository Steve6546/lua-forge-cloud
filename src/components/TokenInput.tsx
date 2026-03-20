import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { KeyRound, Loader2, CheckCircle2, Settings, LogOut } from "lucide-react";

interface TokenInputProps {
  onConnect: (token: string) => Promise<void>;
  onDisconnect: () => void;
  isConnected: boolean;
  username: string;
}

const TOKEN_KEY = "github_pat_token";

const TokenInput = ({ onConnect, onDisconnect, isConnected, username }: TokenInputProps) => {
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Auto-connect from saved token
  useEffect(() => {
    const saved = localStorage.getItem(TOKEN_KEY);
    if (saved && !isConnected) {
      setToken(saved);
      setLoading(true);
      onConnect(saved).catch(() => {
        localStorage.removeItem(TOKEN_KEY);
      }).finally(() => setLoading(false));
    }
  }, [isConnected, onConnect]);

  const handleConnect = async () => {
    if (!token.trim()) return;
    setLoading(true);
    try {
      await onConnect(token.trim());
      localStorage.setItem(TOKEN_KEY, token.trim());
    } catch {
      localStorage.removeItem(TOKEN_KEY);
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = () => {
    localStorage.removeItem(TOKEN_KEY);
    setToken("");
    setShowSettings(false);
    onDisconnect();
  };

  if (isConnected && !showSettings) {
    return (
      <div className="flex items-center justify-between">
        <p className="text-sm text-primary font-mono flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          متصل بحساب: <span className="text-accent font-bold">{username}</span>
        </p>
        <Button variant="ghost" size="icon" onClick={() => setShowSettings(true)}>
          <Settings className="w-4 h-4 text-muted-foreground" />
        </Button>
      </div>
    );
  }

  if (isConnected && showSettings) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-mono text-muted-foreground flex items-center gap-2">
            <Settings className="w-4 h-4 text-primary" />
            إعدادات الاتصال
          </label>
          <Button variant="ghost" size="sm" onClick={() => setShowSettings(false)}>
            إغلاق
          </Button>
        </div>
        <p className="text-xs text-muted-foreground font-mono">
          الحساب: <span className="text-accent">{username}</span>
        </p>
        <Button variant="destructive" size="sm" onClick={handleDisconnect} className="gap-1">
          <LogOut className="w-3 h-3" />
          تغيير المفتاح
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <label className="text-sm font-mono text-muted-foreground flex items-center gap-2">
        <KeyRound className="w-4 h-4 text-primary" />
        GitHub Personal Access Token
      </label>
      <div className="flex gap-2">
        <Input
          type="password"
          placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleConnect()}
          className="font-mono bg-muted border-border focus:ring-primary"
        />
        <Button
          onClick={handleConnect}
          disabled={!token.trim() || loading}
          className="min-w-[120px]"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            "اتصال"
          )}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground font-mono">
        ⚠️ تأكد من تفعيل صلاحية <span className="text-warning">repo</span> في المفتاح لإنشاء المستودعات
      </p>
    </div>
  );
};

export default TokenInput;
