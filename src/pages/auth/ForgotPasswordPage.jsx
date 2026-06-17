import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";
import { authApi } from "../../api/endpoints";
import { OtpInput } from "../../components/ui/otp-input";
import { APP_NAME } from "../../constants/branding";

const OTP_LENGTH = 5;
const RESEND_COOLDOWN = 60;

const brand = {
  primary: "#0099d8",
  pageBg: "#e6ebf1",
  wordmark: "#1a2235",
  body: "#303948",
  muted: "#5f6880",
};

const inputClass =
  "h-12 w-full rounded-full border border-white/60 bg-[rgba(255,255,255,0.82)] px-5 text-base text-[#3f4960] shadow-[0_1px_0_rgba(255,255,255,0.6)] placeholder:text-[#6a758f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-damiun-primary focus-visible:ring-offset-0 sm:h-12 sm:px-6 sm:text-[0.9375rem]";

export function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState("email"); // "email" | "otp" | "password"
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startResendTimer = useCallback(() => {
    setResendTimer(RESEND_COOLDOWN);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const handleSendOtp = useCallback(
    async (e) => {
      e.preventDefault();
      setError("");

      const normalizedEmail = email.trim().toLowerCase();
      if (!normalizedEmail) {
        setError("Emailni kiriting");
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
        setError("Email formati noto'g'ri");
        return;
      }

      setLoading(true);
      try {
        await authApi.sendOtp({
          recipient: normalizedEmail,
        });
        setEmail(normalizedEmail);
        setStep("otp");
        startResendTimer();
        toast.success("Tasdiqlash kodi emailingizga yuborildi");
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Xatolik yuz berdi";
        setError(message);
        toast.error(message);
      } finally {
        setLoading(false);
      }
    },
    [email, startResendTimer],
  );

  const handleVerifyOtp = useCallback(() => {
    if (otp.length !== OTP_LENGTH) {
      setError("Tasdiqlash kodini to'liq kiriting");
      return;
    }
    setError("");
    setStep("password");
  }, [otp]);

  const handleResendOtp = useCallback(async () => {
    if (resendTimer > 0) return;
    setError("");
    try {
      await authApi.sendOtp({
        recipient: email,
      });
      startResendTimer();
      setOtp("");
      toast.success("Yangi kod yuborildi");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Kod yuborishda xatolik";
      toast.error(message);
    }
  }, [resendTimer, email, startResendTimer]);

  const handleResetPassword = useCallback(
    async (e) => {
      e.preventDefault();
      setError("");

      if (password.length < 6) {
        setError("Parol kamida 6 ta belgidan iborat bo'lsin");
        return;
      }
      if (password !== confirmPassword) {
        setError("Parollar mos kelmadi");
        return;
      }

      setLoading(true);
      try {
        await authApi.resetPassword({
          recipient: email,
          otp,
          new_password: password,
        });
        toast.success("Parol muvaffaqiyatli o'zgartirildi");
        navigate("/login", { replace: true });
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Parolni o'zgartirib bo'lmadi";
        setError(message);
        toast.error(message);
      } finally {
        setLoading(false);
      }
    },
    [email, otp, password, confirmPassword, navigate],
  );

  return (
    <div
      className="flex min-h-screen w-full items-center justify-center px-4 font-dm-sans"
      style={{ backgroundColor: brand.pageBg }}
    >
      <div className="w-full max-w-md space-y-8 rounded-3xl bg-white/80 p-8 shadow-xl backdrop-blur sm:p-10">
        {step === "email" && (
          <EmailStep
            email={email}
            setEmail={setEmail}
            error={error}
            loading={loading}
            onSubmit={handleSendOtp}
            onBack={() => navigate("/login")}
          />
        )}

        {step === "otp" && (
          <OtpStep
            email={email}
            otp={otp}
            setOtp={setOtp}
            error={error}
            loading={loading}
            resendTimer={resendTimer}
            onVerify={handleVerifyOtp}
            onResend={handleResendOtp}
            onBack={() => {
              setStep("email");
              setOtp("");
              setError("");
            }}
          />
        )}

        {step === "password" && (
          <PasswordStep
            password={password}
            setPassword={setPassword}
            confirmPassword={confirmPassword}
            setConfirmPassword={setConfirmPassword}
            showPassword={showPassword}
            setShowPassword={setShowPassword}
            showConfirm={showConfirm}
            setShowConfirm={setShowConfirm}
            error={error}
            loading={loading}
            onSubmit={handleResetPassword}
          />
        )}
      </div>
    </div>
  );
}

function EmailStep({ email, setEmail, error, loading, onSubmit, onBack }) {
  return (
    <>
      <div className="space-y-2 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-damiun-primary/10">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-7 w-7 text-damiun-primary"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
            />
          </svg>
        </div>
        <h1
          className="text-2xl font-semibold tracking-tight sm:text-[1.75rem]"
          style={{ color: brand.wordmark }}
        >
          Parolni tiklash
        </h1>
        <p
          className="text-sm leading-relaxed sm:text-[0.9375rem]"
          style={{ color: brand.body }}
        >
          Emailingizni kiriting, biz sizga tasdiqlash kodi yuboramiz
        </p>
      </div>

      {error && (
        <p className="rounded-2xl bg-red-50 px-4 py-3 text-center text-sm font-medium text-red-700">
          {error}
        </p>
      )}

      <form onSubmit={onSubmit} className="space-y-5">
        <div className="space-y-2.5">
          <label
            htmlFor="reset-email"
            className="text-[0.9375rem] font-semibold leading-tight text-[#1a2235]"
          >
            Email Address
          </label>
          <input
            id="reset-email"
            type="email"
            placeholder="Emailingizni kiriting"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
            disabled={loading}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="h-12 w-full rounded-full bg-damiun-primary text-[0.9375rem] font-semibold text-white shadow-sm transition hover:bg-damiun-primary-hover disabled:opacity-70"
        >
          {loading ? "Yuborilmoqda..." : "Kod yuborish"}
        </button>

        <button
          type="button"
          onClick={onBack}
          className="w-full text-center text-sm font-medium transition hover:opacity-80"
          style={{ color: brand.muted }}
        >
          &larr; Kirish sahifasiga qaytish
        </button>
      </form>
    </>
  );
}

function OtpStep({
  email,
  otp,
  setOtp,
  error,
  loading,
  resendTimer,
  onVerify,
  onResend,
  onBack,
}) {
  return (
    <>
      <div className="space-y-2 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-damiun-primary/10">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-7 w-7 text-damiun-primary"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
        </div>
        <h1
          className="text-2xl font-semibold tracking-tight sm:text-[1.75rem]"
          style={{ color: brand.wordmark }}
        >
          Kodni kiriting
        </h1>
        <p
          className="text-sm leading-relaxed sm:text-[0.9375rem]"
          style={{ color: brand.body }}
        >
          <span className="font-medium">{email}</span> manziliga {OTP_LENGTH} raqamli
          tasdiqlash kodi yuborildi
        </p>
      </div>

      {error && (
        <p className="rounded-2xl bg-red-50 px-4 py-3 text-center text-sm font-medium text-red-700">
          {error}
        </p>
      )}

      <div className="space-y-6">
        <OtpInput value={otp} onChange={setOtp} length={OTP_LENGTH} />

        <button
          type="button"
          onClick={onVerify}
          disabled={otp.length !== OTP_LENGTH}
          className="h-12 w-full rounded-full bg-damiun-primary text-[0.9375rem] font-semibold text-white shadow-sm transition hover:bg-damiun-primary-hover disabled:opacity-70"
        >
          Davom etish
        </button>

        <div className="text-center text-sm" style={{ color: brand.muted }}>
          {resendTimer > 0 ? (
            <span>Qayta yuborish ({resendTimer}s)</span>
          ) : (
            <button
              type="button"
              onClick={onResend}
              className="font-semibold transition hover:opacity-80"
              style={{ color: brand.primary }}
            >
              Kodni qayta yuborish
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={onBack}
          className="w-full text-center text-sm font-medium transition hover:opacity-80"
          style={{ color: brand.muted }}
        >
          &larr; Orqaga qaytish
        </button>
      </div>
    </>
  );
}

function PasswordStep({
  password,
  setPassword,
  confirmPassword,
  setConfirmPassword,
  showPassword,
  setShowPassword,
  showConfirm,
  setShowConfirm,
  error,
  loading,
  onSubmit,
}) {
  return (
    <>
      <div className="space-y-2 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-green-100">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-7 w-7 text-green-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
        </div>
        <h1
          className="text-2xl font-semibold tracking-tight sm:text-[1.75rem]"
          style={{ color: brand.wordmark }}
        >
          Yangi parol
        </h1>
        <p
          className="text-sm leading-relaxed sm:text-[0.9375rem]"
          style={{ color: brand.body }}
        >
          Yangi parolingizni kiriting
        </p>
      </div>

      {error && (
        <p className="rounded-2xl bg-red-50 px-4 py-3 text-center text-sm font-medium text-red-700">
          {error}
        </p>
      )}

      <form onSubmit={onSubmit} className="space-y-5">
        <div className="space-y-2.5">
          <label
            htmlFor="new-password"
            className="text-[0.9375rem] font-semibold leading-tight text-[#1a2235]"
          >
            Yangi parol
          </label>
          <div className="relative">
            <input
              id="new-password"
              type={showPassword ? "text" : "password"}
              placeholder="Yangi parolni kiriting"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`${inputClass} pr-12`}
              disabled={loading}
            />
            <button
              type="button"
              className="absolute right-4 top-1/2 -translate-y-1/2 text-[#6c7388] transition hover:text-[#4e576f]"
              onClick={() => setShowPassword((p) => !p)}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
        </div>

        <div className="space-y-2.5">
          <label
            htmlFor="confirm-password"
            className="text-[0.9375rem] font-semibold leading-tight text-[#1a2235]"
          >
            Parolni tasdiqlang
          </label>
          <div className="relative">
            <input
              id="confirm-password"
              type={showConfirm ? "text" : "password"}
              placeholder="Parolni qayta kiriting"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={`${inputClass} pr-12`}
              disabled={loading}
            />
            <button
              type="button"
              className="absolute right-4 top-1/2 -translate-y-1/2 text-[#6c7388] transition hover:text-[#4e576f]"
              onClick={() => setShowConfirm((p) => !p)}
            >
              {showConfirm ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="h-12 w-full rounded-full bg-damiun-primary text-[0.9375rem] font-semibold text-white shadow-sm transition hover:bg-damiun-primary-hover disabled:opacity-70"
        >
          {loading ? "Saqlanmoqda..." : "Parolni o'zgartirish"}
        </button>
      </form>
    </>
  );
}
