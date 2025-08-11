import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { setCookie } from "@/lib/cookies";
import { AUTH_TOKEN_KEY, AUTH_NAME_KEY, AUTH_GROUP_KEY, AUTH_EXPIRES_AT_KEY } from "@/lib/auth";
import { useTheme } from "next-themes";

interface LoginFormProps {
  onLogin: () => void;
}

type LoginResponse = {
  name: string;
  group: string;
  token: string;
  expires: number; // seconds
};

export const LoginForm = ({ onLogin }: LoginFormProps) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { theme } = useTheme();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await fetch(`${import.meta.env.VITE_BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, directory: "pertamina" }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Login gagal");
      }

      const data = (await res.json()) as LoginResponse;

      const expiresAt = Date.now() + data.expires * 1000; // epoch ms

      // Simpan semua nilai response ke cookie
      setCookie(AUTH_TOKEN_KEY, data.token, { expires: new Date(expiresAt), path: "/" });
      setCookie(AUTH_NAME_KEY, data.name, { expires: new Date(expiresAt), path: "/" });
      setCookie(AUTH_GROUP_KEY, data.group, { expires: new Date(expiresAt), path: "/" });
      setCookie(AUTH_EXPIRES_AT_KEY, String(expiresAt), { expires: new Date(expiresAt), path: "/" });

      toast({
        title: "Login berhasil",
        description: `Selamat datang, ${data.name}`,
      });

      onLogin();
    } catch (error: any) {
      toast({
        title: "Login gagal",
        description: error?.message || "Silakan periksa kredensial Anda",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-secondary/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,theme(colors.primary/20),transparent_50%)] animate-pulse"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,theme(colors.secondary/20),transparent_50%)] animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_40%_80%,theme(colors.accent/10),transparent_50%)] animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>
      
      {/* Floating Elements */}
      <div className="absolute top-20 left-20 w-32 h-32 bg-primary/5 rounded-full blur-xl animate-bounce" style={{ animationDuration: '3s' }}></div>
      <div className="absolute top-40 right-32 w-24 h-24 bg-secondary/5 rounded-full blur-xl animate-bounce" style={{ animationDuration: '4s', animationDelay: '1s' }}></div>
      <div className="absolute bottom-32 left-32 w-20 h-20 bg-accent/5 rounded-full blur-xl animate-bounce" style={{ animationDuration: '5s', animationDelay: '2s' }}></div>
      
      <div className="relative z-10 w-full max-w-md p-4">
        <Card className="backdrop-blur-sm bg-card/95 border border-border/50 shadow-2xl">
          <CardHeader className="space-y-4 text-center">
            {/* Logo */}
            <div className="flex justify-center mb-4">
              <img 
                src={theme === 'dark' ? '/logo-dark.png' : '/logo-white.png'}
                alt="Lisensi Aset Logo"
                className="h-14 w-auto object-contain"
              />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold">Login</CardTitle>
              <CardDescription className="text-muted-foreground mt-2">
                Masuk ke sistem monitoring lisensi aset
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="ahmad.kafin-e"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="bg-background/50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-background/50"
                />
              </div>
              <Button
                type="submit"
                className="w-full mt-6 bg-primary hover:bg-primary/90 text-primary-foreground"
                disabled={isLoading}
              >
                {isLoading ? "Memproses..." : "Login"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
