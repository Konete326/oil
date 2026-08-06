import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginUserApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LogoIcon } from "@/components/logo";
import { MailIcon, LockIcon, CheckCircle2Icon, AlertCircleIcon, ArrowRightIcon } from "lucide-react";

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const PASSWORD_REGEX = /^.{6,}$/;

export function LoginPage({ onLoginSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailTouched, setEmailTouched] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");
  const navigate = useNavigate();

  const isEmailValid = EMAIL_REGEX.test(email);
  const isPasswordValid = PASSWORD_REGEX.test(password);
  const isFormValid = isEmailValid && isPasswordValid;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setEmailTouched(true);
    setPasswordTouched(true);

    if (!isFormValid) return;

    setLoading(true);
    setApiError("");

    try {
      const user = await loginUserApi(email, password);
      if (onLoginSuccess) onLoginSuccess(user);
      navigate("/");
    } catch (err) {
      setApiError(err.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  const fillDefaultCredentials = () => {
    setEmail("admin@gmail.com");
    setPassword("admin123");
    setEmailTouched(true);
    setPasswordTouched(true);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background p-4 relative overflow-hidden">
      <div className="w-full max-w-md space-y-6 rounded-2xl border border-border bg-card p-8 shadow-2xl z-10">
        <div className="text-center space-y-2">
          <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-primary/10">
            <LogoIcon className="size-7" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Welcome to EliteDev</h1>
          <p className="text-xs text-muted-foreground">Enter your credentials to access the Oil Management Portal.</p>
        </div>

        {apiError && (
          <div className="rounded-lg bg-destructive/15 border border-destructive/30 p-3 text-xs text-destructive flex items-center gap-2">
            <AlertCircleIcon className="size-4 shrink-0" />
            <span>{apiError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="space-y-1">
            <label className="font-medium text-foreground flex items-center justify-between">
              <span>Email Address</span>
              {emailTouched && (
                <span className={`text-[10px] ${isEmailValid ? "text-emerald-500" : "text-destructive"}`}>
                  {isEmailValid ? "Valid Email" : "Invalid Email Format"}
                </span>
              )}
            </label>
            <div className="relative">
              <MailIcon className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
              <Input
                type="email"
                placeholder="admin@gmail.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (!emailTouched) setEmailTouched(true);
                }}
                onBlur={() => setEmailTouched(true)}
                className={`ps-9 pe-9 text-xs transition-colors ${
                  emailTouched ? (isEmailValid ? "border-emerald-500/60 focus-visible:ring-emerald-500" : "border-destructive focus-visible:ring-destructive") : ""
                }`}
                required
              />
              {emailTouched && (
                <div className="absolute right-3 top-2.5">
                  {isEmailValid ? (
                    <CheckCircle2Icon className="size-4 text-emerald-500" />
                  ) : (
                    <AlertCircleIcon className="size-4 text-destructive" />
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-medium text-foreground flex items-center justify-between">
              <span>Password</span>
              {passwordTouched && (
                <span className={`text-[10px] ${isPasswordValid ? "text-emerald-500" : "text-destructive"}`}>
                  {isPasswordValid ? "Min 6 Characters" : "At least 6 characters"}
                </span>
              )}
            </label>
            <div className="relative">
              <LockIcon className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (!passwordTouched) setPasswordTouched(true);
                }}
                onBlur={() => setPasswordTouched(true)}
                className={`ps-9 pe-9 text-xs transition-colors ${
                  passwordTouched ? (isPasswordValid ? "border-emerald-500/60 focus-visible:ring-emerald-500" : "border-destructive focus-visible:ring-destructive") : ""
                }`}
                required
              />
              {passwordTouched && (
                <div className="absolute right-3 top-2.5">
                  {isPasswordValid ? (
                    <CheckCircle2Icon className="size-4 text-emerald-500" />
                  ) : (
                    <AlertCircleIcon className="size-4 text-destructive" />
                  )}
                </div>
              )}
            </div>
          </div>

          <Button
            type="submit"
            className="w-full h-10 gap-2 text-xs font-semibold cursor-pointer shadow-xs"
            disabled={loading || (emailTouched && passwordTouched && !isFormValid)}
          >
            {loading ? "Signing in..." : "Sign In to Dashboard"}
            <ArrowRightIcon className="size-4" />
          </Button>
        </form>

        <div className="pt-4 border-t border-border text-center space-y-2">
          <p className="text-[11px] text-muted-foreground">Demo Credentials:</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={fillDefaultCredentials}
            className="text-xs gap-1.5 cursor-pointer"
          >
            Use Demo Credentials (admin@gmail.com / admin123)
          </Button>
        </div>
      </div>
    </div>
  );
}
