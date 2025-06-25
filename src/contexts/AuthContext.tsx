"use client";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { SupabaseClient, Session, User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import { useRouter } from "next/navigation";

type AuthContextType = {
  supabase: SupabaseClient;
  session: Session | null;
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  signOut: () => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setLoading(true);
    
    // 初期セッション取得
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user ?? null);
      
      const isSupabaseAdmin = session?.user?.email === 'aoiroserver.m@gmail.com';
      const isLocalAdmin = typeof window !== 'undefined' && localStorage.getItem('admin') === 'true';
      setIsAdmin(isSupabaseAdmin || isLocalAdmin);
      
      if (session?.user) {
        localStorage.removeItem('admin');
      }
      
      setLoading(false);
    };

    getInitialSession();

    // 認証状態変更の監視
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('認証状態変更:', event, session?.user?.email);
        
        setSession(session);
        setUser(session?.user ?? null);
        
        const isSupabaseAdmin = session?.user?.email === 'aoiroserver.m@gmail.com';
        const isLocalAdmin = typeof window !== 'undefined' && localStorage.getItem('admin') === 'true';
        setIsAdmin(isSupabaseAdmin || isLocalAdmin);
        
        if (event === "SIGNED_IN" && session) {
          localStorage.removeItem('admin');
          // 認証成功後のリダイレクト
          if (window.location.pathname === '/') {
            router.push('/train-status');
          }
        } else if (event === "SIGNED_OUT") {
          setSession(null);
          setUser(null);
          setIsAdmin(false);
          router.push("/login");
        }
        
        setLoading(false);
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [router]);

  useEffect(() => {
    const handleStorage = () => {
      const isSupabaseAdmin = user?.email === 'aoiroserver.m@gmail.com';
      const isLocalAdmin = typeof window !== 'undefined' && localStorage.getItem('admin') === 'true';
      setIsAdmin(isSupabaseAdmin || isLocalAdmin);
    };
    window.addEventListener('storage', handleStorage);
    handleStorage();
    return () => {
      window.removeEventListener('storage', handleStorage);
    };
  }, [user]);

  const signOut = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setIsAdmin(false);
    setLoading(false);
    router.push('/login');
  };

  const value = {
    supabase,
    session,
    user,
    loading,
    isAdmin,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === null) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}; 