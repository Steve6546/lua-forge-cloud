import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { KeyRound, Loader2, CheckCircle2 } from "lucide-react";

interface TokenInputProps {
  onConnect: (token: string) => Promise<void>;
  isConnected: boolean;
  username: string;
}

const TokenInput = ({ onConnect, isConnected, username }: TokenInputProps) => {
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);

  const handleConnect = async () => {
    if (!token.trim()) return;
    setLoading(true);
    try {
      await onConnect(token.trim());
    } finally {
      setLoading(false);
    }
  };

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
          disabled={isConnected}
        />
        <Button
          onClick={handleConnect}
          disabled={!token.trim() || loading || isConnected}
          className="min-w-[120px]"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : isConnected ? (
            <>
              <CheckCircle2 className="w-4 h-4 mr-1" />
              متصل
            </>
          ) : (
            "اتصال"
          )}
        </Button>
      </div>
      {isConnected && (
        <p className="text-xs text-primary font-mono">
          ✓ متصل بحساب: <span className="text-accent">{username}</span>
        </p>
      )}
    </div>
  );
};

export default TokenInput;
