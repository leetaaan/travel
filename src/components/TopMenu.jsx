import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { signOut } from 'firebase/auth';
import { doc, getDoc, collection, query, where, getDocs, addDoc, onSnapshot, updateDoc, writeBatch, arrayUnion, deleteDoc } from 'firebase/firestore';
import { toast } from 'react-hot-toast';

const TopMenu = () => {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [friendsList, setFriendsList] = useState([]);
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

  return (
    <div className="bg-white shadow-md p-4 flex justify-between items-center">
      <h1 className="text-2xl font-bold text-teal-600">Travel Planner</h1>
      <div className="flex-1 flex justify-center mx-4 relative">
        <div className="relative w-full max-w-md">
          <input
            type="text"
            placeholder="Tìm kiếm bạn bè..."
            className="border border-gray-300 rounded-full py-2 pl-10 pr-10 w-full focus:outline-none focus:ring-2 focus:ring-teal-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
          </div>
          {searchTerm && (
            <button
              onClick={handleClearSearch}
              className="absolute inset-y-0 right-0 pr-3 flex items-center focus:outline-none"
            >
              <svg className="h-5 w-5 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
          )}
        </div>
        {searchResults.length > 0 && searchTerm.trim() !== '' && (
          <div className="absolute top-full mt-2 w-full max-w-md bg-white border border-gray-300 rounded-md shadow-lg z-10">
            {searchResults.map((result) => (
              <div key={result.id} className="p-2 hover:bg-gray-100 cursor-pointer flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <img src={result.profile_img} alt="Avatar" className="w-8 h-8 rounded-full" />
                  <span>{result.fullName || result.email}</span>
                </div>
                <button
                  onClick={() => sendFriendRequest(result.id, result.fullName || result.email, result.email)}
                  className="bg-teal-500 text-white text-sm rounded-full px-3 py-1 hover:bg-teal-600"
                  disabled={friendsList.includes(result.id) || pendingRequests.some(req => req.receiverId === result.id)}
                >
                  {friendsList.includes(result.id) ? 'Đã là bạn bè' : pendingRequests.some(req => req.receiverId === result.id) ? 'Đang chờ' : 'Kết bạn'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="flex items-center space-x-4">
        {user && userData ? (
          <>
            <Link to="/planning" className="bg-teal-500 text-white rounded-full py-2 px-4 hover:bg-teal-600">
              Xây dựng lịch trình
            </Link>
            <div className="relative" ref={notificationRef}>
              <button
                onClick={() => setNotificationOpen(!notificationOpen)}
                className="relative p-2 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white"
              >
                <span className="sr-only">View notifications</span>
                <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.001 2.001 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0a3 3 0 11-6 0m6 0H9" />
                </svg>
                {notifications.length > 0 && (
                  <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">{notifications.length}</span>
                )}
              </button>
              {notificationOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg py-1 z-20">
                  <div className="block px-4 py-2 text-xs text-gray-400">Thông báo</div>
                  {notifications.length > 0 ? (
                    notifications.map(notification => (
                      <div key={notification.id} className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                        {notification.type === 'friendRequest' && (
                          <div className="flex justify-between items-center">
                            <span>Lời mời kết bạn từ <strong>{notification.senderName || notification.senderEmail}</strong></span>
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleAcceptFriendRequest(notification)}
                                className="bg-green-500 text-white text-xs rounded-full px-2 py-1 hover:bg-green-600"
                              >
                                Chấp nhận
                              </button>
                              <button
                                onClick={() => handleRejectFriendRequest(notification)}
                                className="bg-red-500 text-white text-xs rounded-full px-2 py-1 hover:bg-red-600"
                              >
                                Từ chối
                              </button>
                            </div>
                          </div>
                        )}
                        {notification.type === 'groupInvitation' && (
                          <div className="flex justify-between items-center">
                            <span>Lời mời tham gia nhóm <strong>{notification.groupName}</strong> từ <strong>{notification.senderName || notification.senderEmail}</strong></span>
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleAcceptGroupInvitation(notification)}
                                className="bg-green-500 text-white text-xs rounded-full px-2 py-1 hover:bg-green-600"
                              >
                                Chấp nhận
                              </button>
                              <button
                                onClick={() => handleRejectGroupInvitation(notification)}
                                className="bg-red-500 text-white text-xs rounded-full px-2 py-1 hover:bg-red-600"
                              >
                                Từ chối
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="px-4 py-2 text-sm text-gray-500">Không có thông báo mới.</div>
                  )}
                </div>
              )}
            </div>
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center space-x-2 focus:outline-none"
              >
                <img
                  src={userData.profile_img}
                  alt="Profile Avatar"
                  className="w-10 h-10 rounded-full border-2 border-teal-500"
                />
                <span className="font-medium text-gray-700">{userData.fullName || userData.email}</span>
              </button>
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-20">
                  <button
                    onClick={handleProfileClick}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Hồ sơ
                  </button>
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Đăng xuất
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <Link to="/login" className="text-gray-600 hover:text-teal-500">Đăng nhập</Link>
        )}
      </div>
    </div>
  );
};

export default TopMenu;