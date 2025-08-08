import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { setCookie } from "@/lib/cookies";
import { AUTH_TOKEN_KEY, AUTH_NAME_KEY, AUTH_GROUP_KEY, AUTH_EXPIRES_AT_KEY } from "@/lib/auth";

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await fetch("http://localhost:8080/auth/login", {
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
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Login</CardTitle>
          <CardDescription className="text-center">
            Masuk ke sistem monitoring lisensi aset
          </CardDescription>
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
              />
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? "Memproses..." : "Login"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
