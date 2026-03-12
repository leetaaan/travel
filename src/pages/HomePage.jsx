import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import { useTheme } from "../contexts/ThemeContext";
import TopMenu from "../components/TopMenu";
import Sidebar from "../components/Sidebar";
import MapDashboard from "../components/MapDashboard";
import SpendingManagement from "../components/SpendingManagement";

const HomePage = () => {
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [user, setUser] = useState(null);
  const { isDark } = useTheme();
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const docRef = doc(db, "users", currentUser.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setUserData({ ...docSnap.data(), uid: currentUser.uid });
          } else {
            setUserData({ uid: currentUser.uid, email: currentUser.email });
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
          setUserData({ uid: currentUser.uid, email: currentUser.email });
        }
      } else {
        setUserData(null);
      }
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="flex flex-col h-screen bg-background relative overflow-hidden transition-colors duration-300">
      {/* Premium Liquid Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0)_0%,rgba(255,255,255,0.4)_100%)] z-[1]" />

        <motion.div
          animate={{
            x: [-100, 100, -100],
            y: [-50, 50, -50],
            scale: [1, 1.2, 1],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-[10%] -left-[10%] w-[60%] h-[60%] bg-emerald-200/20 rounded-full blur-[120px] z-0"
        />

        <motion.div
          animate={{
            x: [100, -100, 100],
            y: [50, -50, 50],
            scale: [1, 1.3, 1],
          }}
          transition={{ duration: 30, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[20%] -right-[10%] w-[50%] h-[50%] bg-blue-200/20 rounded-full blur-[130px] z-0"
        />

        <motion.div
          animate={{
            scale: [1, 1.15, 1],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-[-10%] left-[20%] w-[40%] h-[40%] bg-violet-200/20 rounded-full blur-[110px] z-0"
        />
      </div>

      <TopMenu />

      <div className="flex flex-1 overflow-hidden relative z-10 p-4 gap-4">
        <div className="w-80 flex flex-col h-full rounded-[32px] border border-white/40 bg-white/20 backdrop-blur-3xl shadow-2xl shadow-black/5 overflow-hidden">
          {user ? (
            <Sidebar
              onSelectGroup={setSelectedGroup}
              tripId="trip123"
              userId={user.uid}
            />
          ) : (
            <div className="p-8 flex flex-col h-full">
              <h2 className="text-2xl font-black text-foreground mb-6">
                Groups
              </h2>
              <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4">
                <div className="w-16 h-16 bg-white/40 rounded-3xl flex items-center justify-center shadow-inner">
                  <svg
                    className="w-8 h-8 text-slate-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                </div>
                <p className="text-slate-500 font-medium">
                  Vui lòng đăng nhập để xem nhóm của bạn.
                </p>
              </div>
            </div>
          )}
        </div>

        <main className="flex-1 h-full rounded-[32px] border border-white/40 bg-white/10 backdrop-blur-2xl shadow-2xl shadow-black/5 overflow-hidden relative">
          <div className="absolute inset-0 overflow-y-auto no-scrollbar">
            {selectedGroup ? (
              <SpendingManagement
                group={selectedGroup}
                currentUser={userData}
              />
            ) : (
              <MapDashboard />
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default HomePage;
