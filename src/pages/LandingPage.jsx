"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Wallet,
  MapPin,
  PieChart,
  Calendar,
  Shield,
  Smartphone,
  Star,
  Menu,
  ArrowRight,
  CheckCircle,
  Play,
  Facebook,
  Instagram,
  Twitter,
  Github,
  Mail,
} from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import { LiquidButton } from "@/components/ui/LiquidButton";

const fadeInUp = {
  initial: { opacity: 0, y: 60 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: "easeOut" },
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const scaleOnHover = {
  whileHover: { scale: 1.05 },
  transition: { type: "spring", stiffness: 300 },
};

export default function LandingPage() {
  const [mobileOpen, setMobileOpen] = useState(false);
  return (
    <div className="min-h-screen bg-background no-scrollbar">
      {/* Liquid Background Blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            x: [0, 100, 0],
            y: [0, -50, 0],
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute -top-[10%] -left-[5%] w-[40%] h-[40%] bg-emerald-200/30 blur-[120px] rounded-full"
        />
        <motion.div
          animate={{
            x: [0, -80, 0],
            y: [0, 120, 0],
            scale: [1, 1.3, 1],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute top-[20%] -right-[10%] w-[35%] h-[45%] bg-primary/20 blur-[100px] rounded-[40%]"
        />
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-0 left-[15%] w-[50%] h-[30%] bg-secondary/30 blur-[140px] rounded-full"
        />
      </div>

      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="border-b border-black/5 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50"
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <motion.div
              className="flex items-center space-x-2"
              whileHover={{ scale: 1.05 }}
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <Wallet className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold text-foreground">
                PlanGo
              </span>
            </motion.div>

            <nav className="hidden md:flex items-center space-x-8">
              {[
                { label: "Tính năng", id: "features" },
                { label: "Đánh giá", id: "testimonials" },
                { label: "Liên hệ", id: "contact" },
              ].map((link, index) => (
                <motion.a
                  key={link.id}
                  href={`#${link.id}`}
                  onClick={(e) => {
                    e.preventDefault();
                    const el = document.getElementById(link.id);
                    if (el) {
                      const header = document.querySelector("header");
                      const headerHeight =
                        header && header.offsetHeight
                          ? header.offsetHeight
                          : 64;
                      const y =
                        el.getBoundingClientRect().top +
                        window.pageYOffset -
                        headerHeight -
                        8;
                      window.scrollTo({ top: y, behavior: "smooth" });
                    }
                  }}
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 + 0.2 }}
                  whileHover={{ y: -2 }}
                >
                  {link.label}
                </motion.a>
              ))}
            </nav>

            <div className="flex items-center space-x-4">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link
                  to="/login"
                  onClick={() => setMobileOpen(false)}
                  className="inline-flex"
                >
                  <LiquidButton className="h-10 px-6 text-sm">
                    Bắt đầu miễn phí
                  </LiquidButton>
                </Link>
              </motion.div>
              <Button
                variant="ghost"
                size="sm"
                className="md:hidden"
                onClick={() => setMobileOpen((v) => !v)}
              >
                <Menu className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
        {/* Mobile dropdown */}
        <motion.div
          className="md:hidden border-t border-black/5 bg-background"
          initial={false}
          animate={{
            height: mobileOpen ? "auto" : 0,
            opacity: mobileOpen ? 1 : 0,
          }}
          style={{ overflow: "hidden" }}
        >
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-3 space-y-2">
            {[
              { label: "Tính năng", id: "features" },
              { label: "Đánh giá", id: "testimonials" },
              { label: "Liên hệ", id: "contact" },
            ].map((link) => (
              <a
                key={link.id}
                href={`#${link.id}`}
                className="block py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
                onClick={(e) => {
                  e.preventDefault();
                  const el = document.getElementById(link.id);
                  if (el) {
                    const header = document.querySelector("header");
                    const headerHeight =
                      header && header.offsetHeight ? header.offsetHeight : 64;
                    const y =
                      el.getBoundingClientRect().top +
                      window.pageYOffset -
                      headerHeight -
                      8;
                    window.scrollTo({ top: y, behavior: "smooth" });
                  }
                  setMobileOpen(false);
                }}
              >
                {link.label}
              </a>
            ))}
          </div>
        </motion.div>
      </motion.header>

      {/* Hero Section */}
      <section className="py-12 lg:py-24 overflow-hidden relative">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              className="space-y-10 relative z-10"
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <div className="space-y-6">
                <motion.h1
                  className="text-[40px] lg:text-[72px] font-extrabold tracking-tight text-foreground leading-[1.1]"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.8 }}
                >
                  Quản lý chi tiêu nhóm{" "}
                  <span className="text-emerald-700">dễ dàng</span> và minh
                  bạch.
                </motion.h1>
                <motion.p
                  className="text-lg lg:text-xl text-slate-500/90 leading-relaxed max-w-2xl"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.6 }}
                >
                  Đừng để tiền bạc làm ảnh hưởng đến tình bạn. PlanGo giúp
                  bạn theo dõi chi tiêu chung, chia hóa đơn công bằng và giải
                  quyết nợ nần chỉ trong vài giây.
                </motion.p>
              </div>

              <motion.div
                className="flex flex-col sm:flex-row gap-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Link to="/login">
                    <LiquidButton className="h-16 px-10 text-lg">
                      Bắt đầu miễn phí
                      <ArrowRight className="h-5 w-5" />
                    </LiquidButton>
                  </Link>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <LiquidButton className="h-16 px-10 text-lg bg-white/20 backdrop-blur-xl border border-white/40 text-foreground hover:bg-white/40 shadow-lg shadow-black/5">
                    Xem demo
                    <div className="flex items-center justify-center w-7 h-7 rounded-full border-2 border-foreground bg-foreground/5 shrink-0">
                      <Play className="h-3 w-3 fill-current ml-0.5" />
                    </div>
                  </LiquidButton>
                </motion.div>
              </motion.div>

              <motion.div
                className="flex items-center gap-4 pt-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
              >
                <div className="flex -space-x-3">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="h-11 w-11 rounded-full border-4 border-white/80 overflow-hidden bg-slate-100 shadow-md backdrop-blur-sm"
                    >
                      <img
                        src={`https://i.pravatar.cc/100?u=${i + 20}`}
                        alt="User"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
                <p className="text-sm font-medium text-slate-500 italic">
                  Được tin dùng bởi hơn{" "}
                  <span className="text-slate-900 font-bold not-italic">
                    10,000+
                  </span>{" "}
                  nhóm bạn trẻ.
                </p>
              </motion.div>
            </motion.div>

            <motion.div
              className="relative lg:ml-auto w-full max-w-[600px]"
              initial={{ opacity: 0, scale: 0.9, x: 50 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              {/* Liquid Glass Container */}
              <div className="bg-white/10 rounded-[64px] p-8 lg:p-20 relative overflow-hidden flex justify-center items-center backdrop-blur-2xl border border-white/30 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.1)]">
                {/* Internal morphing glow */}
                <motion.div
                  animate={{
                    scale: [1, 1.2, 1],
                    rotate: [0, 180, 0],
                  }}
                  transition={{
                    duration: 15,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                  className="absolute inset-0 bg-gradient-to-br from-primary/10 via-emerald-300/10 to-transparent blur-3xl"
                />

                <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-white/20 to-transparent z-0" />

                {/* Phone Mockup with Glass Shine */}
                <div className="relative w-[280px] lg:w-[320px] aspect-[1/2] rounded-[48px] bg-slate-950 p-3 shadow-2xl shadow-emerald-900/10 z-10 group">
                  {/* Shine effect */}
                  <div className="absolute inset-x-0 top-0 h-full w-full bg-gradient-to-tr from-transparent via-white/5 to-transparent skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none z-30" />

                  <div className="absolute top-0 inset-x-0 h-8 z-20 flex justify-center items-center">
                    <div className="w-20 h-5 rounded-b-2xl bg-slate-950" />
                  </div>
                  <div className="w-full h-full bg-white rounded-[40px] overflow-hidden relative border border-white/10">
                    <img
                      src="/modern-travel-planning-app-interface-showing-expen.png"
                      alt="App interface"
                      className="w-full h-full object-cover"
                    />
                    {/* Fake overlay for better look */}
                    <div className="absolute inset-0 bg-white/5 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Decorative elements */}
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-emerald-100 rounded-full blur-3xl -z-10 opacity-50" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white/40 scroll-mt-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center space-y-4 mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl lg:text-5xl font-bold text-foreground text-balance">
              Mọi thứ bạn cần cho chuyến du lịch hoàn hảo
            </h2>
            <p className="text-xl text-muted-foreground text-pretty max-w-3xl mx-auto">
              Từ việc theo dõi chi tiêu hàng ngày đến lập kế hoạch chi tiết cho
              chuyến du lịch, chúng tôi có tất cả những gì bạn cần.
            </p>
          </motion.div>

          {/* Mobile carousel */}
          <div className="md:hidden">
            <Swiper
              modules={[Autoplay, Pagination]}
              slidesPerView={1}
              spaceBetween={16}
              autoplay={{ delay: 2500, disableOnInteraction: false }}
              pagination={{ clickable: true }}
              className="!pb-10"
            >
              {[
                {
                  icon: Wallet,
                  title: "Theo dõi chi tiêu",
                  description:
                    "Ghi lại mọi khoản chi tiêu một cách dễ dàng với giao diện trực quan. Phân loại tự động và báo cáo chi tiết.",
                  color: "primary",
                },
                {
                  icon: PieChart,
                  title: "Lập ngân sách thông minh",
                  description:
                    "Tạo ngân sách cho từng chuyến du lịch với các danh mục chi tiết. Nhận cảnh báo khi sắp vượt ngân sách.",
                  color: "secondary",
                },
                {
                  icon: MapPin,
                  title: "Lên kế hoạch du lịch",
                  description:
                    "Tạo lịch trình chi tiết với ước tính chi phí cho mỗi hoạt động. Lưu trữ thông tin địa điểm và ghi chú quan trọng.",
                  color: "primary",
                },
                {
                  icon: Calendar,
                  title: "Quản lý lịch trình",
                  description:
                    "Sắp xếp các hoạt động theo thời gian với giao diện lịch trực quan. Đồng bộ với lịch cá nhân của bạn.",
                  color: "secondary",
                },
                {
                  icon: Shield,
                  title: "Bảo mật tuyệt đối",
                  description:
                    "Dữ liệu của bạn được mã hóa và bảo vệ với các tiêu chuẩn bảo mật cao nhất. Sao lưu tự động và đồng bộ đa thiết bị.",
                  color: "primary",
                },
                {
                  icon: Smartphone,
                  title: "Sử dụng mọi lúc mọi nơi",
                  description:
                    "Ứng dụng hoạt động trên mọi thiết bị - điện thoại, máy tính bảng và máy tính. Giao diện thân thiện và dễ sử dụng.",
                  color: "secondary",
                },
              ].map((feature) => (
                <SwiperSlide key={feature.title}>
                  <Card className="border-white/50 bg-white/40 backdrop-blur-md rounded-[32px] hover:shadow-2xl hover:border-primary/30 transition-all duration-500 h-full shadow-sm border">
                    <CardHeader>
                      <div className="flex items-center space-x-3">
                        <div
                          className={`flex h-12 w-12 items-center justify-center rounded-lg ${feature.color === "primary" ? "bg-primary/10" : "bg-secondary/10"}`}
                        >
                          <feature.icon
                            className={`h-6 w-6 ${feature.color === "primary" ? "text-primary" : "text-secondary"}`}
                          />
                        </div>
                        <CardTitle>{feature.title}</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="text-base">
                        {feature.description}
                      </CardDescription>
                    </CardContent>
                  </Card>
                </SwiperSlide>
              ))}
            </Swiper>
          </div>

          {/* Desktop grid */}
          <motion.div
            className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-8"
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            {[
              {
                icon: Wallet,
                title: "Theo dõi chi tiêu",
                description:
                  "Ghi lại mọi khoản chi tiêu một cách dễ dàng với giao diện trực quan. Phân loại tự động và báo cáo chi tiết.",
                color: "primary",
              },
              {
                icon: PieChart,
                title: "Lập ngân sách thông minh",
                description:
                  "Tạo ngân sách cho từng chuyến du lịch với các danh mục chi tiết. Nhận cảnh báo khi sắp vượt ngân sách.",
                color: "secondary",
              },
              {
                icon: MapPin,
                title: "Lên kế hoạch du lịch",
                description:
                  "Tạo lịch trình chi tiết với ước tính chi phí cho mỗi hoạt động. Lưu trữ thông tin địa điểm và ghi chú quan trọng.",
                color: "primary",
              },
              {
                icon: Calendar,
                title: "Quản lý lịch trình",
                description:
                  "Sắp xếp các hoạt động theo thời gian với giao diện lịch trực quan. Đồng bộ với lịch cá nhân của bạn.",
                color: "secondary",
              },
              {
                icon: Shield,
                title: "Bảo mật tuyệt đối",
                description:
                  "Dữ liệu của bạn được mã hóa và bảo vệ với các tiêu chuẩn bảo mật cao nhất. Sao lưu tự động và đồng bộ đa thiết bị.",
                color: "primary",
              },
              {
                icon: Smartphone,
                title: "Sử dụng mọi lúc mọi nơi",
                description:
                  "Ứng dụng hoạt động trên mọi thiết bị - điện thoại, máy tính bảng và máy tính. Giao diện thân thiện và dễ sử dụng.",
                color: "secondary",
              },
            ].map((feature, index) => (
              <motion.div
                key={feature.title}
                variants={fadeInUp}
                className="h-full"
              >
                <motion.div {...scaleOnHover} className="h-full">
                  <Card className="border-white/50 bg-white/40 backdrop-blur-md rounded-[32px] hover:shadow-2xl hover:border-primary/30 transition-all duration-500 h-full shadow-sm border">
                    <CardHeader>
                      <div className="flex items-center space-x-3">
                        <div
                          className={`flex h-12 w-12 items-center justify-center rounded-lg ${feature.color === "primary" ? "bg-primary/10" : "bg-secondary/10"}`}
                        >
                          <feature.icon
                            className={`h-6 w-6 ${feature.color === "primary" ? "text-primary" : "text-secondary"}`}
                          />
                        </div>
                        <CardTitle>{feature.title}</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="text-base">
                        {feature.description}
                      </CardDescription>
                    </CardContent>
                  </Card>
                </motion.div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 bg-transparent scroll-mt-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center space-y-4 mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl lg:text-5xl font-bold text-foreground text-balance">
              Được tin tưởng bởi hàng nghìn người dùng
            </h2>
          </motion.div>

          {/* Mobile carousel */}
          <div className="md:hidden">
            <Swiper
              modules={[Autoplay, Pagination]}
              slidesPerView={1}
              spaceBetween={16}
              autoplay={{ delay: 2500, disableOnInteraction: false }}
              pagination={{ clickable: true }}
              className="!pb-10"
            >
              {[
                {
                  name: "Minh Hương",
                  role: "Du lịch gia đình",
                  avatar: "MH",
                  content:
                    "Ứng dụng tuyệt vời! Giúp tôi tiết kiệm được rất nhiều tiền trong chuyến du lịch Đà Nẵng. Giao diện đẹp và dễ sử dụng.",
                  color: "primary",
                },
                {
                  name: "Tuấn Quang",
                  role: "Backpacker",
                  avatar: "TQ",
                  content:
                    "Tính năng lập ngân sách rất hữu ích. Tôi có thể kiểm soát chi tiêu tốt hơn và không lo vượt quá ngân sách đã đề ra.",
                  color: "secondary",
                },
                {
                  name: "Linh Anh",
                  role: "Doanh nhân",
                  avatar: "LA",
                  content:
                    "Đồng bộ đa thiết bị rất tiện lợi. Tôi có thể cập nhật chi tiêu trên điện thoại và xem báo cáo chi tiết trên máy tính.",
                  color: "primary",
                },
              ].map((testimonial) => (
                <SwiperSlide key={testimonial.name}>
                  <Card className="border-white/50 bg-white/40 backdrop-blur-md rounded-[32px] hover:shadow-2xl hover:border-primary/30 transition-all duration-500 h-full shadow-sm border">
                    <CardContent className="pt-6">
                      <div className="flex items-center space-x-1 mb-4">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className="h-4 w-4 fill-primary text-primary"
                          />
                        ))}
                      </div>
                      <p className="text-muted-foreground mb-4">
                        "{testimonial.content}"
                      </p>
                      <div className="flex items-center space-x-3">
                        <div
                          className={`h-10 w-10 rounded-full ${testimonial.color === "primary" ? "bg-primary/10" : "bg-secondary/10"} flex items-center justify-center`}
                        >
                          <span
                            className={`text-sm font-medium ${testimonial.color === "primary" ? "text-primary" : "text-secondary"}`}
                          >
                            {testimonial.avatar}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-foreground">
                            {testimonial.name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {testimonial.role}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </SwiperSlide>
              ))}
            </Swiper>
          </div>

          {/* Desktop grid */}
          <motion.div
            className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-8"
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            {[
              {
                name: "Minh Hương",
                role: "Du lịch gia đình",
                avatar: "MH",
                content:
                  "Ứng dụng tuyệt vời! Giúp tôi tiết kiệm được rất nhiều tiền trong chuyến du lịch Đà Nẵng. Giao diện đẹp và dễ sử dụng.",
                color: "primary",
              },
              {
                name: "Tuấn Quang",
                role: "Backpacker",
                avatar: "TQ",
                content:
                  "Tính năng lập ngân sách rất hữu ích. Tôi có thể kiểm soát chi tiêu tốt hơn và không lo vượt quá ngân sách đã đề ra.",
                color: "secondary",
              },
              {
                name: "Linh Anh",
                role: "Doanh nhân",
                avatar: "LA",
                content:
                  "Đồng bộ đa thiết bị rất tiện lợi. Tôi có thể cập nhật chi tiêu trên điện thoại và xem báo cáo chi tiết trên máy tính.",
                color: "primary",
              },
            ].map((testimonial, index) => (
              <motion.div
                key={testimonial.name}
                variants={fadeInUp}
                className="h-full"
              >
                <motion.div {...scaleOnHover} className="h-full">
                  <Card className="border-white/50 bg-white/40 backdrop-blur-md rounded-[32px] hover:shadow-2xl hover:border-primary/30 transition-all duration-500 h-full shadow-sm border">
                    <CardContent className="pt-6">
                      <div className="flex items-center space-x-1 mb-4">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className="h-4 w-4 fill-primary text-primary"
                          />
                        ))}
                      </div>
                      <p className="text-muted-foreground mb-4">
                        "{testimonial.content}"
                      </p>
                      <div className="flex items-center space-x-3">
                        <div
                          className={`h-10 w-10 rounded-full ${testimonial.color === "primary" ? "bg-primary/10" : "bg-secondary/10"} flex items-center justify-center`}
                        >
                          <span
                            className={`text-sm font-medium ${testimonial.color === "primary" ? "text-primary" : "text-secondary"}`}
                          >
                            {testimonial.avatar}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-foreground">
                            {testimonial.name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {testimonial.role}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <motion.section
        className="py-20 bg-primary"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center space-y-8"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl lg:text-5xl font-bold text-primary-foreground text-balance">
              Sẵn sàng cho chuyến du lịch tiếp theo?
            </h2>
            <p className="text-xl text-primary-foreground/80 text-pretty max-w-2xl mx-auto">
              Tham gia cùng hàng nghìn người dùng đã tin tưởng PlanGo để
              quản lý chi tiêu và lên kế hoạch du lịch thông minh.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  size="lg"
                  variant="secondary"
                  className="text-lg px-8 rounded-full h-14"
                >
                  Bắt đầu miễn phí ngay
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  size="lg"
                  variant="outline"
                  className="text-lg px-8 border-white/20 text-white hover:bg-white/10 bg-transparent rounded-full h-14"
                >
                  Xem demo
                </Button>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* Contact Section */}
      <section id="contact" className="py-20 bg-white/40 scroll-mt-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center space-y-4 mb-12"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl lg:text-5xl font-bold text-foreground text-balance">
              Chúng tôi có thể giúp gì?
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Gửi câu hỏi, góp ý hoặc yêu cầu hỗ trợ – chúng tôi sẽ phản hồi sớm
              nhất.
            </p>
          </motion.div>

          <div className="max-w-3xl mx-auto">
            <Card className="border-white/50 bg-white/40 backdrop-blur-md rounded-[40px] shadow-2xl overflow-hidden border">
              <CardContent className="p-8 lg:p-12 space-y-8">
                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-foreground/70 ml-1">
                      Họ và tên
                    </label>
                    <input
                      className="w-full rounded-2xl border border-white/60 bg-white/30 px-5 py-4 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all backdrop-blur-sm"
                      placeholder="Nguyễn Văn A"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-foreground/70 ml-1">
                      Email
                    </label>
                    <input
                      className="w-full rounded-2xl border border-white/60 bg-white/30 px-5 py-4 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all backdrop-blur-sm"
                      placeholder="example@gmail.com"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-foreground/70 ml-1">
                    Nội dung
                  </label>
                  <textarea
                    className="w-full min-h-[160px] rounded-2xl border border-white/60 bg-white/30 px-5 py-4 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all backdrop-blur-sm"
                    placeholder="Bạn muốn chia sẻ điều gì với chúng tôi?"
                  />
                </div>
                <div className="flex justify-end pt-2">
                  <Button className="rounded-full px-10 h-16 text-lg font-bold bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 transition-all">
                    Gửi tin nhắn ngay
                    <ArrowRight className="ml-2 h-6 w-6" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0a1410] pt-24 pb-12 text-white relative overflow-hidden">
        {/* Decorative Liquid Glow in Footer */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-900/20 blur-[150px] -z-10 rounded-full" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-primary/10 blur-[120px] -z-10 rounded-full" />

        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-12 gap-12 lg:gap-24 pb-16">
            {/* Brand Section */}
            <div className="lg:col-span-4 space-y-8">
              <motion.div
                className="flex items-center space-x-3"
                variants={fadeInUp}
                initial="initial"
                whileInView="animate"
                viewport={{ once: true }}
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary shadow-lg shadow-primary/20">
                  <Wallet className="h-7 w-7 text-white" />
                </div>
                <span className="text-3xl font-extrabold tracking-tight text-white">
                  Plan<span className="text-primary">Go</span>
                </span>
              </motion.div>
              <p className="text-slate-400 text-lg leading-relaxed max-w-sm">
                Tham gia cùng hàng nghìn người dùng đã tin tưởng PlanGo để
                quản lý chi tiêu và lên kế hoạch du lịch thông minh.
              </p>
              <div className="flex items-center gap-4">
                {[Facebook, Instagram, Twitter, Github].map((Icon, i) => (
                  <motion.a
                    key={i}
                    href="#"
                    whileHover={{ y: -5, color: "#10b981" }}
                    className="h-12 w-12 rounded-full bg-white/5 flex items-center justify-center text-slate-400 hover:bg-white/10 transition-all border border-white/5"
                  >
                    <Icon className="h-5 w-5" />
                  </motion.a>
                ))}
              </div>
            </div>

            {/* Links Sections */}
            <div className="lg:col-span-4 grid grid-cols-2 gap-8">
              {[
                {
                  title: "Sản phẩm",
                  links: ["Tính năng", "Giá cả", "Bảo mật", "API"],
                },
                {
                  title: "Hỗ trợ",
                  links: ["Trung tâm trợ giúp", "Liên hệ", "Hướng dẫn", "Blog"],
                },
              ].map((section) => (
                <div key={section.title} className="space-y-6">
                  <h3 className="text-lg font-bold text-white uppercase tracking-wider">
                    {section.title}
                  </h3>
                  <ul className="space-y-4">
                    {section.links.map((link) => (
                      <li key={link}>
                        <motion.a
                          href="#"
                          className="text-slate-400 hover:text-white transition-colors flex items-center group"
                          whileHover={{ x: 5 }}
                        >
                          <span className="h-1.5 w-0 bg-primary mr-0 group-hover:w-3 group-hover:mr-2 transition-all rounded-full" />
                          {link}
                        </motion.a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            {/* Newsletter Section */}
            <div className="lg:col-span-4 space-y-8">
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-white uppercase tracking-wider">
                  Đăng ký nhận tin
                </h3>
                <p className="text-slate-400">
                  Nhận các mẹo quản lý tài chính và ưu đãi mới nhất từ chúng
                  tôi.
                </p>
              </div>
              <div className="relative group">
                <input
                  type="email"
                  placeholder="name@email.com"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 pr-16 focus:outline-none focus:border-white focus:ring-1 focus:ring-white/20 transition-all backdrop-blur-sm"
                />
                <button className="absolute right-2 top-2 bottom-2 w-12 rounded-xl bg-primary hover:bg-primary/90 flex items-center justify-center transition-all shadow-lg shadow-primary/20">
                  <ArrowRight className="h-5 w-5 text-white" />
                </button>
              </div>
            </div>
          </div>

          <motion.div
            className="border-t border-white/5 pt-12 text-center text-slate-500 text-sm flex flex-col md:flex-row justify-between items-center gap-6"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5 }}
          >
            <p>&copy; 2026 PlanGo. Tất cả quyền được bảo lưu.</p>
            <div className="flex items-center gap-8">
              <a href="#" className="hover:text-white transition-colors">
                Điều khoản
              </a>
              <a href="#" className="hover:text-white transition-colors">
                Bảo mật
              </a>
            </div>
          </motion.div>
        </div>
      </footer>
    </div>
  );
}
