import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { auth } from "../firebase";
import { verifyPasswordResetCode, confirmPasswordReset } from "firebase/auth";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { toast } from "react-hot-toast";
import {
  Lock,
  Shield,
  CheckCircle2,
  ArrowRight,
  Wallet,
  Eye,
  EyeOff,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LiquidButton } from "../components/ui/LiquidButton";

const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [isValidating, setIsValidating] = useState(true);
  const [email, setEmail] = useState("");

  const oobCode = searchParams.get("oobCode");

  useEffect(() => {
    const verifyCode = async () => {
      if (!oobCode) {
        setError("Mã xác thực không hợp lệ hoặc đã hết hạn.");
        setIsValidating(false);
        return;
      }

      try {
        const userEmail = await verifyPasswordResetCode(auth, oobCode);
        setEmail(userEmail);
      } catch (err) {
        console.error("Link verification error:", err);
        setError("Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.");
      } finally {
        setIsValidating(false);
      }
    };

    verifyCode();
  }, [oobCode]);

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("Mật khẩu xác nhận không khớp");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("Mật khẩu phải có ít nhất 6 ký tự");
      return;
    }

    setIsLoading(true);
    try {
      await confirmPasswordReset(auth, oobCode, newPassword);
      setIsSuccess(true);
      toast.success("Thay đổi mật khẩu thành công!");
      setTimeout(() => navigate("/login"), 3000);
    } catch (err) {
      console.error("Password reset error:", err);
      toast.error("Đã có lỗi xảy ra. Vui lòng thử lại sau.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center py-12 px-6 relative overflow-y-auto">
      {/* Premium Liquid Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0)_0%,rgba(255,255,255,0.5)_100%)] z-10" />
        <motion.div
          animate={{
            x: [-100, 100, -100],
            y: [-50, 50, -50],
            scale: [1, 1.2, 1],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-[20%] -left-[10%] w-[70%] h-[70%] bg-emerald-200/30 rounded-full blur-[120px]"
        />
        <motion.div
          animate={{
            x: [100, -100, 100],
            y: [50, -50, 50],
            scale: [1, 1.3, 1],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[20%] -right-[10%] w-[60%] h-[60%] bg-blue-200/30 rounded-full blur-[130px]"
        />
      </div>

      <motion.div
        className="w-full max-w-[480px] relative z-20"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8 }}
      >
        <div className="border border-white/50 bg-white/40 backdrop-blur-3xl rounded-[40px] shadow-2xl overflow-hidden shadow-primary/5">
          <Card className="bg-transparent border-none shadow-none">
            <CardHeader className="text-center pb-8 pt-10">
              <Link to="/" className="inline-block mx-auto group">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary shadow-lg shadow-primary/20 mb-4 mx-auto group-hover:scale-110 transition-transform">
                  <Wallet className="h-7 w-7 text-white" />
                </div>
                <span className="text-2xl font-extrabold tracking-tight text-foreground">
                  PlanGo
                </span>
              </Link>
            </CardHeader>

            <CardContent className="px-10 pb-12">
              {isValidating ? (
                <div className="text-center py-10 space-y-4">
                  <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
                  <p className="text-slate-500 font-medium">
                    Đang xác thực liên kết...
                  </p>
                </div>
              ) : error ? (
                <div className="text-center space-y-6">
                  <div className="bg-red-50 border border-red-100 rounded-3xl p-8 flex flex-col items-center gap-4">
                    <AlertCircle className="h-12 w-12 text-red-500" />
                    <p className="text-slate-700 font-bold">{error}</p>
                  </div>
                  <Button
                    asChild
                    variant="outline"
                    className="w-full h-12 rounded-2xl border-white/60 bg-white/40"
                  >
                    <Link to="/login">Quay lại Đăng nhập</Link>
                  </Button>
                </div>
              ) : isSuccess ? (
                <div className="text-center space-y-6 animate-in zoom-in-95 duration-500">
                  <div className="bg-emerald-50 border border-emerald-100 rounded-3xl p-8 flex flex-col items-center gap-4">
                    <div className="bg-emerald-500 rounded-full p-3 shadow-lg shadow-emerald-500/20">
                      <CheckCircle2 className="h-10 w-10 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-slate-800">
                        Thành công!
                      </h3>
                      <p className="text-slate-500 text-sm mt-1">
                        Mật khẩu của bạn đã được cập nhật.
                      </p>
                    </div>
                  </div>
                  <p className="text-sm text-slate-400 font-medium italic">
                    Tự động chuyển trang sau vài giây...
                  </p>
                  <LiquidButton
                    className="w-full h-14"
                    onClick={() => navigate("/login")}
                  >
                    Đăng nhập ngay <ArrowRight className="h-5 w-5" />
                  </LiquidButton>
                </div>
              ) : (
                <form onSubmit={handleResetPassword} className="space-y-6">
                  <div className="text-center mb-6">
                    <h3 className="text-2xl font-bold text-foreground mb-2">
                      Đặt lại mật khẩu
                    </h3>
                    <p className="text-slate-500 text-sm">
                      Đang thiết lập lại cho:{" "}
                      <span className="text-primary font-bold">{email}</span>
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-bold text-slate-700 ml-1">
                        Mật khẩu mới
                      </Label>
                      <div className="relative group">
                        <Lock className="absolute left-4 top-4 h-5 w-5 text-slate-400" />
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          className="bg-white/40 border-white/60 focus:bg-white/60 rounded-2xl h-14 pl-12"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute inset-y-0 right-4 flex items-center text-slate-400"
                        >
                          {showPassword ? (
                            <EyeOff className="h-5 w-5" />
                          ) : (
                            <Eye className="h-5 w-5" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-bold text-slate-700 ml-1">
                        Xác nhận mật khẩu
                      </Label>
                      <div className="relative group">
                        <Lock className="absolute left-4 top-4 h-5 w-5 text-slate-400" />
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          className="bg-white/40 border-white/60 focus:bg-white/60 rounded-2xl h-14 pl-12"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <LiquidButton
                    type="submit"
                    className="w-full h-14 text-lg"
                    disabled={isLoading}
                  >
                    {isLoading ? "Đang lưu..." : "Cập nhật mật khẩu"}
                    <ArrowRight className="h-5 w-5" />
                  </LiquidButton>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </div>
  );
};

export default ResetPasswordPage;
