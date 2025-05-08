import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { CategoriesClient } from "./categories-client";

// 分类管理页面 - 服务器组件
export default async function CategoriesPage() {
  const supabase = await createClient();
  
  // 验证用户是否已登录且是管理员
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    // 如果用户未登录，重定向到登录页面
    redirect("/sign-in");
  }
  
  // 获取用户角色信息
  let isAdmin = false;
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    
    console.log('User profile:', profile);
    isAdmin = profile?.role === 'admin';
  } catch (error) {
    console.error('Error fetching profile:', error);
    // 出错时，默认为非管理员
    isAdmin = false;
  }
  
  // 如果用户不是管理员，重定向到首页
  if (!isAdmin) {
    redirect("/");
  }
  
  // 获取所有分类
  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .order('name');
    
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="flex items-center gap-2 text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
              <span className="font-medium">返回仪表盘</span>
            </Link>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">AI产品类别管理</h1>
          </div>
          <div>
            <span className="text-sm text-gray-600 dark:text-gray-400">管理员：{user.email}</span>
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <CategoriesClient categories={categories || []} />
      </main>
    </div>
  );
} 