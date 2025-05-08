'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { PlusCircle, Pencil, Trash2, Check, X, ExternalLink } from 'lucide-react';
import Link from 'next/link';

interface Tool {
  id: string;
  name: string;
  description: string;
  url: string;
  icon: string;
  category_id: string;
  clicks_count: number;
}

interface Category {
  id: string;
  name: string;
  description: string;
}

export function ToolsClient({ tools: initialTools, categories }: { tools: Tool[], categories: Category[] }) {
  const [tools, setTools] = useState<Tool[]>(initialTools);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [newTool, setNewTool] = useState<Omit<Tool, 'id' | 'clicks_count'>>({
    name: '',
    description: '',
    url: '',
    icon: '',
    category_id: categories.length > 0 ? categories[0].id : ''
  });
  const [editForm, setEditForm] = useState<Omit<Tool, 'id' | 'clicks_count'>>({
    name: '',
    description: '',
    url: '',
    icon: '',
    category_id: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  
  const supabase = createClient();
  
  // 在组件加载时检查管理员权限
  useEffect(() => {
    async function checkAdminStatus() {
      try {
        console.log("开始检查管理员权限...");
        
        // 获取当前会话
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error("获取会话时出错:", sessionError);
          setError("无法验证您的登录状态，请重新登录");
          return;
        }
        
        if (!sessionData.session) {
          console.log("没有活跃会话，用户可能未登录");
          setError("请先登录");
          return;
        }
        
        console.log("会话有效, 用户ID:", sessionData.session.user.id);
        
        // 获取当前用户
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError) {
          console.error("获取用户信息失败:", userError);
          setError("获取用户信息失败，请刷新页面或重新登录");
          return;
        }
        
        if (!user) {
          console.log("未登录状态");
          setError("请先登录");
          return;
        }
        
        console.log("当前用户ID:", user.id);
        
        // 获取用户角色信息
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
        
        if (profileError) {
          console.error("获取用户角色失败:", profileError);
          setError("无法验证您的权限，请联系管理员");
          return;
        }
        
        const hasAdminRole = profile?.role === 'admin';
        console.log("用户角色:", profile?.role, "是否管理员:", hasAdminRole);
        
        setIsAdmin(hasAdminRole);
        
        if (!hasAdminRole) {
          setError("您没有管理员权限，无法编辑工具");
        } else {
          setError(null);
          console.log("管理员权限验证成功");
        }
      } catch (error) {
        console.error("检查管理员状态时出错:", error);
        setError("验证权限时发生错误");
      }
    }
    
    checkAdminStatus();
  }, [supabase]);
  
  // 添加新工具
  const handleAddTool = async () => {
    // 检查管理员权限
    if (!isAdmin) {
      setError("您没有管理员权限，无法添加工具");
      console.error("非管理员用户尝试添加工具");
      return;
    }
    
    if (!validateToolForm(newTool)) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // 获取当前会话确认认证状态
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        console.error("获取会话失败或无有效会话:", sessionError);
        throw new Error("您的登录已过期，请重新登录");
      }
      
      const { data, error } = await supabase
        .from('tools')
        .insert([{ 
          ...newTool,
          clicks_count: 0 
        }])
        .select()
        .single();
      
      if (error) throw error;
      
      setTools([...tools, data]);
      setNewTool({
        name: '',
        description: '',
        url: '',
        icon: '',
        category_id: categories.length > 0 ? categories[0].id : ''
      });
      setIsAdding(false);
      setSuccessMessage('工具添加成功');
      
      // 3秒后清除成功消息
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error: any) {
      console.error('Error adding tool:', error);
      setError(error.message || '添加工具失败');
    } finally {
      setIsLoading(false);
    }
  };
  
  // 开始编辑工具
  const handleEditStart = (tool: Tool) => {
    setEditingId(tool.id);
    setEditForm({
      name: tool.name,
      description: tool.description || '',
      url: tool.url,
      icon: tool.icon || '',
      category_id: tool.category_id
    });
  };
  
  // 取消编辑
  const handleEditCancel = () => {
    setEditingId(null);
    setEditForm({
      name: '',
      description: '',
      url: '',
      icon: '',
      category_id: ''
    });
  };
  
  // 保存编辑
  const handleEditSave = async (id: string) => {
    console.log("开始编辑保存，ID:", id, "类型:", typeof id);
    
    // 检查管理员权限
    if (!isAdmin) {
      setError("您没有管理员权限，无法更新工具");
      console.error("非管理员用户尝试更新工具");
      return;
    }
    
    if (!validateToolForm(editForm)) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // 先刷新会话，确保认证状态最新
      const { error: refreshError } = await supabase.auth.refreshSession();
      if (refreshError) {
        console.warn("刷新会话失败，尝试继续操作:", refreshError);
      }
      
      // 获取当前会话确认认证状态
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error("获取会话失败:", sessionError);
        throw new Error("无法验证您的身份，请重新登录");
      }
      
      if (!session) {
        console.error("无有效会话");
        throw new Error("您的登录已过期，请重新登录");
      }
      
      console.log("使用有效会话:", session.user.id);
      
      // 先检查记录是否存在
      console.log("检查工具是否存在，ID:", id);
      try {
        const { data: existingTool, error: checkError } = await supabase
          .from('tools')
          .select('*')
          .eq('id', id)
          .single();
        
        if (checkError) {
          console.log("检查工具存在时出错:", checkError);
          throw new Error(`无法找到ID为 ${id} 的工具: ${checkError.message}`);
        }
        
        console.log("找到现有工具:", existingTool);
      } catch (error) {
        console.error("查询工具时出错:", error);
        throw new Error("查询工具数据失败，请稍后再试");
      }
      
      console.log("准备发送更新请求，数据:", editForm);
      
      let updateData;
      try {
        const { data, error } = await supabase
          .from('tools')
          .update({
            name: editForm.name.trim(),
            description: editForm.description.trim(),
            url: editForm.url.trim(),
            icon: editForm.icon.trim(),
            category_id: editForm.category_id
          })
          .eq('id', id)
          .select()
          .single();
        
        console.log("收到响应 - data:", data, "error:", error);
        
        if (error) {
          console.error("更新时出错:", error, "错误代码:", error.code);
          throw error;
        }
        
        updateData = data;
      } catch (updateError: any) {
        console.error("更新操作失败:", updateError);
        throw new Error(`更新工具失败: ${updateError.message || '未知错误'}`);
      }
      
      if (!updateData) {
        throw new Error("更新成功但未返回更新后的数据");
      }
      
      setTools(tools.map(tool => tool.id === id ? updateData : tool));
      setEditingId(null);
      setSuccessMessage('工具更新成功');
      
      // 3秒后清除成功消息
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error: any) {
      console.error('Error updating tool:', error);
      setError(error.message || '更新工具失败');
    } finally {
      setIsLoading(false);
      console.log("编辑保存完成");
    }
  };
  
  // 删除工具
  const handleDeleteTool = async (id: string) => {
    // 检查管理员权限
    if (!isAdmin) {
      setError("您没有管理员权限，无法删除工具");
      console.error("非管理员用户尝试删除工具");
      return;
    }
    
    if (!confirm('确定要删除这个工具吗？')) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // 获取当前会话确认认证状态
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        console.error("获取会话失败或无有效会话:", sessionError);
        throw new Error("您的登录已过期，请重新登录");
      }
      
      const { error } = await supabase
        .from('tools')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      setTools(tools.filter(tool => tool.id !== id));
      setSuccessMessage('工具删除成功');
      
      // 3秒后清除成功消息
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error: any) {
      console.error('Error deleting tool:', error);
      setError(error.message || '删除工具失败');
    } finally {
      setIsLoading(false);
    }
  };
  
  // 表单验证
  const validateToolForm = (form: Omit<Tool, 'id' | 'clicks_count'>): boolean => {
    if (!form.name.trim()) {
      setError('工具名称不能为空');
      return false;
    }
    
    if (!form.url.trim()) {
      setError('URL不能为空');
      return false;
    }
    
    if (!form.category_id) {
      setError('必须选择分类');
      return false;
    }
    
    // 验证URL格式
    try {
      new URL(form.url);
    } catch (_) {
      setError('URL格式不正确，请输入完整URL（包含http://或https://）');
      return false;
    }
    
    return true;
  };
  
  // 查询分类名称
  const getCategoryName = (categoryId: string): string => {
    const category = categories.find(c => c.id === categoryId);
    return category ? category.name : '-';
  };
  
  // 渲染工具表单
  const renderToolForm = (isNew = true, data = newTool, setData = setNewTool) => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            工具名称 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={data.name}
            onChange={(e) => setData({ ...data, name: e.target.value })}
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white py-2 px-3"
            placeholder="输入工具名称"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            分类 <span className="text-red-500">*</span>
          </label>
          <select
            value={data.category_id}
            onChange={(e) => setData({ ...data, category_id: e.target.value })}
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white py-2 px-3"
          >
            <option value="" disabled>选择分类</option>
            {categories.map(category => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          URL <span className="text-red-500">*</span>
        </label>
        <input
          type="url"
          value={data.url}
          onChange={(e) => setData({ ...data, url: e.target.value })}
          className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white py-2 px-3"
          placeholder="https://example.com"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          图标URL
        </label>
        <input
          type="url"
          value={data.icon}
          onChange={(e) => setData({ ...data, icon: e.target.value })}
          className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white py-2 px-3"
          placeholder="https://example.com/icon.png"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          描述
        </label>
        <textarea
          value={data.description}
          onChange={(e) => setData({ ...data, description: e.target.value })}
          className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white py-2 px-3"
          placeholder="输入工具描述"
          rows={3}
        />
      </div>
      <div className="flex justify-end gap-2">
        <button
          onClick={() => {
            if (isNew) {
              setIsAdding(false);
              setNewTool({
                name: '',
                description: '',
                url: '',
                icon: '',
                category_id: categories.length > 0 ? categories[0].id : ''
              });
            } else {
              handleEditCancel();
            }
            setError(null);
          }}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
          disabled={isLoading}
        >
          取消
        </button>
        <button
          onClick={isNew ? handleAddTool : () => handleEditSave(editingId!)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400"
          disabled={isLoading}
        >
          {isLoading ? '保存中...' : '保存'}
        </button>
      </div>
    </div>
  );
  
  return (
    <div className="space-y-6">
      {/* 顶部操作栏 */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">工具列表 ({tools.length})</h2>
        <div className="flex gap-2">
          <Link href="/dashboard/categories" className="flex items-center gap-2 px-4 py-2 border border-indigo-600 dark:border-indigo-400 text-indigo-600 dark:text-indigo-400 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors">
            <span>管理分类</span>
          </Link>
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-gray-400"
            disabled={isAdding || isLoading}
          >
            <PlusCircle className="w-4 h-4" />
            <span>添加工具</span>
          </button>
        </div>
      </div>
      
      {/* 错误和成功提示 */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}
      
      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
          {successMessage}
        </div>
      )}
      
      {/* 添加新工具表单 */}
      {isAdding && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">添加新工具</h3>
          {renderToolForm()}
        </div>
      )}
      
      {/* 工具列表 */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  工具名称
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  分类
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  URL
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  点击数
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {tools.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                    暂无工具数据
                  </td>
                </tr>
              )}
              
              {tools.map((tool) => (
                <tr key={tool.id} className={editingId === tool.id ? 'bg-indigo-50 dark:bg-indigo-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-750'}>
                  {editingId === tool.id ? (
                    <td colSpan={5} className="px-4 py-4">
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">编辑工具</h4>
                      {renderToolForm(false, editForm, setEditForm)}
                    </td>
                  ) : (
                    <>
                      <td className="px-4 py-4">
                        <div className="flex items-center">
                          {tool.icon && (
                            <img 
                              src={tool.icon} 
                              alt={tool.name} 
                              className="w-6 h-6 mr-3 object-contain"
                              onError={(e) => (e.target as HTMLImageElement).style.display = 'none'} 
                            />
                          )}
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {tool.name}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs rounded-full bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                          {getCategoryName(tool.category_id)}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <a 
                          href={tool.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          {tool.url.length > 30 ? tool.url.substring(0, 30) + '...' : tool.url}
                          <ExternalLink className="w-3 h-3 ml-1" />
                        </a>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {tool.clicks_count}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end gap-3">
                          <button
                            onClick={() => handleEditStart(tool)}
                            className="flex items-center gap-1 text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300"
                            disabled={isLoading || editingId !== null}
                          >
                            <Pencil className="w-4 h-4" />
                            <span>编辑</span>
                          </button>
                          <button
                            onClick={() => handleDeleteTool(tool.id)}
                            className="flex items-center gap-1 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                            disabled={isLoading || editingId !== null}
                          >
                            <Trash2 className="w-4 h-4" />
                            <span>删除</span>
                          </button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 