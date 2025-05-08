import { createClient } from "@/utils/supabase/server";
import { ClientHomePage } from "./components/client-home";

interface Category {
  id: string;
  name: string;
  description: string;
}

interface Tool {
  id: string;
  name: string;
  description: string;
  url: string;
  icon: string;
  category_id: string;
  clicks_count: number;
}

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  console.log('User:', user);
  
  // 获取用户角色信息
  let isAdmin = false;
  if (user) {
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
  }
  
  // 从数据库获取分类列表
  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .order('name');
  
  // 从数据库获取工具列表
  const { data: tools } = await supabase
    .from('tools')
    .select('*')
    .order('name');
  
  // 查询当前用户收藏的工具id
  let favoriteToolIds: string[] = [];
  if (user) {
    const { data: favorites } = await supabase
      .from('favorites')
      .select('tool_id')
      .eq('user_id', user.id);
    favoriteToolIds = favorites?.map((f: any) => f.tool_id) || [];
  }
  
  return <ClientHomePage 
    user={user} 
    isAdmin={isAdmin}
    dbCategories={categories || []} 
    dbTools={tools || []} 
    favoriteToolIds={favoriteToolIds}
  />;
}