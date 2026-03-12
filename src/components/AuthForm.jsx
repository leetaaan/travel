"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Eye, EyeOff } from "lucide-react";
import { auth, db } from "../firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  FacebookAuthProvider,
  signInWithPopup,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  sendPasswordResetEmail,
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { toast } from "react-hot-toast";
import { useNavigate, Link } from "react-router-dom";
import { generateRandomAvatar } from "../utils/avatarUtils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Wallet,
  Mail,
  Lock,
  User,
  ArrowRight,
  Shield,
  Phone,
  Github,
  Facebook,
} from "lucide-react";
import { LiquidButton } from "@/components/ui/LiquidButton";

const AuthForm = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loginMethod, setLoginMethod] = useState("email"); // 'email' or 'phone'
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [showOTP, setShowOTP] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState(null);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast.success("Đăng nhập thành công!");
      navigate("/home");
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      if (password !== confirmPassword) {
        throw new Error("Mật khẩu xác nhận không khớp");
      }
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password,
      );
      const user = userCredential.user;
      const avatarUrl = generateRandomAvatar();
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        email: user.email,
        fullName: `${firstName} ${lastName}`,
        profile_img: avatarUrl,
        createdAt: new Date(),
      });
      toast.success("Đăng ký thành công!");
      navigate("/home");
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = async (providerType) => {
    setError(null);
    setIsLoading(true);
    try {
      let provider;
      if (providerType === "google") {
        provider = new GoogleAuthProvider();
      } else if (providerType === "facebook") {
        provider = new FacebookAuthProvider();
      } else {
        return;
      }

      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Check if user exists in Firestore
      const userDoc = await getDoc(doc(db, "users", user.uid));

      if (!userDoc.exists()) {
        await setDoc(doc(db, "users", user.uid), {
          uid: user.uid,
          email: user.email,
          fullName: user.displayName || "User",
          profile_img: user.photoURL || generateRandomAvatar(),
          createdAt: new Date(),
        });
      }

      toast.success(
        `Đăng nhập bằng ${providerType === "google" ? "Google" : "Facebook"} thành công!`,
      );
      navigate("/home");
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const setupRecaptcha = (containerId) => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
        size: "invisible",
        callback: (response) => {
          // reCAPTCHA solved, allow signInWithPhoneNumber.
        },
      });
    }
  };

  const handlePhoneSignIn = async (e) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      toast.loading("Đang chuẩn bị xác thực...", { id: "phone-auth" });

      setupRecaptcha("recaptcha-container");
      const appVerifier = window.recaptchaVerifier;

      const formatPhone = phoneNumber.startsWith("+")
        ? phoneNumber
        : `+84${phoneNumber.replace(/^0/, "")}`;

      const confirmation = await signInWithPhoneNumber(
        auth,
        formatPhone,
        appVerifier,
      );

      setConfirmationResult(confirmation);
      setShowOTP(true);
      toast.success("Mã OTP đã được gửi!", { id: "phone-auth" });
    } catch (err) {
      console.error("Phone sign in error:", err);
      setError(err.message);
      toast.error("Gửi mã thất bại: " + err.message, { id: "phone-auth" });
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = null;
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      const result = await confirmationResult.confirm(otpCode);
      const user = result.user;

      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (!userDoc.exists()) {
        await setDoc(doc(db, "users", user.uid), {
          uid: user.uid,
          phoneNumber: user.phoneNumber,
          fullName: "User " + user.phoneNumber.slice(-4),
          profile_img: generateRandomAvatar(),
          createdAt: new Date(),
        });
      }

      toast.success("Xác thực thành công!");
      navigate("/home");
    } catch (err) {
      setError("Mã OTP không chính xác hoặc đã hết hạn");
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      toast.error("Vui lòng nhập email của bạn để lấy lại mật khẩu", {
        icon: "📧",
      });
      return;
    }

    setIsLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      toast.success("Link đặt lại mật khẩu đã được gửi vào email của bạn!", {
        duration: 5000,
      });
    } catch (err) {
      console.error("Reset password error:", err);
      let message = "Đã có lỗi xảy ra. Vui lòng thử lại sau.";
      if (err.code === "auth/user-not-found") {
        message = "Email này chưa được đăng ký tài khoản.";
      } else if (err.code === "auth/invalid-email") {
        message = "Địa chỉ email không hợp lệ.";
      }
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      className="relative"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="bg-transparent border-none shadow-none">
        <CardHeader className="text-center pb-8">
          <Link to="/" className="inline-block mx-auto group">
            <motion.div
              className="flex justify-center items-center gap-3 mb-6 cursor-pointer"
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary shadow-lg shadow-primary/20 group-hover:shadow-primary/40 transition-shadow">
                <Wallet className="h-7 w-7 text-white" />
              </div>
              <span className="text-3xl font-extrabold tracking-tight text-foreground">
                Plan<span className="text-primary group-hover:text-emerald-500 transition-colors">Go</span>
              </span>
            </motion.div>
          </Link>
        </CardHeader>

        <CardContent className="p-0">
          <Tabs defaultValue="login" className="w-full">
            <div className="px-8 pb-4">
              <TabsList className="grid grid-cols-2 w-full h-auto rounded-[24px] bg-white/40 p-1 border border-white/60">
                <TabsTrigger
                  value="login"
                  className="rounded-[20px] data-[state=active]:bg-white data-[state=active]:shadow-xl data-[state=active]:text-primary transition-all py-3 font-bold"
                >
                  Đăng nhập
                </TabsTrigger>
                <TabsTrigger
                  value="register"
                  className="rounded-[20px] data-[state=active]:bg-white data-[state=active]:shadow-xl data-[state=active]:text-primary transition-all py-3 font-bold"
                >
                  Đăng ký
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent
              value="login"
              className="space-y-6 animate-in fade-in slide-in-from-bottom-2 px-8 pb-8 pt-4"
            >
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-foreground mb-2">
                  Chào mừng trở lại!
                </h3>
                <p className="text-slate-500 font-medium">
                  Tiếp tục quản lý chi tiêu nhóm của bạn
                </p>
              </div>

              {error && (
                <motion.div
                  className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center gap-3 text-red-600 mb-6"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <Shield className="h-5 w-5 shrink-0" />
                  <p className="text-sm font-medium leading-tight">{error}</p>
                </motion.div>
              )}

              {loginMethod === "email" ? (
                <form onSubmit={handleLogin} className="space-y-5">
                  <div className="space-y-2">
                    <Label
                      htmlFor="email"
                      className="text-sm font-bold text-slate-700 ml-1"
                    >
                      Email
                    </Label>
                    <div className="relative group">
                      <Mail className="absolute left-4 top-4 h-5 w-5 text-slate-400 group-focus-within:text-primary transition-colors" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="name@email.com"
                        className="bg-white/40 border-white/60 focus:bg-white/60 focus:ring-primary/40 rounded-2xl h-14 pl-12 transition-all placeholder:text-slate-400"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="password"
                      className="text-sm font-bold text-slate-700 ml-1"
                    >
                      Mật khẩu
                    </Label>
                    <div className="relative group">
                      <Lock className="absolute left-4 top-4 h-5 w-5 text-slate-400 group-focus-within:text-primary transition-colors" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        className="bg-white/40 border-white/60 focus:bg-white/60 focus:ring-primary/40 rounded-2xl h-14 pl-12 transition-all placeholder:text-slate-400"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground focus:outline-none"
                        aria-label={
                          showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"
                        }
                      >
                        {showPassword ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pb-2 px-1">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="remember"
                        className="rounded-md border-primary/30 data-[state=checked]:bg-primary h-5 w-5"
                      />
                      <Label
                        htmlFor="remember"
                        className="text-sm text-slate-500 cursor-pointer font-medium"
                      >
                        Ghi nhớ tôi
                      </Label>
                    </div>
                    <Button
                      type="button"
                      variant="link"
                      className="text-primary hover:text-primary p-0 h-auto font-bold text-sm"
                      onClick={handleForgotPassword}
                      disabled={isLoading}
                    >
                      Quên mật khẩu?
                    </Button>
                  </div>

                  <LiquidButton
                    type="submit"
                    className="w-full h-14 text-lg"
                    disabled={isLoading}
                  >
                    {isLoading ? "Đang xử lý..." : "Đăng nhập ngay"}
                    <ArrowRight className="h-5 w-5" />
                  </LiquidButton>
                </form>
              ) : (
                <form
                  onSubmit={showOTP ? handleVerifyOTP : handlePhoneSignIn}
                  className="space-y-5"
                >
                  {!showOTP ? (
                    <div className="space-y-2">
                      <Label
                        htmlFor="phone"
                        className="text-sm font-bold text-slate-700 ml-1"
                      >
                        Số điện thoại
                      </Label>
                      <div className="relative group">
                        <Phone className="absolute left-4 top-4 h-5 w-5 text-slate-400 group-focus-within:text-primary transition-colors" />
                        <Input
                          id="phone"
                          type="tel"
                          placeholder="09xx xxx xxx"
                          className="bg-white/40 border-white/60 focus:bg-white/60 rounded-2xl h-14 pl-12 transition-all"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          required
                        />
                      </div>
                      <p className="text-xs text-slate-400 ml-1">
                        Nhập số điện thoại để nhận mã xác thực qua SMS
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Label
                        htmlFor="otp"
                        className="text-sm font-bold text-slate-700 ml-1"
                      >
                        Mã xác thực (OTP)
                      </Label>
                      <Input
                        id="otp"
                        type="text"
                        placeholder="Nhập 6 chữ số"
                        className="bg-white/40 border-white/60 focus:bg-white/60 rounded-2xl h-14 text-center text-2xl tracking-widest transition-all"
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value)}
                        maxLength={6}
                        required
                      />
                      <Button
                        variant="link"
                        type="button"
                        className="text-xs text-primary p-0"
                        onClick={() => setShowOTP(false)}
                      >
                        Thay đổi số điện thoại
                      </Button>
                    </div>
                  )}

                  <div id="recaptcha-container" className="hidden"></div>

                  <LiquidButton
                    type="submit"
                    className="w-full h-14 text-lg"
                    disabled={isLoading}
                  >
                    {isLoading
                      ? "Đang xử lý..."
                      : showOTP
                        ? "Xác nhận OTP"
                        : "Gửi mã xác thực"}
                    <ArrowRight className="h-5 w-5" />
                  </LiquidButton>

                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full text-slate-500 font-medium"
                    onClick={() => {
                      setLoginMethod("email");
                      setShowOTP(false);
                    }}
                  >
                    Quay lại đăng nhập Email
                  </Button>
                </form>
              )}

              <div className="relative py-4">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center text-[10px] uppercase tracking-[0.15em]">
                  <span className="bg-white/60 backdrop-blur-xl px-4 py-1.5 rounded-full border border-white/80 text-slate-500 font-extrabold shadow-sm">
                    Hoặc tiếp tục với
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="h-14 rounded-2xl bg-white/40 border-white/60 hover:bg-white hover:text-primary transition-all"
                  onClick={() => handleSocialLogin("google")}
                  disabled={isLoading}
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="h-14 rounded-2xl bg-white/40 border-white/60 hover:bg-white hover:text-[#1877F2] transition-all"
                  onClick={() => handleSocialLogin("facebook")}
                  disabled={isLoading}
                >
                  <Facebook className="h-5 w-5 fill-current" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="h-14 rounded-2xl bg-white/40 border-white/60 hover:bg-white hover:text-primary transition-all"
                  onClick={() => {
                    setLoginMethod("phone");
                    toast("Đã chuyển sang đăng nhập bằng SĐT", { icon: "📱" });
                  }}
                  disabled={isLoading}
                >
                  <Phone className="h-5 w-5" />
                </Button>
              </div>
            </TabsContent>

            <TabsContent
              value="register"
              className="space-y-4 animate-in fade-in slide-in-from-bottom-2 px-8 pb-8 pt-2"
            >
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-foreground">
                  Bắt đầu ngay hôm nay
                </h3>
              </div>

              {error && (
                <motion.div
                  className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center gap-3 text-red-600 mb-6"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <Shield className="h-5 w-5 shrink-0" />
                  <p className="text-sm font-medium leading-tight">{error}</p>
                </motion.div>
              )}

              <form onSubmit={handleRegister} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor="firstName"
                      className="text-sm font-bold text-slate-700 ml-1"
                    >
                      Họ
                    </Label>
                    <Input
                      id="firstName"
                      placeholder="Họ"
                      className="bg-white/40 border-white/60 focus:bg-white/60 rounded-2xl h-14 transition-all"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="lastName"
                      className="text-sm font-bold text-slate-700 ml-1"
                    >
                      Tên
                    </Label>
                    <Input
                      id="lastName"
                      placeholder="Tên"
                      className="bg-white/40 border-white/60 focus:bg-white/60 rounded-2xl h-14 transition-all"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="registerEmail"
                    className="text-sm font-bold text-slate-700 ml-1"
                  >
                    Email
                  </Label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-4 h-5 w-5 text-slate-400 group-focus-within:text-primary transition-colors" />
                    <Input
                      id="registerEmail"
                      type="email"
                      placeholder="name@email.com"
                      className="bg-white/40 border-white/60 focus:bg-white/60 rounded-2xl h-14 pl-12 transition-all placeholder:text-slate-400"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="registerPassword"
                    className="text-sm font-bold text-slate-700 ml-1"
                  >
                    Mật khẩu
                  </Label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-4 h-5 w-5 text-slate-400 group-focus-within:text-primary transition-colors" />
                    <Input
                      id="registerPassword"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      className="bg-white/40 border-white/60 focus:bg-white/60 rounded-2xl h-14 pl-12 transition-all placeholder:text-slate-400"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute inset-y-0 right-0 flex items-center px-4 text-slate-400 hover:text-slate-600"
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
                  <Label
                    htmlFor="confirmPassword"
                    className="text-sm font-bold text-slate-700 ml-1"
                  >
                    Xác nhận mật khẩu
                  </Label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-4 h-5 w-5 text-slate-400 group-focus-within:text-primary transition-colors" />
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="••••••••"
                      className="bg-white/40 border-white/60 focus:bg-white/60 rounded-2xl h-14 pl-12 transition-all placeholder:text-slate-400"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((v) => !v)}
                      className="absolute inset-y-0 right-0 flex items-center px-4 text-slate-400 hover:text-slate-600"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex items-center space-x-2 py-1">
                  <Checkbox
                    id="terms"
                    required
                    className="rounded-md border-primary/30 data-[state=checked]:bg-primary h-5 w-5"
                  />
                  <Label
                    htmlFor="terms"
                    className="text-sm text-slate-500 cursor-pointer font-medium leading-relaxed"
                  >
                    Tôi đồng ý với{" "}
                    <Button
                      variant="link"
                      className="text-primary hover:text-primary p-0 h-auto font-bold underline"
                    >
                      Điều khoản & Dịch vụ
                    </Button>
                  </Label>
                </div>

                <LiquidButton
                  type="submit"
                  className="w-full h-14 text-lg bg-emerald-600 hover:shadow-emerald-600/20"
                  disabled={isLoading}
                >
                  {isLoading ? "Đang xử lý..." : "Tạo tài khoản ngay"}
                  <ArrowRight className="h-5 w-5" />
                </LiquidButton>

                <div className="relative py-4">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-slate-200" />
                  </div>
                  <div className="relative flex justify-center text-[10px] uppercase tracking-[0.15em]">
                    <span className="bg-white/60 backdrop-blur-xl px-4 py-1.5 rounded-full border border-white/80 text-slate-500 font-extrabold shadow-sm">
                      Hoặc tiếp tục với
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-14 rounded-2xl bg-white/40 border-white/60 hover:bg-white hover:text-primary transition-all"
                    onClick={() => handleSocialLogin("google")}
                  >
                    <svg className="h-5 w-5" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="currentColor"
                        d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-14 rounded-2xl bg-white/40 border-white/60 hover:bg-white hover:text-[#1877F2] transition-all"
                    onClick={() => handleSocialLogin("facebook")}
                  >
                    <Facebook className="h-5 w-5 fill-current" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-14 rounded-2xl bg-white/40 border-white/60 hover:bg-white hover:text-primary transition-all"
                    onClick={() => {
                      setLoginMethod("phone");
                      const loginTab =
                        document.querySelector('[value="login"]');
                      if (loginTab) loginTab.click();
                    }}
                  >
                    <Phone className="h-5 w-5" />
                  </Button>
                </div>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default AuthForm;
