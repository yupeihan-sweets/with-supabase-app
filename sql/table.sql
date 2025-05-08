-- 创建用户配置文件表，扩展auth.users添加角色信息
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT,
  role TEXT DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 创建触发器，当新用户注册时自动创建profiles记录
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (new.id, new.email);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 创建分类表
CREATE TABLE public.categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 创建工具表
CREATE TABLE public.tools (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  url TEXT NOT NULL,
  icon TEXT,
  category_id UUID REFERENCES public.categories(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  clicks_count INTEGER DEFAULT 0
);

-- 创建点击记录表
CREATE TABLE public.clicks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tool_id UUID REFERENCES public.tools(id) NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  ip_address TEXT,
  user_agent TEXT,
  referrer TEXT,
  clicked_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 创建自动更新工具点击数的函数和触发器
CREATE OR REPLACE FUNCTION public.increment_tool_clicks()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.tools
  SET clicks_count = clicks_count + 1
  WHERE id = NEW.tool_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_click_created
  AFTER INSERT ON public.clicks
  FOR EACH ROW EXECUTE PROCEDURE public.increment_tool_clicks();

-- 创建修改表的更新时间的函数和触发器
CREATE OR REPLACE FUNCTION public.update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_categories_modtime
  BEFORE UPDATE ON public.categories
  FOR EACH ROW EXECUTE PROCEDURE public.update_modified_column();

CREATE TRIGGER update_tools_modtime
  BEFORE UPDATE ON public.tools
  FOR EACH ROW EXECUTE PROCEDURE public.update_modified_column();

-- RLS策略设置
-- 启用所有表的RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clicks ENABLE ROW LEVEL SECURITY;

-- Profiles表策略 (修复无限递归问题)
CREATE POLICY "所有认证用户可以查看资料" ON public.profiles
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "用户可以更新自己的资料" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Categories表策略
CREATE POLICY "所有人可以查看分类" ON public.categories
  FOR SELECT USING (true);

CREATE POLICY "只有管理员可以插入分类" ON public.categories
  FOR INSERT WITH CHECK (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "只有管理员可以更新分类" ON public.categories
  FOR UPDATE USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "只有管理员可以删除分类" ON public.categories
  FOR DELETE USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

-- Tools表策略
CREATE POLICY "所有人可以查看工具" ON public.tools
  FOR SELECT USING (true);

CREATE POLICY "只有管理员可以插入工具" ON public.tools
  FOR INSERT WITH CHECK (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "只有管理员可以更新工具" ON public.tools
  FOR UPDATE USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "只有管理员可以删除工具" ON public.tools
  FOR DELETE USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

-- Clicks表策略
CREATE POLICY "所有人可以记录点击" ON public.clicks
  FOR INSERT WITH CHECK (true);

CREATE POLICY "只有管理员可以查看点击数据" ON public.clicks
  FOR SELECT USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

-- 创建视图用于管理员分析
CREATE OR REPLACE VIEW admin_tool_analytics AS
SELECT 
  t.id,
  t.name,
  t.url,
  c.name AS category,
  t.clicks_count,
  COUNT(cl.id) AS clicks_last_30_days,
  COUNT(DISTINCT cl.user_id) AS unique_users
FROM public.tools t
JOIN public.categories c ON t.category_id = c.id
LEFT JOIN public.clicks cl ON t.id = cl.tool_id AND cl.clicked_at > now() - INTERVAL '30 days'
GROUP BY t.id, t.name, t.url, c.name, t.clicks_count
ORDER BY t.clicks_count DESC;

-- 注意：视图不支持RLS策略，访问控制通过基础表的RLS实现
-- 由于tools和clicks表都有RLS策略限制，因此此视图的数据访问会受到这些表策略的影响
-- 可以通过创建一个存储过程或函数来实现更精细的访问控制

-- 创建一个安全的函数，只有管理员可以调用来访问分析数据
CREATE OR REPLACE FUNCTION public.get_tool_analytics()
RETURNS SETOF admin_tool_analytics
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- 检查当前用户是否为管理员
  IF EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  ) THEN
    -- 如果是管理员，返回所有分析数据
    RETURN QUERY SELECT * FROM admin_tool_analytics;
  ELSE
    -- 如果不是管理员，返回空集
    RETURN;
  END IF;
END;
$$;

-- 创建收藏表
CREATE TABLE public.favorites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  tool_id UUID REFERENCES public.tools(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (user_id, tool_id)
);

ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

-- 收藏表策略：用户只能查看和操作自己的收藏
CREATE POLICY "用户可以查看自己的收藏" ON public.favorites
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "用户可以添加收藏" ON public.favorites
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "用户可以删除自己的收藏" ON public.favorites
  FOR DELETE USING (auth.uid() = user_id);