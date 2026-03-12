import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { auth, db } from "../firebase";
import { doc, getDoc, updateDoc, collection, query, getDocs, orderBy, writeBatch } from "firebase/firestore";
import { signOut, sendPasswordResetEmail, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from "firebase/auth";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import TopMenu from "../components/TopMenu";
import { 
  User, Mail, Phone, Calendar, MapPin, Camera, 
  Settings, LogOut, ChevronRight, Shield, Bell, 
  CreditCard, Globe, Heart, History, Sparkles,
  Edit2, Check, X, CameraIcon, MessageCircle, UserPlus,
  Lock, Eye, EyeOff
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const ProfilePage = () => {
  const { uid } = useParams();
  const [currentUser, setCurrentUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [isFriend, setIsFriend] = useState(false);
  const [isPending, setIsPending] = useState(false);
  
  const [editData, setEditData] = useState({
    fullName: "",
    phoneNumber: "",
    bio: "",
    address: "",
    interests: []
  });
  const [newInterest, setNewInterest] = useState("");
  const [showInterestInput, setShowInterestInput] = useState(false);
  const [stats, setStats] = useState({
    tripsCount: 0,
    friendsCount: 0,
    savedPlaces: 0
  });

  // Password Change State
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [showPass, setShowPass] = useState({ current: false, new: false, confirm: false });
  const [isChangingPass, setIsChangingPass] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (loggedInUser) => {
      setCurrentUser(loggedInUser);
      
      const targetUid = uid || loggedInUser?.uid;
      
      if (!targetUid) {
        if (!loggedInUser) navigate("/login");
        return;
      }

      setIsOwnProfile(!uid || uid === loggedInUser?.uid);
      await fetchUserData(targetUid);
      await fetchStats(targetUid);
      
      if (loggedInUser && targetUid !== loggedInUser.uid) {
        await checkFriendshipStatus(loggedInUser.uid, targetUid);
      }
      
      setLoading(false);
    });
    return () => unsubscribe();
  }, [uid, navigate]);

  const checkFriendshipStatus = async (currentUid, targetUid) => {
    try {
      // Check if already friends (in current user's friends subcollection)
      const friendDoc = await getDoc(doc(db, "users", currentUid, "friends", targetUid));
      if (friendDoc.exists()) {
        setIsFriend(true);
        return;
      }

      // Check for pending requests in local notifications
      const notiRef = doc(db, "users", currentUid, "notifications", targetUid);
      const notiSnap = await getDoc(notiRef);
      
      if (notiSnap.exists()) {
        const notiData = notiSnap.data();
        if (notiData.status === "pending") {
          setIsPending(true);
        }
      }
    } catch (error) {
      console.error("Error checking friendship status:", error);
    }
  };

  const fetchUserData = async (targetUid) => {
    try {
      const docRef = doc(db, "users", targetUid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setUserData(data);
        setEditData({
          fullName: data.fullName || "",
          phoneNumber: data.phoneNumber || "",
          bio: data.bio || "",
          address: data.address || "",
          interests: data.interests || ["Biển", "Leo núi", "Ẩm thực", "Chụp ảnh", "Văn hóa", "Nghỉ dưỡng"]
        });
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

  const fetchStats = async (targetUid) => {
    try {
      // Fetch trips count
      const tripsQuery = query(collection(db, "users", targetUid, "itineraries"));
      const tripsSnap = await getDocs(tripsQuery);
      
      // Fetch friends count
      const friendsQuery = query(collection(db, "users", targetUid, "friends"));
      const friendsSnap = await getDocs(friendsQuery);
      
      setStats({
        tripsCount: 0, // Placeholder or separate logic for taken trips
        friendsCount: friendsSnap.size,
        savedPlaces: tripsSnap.size
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const handleUpdateProfile = async () => {
    if (!currentUser || !isOwnProfile) return;
    setLoading(true);
    try {
      await updateDoc(doc(db, "users", currentUser.uid), {
        ...editData,
        updatedAt: new Date()
      });
      setUserData({ ...userData, ...editData });
      setIsEditing(false);
      setShowInterestInput(false);
      toast.success("Hồ sơ đã được cập nhật!");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Cập nhật thất bại!");
    } finally {
      setLoading(false);
    }
  };

  const addInterest = () => {
    if (newInterest.trim() && !editData.interests.includes(newInterest.trim())) {
      setEditData({
        ...editData,
        interests: [...editData.interests, newInterest.trim()]
      });
      setNewInterest("");
      setShowInterestInput(false);
    }
  };

  const removeInterest = (interestToRemove) => {
    setEditData({
      ...editData,
      interests: editData.interests.filter(i => i !== interestToRemove)
    });
  };

  const handleSendFriendRequest = async () => {
    if (!currentUser || !userData) {
      toast.error("Bạn cần đăng nhập để gửi lời mời!");
      return;
    }

    setLoading(true);
    const batch = writeBatch(db);
    try {
      // 1. Notification for receiver
      const receiverNotiRef = doc(db, "users", uid, "notifications", currentUser.uid);
      batch.set(receiverNotiRef, {
        type: "friendRequest",
        role: "receiver",
        senderId: currentUser.uid,
        senderName: currentUser.displayName || currentUser.email, // Use auth data as backup
        senderEmail: currentUser.email,
        receiverId: uid,
        status: "pending",
        timestamp: new Date(),
      });

      // 2. Notification for sender
      const senderNotiRef = doc(db, "users", currentUser.uid, "notifications", uid);
      batch.set(senderNotiRef, {
        type: "friendRequest",
        role: "sender",
        senderId: currentUser.uid,
        receiverId: uid,
        receiverName: userData.fullName || userData.email,
        receiverEmail: userData.email || "",
        status: "pending",
        timestamp: new Date(),
      });

      await batch.commit();
      setIsPending(true);
      toast.success("Đã gửi lời mời kết bạn!");
    } catch (error) {
      console.error("Error sending friend request:", error);
      toast.error("Gửi lời mời thất bại!");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast.success("Đăng xuất thành công!");
      navigate("/login");
    } catch (error) {
      toast.error("Đăng xuất thất bại!");
    }
  };

  const handlePasswordReset = async () => {
    if (!currentUser?.email) return;
    
    // Check if user is using password provider
    const isPasswordProvider = currentUser.providerData.some(
      (profile) => profile.providerId === 'password'
    );

    if (!isPasswordProvider) {
      toast.error("Tính năng này chỉ dành cho tài khoản đăng ký bằng Email và Mật khẩu.");
      return;
    }

    try {
      await sendPasswordResetEmail(auth, currentUser.email);
      toast.success("Link đặt lại mật khẩu đã được gửi vào email của bạn!", {
        duration: 5000,
        icon: '📧'
      });
    } catch (error) {
      console.error("Error sending reset email:", error);
      toast.error("Gửi email thất bại. Vui lòng thử lại sau.");
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (!currentUser) return;

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("Mật khẩu mới không khớp!");
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error("Mật khẩu mới phải có ít nhất 6 ký tự!");
      return;
    }

    setIsChangingPass(true);
    try {
      // Re-authenticate user first
      const credential = EmailAuthProvider.credential(currentUser.email, passwordData.currentPassword);
      await reauthenticateWithCredential(currentUser, credential);
      
      // Update password
      await updatePassword(currentUser, passwordData.newPassword);
      
      toast.success("Đổi mật khẩu thành công!");
      setShowPasswordModal(false);
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (error) {
      console.error("Error updating password:", error);
      if (error.code === 'auth/wrong-password') {
        toast.error("Mật khẩu hiện tại không chính xác!");
      } else {
        toast.error("Đã xảy ra lỗi khi đổi mật khẩu.");
      }
    } finally {
      setIsChangingPass(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="relative w-20 h-20">
          <div className="absolute inset-0 border-4 border-primary/20 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 relative overflow-x-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 -mr-40 -mt-40 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/2 left-0 -ml-40 w-[500px] h-[500px] bg-blue-400/10 rounded-full blur-[100px] pointer-events-none" />
      
      <TopMenu />

      <main className="relative z-10 max-w-6xl mx-auto px-4 md:px-6 pt-8 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Profile Card */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-4 space-y-6"
          >
            <div className="bg-white/70 backdrop-blur-2xl rounded-[40px] border border-white/60 p-8 shadow-2xl shadow-slate-200/50 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-[100px] -mr-8 -mt-8 transition-all group-hover:scale-110" />
              
              <div className="relative flex flex-col items-center">
                <div className="relative mb-6">
                  <div className="w-32 h-32 rounded-[35%] overflow-hidden border-4 border-white shadow-xl group-hover:rotate-3 transition-transform duration-500">
                    <Avatar className="w-full h-full rounded-none">
                      <AvatarImage src={userData?.profile_img} />
                      <AvatarFallback className="text-3xl font-black bg-gradient-to-br from-primary to-emerald-400 text-white">
                        {userData?.fullName?.charAt(0) || "U"}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <button className="absolute bottom-0 right-0 p-2.5 bg-primary text-white rounded-2xl shadow-lg hover:scale-110 transition-all border-4 border-white">
                    <CameraIcon className="w-4 h-4" />
                  </button>
                </div>

                <h1 className="text-2xl font-black text-slate-800 tracking-tight text-center truncate w-full">
                  {userData?.fullName || "Người dùng ẩn danh"}
                </h1>
                <p className="text-slate-400 font-medium text-sm mb-6">
                  @{userData?.email?.split('@')[0] || 'user'}
                </p>

                <div className="grid grid-cols-3 w-full gap-2 mb-8">
                  <motion.div 
                    whileHover={{ y: -5, backgroundColor: "rgba(248, 250, 252, 0.8)" }}
                    className="bg-slate-50/50 rounded-2xl p-3 text-center border border-slate-100/50 transition-colors cursor-default"
                  >
                    <p className="text-xl font-black text-slate-800">{stats.tripsCount}</p>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Chuyến đi</p>
                  </motion.div>
                  <motion.div 
                    whileHover={{ y: -5, backgroundColor: "rgba(248, 250, 252, 0.8)" }}
                    className="bg-slate-50/50 rounded-2xl p-3 text-center border border-slate-100/50 transition-colors cursor-default"
                  >
                    <p className="text-xl font-black text-slate-800">{stats.friendsCount}</p>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Bạn bè</p>
                  </motion.div>
                  <motion.div 
                    whileHover={{ y: -5, scale: 1.05 }}
                    className="bg-white/50 rounded-2xl p-3 text-center border border-primary/20 shadow-sm transition-all cursor-default"
                  >
                    <p className="text-xl font-black text-primary">{stats.savedPlaces}</p>
                    <p className="text-[10px] font-black text-primary/60 uppercase tracking-wider">Đã lưu</p>
                  </motion.div>
                </div>

                <div className="space-y-3 w-full">
                  {isOwnProfile ? (
                    <>
                      <Button 
                        variant="outline" 
                        className="w-full h-12 rounded-2xl font-bold bg-white/40 border-slate-200 hover:bg-white hover:border-primary/30 transition-all gap-2"
                        onClick={() => navigate('/planning-history')}
                      >
                        <History className="w-4 h-4" />
                        Lịch sử hành trình
                      </Button>
                      <Button 
                        className="w-full h-12 rounded-2xl font-bold bg-slate-900 hover:bg-slate-800 transition-all gap-2 shadow-xl shadow-slate-900/20"
                        onClick={handleLogout}
                      >
                        <LogOut className="w-4 h-4" />
                        Đăng xuất
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button 
                        className={`w-full h-12 rounded-2xl font-bold transition-all gap-2 shadow-xl shadow-primary/20 ${isFriend ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-primary hover:bg-primary/90'}`}
                        disabled={isFriend || isPending}
                        onClick={handleSendFriendRequest}
                      >
                        {isFriend ? (
                          <>
                            <Check className="w-4 h-4" />
                            Đã là bạn bè
                          </>
                        ) : isPending ? (
                          <>
                            <Calendar className="w-4 h-4" />
                            Đang chờ
                          </>
                        ) : (
                          <>
                            <UserPlus className="w-4 h-4" />
                            Kết bạn
                          </>
                        )}
                      </Button>
                      <Button 
                        variant="outline"
                        className="w-full h-12 rounded-2xl font-bold bg-white/40 border-slate-200 hover:bg-white hover:border-primary/30 transition-all gap-2"
                      >
                        <MessageCircle className="w-4 h-4" />
                        Nhắn tin
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Settings - Only show for own profile */}
            {isOwnProfile && (
              <div className="bg-white/50 backdrop-blur-xl rounded-[32px] border border-white/60 p-6 shadow-xl shadow-slate-200/40">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-4 ml-2">Cài đặt nhanh</h3>
                <div className="space-y-1">
                  {[
                    { 
                      icon: Shield, 
                      label: "Quyền riêng tư", 
                      color: "text-emerald-500", 
                      bg: "bg-emerald-50",
                      action: () => toast.success("Sẽ sớm cập nhật!", { icon: "🚀" })
                    },
                    { 
                      icon: Lock, 
                      label: "Đổi mật khẩu", 
                      color: "text-rose-500", 
                      bg: "bg-rose-50",
                      action: () => setShowPasswordModal(true) 
                    },
                    { 
                      icon: Bell, 
                      label: "Thông báo", 
                      color: "text-blue-500", 
                      bg: "bg-blue-50",
                      action: () => toast.success("Sẽ sớm cập nhật!", { icon: "🚀" })
                    },
                    { 
                      icon: Globe, 
                      label: "Ngôn ngữ", 
                      color: "text-amber-500", 
                      bg: "bg-amber-50",
                      action: () => toast.success("Sẽ sớm cập nhật!", { icon: "🚀" })
                    },
                  ].map((item, i) => (
                    <button 
                      key={i} 
                      onClick={item.action}
                      className="flex items-center justify-between w-full p-3 rounded-2xl hover:bg-white/80 transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 ${item.bg} rounded-xl flex items-center justify-center transition-transform group-hover:rotate-6`}>
                          <item.icon className={`w-5 h-5 ${item.color}`} />
                        </div>
                        <span className="text-sm font-bold text-slate-600">{item.label}</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </motion.div>

          {/* Right Column: Info */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-8 space-y-8"
          >
            <div className="bg-white/80 backdrop-blur-2xl rounded-[40px] border border-white border-white/80 shadow-2xl shadow-slate-200/50 p-8 md:p-10 relative overflow-hidden">
              <div className="flex items-center justify-between mb-10">
                <div>
                  <h2 className="text-3xl font-black text-slate-800 tracking-tight">
                    {isOwnProfile ? "Hồ sơ cá nhân" : "Thông tin cá nhân"}
                  </h2>
                  <p className="text-slate-400 font-medium">
                    {isOwnProfile ? "Quản lý thông tin và tài khoản của bạn" : `Khám phá hồ sơ của ${userData?.fullName}`}
                  </p>
                </div>
                {isOwnProfile && (
                  !isEditing ? (
                    <Button 
                      onClick={() => setIsEditing(true)}
                      className="rounded-2xl px-6 h-12 font-black gap-2 transition-all hover:scale-105 btn-liquid"
                    >
                      <div className="btn-liquid-shine" />
                      <Edit2 className="w-4 h-4 relative z-10" />
                      <span className="relative z-10">Chỉnh sửa</span>
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button 
                        variant="ghost"
                        onClick={() => setIsEditing(false)}
                        className="rounded-2xl h-12 font-bold text-slate-400 hover:bg-slate-100"
                      >
                        <X className="w-4 h-4 mr-2" />
                        Hủy
                      </Button>
                      <Button 
                        onClick={handleUpdateProfile}
                        className="rounded-2xl px-6 h-12 font-black gap-2 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20"
                      >
                        <Check className="w-4 h-4" />
                        Lưu thay đổi
                      </Button>
                    </div>
                  )
                )}
              </div>

              <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Họ và tên</Label>
                    {!isEditing ? (
                      <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-100 font-bold flex items-center gap-3">
                        <User className="w-5 h-5 text-slate-300" />
                        {userData?.fullName || "Chưa thiết lập"}
                      </div>
                    ) : (
                      <div className="relative group">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-primary transition-colors" />
                        <Input 
                          value={editData.fullName}
                          onChange={(e) => setEditData({...editData, fullName: e.target.value})}
                          className="h-14 pl-12 rounded-2xl bg-white border-slate-200 focus:ring-primary/20 focus:border-primary transition-all font-bold"
                        />
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Số điện thoại</Label>
                    {!isEditing ? (
                      <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-100 font-bold flex items-center gap-3">
                        <Phone className="w-5 h-5 text-slate-300" />
                        {(!isOwnProfile && !isFriend) ? "xxxxxxxxxx" : (userData?.phoneNumber || "Chưa cập nhật")}
                      </div>
                    ) : (
                      <div className="relative group">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-primary transition-colors" />
                        <Input 
                          value={editData.phoneNumber}
                          onChange={(e) => setEditData({...editData, phoneNumber: e.target.value})}
                          className="h-14 pl-12 rounded-2xl bg-white border-slate-200 focus:ring-primary/20 focus:border-primary transition-all font-bold"
                          type="tel"
                        />
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email</Label>
                    <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-100 font-bold flex items-center gap-3 opacity-70">
                      <Mail className="w-5 h-5 text-slate-300" />
                      {userData?.email}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Địa chỉ</Label>
                    {!isEditing ? (
                      <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-100 font-bold flex items-center gap-3">
                        <MapPin className="w-5 h-5 text-slate-300" />
                        {(!isOwnProfile && !isFriend) ? "Quyền riêng tư" : (userData?.address || "Chưa cập nhật")}
                      </div>
                    ) : (
                      <div className="relative group">
                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-primary transition-colors" />
                        <Input 
                          value={editData.address}
                          onChange={(e) => setEditData({...editData, address: e.target.value})}
                          className="h-14 pl-12 rounded-2xl bg-white border-slate-200 focus:ring-primary/20 focus:border-primary transition-all font-bold"
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Giới thiệu</Label>
                  {!isEditing ? (
                    <div className="p-5 bg-slate-50/80 rounded-[24px] border border-slate-100 font-medium italic text-slate-500 min-h-[120px] leading-relaxed">
                      {userData?.bio || "Chia sẻ điều gì đó về bản thân bạn..."}
                    </div>
                  ) : (
                    <textarea 
                      value={editData.bio}
                      onChange={(e) => setEditData({...editData, bio: e.target.value})}
                      className="w-full min-h-[120px] p-5 rounded-[24px] bg-white border border-slate-200 focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all font-medium resize-none shadow-sm leading-relaxed"
                      placeholder="Chia sẻ về sở thích du lịch của bạn..."
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Achievement / Badges section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gradient-to-br from-primary via-emerald-600 to-teal-700 rounded-[32px] p-8 text-white relative overflow-hidden shadow-2xl shadow-primary/20 group border border-white/10">
                <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20 animate-pulse" />
                <Sparkles className="absolute top-4 right-4 w-20 h-20 text-white/5 -rotate-12 transition-transform group-hover:scale-125 group-hover:rotate-0 duration-700" />
                <div className="relative z-10">
                  <h3 className="text-2xl font-black mb-1 italic tracking-tight">Hành trình Khám phá</h3>
                  <p className="text-white/70 text-[10px] font-black uppercase tracking-[0.2em] mb-6">
                    Hạng: {userData?.visitedProvinces?.length >= 30 ? "Nhà thám hiểm" : userData?.visitedProvinces?.length >= 15 ? "Lữ hành gia" : "Người khởi hành"}
                  </p>
                  
                  <div className="flex items-center gap-3 mb-6">
                    <div className="h-3 flex-1 bg-black/20 rounded-full overflow-hidden backdrop-blur-sm border border-white/5">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(((userData?.visitedProvinces?.length || 0) / 63) * 100, 100)}%` }}
                        transition={{ duration: 1.5, ease: "easeOut", delay: 0.5 }}
                        className="h-full bg-gradient-to-r from-teal-200 to-white rounded-full shadow-[0_0_15px_rgba(255,255,255,0.5)]"
                      />
                    </div>
                    <span className="text-sm font-black text-white/90">
                      {Math.round(((userData?.visitedProvinces?.length || 0) / 63) * 100)}%
                    </span>
                  </div>
                  <p className="text-white font-medium leading-relaxed drop-shadow-sm">
                    Bạn đã khám phá được <span className="font-black text-teal-200">{userData?.visitedProvinces?.length || 0} tỉnh thành</span> tại Việt Nam. Tiếp tục hành trình để nhận huy hiệu cao cấp hơn!
                  </p>
                </div>
              </div>

              <div className="bg-white/70 backdrop-blur-xl rounded-[32px] border border-white p-8 border-slate-200/50 shadow-xl shadow-slate-200/40 group">
                 <h3 className="text-xl font-black text-slate-800 mb-6 flex items-center justify-between gap-2">
                   <div className="flex items-center gap-2">
                     <Heart className="w-5 h-5 text-rose-500 fill-rose-500" />
                     Sở thích
                   </div>
                   {isEditing && (
                     <Sparkles className="w-4 h-4 text-primary animate-pulse" />
                   )}
                 </h3>
                 <div className="flex flex-wrap gap-2">
                   {(!isEditing ? (userData?.interests || []) : editData.interests).map((tag, i) => (
                     <div 
                       key={i}
                       className="group/tag relative"
                     >
                       <span 
                         className="px-4 py-2 bg-slate-100/80 text-slate-600 rounded-xl text-xs font-bold transition-all cursor-default flex items-center gap-2 hover:bg-slate-200"
                       >
                         {tag}
                         {isEditing && isOwnProfile && (
                           <button 
                             onClick={() => removeInterest(tag)}
                             className="hover:text-rose-500 transition-colors"
                           >
                             <X className="w-3 h-3" />
                           </button>
                         )}
                       </span>
                     </div>
                   ))}
                   
                   {isEditing && isOwnProfile && (
                     <div className="flex flex-col gap-2 w-full mt-2">
                       {showInterestInput ? (
                         <div className="flex gap-2 animate-in slide-in-from-left-2 duration-300">
                           <Input 
                             value={newInterest}
                             onChange={(e) => setNewInterest(e.target.value)}
                             onKeyDown={(e) => e.key === 'Enter' && addInterest()}
                             placeholder="Nhập sở thích mới..."
                             className="h-10 rounded-xl text-xs font-bold"
                             autoFocus
                           />
                           <Button 
                             onClick={addInterest}
                             className="h-10 px-4 rounded-xl text-xs font-bold"
                           >
                             Thêm
                           </Button>
                           <Button 
                             variant="ghost"
                             onClick={() => setShowInterestInput(false)}
                             className="h-10 px-3 rounded-xl"
                           >
                             <X className="w-4 h-4" />
                           </Button>
                         </div>
                       ) : (
                         <button 
                           onClick={() => setShowInterestInput(true)}
                           className="w-fit px-4 py-2 border border-dashed border-slate-300 text-slate-400 rounded-xl text-xs font-bold hover:border-primary hover:text-primary transition-all flex items-center gap-2"
                         >
                           <Sparkles className="w-3 h-3" />
                           + Thêm sở thích
                         </button>
                       )}
                     </div>
                   )}
                 </div>
              </div>
            </div>
          </motion.div>
        </div>
      </main>

      {/* Password Change Modal */}
      <AnimatePresence>
        {showPasswordModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPasswordModal(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-[40px] shadow-2xl p-8 border border-white"
            >
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Lock className="w-8 h-8 text-rose-500" />
                </div>
                <h3 className="text-2xl font-black text-slate-800">Đổi mật khẩu</h3>
                <p className="text-slate-400 font-medium">Nhập thông tin bên dưới để cập nhật bảo mật</p>
              </div>

              <form onSubmit={handleUpdatePassword} className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mật khẩu hiện tại</Label>
                  <div className="relative">
                    <Input 
                      type={showPass.current ? "text" : "password"}
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                      className="h-14 rounded-2xl bg-slate-50 border-slate-100 focus:bg-white transition-all font-bold pr-12"
                      placeholder="••••••••"
                      required
                    />
                    <button 
                      type="button"
                      onClick={() => setShowPass({...showPass, current: !showPass.current})}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500"
                    >
                      {showPass.current ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mật khẩu mới</Label>
                  <div className="relative">
                    <Input 
                      type={showPass.new ? "text" : "password"}
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                      className="h-14 rounded-2xl bg-slate-50 border-slate-100 focus:bg-white transition-all font-bold pr-12"
                      placeholder="••••••••"
                      required
                    />
                    <button 
                      type="button"
                      onClick={() => setShowPass({...showPass, new: !showPass.new})}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500"
                    >
                      {showPass.new ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Xác nhận mật khẩu mới</Label>
                  <div className="relative">
                    <Input 
                      type={showPass.confirm ? "text" : "password"}
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                      className="h-14 rounded-2xl bg-slate-50 border-slate-100 focus:bg-white transition-all font-bold pr-12"
                      placeholder="••••••••"
                      required
                    />
                    <button 
                      type="button"
                      onClick={() => setShowPass({...showPass, confirm: !showPass.confirm})}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500"
                    >
                      {showPass.confirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button 
                    type="button"
                    variant="ghost"
                    onClick={() => setShowPasswordModal(false)}
                    className="flex-1 h-14 rounded-2xl font-bold text-slate-400"
                  >
                    Hủy
                  </Button>
                  <Button 
                    type="submit"
                    disabled={isChangingPass}
                    className="flex-[2] h-14 rounded-2xl font-black bg-rose-500 hover:bg-rose-600 shadow-xl shadow-rose-200 transition-all"
                  >
                    {isChangingPass ? "Đang xử lý..." : "Xác nhận đổi"}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProfilePage;
