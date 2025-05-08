import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export const createClient = async () => {
  const cookieStore = await cookies();
  
  // 打印每个cookie的名称，帮助调试
  const allCookies = cookieStore.getAll();
  // console.log('Cookie names:', allCookies.map((c: any) => c.name));
  
  // 检查是否有包含auth-token的cookie
  const authCookie = allCookies.find((c: any) => c.name.includes('auth-token'));
  // console.log('Auth cookie found:', !!authCookie);
  
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return allCookies;
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch (error) {
            // The `set` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    },
  );
};
