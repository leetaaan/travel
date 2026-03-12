import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useTheme } from "../contexts/ThemeContext";
import { auth, db } from "../firebase";
import { signOut } from "firebase/auth";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  onSnapshot,
  updateDoc,
  writeBatch,
  arrayUnion,
  deleteDoc,
} from "firebase/firestore";
import { toast } from "react-hot-toast";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { History, Sparkles } from "lucide-react";

const TopMenu = () => {
  const { isDark, toggleTheme } = useTheme();
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [friendsList, setFriendsList] = useState([]); // Requests sent by current user
  const [pendingRequests, setPendingRequests] = useState([]); // Requests sent by current user
  const navigate = useNavigate();
  const location = useLocation();
  const isPlanningPage = location.pathname === "/planning";
  const dropdownRef = useRef(null);
  const notificationRef = useRef(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const docRef = doc(db, "users", currentUser.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setUserData(docSnap.data());
        }

        // Listen for notifications
        const notificationsQuery = collection(db, "users", currentUser.uid, "notifications");
        const unsubscribeNotifications = onSnapshot(notificationsQuery, (snapshot) => {
          const allNotifications = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          
          // Filter for UI display:
          // 1. Pending requests where I am the receiver
          // 2. Accepted requests where I am EITHER sender or receiver (not yet read)
          const displayNotifications = allNotifications.filter(n => 
            (n.role === "receiver" && n.status === "pending") ||
            (n.status === "accepted" && !n.read)
          );
          
          setNotifications(displayNotifications);
          
          // Also track all my outgoing pending requests for button states
          const sentRequests = allNotifications.filter(n => 
            n.type === "friendRequest" && n.role === "sender" && n.status === "pending"
          );
          setPendingRequests(sentRequests);
        });

        // Listen for group invitations (keeping it separate if not migrated yet)
        const groupInvitationsQuery = query(
          collection(db, "groupInvitations"),
          where("receiverId", "==", currentUser.uid),
          where("status", "==", "pending"),
        );
        const unsubscribeGroupInvitations = onSnapshot(
          groupInvitationsQuery,
          (snapshot) => {
            const newInvitations = snapshot.docs.map((doc) => ({
              id: doc.id,
              type: "groupInvitation",
              ...doc.data(),
            }));
            setNotifications((prev) => [
              ...prev.filter((n) => n.type !== "groupInvitation"),
              ...newInvitations,
            ]);
          },
        );

        // Listen for friends list from subcollection
        const friendsSubcollectionQuery = collection(
          db,
          "users",
          currentUser.uid,
          "friends",
        );
        const unsubscribeFriends = onSnapshot(
          friendsSubcollectionQuery,
          (snapshot) => {
            const friends = snapshot.docs.map((doc) => doc.id);
            setFriendsList(friends);
          },
        );

        return () => {
          unsubscribeNotifications();
          unsubscribeGroupInvitations();
          unsubscribeFriends();
        };
      } else {
        setUserData(null);
        setNotifications([]);
        setFriendsList([]);
        setPendingRequests([]);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target)
      ) {
        setNotificationOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Helper for smarter matching
  const isSmartMatch = (text, search) => {
    if (!text || !search) return false;
    const normalizedText = text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    const normalizedSearch = search.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    return normalizedText.includes(normalizedSearch);
  };

  // Debounce search term
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      const trimmedSearch = searchTerm.trim();
      if (trimmedSearch !== "") {
        const usersRef = collection(db, "users");
        
        // Create multiple variations for Firestore "starts with" query
        // Firestore is case-sensitive, so we try:
        // 1. As is
        // 2. lowercase
        // 3. Capitalized (FirstName LastName)
        const searchVariations = [
          trimmedSearch,
          trimmedSearch.toLowerCase(),
          trimmedSearch.charAt(0).toUpperCase() + trimmedSearch.slice(1)
        ];

        const queries = [];
        searchVariations.forEach(term => {
          queries.push(query(usersRef, where("fullName", ">=", term), where("fullName", "<=", term + "\uf8ff")));
          queries.push(query(usersRef, where("email", ">=", term.toLowerCase()), where("email", "<=", term.toLowerCase() + "\uf8ff")));
        });

        try {
          const snapshots = await Promise.all(queries.map(q => getDocs(q)));
          let allResults = [];
          
          snapshots.forEach(snapshot => {
            snapshot.forEach(doc => {
              if (doc.id !== user?.uid) {
                allResults.push({ id: doc.id, ...doc.data() });
              }
            });
          });

          // Deduplicate by ID
          const uniqueResults = Array.from(new Map(allResults.map(item => [item.id, item])).values());

          // Smart Client-side Filter: 
          // Sort results: prioritizes exact matches, then starts-with, then contains
          const finalResults = uniqueResults.sort((a, b) => {
            const nameA = a.fullName || a.email || "";
            const nameB = b.fullName || b.email || "";
            
            const startA = nameA.toLowerCase().startsWith(trimmedSearch.toLowerCase());
            const startB = nameB.toLowerCase().startsWith(trimmedSearch.toLowerCase());
            
            if (startA && !startB) return -1;
            if (!startA && startB) return 1;
            return 0;
          });

          setSearchResults(finalResults.slice(0, 8)); // Limit to top 8 results
        } catch (error) {
          console.error("Search error:", error);
        }
      } else {
        setSearchResults([]);
      }
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, user]);

  const handleClearSearch = () => {
    setSearchTerm("");
    setSearchResults([]);
  };

  const sendFriendRequest = async (receiverId, receiverName, receiverEmail) => {
    if (!user) {
      toast.error("Bạn cần đăng nhập để gửi lời mời kết bạn.");
      return;
    }

    // Check if already friends
    const friendDocRef = doc(db, "users", user.uid, "friends", receiverId);
    const friendDocSnap = await getDoc(friendDocRef);
    if (friendDocSnap.exists()) {
      toast("Bạn và người này đã là bạn bè.");
      return;
    }

    // Check for existing request in notifications
    const myRequestRef = doc(db, "users", user.uid, "notifications", receiverId);
    const myRequestSnap = await getDoc(myRequestRef);
    if (myRequestSnap.exists()) {
      toast("Lời mời kết bạn đang chờ xử lý.");
      return;
    }

    const batch = writeBatch(db);
    try {
      // 1. Notification for receiver
      const receiverNotiRef = doc(db, "users", receiverId, "notifications", user.uid);
      batch.set(receiverNotiRef, {
        type: "friendRequest",
        role: "receiver",
        senderId: user.uid,
        senderName: userData.fullName || userData.email,
        senderEmail: userData.email,
        receiverId: receiverId,
        status: "pending",
        timestamp: new Date(),
      });

      // 2. Notification for sender (to track)
      const senderNotiRef = doc(db, "users", user.uid, "notifications", receiverId);
      batch.set(senderNotiRef, {
        type: "friendRequest",
        role: "sender",
        senderId: user.uid,
        receiverId: receiverId,
        receiverName: receiverName || "Người dùng",
        receiverEmail: receiverEmail || "",
        status: "pending",
        timestamp: new Date(),
      });

      await batch.commit();
      toast.success("Đã gửi lời mời kết bạn!");
    } catch (error) {
      console.error("Error sending friend request:", error);
      toast.error("Gửi lời mời kết bạn thất bại.");
    }
  };

  const handleAcceptFriendRequest = async (notification) => {
    if (!user) return;

    const batch = writeBatch(db);
    const senderId = notification.senderId;

    // 1. Update/Delete notifications on both sides
    const receiverNotiRef = doc(db, "users", user.uid, "notifications", senderId);
    const senderNotiRef = doc(db, "users", senderId, "notifications", user.uid);
    
    // Instead of deleting, we update to 'accepted' as per user screenshot interest?
    // Actually, usually it's cleaner to delete, but let's keep it as history if needed.
    // User said "luu la noti", let's update status.
    batch.update(receiverNotiRef, { status: "accepted" });
    batch.update(senderNotiRef, { status: "accepted" });

    // 2. Add sender to current user's friends subcollection
    const currentUserFriendRef = doc(db, "users", user.uid, "friends", senderId);
    batch.set(currentUserFriendRef, {
      uid: senderId,
      fullName: notification.senderName || "Người dùng",
      email: notification.senderEmail || "",
      addedAt: new Date(),
    });

    // 3. Add current user to sender's friends subcollection
    const senderFriendRef = doc(db, "users", senderId, "friends", user.uid);
    batch.set(senderFriendRef, {
      uid: user.uid,
      fullName: userData.fullName || userData.email || "Người dùng",
      email: userData.email || "",
      addedAt: new Date(),
    });

    try {
      await batch.commit();
      toast.success("Đã chấp nhận lời mời kết bạn!");
    } catch (error) {
      console.error("Error accepting friend request:", error);
      toast.error("Chấp nhận lời mời kết bạn thất bại.");
    }
  };

  const handleRejectFriendRequest = async (notification) => {
    if (!user) return;
    const senderId = notification.senderId;

    try {
      const batch = writeBatch(db);
      const receiverNotiRef = doc(db, "users", user.uid, "notifications", senderId);
      const senderNotiRef = doc(db, "users", senderId, "notifications", user.uid);
      
      batch.update(receiverNotiRef, { status: "declined" });
      batch.update(senderNotiRef, { status: "declined" });
      
      await batch.commit();
      toast.success("Đã từ chối lời mời kết bạn.");
    } catch (error) {
      console.error("Error rejecting friend request:", error);
      toast.error("Từ chối lời mời kết bạn thất bại.");
    }
  };

  const handleAcceptGroupInvitation = async (notification) => {
    if (!user) return;

    if (notification.receiverId !== user.uid) {
      toast.error("Bạn không có quyền chấp nhận lời mời này!");
      return;
    }

    const batch = writeBatch(db);

    // 1. Update group invitation status to 'accepted'
    const invitationRef = doc(db, "groupInvitations", notification.id);
    batch.update(invitationRef, { status: "accepted" });

    // 2. Add current user to group members
    const groupRef = doc(db, "groups", notification.groupId);
    batch.update(groupRef, {
      members: arrayUnion(user.uid),
    });

    try {
      await batch.commit();
      // Delete the group invitation document after successful acceptance
      await deleteDoc(invitationRef);
      toast.success("Đã chấp nhận lời mời tham gia nhóm!");
    } catch (error) {
      console.error("Error accepting group invitation:", error);
      toast.error("Chấp nhận lời mời tham gia nhóm thất bại.");
    }
  };

  const handleRejectGroupInvitation = async (notification) => {
    if (!user) return;

    try {
      const invitationRef = doc(db, "groupInvitations", notification.id);
      await updateDoc(invitationRef, { status: "declined" });
      // Delete the group invitation document after successful rejection
      await deleteDoc(invitationRef);
      toast.success("Đã từ chối lời mời tham gia nhóm.");
    } catch (error) {
      console.error("Error rejecting group invitation:", error);
      toast.error("Từ chối lời mời tham gia nhóm thất bại.");
    }
  };

  const handleMarkAsRead = async (notification) => {
    try {
      const notiRef = doc(db, "users", user.uid, "notifications", notification.id);
      await updateDoc(notiRef, { read: true });
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast.success("Đăng xuất thành công!");
      navigate("/login");
    } catch (error) {
      console.error("Error logging out:", error);
      toast.error("Đăng xuất thất bại!");
    }
  };

  const handleProfileClick = () => {
    setDropdownOpen(false);
    toast.success("Chuyển đến trang Hồ sơ!");
    navigate("/profile");
  };

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <div className="bg-white/40 backdrop-blur-xl border-b border-white/60 px-6 py-4 flex justify-between items-center sticky top-0 z-[100] transition-all duration-300 shadow-sm">
      <div className="flex items-center space-x-4">
        <Link to="/home" className="flex items-center space-x-3 group">
          <span className="text-2xl font-black tracking-tighter text-slate-800 italic">
            Plan<span className="text-primary">Go</span>
          </span>
        </Link>
      </div>

      {/* Mobile Menu Button */}
      <div className="md:hidden">
        <button
          onClick={toggleMobileMenu}
          className="p-3 rounded-full text-muted-foreground hover:text-foreground hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring transition-all duration-200"
        >
          <svg
            className="h-6 w-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            {isMobileMenuOpen ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 6h16M4 12h16m-7 6h7"
              />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 w-full bg-white/90 backdrop-blur-2xl shadow-xl rounded-b-[32px] p-6 border-t border-white/60 z-[101]">
          <div className="flex flex-col space-y-4">
            {user && userData ? (
              <>
                {isPlanningPage ? (
                  <Link
                    to="/planning-history"
                    className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full py-2 px-6 transition-all duration-200 font-medium shadow-md hover:shadow-lg text-center flex items-center justify-center gap-2"
                  >
                    <History className="w-4 h-4" />
                    Lịch sử Lập kế hoạch
                  </Link>
                ) : (
                  <Link
                    to="/planning"
                    className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full py-2 px-6 transition-all duration-200 font-medium shadow-md hover:shadow-lg text-center flex items-center justify-center gap-2"
                  >
                    <Sparkles className="w-4 h-4" />
                    Xây dựng lịch trình
                  </Link>
                )}
                <button
                  onClick={handleProfileClick}
                  className="flex items-center w-full text-left px-4 py-3 text-sm text-foreground hover:bg-accent transition-colors"
                >
                  <svg
                    className="w-4 h-4 mr-3 text-muted-foreground"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    ></path>
                  </svg>
                  <span>Hồ sơ</span>
                </button>
                <button
                  onClick={toggleTheme}
                  className="flex items-center w-full text-left px-4 py-3 text-sm text-foreground hover:bg-accent transition-colors"
                >
                  {isDark ? (
                    <svg
                      className="w-4 h-4 mr-3 text-yellow-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                      ></path>
                    </svg>
                  ) : (
                    <svg
                      className="w-4 h-4 mr-3 text-muted-foreground"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                      ></path>
                    </svg>
                  )}
                  <span>{isDark ? "Chế độ sáng" : "Chế độ tối"}</span>
                </button>
                <button
                  onClick={handleLogout}
                  className="flex items-center w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors border-t border-border"
                >
                  <svg
                    className="w-4 h-4 mr-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                    ></path>
                  </svg>
                  <span>Đăng xuất</span>
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="bg-gradient-to-r from-primary to-secondary text-white px-6 py-2 rounded-full hover:from-primary/90 hover:to-secondary/90 transition-all duration-200 font-medium shadow-md hover:shadow-lg transform hover:scale-105 text-center"
              >
                Đăng nhập
              </Link>
            )}
          </div>
        </div>
      )}

      <div className="hidden md:flex flex-1 justify-center mx-6 relative">
        <div className="relative w-full max-w-md">
          <input
            type="text"
            placeholder="Tìm kiếm bạn bè..."
            className="border border-white/60 rounded-full py-3 pl-12 pr-12 w-full focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary/40 bg-white/40 hover:bg-white/60 transition-all duration-300 shadow-sm text-slate-700 placeholder-slate-400 group"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none group-hover:scale-110 transition-transform">
            <svg
              className="h-5 w-5 text-slate-400 group-hover:text-primary transition-colors"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              ></path>
            </svg>
          </div>
          {searchTerm && (
            <button
              onClick={handleClearSearch}
              className="absolute inset-y-0 right-0 pr-4 flex items-center focus:outline-none hover:text-foreground transition-colors"
            >
              <svg
                className="h-5 w-5 text-muted-foreground"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                ></path>
              </svg>
            </button>
          )}
        </div>
        {searchResults.length > 0 && searchTerm.trim() !== "" && (
          <div className="absolute top-full mt-3 w-full max-w-md bg-white/90 backdrop-blur-2xl border border-white/60 rounded-[28px] shadow-2xl z-[110] overflow-hidden">
            {searchResults.map((result) => (
              <div
                key={result.id}
                onClick={() => {
                  navigate(`/profile/${result.id}`);
                  setSearchTerm("");
                  setSearchResults([]);
                }}
                className="p-4 hover:bg-slate-100/80 cursor-pointer flex items-center justify-between border-b border-slate-100 last:border-b-0 first:rounded-t-xl last:rounded-b-xl transition-all group"
              >
                <div className="flex items-center space-x-3">
                  <Avatar className="group-hover:scale-105 transition-transform">
                    <AvatarImage src={result.profile_img} alt="Avatar" />
                    <AvatarFallback className="bg-primary text-white font-bold">
                      {(result.fullName || result.email || "?")
                        .charAt(0)
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="font-bold text-slate-700">
                      {result.fullName || result.email}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">Xem hồ sơ</span>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    sendFriendRequest(
                      result.id,
                      result.fullName || result.email,
                      result.email,
                    );
                  }}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground text-sm rounded-full px-4 py-2 transition-all duration-200 font-medium shadow-md hover:shadow-lg"
                  disabled={
                    friendsList.includes(result.id) ||
                    pendingRequests.some((req) => req.receiverId === result.id)
                  }
                >
                  {friendsList.includes(result.id)
                    ? "Đã là bạn bè"
                    : pendingRequests.some(
                          (req) => req.receiverId === result.id,
                        )
                      ? "Đang chờ"
                      : "Kết bạn"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="hidden md:flex items-center space-x-4">
        {user && userData ? (
          <>
            {isPlanningPage ? (
              <Link
                to="/planning-history"
                className="btn-liquid py-2.5 px-8 h-auto group"
              >
                <div className="btn-liquid-shine" />
                <History className="w-5 h-5 relative z-10 group-hover:rotate-12 transition-transform" />
                <span className="relative z-10 ml-2">Lịch sử Lập kế hoạch</span>
              </Link>
            ) : (
              <Link
                to="/planning"
                className="btn-liquid py-2.5 px-8 h-auto group"
              >
                <div className="btn-liquid-shine" />
                <Sparkles className="w-5 h-5 relative z-10 group-bounce" />
                <span className="relative z-10 ml-2">Xây dựng lịch trình</span>
                <svg
                  className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform ml-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2.5"
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
              </Link>
            )}
            <div className="relative" ref={notificationRef}>
              <button
                onClick={() => setNotificationOpen(!notificationOpen)}
                className={`relative p-3 rounded-full transition-all duration-300 shadow-sm border ${
                  notificationOpen
                    ? "bg-primary text-white border-primary shadow-lg shadow-primary/20 scale-105"
                    : "text-slate-500 bg-white/40 border-white/60 hover:bg-white/80 hover:text-primary hover:border-primary/30"
                } focus:outline-none`}
              >
                <span className="sr-only">View notifications</span>
                <svg
                  className="h-6 w-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M15 17h5l-1.405-1.405A2.001 2.001 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0a3 3 0 11-6 0m6 0H9"
                  />
                </svg>
                {notifications.length > 0 && (
                  <span
                    className="absolute -top-1 -right-1 inline-flex items-center justify-center w-5 h-5 text-[10px] font-black leading-none text-white rounded-full animate-pulse shadow-sm bg-red-500"
                  >
                    {notifications.length}
                  </span>
                )}
              </button>
              {notificationOpen && (
                <div className="absolute right-0 mt-4 w-80 bg-white/90 backdrop-blur-2xl rounded-[28px] shadow-2xl border border-white/60 py-3 z-20 overflow-hidden">
                  <div className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-white/40">
                    Thông báo
                  </div>
                  {notifications.length > 0 ? (
                    notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className="px-4 py-3 text-sm text-foreground hover:bg-slate-50/50 border-b border-slate-100 last:border-b-0 transition-colors"
                      >
                        {notification.type === "friendRequest" && notification.role === "receiver" && notification.status === "pending" && (
                          <div className="space-y-3">
                            <p className="text-slate-600 font-medium">
                              Lời mời kết bạn từ{" "}
                              <button 
                                onClick={() => {
                                  navigate(`/profile/${notification.senderId}`);
                                  setNotificationOpen(false);
                                }}
                                className="text-primary font-black hover:underline"
                              >
                                {notification.senderName || notification.senderEmail}
                              </button>
                            </p>
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleAcceptFriendRequest(notification)}
                                className="flex-1 bg-emerald-500 text-white text-[11px] rounded-full py-2 hover:bg-emerald-600 transition-all font-black shadow-md shadow-emerald-500/20 active:scale-95"
                              >
                                Chấp nhận
                              </button>
                              <button
                                onClick={() => handleRejectFriendRequest(notification)}
                                className="flex-1 bg-rose-500 text-white text-[11px] rounded-full py-2 hover:bg-rose-600 transition-all font-black shadow-md shadow-rose-500/20 active:scale-95"
                              >
                                Từ chối
                              </button>
                            </div>
                          </div>
                        )}
                        {notification.type === "friendRequest" && notification.status === "accepted" && (
                          <div className="flex items-center justify-between gap-4">
                            <p className="text-slate-600 font-medium">
                              {notification.role === "sender" ? (
                                <>Bạn và <strong className="text-primary">{notification.receiverName}</strong> đã trở thành bạn bè!</>
                              ) : (
                                <>Bạn và <strong className="text-primary">{notification.senderName}</strong> đã trở thành bạn bè!</>
                              )}
                            </p>
                            <button 
                              onClick={() => handleMarkAsRead(notification)}
                              className="text-[10px] text-slate-400 hover:text-primary transition-colors font-black uppercase tracking-tighter"
                            >
                              Đã xem
                            </button>
                          </div>
                        )}
                        {notification.type === "groupInvitation" && (
                          <div className="space-y-2">
                            <p className="text-foreground">
                              Lời mời tham gia nhóm{" "}
                              <strong className="text-secondary">
                                {notification.groupName}
                              </strong>{" "}
                              từ{" "}
                              <strong className="text-primary">
                                {notification.senderName ||
                                  notification.senderEmail}
                              </strong>
                            </p>
                            <div className="flex space-x-2 pt-2">
                              <button
                                onClick={() =>
                                  handleAcceptGroupInvitation(notification)
                                }
                                className="bg-green-500 text-white text-xs rounded-full px-3 py-1 hover:bg-green-600 transition-colors font-medium"
                              >
                                Chấp nhận
                              </button>
                              <button
                                onClick={() =>
                                  handleRejectGroupInvitation(notification)
                                }
                                className="bg-red-500 text-white text-xs rounded-full px-3 py-1 hover:bg-red-600 transition-colors font-medium"
                              >
                                Từ chối
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="px-4 py-8 text-center">
                      <svg
                        className="w-12 h-12 text-muted-foreground mx-auto mb-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M15 17h5l-1.405-1.405A2.001 2.001 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0a3 3 0 11-6 0m6 0H9"
                        />
                      </svg>
                      <p className="text-sm text-muted-foreground">
                        Không có thông báo mới
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className={`flex items-center space-x-3 focus:outline-none rounded-2xl p-2 pr-4 transition-all duration-300 border ${
                  dropdownOpen
                    ? "bg-primary text-white border-primary shadow-lg shadow-primary/20 scale-105"
                    : "bg-white/40 border-white/60 hover:bg-white/80 text-slate-700 hover:border-primary/30"
                }`}
              >
                <div className="relative group-hover:scale-105 transition-transform">
                  <Avatar className="border-2 border-white shadow-sm w-10 h-10">
                    <AvatarImage
                      src={userData.profile_img}
                      alt="Profile Avatar"
                    />
                    <AvatarFallback className="bg-emerald-100 text-emerald-700 font-bold">
                      {(userData.fullName || userData.email || "?")
                        .charAt(0)
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <div className="hidden md:block text-left">
                  <p
                    className={`font-bold text-sm ${dropdownOpen ? "text-white" : "text-slate-700"}`}
                  >
                    {userData.fullName || userData.email}
                  </p>
                  <p
                    className={`text-[10px] font-bold uppercase tracking-wider ${dropdownOpen ? "text-emerald-100" : "text-slate-400"}`}
                  >
                    {dropdownOpen ? "Đang xem" : "Cá nhân"}
                  </p>
                </div>
                <svg
                  className={`w-4 h-4 transition-transform duration-300 ${dropdownOpen ? "rotate-180 text-white" : "text-slate-400"}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="3"
                    d="M19 9l-7 7-7-7"
                  ></path>
                </svg>
              </button>
              {dropdownOpen && (
                <div className="absolute right-0 mt-4 w-64 bg-white/90 backdrop-blur-2xl rounded-[32px] shadow-2xl border border-white/60 py-3 z-20 overflow-hidden">
                  <button
                    onClick={handleProfileClick}
                    className="flex items-center w-[92%] mx-auto my-1 text-left px-4 py-3 text-sm text-slate-600 rounded-xl hover:bg-primary hover:text-white transition-all duration-300 group"
                  >
                    <svg
                      className="w-5 h-5 mr-3 text-slate-400 group-hover:text-white transition-colors flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      ></path>
                    </svg>
                    <span className="font-bold">Hồ sơ cá nhân</span>
                  </button>
                  <button
                    onClick={toggleTheme}
                    className="flex items-center w-[92%] mx-auto my-1 text-left px-4 py-3 text-sm text-slate-600 rounded-xl hover:bg-primary hover:text-white transition-all duration-300 group"
                  >
                    {isDark ? (
                      <svg
                        className="w-5 h-5 mr-3 text-yellow-500 group-hover:text-white transition-colors flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                        ></path>
                      </svg>
                    ) : (
                      <svg
                        className="w-5 h-5 mr-3 text-slate-400 group-hover:text-white transition-colors flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                        ></path>
                      </svg>
                    )}
                    <span className="font-bold">
                      {isDark ? "Chế độ sáng" : "Chế độ tối"}
                    </span>
                  </button>
                  <button
                    onClick={handleLogout}
                    className="flex items-center w-[92%] mx-auto mt-2 mb-1 text-left px-4 py-3 text-sm text-red-600 rounded-xl hover:bg-red-500 hover:text-white transition-all duration-300 group border-t border-slate-100"
                  >
                    <svg
                      className="w-5 h-5 mr-3 group-hover:text-white transition-colors flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                      ></path>
                    </svg>
                    <span className="font-bold">Đăng xuất</span>
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <Link
            to="/login"
            className="bg-gradient-to-r from-primary to-secondary text-white px-6 py-2 rounded-full hover:from-primary/90 hover:to-secondary/90 transition-all duration-200 font-medium shadow-md hover:shadow-lg transform hover:scale-105"
          >
            Đăng nhập
          </Link>
        )}
      </div>
    </div>
  );
};

export default TopMenu;
