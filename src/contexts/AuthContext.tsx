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
      console.log('🔄 Getting initial session...');
      
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ Error getting initial session:', error);
        }
        
        console.log('Initial session:', session);
        console.log('Initial user:', session?.user);
        console.log('Session details:', {
          hasSession: !!session,
          hasUser: !!session?.user,
          userEmail: session?.user?.email,
          accessToken: session?.access_token ? 'present' : 'missing',
          refreshToken: session?.refresh_token ? 'present' : 'missing',
          expiresAt: session?.expires_at,
          tokenType: session?.token_type
        });
        
        // セッションが存在する場合はローカルストレージに保存
        if (session && typeof window !== 'undefined') {
          console.log('💾 Saving session to localStorage...');
          localStorage.setItem('aoiro-auth-token', JSON.stringify(session));
        }
        
        setSession(session);
        setUser(session?.user ?? null);
        
        const isSupabaseAdmin = session?.user?.email === 'aoiroserver.m@gmail.com';
        const isLocalAdmin = typeof window !== 'undefined' && localStorage.getItem('admin') === 'true';
        setIsAdmin(isSupabaseAdmin || isLocalAdmin);
        
        if (session?.user) {
          localStorage.removeItem('admin');
          console.log('✅ User authenticated on initial load:', session.user.email);
        } else {
          console.log('❌ No user found on initial load');
        }
      } catch (error) {
        console.error('❌ Exception during initial session load:', error);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // 認証状態変更の監視
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Auth state change:', event, session?.user?.email);
        console.log('Event details:', {
          event,
          hasSession: !!session,
          hasUser: !!session?.user,
          userEmail: session?.user?.email,
          currentPath: window.location.pathname
        });
        
        // セッションの詳細ログ
        if (session) {
          console.log('Session details:', {
            accessToken: session.access_token ? 'present' : 'missing',
            refreshToken: session.refresh_token ? 'present' : 'missing',
            expiresAt: session.expires_at,
            tokenType: session.token_type,
            user: {
              id: session.user.id,
              email: session.user.email,
              provider: session.user.app_metadata?.provider
            }
          });
        }
        
        setSession(session);
        setUser(session?.user ?? null);
        
        const isSupabaseAdmin = session?.user?.email === 'aoiroserver.m@gmail.com';
        const isLocalAdmin = typeof window !== 'undefined' && localStorage.getItem('admin') === 'true';
        setIsAdmin(isSupabaseAdmin || isLocalAdmin);
        
        if (event === "SIGNED_IN" && session) {
          localStorage.removeItem('admin');
          console.log('✅ User signed in successfully:', session.user.email);
          
          // セッションをローカルストレージに保存
          if (typeof window !== 'undefined') {
            try {
              localStorage.setItem('aoiro-auth-token', JSON.stringify(session));
              console.log('💾 Session saved to localStorage');
            } catch (error) {
              console.error('❌ Error saving session to localStorage:', error);
            }
          }
          
          // 認証成功後のリダイレクト
          if (window.location.pathname === '/') {
            console.log('🔄 Redirecting to train-status from home page');
            router.push('/train-status');
          }
        } else if (event === "SIGNED_OUT") {
          console.log('❌ User signed out');
          setSession(null);
          setUser(null);
          setIsAdmin(false);
          
          // ローカルストレージからセッションを削除
          if (typeof window !== 'undefined') {
            try {
              localStorage.removeItem('aoiro-auth-token');
              console.log('🧹 Session removed from localStorage');
            } catch (error) {
              console.error('❌ Error removing session from localStorage:', error);
            }
          }
          
          router.push("/login");
        } else if (event === "TOKEN_REFRESHED") {
          console.log('🔄 Token refreshed');
          
          // 更新されたセッションをローカルストレージに保存
          if (session && typeof window !== 'undefined') {
            try {
              localStorage.setItem('aoiro-auth-token', JSON.stringify(session));
              console.log('💾 Refreshed session saved to localStorage');
            } catch (error) {
              console.error('❌ Error saving refreshed session to localStorage:', error);
            }
          }
        } else if (event === "USER_UPDATED") {
          console.log('🔄 User updated');
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