"use client";

import { Brain, MessageSquare, Image as ImageIcon, Video, Music, Code, Palette, Sparkles } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { signOutAction } from "../actions";
import { createClient } from "@/utils/supabase/client";
import { recordToolClickAction } from "../actions";

// 定义接口
interface DBCategory {
  id: string;
  name: string;
  description: string;
}

interface DBTool {
  id: string;
  name: string;
  description: string;
  url: string;
  icon: string;
  category_id: string;
  clicks_count: number;
}

interface Tool {
  id: string; 
  name: string;
  description: string;
  icon: React.ReactNode;
  url: string;
  category: string;
  category_id: string;
  clicks_count: number;
}

// 图标映射函数 - 修改以支持图片URL
const getIconComponent = (iconName: string): React.ReactNode => {
  // 如果传入的是URL，则返回Image组件
  if (iconName.startsWith('http')) {
    return (
      <div className="relative w-full h-full flex items-center justify-center">
        <Image
          src={iconName}
          alt="Tool icon"
          width={36}
          height={36}
          className="w-8 h-8 object-contain"
        />
      </div>
    );
  }
  
  // 对于非URL的情况，保持原来的图标映射逻辑
  switch (iconName) {
    case 'MessageSquare':
      return <MessageSquare className="w-8 h-8 text-purple-600 dark:text-purple-400" />;
    case 'Image':
      return <ImageIcon className="w-8 h-8 text-purple-600 dark:text-purple-400" />;
    case 'Video':
      return <Video className="w-8 h-8 text-purple-600 dark:text-purple-400" />;
    case 'Music':
      return <Music className="w-8 h-8 text-purple-600 dark:text-purple-400" />;
    case 'Code':
      return <Code className="w-8 h-8 text-purple-600 dark:text-purple-400" />;
    case 'Palette':
      return <Palette className="w-8 h-8 text-purple-600 dark:text-purple-400" />;
    default:
      return <Sparkles className="w-8 h-8 text-purple-600 dark:text-purple-400" />;
  }
};

// 使用备用数据，当数据库数据为空时使用
const fallbackCategories = ["聊天助手", "图像生成", "视频工具", "音频工具", "编程辅助"];

const fallbackTools: Tool[] = [
  {
    id: "1",
    name: "ChatGPT",
    description: "Advanced AI language model for conversation and text generation",
    icon: <MessageSquare className="w-6 h-6" />,
    url: "https://chat.openai.com",
    category: "聊天助手",
    category_id: "1",
    clicks_count: 0
  },
  // ... 其他备用工具
];

export function ClientHomePage({ 
  user, 
  isAdmin = false,
  dbCategories = [], 
  dbTools = [],
  favoriteToolIds = []
}: { 
  user: any;
  isAdmin?: boolean;
  dbCategories?: DBCategory[];
  dbTools?: DBTool[];
  favoriteToolIds?: string[];
}) {
  // 处理从数据库获取的分类和工具数据
  const processedTools = dbTools.length > 0 
    ? dbTools.map(tool => ({
        id: tool.id,
        name: tool.name,
        description: tool.description,
        icon: getIconComponent(tool.icon),
        url: tool.url,
        category_id: tool.category_id,
        category: dbCategories.find(c => c.id === tool.category_id)?.name || "未分类",
        clicks_count: tool.clicks_count
      }))
    : fallbackTools;

  // 处理分类，插入"我的收藏"和"全部工具"
  let categories = dbCategories.length > 0
    ? dbCategories.map(cat => cat.name)
    : fallbackCategories;
  
  // 先添加"全部工具"作为第一个选项
  categories = ["全部工具", ...categories];
  
  // 如果用户已登录，在全部工具后添加"我的收藏"
  if (user) {
    categories = ["全部工具", "我的收藏", ...categories.slice(1)];
  }

  const [selectedCategory, setSelectedCategory] = useState<string>(categories[0] || "");
  const [searchQuery, setSearchQuery] = useState("");

  // 将工具列表转换为状态，以便可以更新点击计数
  const [tools, setTools] = useState<Tool[]>(processedTools);
  
  // 当分类列表变化时更新选中的分类
  useEffect(() => {
    if (categories.length > 0 && !categories.includes(selectedCategory)) {
      setSelectedCategory(categories[0]);
    }
  }, [categories, selectedCategory]);

  // 当工具数据从服务器更新时，更新工具状态
  useEffect(() => {
    setTools(processedTools);
  }, [dbTools, dbCategories]);

  // 处理收藏工具
  const [favorites, setFavorites] = useState<string[]>(favoriteToolIds);

  // 收藏/取消收藏操作
  const handleFavorite = async (toolId: string, isFav: boolean, e: React.MouseEvent) => {
    // 阻止事件冒泡，防止触发父元素的点击事件
    e.stopPropagation();
    
    const supabase = createClient();
    if (!user) return;
    if (isFav) {
      // 取消收藏
      await supabase.from('favorites').delete().eq('user_id', user.id).eq('tool_id', toolId);
      setFavorites(favs => favs.filter(id => id !== toolId));
    } else {
      // 添加收藏
      await supabase.from('favorites').insert({ user_id: user.id, tool_id: toolId });
      setFavorites(favs => [...favs, toolId]);
    }
  };

  // 更新过滤器以使用状态中的工具列表
  const filteredTools = tools.filter(tool => {
    // 先检查是否匹配搜索条件
    const matchesSearch = searchQuery === "" || 
                         tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         tool.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    // 如果不匹配搜索，直接返回false
    if (!matchesSearch) return false;
    
    // 根据分类进行筛选
    if (selectedCategory === "我的收藏") {
      return favorites.includes(tool.id);
    } else if (selectedCategory === "全部工具") {
      return true; // 显示所有匹配搜索的工具
    }
    
    // 匹配特定分类
    return tool.category === selectedCategory;
  });

  // 跟踪哪些工具点击数刚刚更新
  const [recentlyClicked, setRecentlyClicked] = useState<string | null>(null);
  
  // 点击动画计时器引用
  const clickTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 简化的工具点击处理函数
  const handleToolClick = (tool: Tool) => {
    // 立即在界面上更新点击数
    setTools(prevTools => 
      prevTools.map(t => 
        t.id === tool.id 
          ? { ...t, clicks_count: t.clicks_count + 1 } 
          : t
      )
    );
    
    // 设置刚刚点击的工具以触发动画
    setRecentlyClicked(tool.id);
    
    // 清除之前的定时器
    if (clickTimerRef.current) {
      clearTimeout(clickTimerRef.current);
    }
    
    // 设置新的定时器，1.5秒后移除动画效果
    clickTimerRef.current = setTimeout(() => {
      setRecentlyClicked(null);
    }, 1500);
    
    // 后台记录点击统计，不干扰导航
    try {
      // 通过服务器端操作记录点击（更可靠）
      const formData = new FormData();
      formData.append("toolId", tool.id);
      formData.append("referrer", document.referrer);
      formData.append("userAgent", navigator.userAgent);
      
      // 异步调用，不等待结果
      recordToolClickAction(formData);
    } catch (error) {
      console.error('Error recording click:', error);
    }
  };

  // 清理定时器
  useEffect(() => {
    return () => {
      if (clickTimerRef.current) {
        clearTimeout(clickTimerRef.current);
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8 pb-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-4">
            <Brain className="w-10 h-10 text-purple-600 dark:text-purple-400" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                AI Tools Navigator
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                发现适合您创意和生产需求的最佳AI工具
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            {user ? (
              <>
                {isAdmin && (
                  <Link
                    href="/dashboard"
                    className="px-6 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors duration-200"
                  >
                    仪表盘
                  </Link>
                )}
                <form action={signOutAction}>
                  <button
                    type="submit"
                    className="px-6 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition-colors duration-200"
                  >
                    退出登录
                  </button>
                </form>
              </>
            ) : (
              <>
                <Link
                  href="/sign-in"
                  className="px-6 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition-colors duration-200"
                >
                  登录
                </Link>
                <Link
                  href="/sign-up"
                  className="px-6 py-2 rounded-lg bg-white dark:bg-gray-800 text-purple-600 dark:text-purple-400 border border-purple-600 dark:border-purple-400 hover:bg-purple-50 dark:hover:bg-gray-700 transition-colors duration-200"
                >
                  注册
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Search */}
        <div className="mb-8">
          <div className="relative">
            <input
              type="text"
              placeholder="搜索工具..."
              className="w-full px-4 py-2 pr-12 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  // 回车键按下时，已经通过onChange设置了searchQuery，所以这里不需要额外操作
                }
              }}
            />
            <button 
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-gray-500 hover:text-purple-600 dark:text-gray-400 dark:hover:text-purple-400 transition-colors"
              onClick={() => {
                // 按钮点击时，已经通过onChange设置了searchQuery，所以这里不需要额外操作
              }}
              type="button"
              aria-label="搜索"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex flex-col md:flex-row gap-8">
          {/* Left Sidebar - Categories */}
          <div className="w-full md:w-64 flex-shrink-0">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">AI工具分类</h2>
            <nav className="space-y-1">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-colors duration-200 ${
                    selectedCategory === category
                      ? "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 font-medium"
                      : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                  }`}
                >
                  <span className="flex-1">{category}</span>
                  <span className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs px-2 py-1 rounded-full">
                    {category === "我的收藏"
                      ? favorites.filter(id => 
                          tools.some(tool => 
                            tool.id === id && 
                            (searchQuery === "" || 
                             tool.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                             tool.description.toLowerCase().includes(searchQuery.toLowerCase()))
                          )
                        ).length
                      : category === "全部工具"
                        ? tools.filter(tool => 
                            searchQuery === "" || 
                            tool.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            tool.description.toLowerCase().includes(searchQuery.toLowerCase())
                          ).length
                        : tools.filter(tool => 
                            tool.category === category && 
                            (searchQuery === "" || 
                             tool.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                             tool.description.toLowerCase().includes(searchQuery.toLowerCase()))
                          ).length
                    }
                  </span>
                </button>
              ))}
            </nav>
          </div>

          {/* Right Content - Tools */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {selectedCategory}
              </h2>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                共 {filteredTools.length} 个工具
              </span>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredTools.map((tool) => (
                <a
                  key={tool.id}
                  href={tool.url}
                  onClick={() => handleToolClick(tool)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block group"
                >
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-200 border border-gray-100 dark:border-gray-700 h-full flex flex-col">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-10 h-10 flex items-center justify-center rounded-lg overflow-hidden">
                        {tool.icon}
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors duration-200">
                        {tool.name}
                      </h3>
                    </div>
                    <p className="text-gray-600 dark:text-gray-300 flex-grow">
                      {tool.description}
                    </p>
                    <div className="mt-4 flex items-center justify-end gap-3">
                      {tool.clicks_count > 0 && (
                        <span className={`text-xs flex items-center gap-1 px-2 py-1 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-full ${recentlyClicked === tool.id ? 'animate-pulse font-bold' : ''}`}>
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M15 15s1-1 2-1 2 1 2 1M7 15s1-1 2-1 2 1 2 1"/>
                            <line x1="12" y1="20" x2="12" y2="14"/>
                          </svg>
                          {tool.clicks_count}
                        </span>
                      )}
                      {user && (
                        <button
                          type="button"
                          className={`text-xs px-2 py-1 rounded-full border ${favorites.includes(tool.id) ? 'bg-yellow-200 border-yellow-400 text-yellow-700' : 'bg-gray-100 border-gray-300 text-gray-500'} hover:bg-yellow-300 hover:text-yellow-900 transition`}
                          onClick={e => { 
                            e.preventDefault(); // 防止链接跳转
                            e.stopPropagation(); // 防止事件冒泡到父元素的点击处理函数
                            handleFavorite(tool.id, favorites.includes(tool.id), e); 
                          }}
                        >
                          {favorites.includes(tool.id) ? '★ 已收藏' : '☆ 收藏'}
                        </button>
                      )}
                    </div>
                  </div>
                </a>
              ))}
              {filteredTools.length === 0 && (
                <div className="col-span-full flex flex-col items-center justify-center p-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
                  <p className="text-gray-500 dark:text-gray-400 text-center">
                    没有找到匹配的工具
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 