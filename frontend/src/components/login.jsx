import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { loginUserApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LogoIcon } from "@/components/logo";
import { MailIcon, LockIcon, CheckCircle2Icon, AlertCircleIcon, ArrowRightIcon, Loader2Icon, EyeIcon, EyeOffIcon } from "lucide-react";

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const PASSWORD_REGEX = /^.{6,}$/;

export function LoginPage({ onLoginSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailTouched, setEmailTouched] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
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

    try {
      const user = await loginUserApi(email, password);
      toast.success("Welcome back! Redirecting to dashboard...");
      if (onLoginSuccess) onLoginSuccess(user);
      navigate("/");
    } catch (err) {
      toast.error(err.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background p-4 relative overflow-hidden">
      <div className="w-full max-w-md space-y-6 rounded-2xl border border-border bg-card p-8 shadow-2xl z-10">
        <div className="text-center space-y-2">
          <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-primary/10">
            <LogoIcon className="size-7" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Welcome to Al Khaleej Lubricants</h1>
          <p className="text-xs text-muted-foreground">Enter your credentials to access the Oil Management Portal.</p>
        </div>

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
                type={showPassword ? "text" : "password"}
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
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                tabIndex={-1}
              >
                {showPassword ? <EyeOffIcon className="size-4" /> : <EyeIcon className="size-4" />}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full h-10 gap-2 text-xs font-semibold cursor-pointer shadow-xs"
            disabled={loading || (emailTouched && passwordTouched && !isFormValid)}
          >
            {loading ? (
              <>
                <Loader2Icon className="size-4 animate-spin" />
                <span>Signing In...</span>
              </>
            ) : (
              <>
                <span>Sign In to Dashboard</span>
                <ArrowRightIcon className="size-4" />
              </>
            )}
          </Button>
        </form>


      </div>
    </div>
  );
}
