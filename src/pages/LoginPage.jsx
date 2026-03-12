import React from "react";
import { motion } from "framer-motion";
import AuthForm from "../components/AuthForm";

const LoginPage = () => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center py-12 px-6 relative overflow-y-auto">
      {/* Premium Liquid Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0)_0%,rgba(255,255,255,0.5)_100%)] z-10" />

        {/* Main Accent Blob */}
        <motion.div
          animate={{
            x: [-100, 100, -100],
            y: [-50, 50, -50],
            scale: [1, 1.2, 1],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-[20%] -left-[10%] w-[70%] h-[70%] bg-emerald-200/30 rounded-full blur-[120px]"
        />

        {/* Secondary Accent Blob */}
        <motion.div
          animate={{
            x: [100, -100, 100],
            y: [50, -50, 50],
            scale: [1, 1.3, 1],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[20%] -right-[10%] w-[60%] h-[60%] bg-blue-200/30 rounded-full blur-[130px]"
        />

        {/* Tertiary Accent Blob */}
        <motion.div
          animate={{
            x: [-50, 50, -50],
            y: [100, -100, 100],
            scale: [1.2, 1, 1.2],
          }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -bottom-[20%] left-[10%] w-[65%] h-[65%] bg-violet-200/20 rounded-full blur-[140px]"
        />

        {/* Floating Highlight */}
        <motion.div
          animate={{
            x: [0, 200, 0],
            y: [0, 300, 0],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/4 left-1/4 w-[30%] h-[30%] bg-white/40 rounded-full blur-[100px]"
        />
      </div>

      <motion.div
        className="w-full max-w-[480px] relative z-20"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8 }}
      >
        <div className="border border-white/50 bg-white/40 backdrop-blur-3xl rounded-[40px] shadow-2xl overflow-hidden shadow-primary/5">
          <AuthForm />
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;
