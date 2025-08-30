"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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
} from "lucide-react"
import { motion } from "framer-motion"

const fadeInUp = {
  initial: { opacity: 0, y: 60 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: "easeOut" },
}

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
}

const scaleOnHover = {
  whileHover: { scale: 1.05 },
  transition: { type: "spring", stiffness: 300 },
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50"
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <motion.div className="flex items-center space-x-2" whileHover={{ scale: 1.05 }}>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <Wallet className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold text-foreground">TravelBudget</span>
            </motion.div>

            <nav className="hidden md:flex items-center space-x-8">
              {["Tính năng", "Đánh giá", "Giá cả", "Liên hệ"].map((item, index) => (
                <motion.a
                  key={item}
                  href={`#${item.toLowerCase()}`}
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 + 0.2 }}
                  whileHover={{ y: -2 }}
                >
                  {item}
                </motion.a>
              ))}
            </nav>

            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm" className="hidden sm:inline-flex bg-transparent">
                Đăng nhập
              </Button>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button size="sm">Bắt đầu ngay</Button>
              </motion.div>
              <Button variant="ghost" size="sm" className="md:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Hero Section */}
      <section className="py-20 lg:py-32">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              className="space-y-8"
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <div className="space-y-4">
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <Badge variant="secondary" className="w-fit">
                    🎉 Mới ra mắt - Miễn phí 30 ngày đầu
                  </Badge>
                </motion.div>
                <motion.h1
                  className="text-4xl lg:text-6xl font-bold text-foreground text-balance"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.8 }}
                >
                  Quản lý chi tiêu, lên kế hoạch du lịch <span className="text-primary">dễ dàng</span>
                </motion.h1>
                <motion.p
                  className="text-xl text-muted-foreground text-pretty max-w-2xl"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.6 }}
                >
                  Theo dõi chi tiêu thông minh, lập ngân sách hiệu quả và lên kế hoạch cho những chuyến du lịch hoàn
                  hảo. Tất cả trong một ứng dụng đơn giản và dễ sử dụng.
                </motion.p>
              </div>

              <motion.div
                className="flex flex-col sm:flex-row gap-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button size="lg" className="text-lg px-8">
                    Bắt đầu miễn phí
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button variant="outline" size="lg" className="text-lg px-8 bg-transparent">
                    Tìm hiểu thêm
                  </Button>
                </motion.div>
              </motion.div>

              <motion.div
                className="flex items-center space-x-8 pt-4"
                variants={staggerContainer}
                initial="initial"
                animate="animate"
              >
                {["Miễn phí 30 ngày", "Không cần thẻ tín dụng", "Hủy bất cứ lúc nào"].map((text, index) => (
                  <motion.div key={text} className="flex items-center space-x-2" variants={fadeInUp}>
                    <CheckCircle className="h-5 w-5 text-primary" />
                    <span className="text-sm text-muted-foreground">{text}</span>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>

            <motion.div
              className="relative"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <div className="relative z-10">
                <motion.img
                  src="/modern-travel-planning-app-interface-showing-expen.png"
                  alt="TravelBudget App Interface"
                  className="w-full max-w-md mx-auto rounded-2xl shadow-2xl"
                  whileHover={{ scale: 1.05, rotateY: 5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                />
              </div>
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-2xl blur-3xl transform scale-110"
                animate={{
                  scale: [1.1, 1.2, 1.1],
                  opacity: [0.3, 0.5, 0.3],
                }}
                transition={{
                  duration: 4,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: "easeInOut",
                }}
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center space-y-4 mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <Badge variant="outline" className="w-fit mx-auto">
              Tính năng nổi bật
            </Badge>
            <h2 className="text-3xl lg:text-5xl font-bold text-foreground text-balance">
              Mọi thứ bạn cần cho chuyến du lịch hoàn hảo
            </h2>
            <p className="text-xl text-muted-foreground text-pretty max-w-3xl mx-auto">
              Từ việc theo dõi chi tiêu hàng ngày đến lập kế hoạch chi tiết cho chuyến du lịch, chúng tôi có tất cả
              những gì bạn cần.
            </p>
          </motion.div>

          <motion.div
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
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
              <motion.div key={feature.title} variants={fadeInUp}>
                <motion.div {...scaleOnHover}>
                  <Card className="border-border hover:shadow-lg transition-shadow h-full">
                    <CardHeader>
                      <div className="flex items-center space-x-3">
                        <div className={`flex h-12 w-12 items-center justify-center rounded-lg bg-${feature.color}/10`}>
                          <feature.icon className={`h-6 w-6 text-${feature.color}`} />
                        </div>
                        <CardTitle>{feature.title}</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="text-base">{feature.description}</CardDescription>
                    </CardContent>
                  </Card>
                </motion.div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center space-y-4 mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <Badge variant="outline" className="w-fit mx-auto">
              Khách hàng nói gì
            </Badge>
            <h2 className="text-3xl lg:text-5xl font-bold text-foreground text-balance">
              Được tin tưởng bởi hàng nghìn người dùng
            </h2>
          </motion.div>

          <motion.div
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
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
              <motion.div key={testimonial.name} variants={fadeInUp}>
                <motion.div {...scaleOnHover}>
                  <Card className="border-border h-full">
                    <CardContent className="pt-6">
                      <div className="flex items-center space-x-1 mb-4">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                        ))}
                      </div>
                      <p className="text-muted-foreground mb-4">"{testimonial.content}"</p>
                      <div className="flex items-center space-x-3">
                        <div
                          className={`h-10 w-10 rounded-full bg-${testimonial.color}/10 flex items-center justify-center`}
                        >
                          <span className={`text-sm font-medium text-${testimonial.color}`}>{testimonial.avatar}</span>
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{testimonial.name}</p>
                          <p className="text-sm text-muted-foreground">{testimonial.role}</p>
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
              Tham gia cùng hàng nghìn người dùng đã tin tưởng TravelBudget để quản lý chi tiêu và lên kế hoạch du lịch
              thông minh.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button size="lg" variant="secondary" className="text-lg px-8">
                  Bắt đầu miễn phí ngay
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  size="lg"
                  variant="outline"
                  className="text-lg px-8 border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10 bg-transparent"
                >
                  Xem demo
                </Button>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* Footer */}
      <footer className="bg-muted py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="grid md:grid-cols-2 lg:grid-cols-4 gap-8"
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            <motion.div className="space-y-4" variants={fadeInUp}>
              <div className="flex items-center space-x-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                  <Wallet className="h-5 w-5 text-primary-foreground" />
                </div>
                <span className="text-xl font-bold text-foreground">TravelBudget</span>
              </div>
              <p className="text-muted-foreground">
                Ứng dụng quản lý chi tiêu và lên kế hoạch du lịch thông minh cho người Việt.
              </p>
            </motion.div>

            {[
              {
                title: "Sản phẩm",
                links: ["Tính năng", "Giá cả", "Bảo mật", "API"],
              },
              {
                title: "Hỗ trợ",
                links: ["Trung tâm trợ giúp", "Liên hệ", "Hướng dẫn", "Blog"],
              },
              {
                title: "Pháp lý",
                links: ["Chính sách bảo mật", "Điều khoản sử dụng", "Cookie"],
              },
            ].map((section, index) => (
              <motion.div key={section.title} className="space-y-4" variants={fadeInUp}>
                <h3 className="font-semibold text-foreground">{section.title}</h3>
                <ul className="space-y-2 text-muted-foreground">
                  {section.links.map((link) => (
                    <li key={link}>
                      <motion.a href="#" className="hover:text-foreground transition-colors" whileHover={{ x: 5 }}>
                        {link}
                      </motion.a>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </motion.div>

          <motion.div
            className="border-t border-border mt-12 pt-8 text-center text-muted-foreground"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5 }}
          >
            <p>&copy; 2024 TravelBudget. Tất cả quyền được bảo lưu.</p>
          </motion.div>
        </div>
      </footer>
    </div>
  )
}