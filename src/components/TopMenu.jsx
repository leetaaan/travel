import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { auth, db } from '../firebase';
import { signOut } from 'firebase/auth';
import { doc, getDoc, collection, query, where, getDocs, addDoc, onSnapshot, updateDoc, writeBatch, arrayUnion, deleteDoc } from 'firebase/firestore';
import { toast } from 'react-hot-toast';
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

const TopMenu = () => {
  const { isDark, toggleTheme } = useTheme();
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [friendsList, setFriendsList] = useState([]); // Requests sent by current user
  const [pendingRequests, setPendingRequests] = useState([]); // Requests sent by current user
  const navigate = useNavigate();
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

        // Listen for friend requests received by current user
        const friendRequestsReceivedQuery = query(
          collection(db, "friendRequests"),
          where("receiverId", "==", currentUser.uid),
          where("status", "==", "pending")
        );
        const unsubscribeFriendRequestsReceived = onSnapshot(friendRequestsReceivedQuery, (snapshot) => {
          const newRequests = snapshot.docs.map(doc => ({ id: doc.id, type: 'friendRequest', ...doc.data() }));
          setNotifications(prev => [...prev.filter(n => n.type !== 'friendRequest'), ...newRequests]);
        });

        // Listen for friend requests sent by current user
        const friendRequestsSentQuery = query(
          collection(db, "friendRequests"),
          where("senderId", "==", currentUser.uid),
          where("status", "==", "pending")
        );
        const unsubscribeFriendRequestsSent = onSnapshot(friendRequestsSentQuery, (snapshot) => {
          const sentRequests = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setPendingRequests(sentRequests);
        });

        // Listen for group invitations
        const groupInvitationsQuery = query(
          collection(db, "groupInvitations"),
          where("receiverId", "==", currentUser.uid),
          where("status", "==", "pending")
        );
        const unsubscribeGroupInvitations = onSnapshot(groupInvitationsQuery, (snapshot) => {
          const newInvitations = snapshot.docs.map(doc => ({ id: doc.id, type: 'groupInvitation', ...doc.data() }));
          console.log('Group invitations found:', newInvitations);
          setNotifications(prev => [...prev.filter(n => n.type !== 'groupInvitation'), ...newInvitations]);
        });

        // Listen for friends list from subcollection
        const friendsSubcollectionQuery = collection(db, "users", currentUser.uid, "friends");
        const unsubscribeFriends = onSnapshot(friendsSubcollectionQuery, (snapshot) => {
          const friends = snapshot.docs.map(doc => doc.id);
          setFriendsList(friends);
        });

        return () => {
          unsubscribeFriendRequestsReceived();
          unsubscribeFriendRequestsSent();
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
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setNotificationOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Debounce search term
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchTerm.trim() !== '') {
        const usersRef = collection(db, "users");
        const q1 = query(usersRef, where("fullName", ">=", searchTerm), where("fullName", "<=", searchTerm + '\uf8ff'));
        const q2 = query(usersRef, where("email", ">=", searchTerm), where("email", "<=", searchTerm + '\uf8ff'));

        const [snapshot1, snapshot2] = await Promise.all([
          getDocs(q1),
          getDocs(q2)
        ]);

        const results = [];
        snapshot1.forEach(doc => {
          if (doc.id !== user?.uid) results.push({ id: doc.id, ...doc.data() });
        });
        snapshot2.forEach(doc => {
          if (doc.id !== user?.uid && !results.some(r => r.id === doc.id)) results.push({ id: doc.id, ...doc.data() });
        });
        setSearchResults(results);
      } else {
        setSearchResults([]);
      }
    }, 500); // 500ms debounce time

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, user]);

  const handleClearSearch = () => {
    setSearchTerm('');
    setSearchResults([]);
  };

  const sendFriendRequest = async (receiverId, receiverName, receiverEmail) => {
    if (!user) {
      toast.error("Bạn cần đăng nhập để gửi lời mời kết bạn.");
      return;
    }

    // Check if already friends in the subcollection
    const friendDocRef = doc(db, "users", user.uid, "friends", receiverId);
    const friendDocSnap = await getDoc(friendDocRef);
    if (friendDocSnap.exists()) {
      toast("Bạn và người này đã là bạn bè.");
      return;
    }

    const existingRequestQuery = query(
      collection(db, "friendRequests"),
      where("senderId", "==", user.uid),
      where("receiverId", "==", receiverId),
      where("status", "==", "pending")
    );
    const existingRequestSnapshot = await getDocs(existingRequestQuery);

    const existingReverseRequestQuery = query(
      collection(db, "friendRequests"),
      where("senderId", "==", receiverId),
      where("receiverId", "==", user.uid),
      where("status", "==", "pending")
    );
    const existingReverseRequestSnapshot = await getDocs(existingReverseRequestQuery);

    if (!existingRequestSnapshot.empty || !existingReverseRequestSnapshot.empty) {
      toast("Lời mời kết bạn đang chờ xử lý.");
      return;
    }

    try {
      await addDoc(collection(db, "friendRequests"), {
        senderId: user.uid,
        senderName: userData.fullName || userData.email,
        senderEmail: userData.email,
        receiverId: receiverId,
        receiverName: receiverName,
        receiverEmail: receiverEmail,
        status: "pending",
        timestamp: new Date(),
      });
      toast.success("Đã gửi lời mời kết bạn!");
    } catch (error) {
      console.error("Error sending friend request:", error);
      toast.error("Gửi lời mời kết bạn thất bại.");
    }
  };

  const handleAcceptFriendRequest = async (notification) => {
    if (!user) return;

    const batch = writeBatch(db);

    // 1. Update friend request status to 'accepted'
    const requestRef = doc(db, "friendRequests", notification.id);
    batch.update(requestRef, { status: "accepted" });

    // 2. Add sender to current user's friends subcollection
    const currentUserFriendRef = doc(db, "users", user.uid, "friends", notification.senderId);
    batch.set(currentUserFriendRef, {
      uid: notification.senderId,
      fullName: notification.senderName,
      email: notification.senderEmail,
      addedAt: new Date(),
    });

    // 3. Add current user to sender's friends subcollection
    const senderFriendRef = doc(db, "users", notification.senderId, "friends", user.uid);
    batch.set(senderFriendRef, {
      uid: user.uid,
      fullName: userData.fullName || userData.email,
      email: userData.email,
      addedAt: new Date(),
    });

    try {
      await batch.commit();
      // Delete the friend request document after successful acceptance
      await deleteDoc(requestRef);
      toast.success("Đã chấp nhận lời mời kết bạn!");
    } catch (error) {
      console.error("Error accepting friend request:", error);
      toast.error("Chấp nhận lời mời kết bạn thất bại.");
    }
  };

  const handleRejectFriendRequest = async (notification) => {
    if (!user) return;

    try {
      const requestRef = doc(db, "friendRequests", notification.id);
      await updateDoc(requestRef, { status: "declined" });
      // Delete the friend request document after successful rejection
      await deleteDoc(requestRef);
      toast.success("Đã từ chối lời mời kết bạn.");
    } catch (error) {
      console.error("Error rejecting friend request:", error);
      toast.error("Từ chối lời mời kết bạn thất bại.");
    }
  };

  const handleAcceptGroupInvitation = async (notification) => {
    if (!user) return;
    console.log("notification", notification); // Log để kiểm tra receiverId

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
      members: arrayUnion(user.uid)
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

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast.success('Đăng xuất thành công!');
      navigate('/login');
    } catch (error) {
      console.error("Error logging out:", error);
      toast.error('Đăng xuất thất bại!');
    }
  };

  const handleProfileClick = () => {
    setDropdownOpen(false);
    toast.success('Chuyển đến trang Hồ sơ!');
    navigate('/profile');
  };

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <div className="bg-background/95 backdrop-blur-md shadow-lg border-b border-border p-4 flex justify-between items-center sticky top-0 z-50 transition-colors duration-300">
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow duration-300">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-foreground">Travel Planner</h1>
      </div>

      {/* Mobile Menu Button */}
      <div className="md:hidden">
        <button
          onClick={toggleMobileMenu}
          className="p-3 rounded-full text-muted-foreground hover:text-foreground hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring transition-all duration-200"
        >
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {isMobileMenuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-full left 0 w-full bg-background shadow-lg rounded-b-xl p-4 border-t border-border">
          <div className="flex flex-col space-y-4">
            {user && userData ? (
              <>
                <Link to="/planning" className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full py-2 px-6 transition-all duration-200 font-medium shadow-md hover:shadow-lg text-center">
                  Xây dựng lịch trình
                </Link>
                <button
                  onClick={handleProfileClick}
                  className="flex items-center w-full text-left px-4 py-3 text-sm text-foreground hover:bg-accent transition-colors"
                >
                  <svg className="w-4 h-4 mr-3 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                  </svg>
                  <span>Hồ sơ</span>
                </button>
                <button
                  onClick={toggleTheme}
                  className="flex items-center w-full text-left px-4 py-3 text-sm text-foreground hover:bg-accent transition-colors"
                >
                  {isDark ? (
                    <svg className="w-4 h-4 mr-3 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path>
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 mr-3 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path>
                    </svg>
                  )}
                  <span>{isDark ? 'Chế độ sáng' : 'Chế độ tối'}</span>
                </button>
                <button
                  onClick={handleLogout}
                  className="flex items-center w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors border-t border-border"
                >
                  <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
                  </svg>
                  <span>Đăng xuất</span>
                </button>
              </>
            ) : (
              <Link to="/login" className="bg-gradient-to-r from-primary to-secondary text-white px-6 py-2 rounded-full hover:from-primary/90 hover:to-secondary/90 transition-all duration-200 font-medium shadow-md hover:shadow-lg transform hover:scale-105 text-center">
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
            className="border border-border rounded-full py-3 pl-12 pr-12 w-full focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent bg-muted hover:bg-background transition-colors shadow-sm text-foreground placeholder-muted-foreground"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
          </div>
          {searchTerm && (
            <button
              onClick={handleClearSearch}
              className="absolute inset-y-0 right-0 pr-4 flex items-center focus:outline-none hover:text-foreground transition-colors"
            >
              <svg className="h-5 w-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          )}
        </div>
        {searchResults.length > 0 && searchTerm.trim() !== '' && (
          <div className="absolute top-full mt 2 w-full max-w-md bg-background border border-border rounded-xl shadow-xl z-10 backdrop-blur-md">
            {searchResults.map((result) => (
              <div key={result.id} className="p-4 hover:bg-accent cursor-pointer flex items-center justify-between border-b border-border last:border-b-0 first:rounded-t-xl last:rounded-b-xl transition-colors">
                <div className="flex items-center space-x-3">
                  <Avatar>
                    <AvatarImage src={result.profile_img} alt="Avatar" />
                    <AvatarFallback>
                      {(result.fullName || result.email || "?").charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium text-foreground">{result.fullName || result.email}</span>
                </div>
                <button
                  onClick={() => sendFriendRequest(result.id, result.fullName || result.email, result.email)}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground text-sm rounded-full px-4 py-2 transition-all duration-200 font-medium shadow-md hover:shadow-lg"
                  disabled={friendsList.includes(result.id) || pendingRequests.some(req => req.receiverId === result.id)}
                >
                  {friendsList.includes(result.id) ? 'Đã là bạn bè' : pendingRequests.some(req => req.receiverId === result.id) ? 'Đang chờ' : 'Kết bạn'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="hidden md:flex items-center space-x-4">
        {user && userData ? (
          <>
            <Link to="/planning" className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full py-2 px-6 transition-all duration-200 font-medium shadow-md hover:shadow-lg">
              Xây dựng lịch trình
            </Link>
            <div className="relative" ref={notificationRef}>
              <button
                onClick={() => setNotificationOpen(!notificationOpen)}
                className="relative p-3 rounded-full text-muted-foreground hover:text-foreground hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring transition-all duration-200"
              >
                <span className="sr-only">View notifications</span>
                <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.001 2.001 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0a3 3 0 11-6 0m6 0H9" />
                </svg>
                {notifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 inline-flex items-center justify-center w-5 h-5 text-xs font-bold leading-none text-white bg-gradient-to-r from-red-500 to-pink-500 rounded-full animate-pulse">{notifications.length}</span>
                )}
              </button>
              {notificationOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-background rounded-xl shadow-xl border border-border py-2 z-20 backdrop-blur-md">
                  <div className="block px-4 py-3 text-sm font-semibold text-muted-foreground border-b border-border">Thông báo</div>
                  {notifications.length > 0 ? (
                    notifications.map(notification => (
                      <div key={notification.id} className="px-4 py-3 text-sm text-foreground hover:bg-accent border-b border-border last:border-b-0 transition-colors">
                        {notification.type === 'friendRequest' && (
                          <div className="space-y-2">
                            <p className="text-foreground">Lời mời kết bạn từ <strong className="text-primary">{notification.senderName || notification.senderEmail}</strong></p>
                            <div className="flex space-x-2 pt-2">
                              <button
                                onClick={() => handleAcceptFriendRequest(notification)}
                                className="bg-green-500 text-white text-xs rounded-full px-3 py-1 hover:bg-green-600 transition-colors font-medium"
                              >
                                Chấp nhận
                              </button>
                              <button
                                onClick={() => handleRejectFriendRequest(notification)}
                                className="bg-red-500 text-white text-xs rounded-full px-3 py-1 hover:bg-red-600 transition-colors font-medium"
                              >
                                Từ chối
                              </button>
                            </div>
                          </div>
                        )}
                        {notification.type === 'groupInvitation' && (
                          <div className="space-y-2">
                            <p className="text-foreground">Lời mời tham gia nhóm <strong className="text-secondary">{notification.groupName}</strong> từ <strong className="text-primary">{notification.senderName || notification.senderEmail}</strong></p>
                            <div className="flex space-x-2 pt-2">
                              <button
                                onClick={() => handleAcceptGroupInvitation(notification)}
                                className="bg-green-500 text-white text-xs rounded-full px-3 py-1 hover:bg-green-600 transition-colors font-medium"
                              >
                                Chấp nhận
                              </button>
                              <button
                                onClick={() => handleRejectGroupInvitation(notification)}
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
                      <svg className="w-12 h-12 text-muted-foreground mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.001 2.001 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0a3 3 0 11-6 0m6 0H9" />
                      </svg>
                      <p className="text-sm text-muted-foreground">Không có thông báo mới</p>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center space-x-3 focus:outline-none hover:bg-accent rounded-full p-2 transition-colors"
              >
                <Avatar>
                  <AvatarImage src={userData.profile_img} alt="Profile Avatar" />
                  <AvatarFallback>
                    {(userData.fullName || userData.email || "?").charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden md:block text-left">
                  <p className="font-semibold text-foreground text-sm">{userData.fullName || userData.email}</p>
                  <p className="text-xs text-muted-foreground">Xem hồ sơ</p>
                </div>
                <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                </svg>
              </button>
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-background rounded-xl shadow-xl border border-border py-2 z-20 backdrop-blur-md">
                  <button
                    onClick={handleProfileClick}
                    className="flex items-center w-full text-left px-4 py-3 text-sm text-foreground hover:bg-accent transition-colors"
                  >
                    <svg className="w-4 h-4 mr-3 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                    </svg>
                    <span>Hồ sơ</span>
                  </button>
                  <button
                    onClick={toggleTheme}
                    className="flex items-center w-full text-left px-4 py-3 text-sm text-foreground hover:bg-accent transition-colors"
                  >
                    {isDark ? (
                      <svg className="w-4 h-4 mr-3 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path>
                      </svg>
                    ) : (
                      <svg className="w-4 h-4 mr-3 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path>
                      </svg>
                    )}
                    <span>{isDark ? 'Chế độ sáng' : 'Chế độ tối'}</span>
                  </button>
                  <button
                    onClick={handleLogout}
                    className="flex items-center w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors border-t border-border"
                  >
                    <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
                    </svg>
                    <span>Đăng xuất</span>
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <Link to="/login" className="bg-gradient-to-r from-primary to-secondary text-white px-6 py-2 rounded-full hover:from-primary/90 hover:to-secondary/90 transition-all duration-200 font-medium shadow-md hover:shadow-lg transform hover:scale-105">
            Đăng nhập
          </Link>
        )}
      </div>
    </div>
  );
};

export default TopMenu;