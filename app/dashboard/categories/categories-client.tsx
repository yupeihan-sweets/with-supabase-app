'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { PlusCircle, Pencil, Trash2, Check, X } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  description: string;
}

export function CategoriesClient({ categories: initialCategories }: { categories: Category[] }) {
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [newCategory, setNewCategory] = useState<Omit<Category, 'id'>>({
    name: '',
    description: ''
  });
  const [editForm, setEditForm] = useState<Omit<Category, 'id'>>({
    name: '',
    description: ''
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
        // 获取当前会话
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error("获取会话时出错:", sessionError);
          setError("无法验证您的登录状态，请重新登录");
          return;
        }
        
        if (!sessionData.session) {
          setError("请先登录");
          return;
        }
        
        // 获取当前用户
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError) {
          console.error("获取用户信息失败:", userError);
          setError("获取用户信息失败，请刷新页面或重新登录");
          return;
        }
        
        if (!user) {
          setError("请先登录");
          return;
        }
        
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
        
        setIsAdmin(hasAdminRole);
        
        if (!hasAdminRole) {
          setError("您没有管理员权限，无法编辑分类");
        } else {
          setError(null);
        }
      } catch (error) {
        console.error("检查管理员状态时出错:", error);
        setError("验证权限时发生错误");
      }
    }
    
    checkAdminStatus();
  }, [supabase]);
  
  // 添加新分类
  const handleAddCategory = async () => {
    // 检查管理员权限
    if (!isAdmin) {
      setError("您没有管理员权限，无法添加分类");
      console.error("非管理员用户尝试添加分类");
      return;
    }
    
    if (!validateCategoryForm(newCategory)) return;
    
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
        .from('categories')
        .insert([newCategory])
        .select()
        .single();
      
      if (error) throw error;
      
      setCategories([...categories, data]);
      setNewCategory({
        name: '',
        description: ''
      });
      setIsAdding(false);
      setSuccessMessage('分类添加成功');
      
      // 3秒后清除成功消息
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error: any) {
      console.error('Error adding category:', error);
      setError(error.message || '添加分类失败');
    } finally {
      setIsLoading(false);
    }
  };
  
  // 开始编辑分类
  const handleEditStart = (category: Category) => {
    setEditingId(category.id);
    setEditForm({
      name: category.name,
      description: category.description || ''
    });
  };
  
  // 取消编辑
  const handleEditCancel = () => {
    setEditingId(null);
    setEditForm({
      name: '',
      description: ''
    });
  };
  
  // 保存编辑
  const handleEditSave = async (id: string) => {
    // 检查管理员权限
    if (!isAdmin) {
      setError("您没有管理员权限，无法更新分类");
      console.error("非管理员用户尝试更新分类");
      return;
    }
    
    if (!validateCategoryForm(editForm)) return;
    
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
        throw new Error("您的登录已过期，请重新登录");
      }
      
      // 检查分类是否存在
      const { data: existingCategory, error: checkError } = await supabase
        .from('categories')
        .select()
        .eq('id', id)
        .single();
      
      if (checkError) {
        console.error("检查分类存在时出错:", checkError);
        throw new Error("找不到要编辑的分类");
      }
      
      if (!existingCategory) {
        throw new Error("找不到要编辑的分类");
      }
      
      // 更新分类
      const { data, error } = await supabase
        .from('categories')
        .update({
          name: editForm.name.trim(),
          description: editForm.description.trim()
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      // 更新本地状态
      setCategories(categories.map(cat => cat.id === id ? data : cat));
      setEditingId(null);
      setSuccessMessage('分类更新成功');
      
      // 3秒后清除成功消息
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error: any) {
      console.error('Error updating category:', error);
      setError(error.message || '更新分类失败');
    } finally {
      setIsLoading(false);
    }
  };
  
  // 删除分类
  const handleDeleteCategory = async (id: string) => {
    // 检查管理员权限
    if (!isAdmin) {
      setError("您没有管理员权限，无法删除分类");
      console.error("非管理员用户尝试删除分类");
      return;
    }
    
    if (!confirm('确定要删除这个分类吗？分类下的所有工具也会被设为未分类！')) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // 获取当前会话确认认证状态
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        console.error("获取会话失败或无有效会话:", sessionError);
        throw new Error("您的登录已过期，请重新登录");
      }
      
      // 查询分类下是否有工具
      const { data: tools, error: toolsError } = await supabase
        .from('tools')
        .select('id')
        .eq('category_id', id);
      
      if (toolsError) {
        console.error("查询分类下的工具时出错:", toolsError);
        throw new Error("无法检查分类下的工具");
      }
      
      if (tools && tools.length > 0) {
        if (!confirm(`此分类下有 ${tools.length} 个工具，删除后这些工具将变为未分类，确定要继续吗？`)) {
          setIsLoading(false);
          return;
        }
        
        // 需要先将该分类下的工具设为未分类
        try {
          // 将该分类下所有工具的category_id设为null
          await supabase
            .from('tools')
            .update({ category_id: null })
            .eq('category_id', id);
        } catch (error) {
          console.error("更新工具分类时出错:", error);
          throw new Error("无法更新工具分类");
        }
      }
      
      // 删除分类
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      // 更新本地状态
      setCategories(categories.filter(cat => cat.id !== id));
      setSuccessMessage('分类删除成功');
      
      // 3秒后清除成功消息
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error: any) {
      console.error('Error deleting category:', error);
      setError(error.message || '删除分类失败');
    } finally {
      setIsLoading(false);
    }
  };
  
  // 验证表单
  const validateCategoryForm = (form: Omit<Category, 'id'>): boolean => {
    if (!form.name.trim()) {
      setError('分类名称不能为空');
      return false;
    }
    
    // 检查名称长度
    if (form.name.trim().length > 50) {
      setError('分类名称不能超过50个字符');
      return false;
    }
    
    // 检查描述长度
    if (form.description && form.description.length > 500) {
      setError('分类描述不能超过500个字符');
      return false;
    }
    
    return true;
  };
  
  // 渲染分类表单
  const renderCategoryForm = (isNew = true, data = newCategory, setData = setNewCategory) => (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow mb-4">
      <h3 className="text-lg font-medium mb-4">{isNew ? '添加新分类' : '编辑分类'}</h3>
      <div className="space-y-4">
        <div>
          <label htmlFor={`${isNew ? 'new' : 'edit'}-name`} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            名称 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id={`${isNew ? 'new' : 'edit'}-name`}
            value={data.name}
            onChange={(e) => setData({ ...data, name: e.target.value })}
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 focus:ring-purple-500 focus:border-purple-500"
            placeholder="分类名称"
            required
          />
        </div>
        
        <div>
          <label htmlFor={`${isNew ? 'new' : 'edit'}-description`} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            描述
          </label>
          <textarea
            id={`${isNew ? 'new' : 'edit'}-description`}
            value={data.description || ''}
            onChange={(e) => setData({ ...data, description: e.target.value })}
            rows={3}
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 focus:ring-purple-500 focus:border-purple-500"
            placeholder="分类描述（可选）"
          />
        </div>
        
        <div className="flex justify-end space-x-2">
          <button
            type="button"
            onClick={() => isNew ? setIsAdding(false) : handleEditCancel()}
            className="py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
            disabled={isLoading}
          >
            取消
          </button>
          <button
            type="button"
            onClick={() => isNew ? handleAddCategory() : handleEditSave(editingId!)}
            className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:bg-purple-400 disabled:cursor-not-allowed"
            disabled={isLoading}
          >
            {isLoading ? '处理中...' : (isNew ? '添加' : '保存')}
          </button>
        </div>
      </div>
    </div>
  );
  
  return (
    <div>
      {error && (
        <div className="bg-red-100 dark:bg-red-900 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded relative mb-4" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      )}
      
      {successMessage && (
        <div className="bg-green-100 dark:bg-green-900 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 px-4 py-3 rounded relative mb-4" role="alert">
          <span className="block sm:inline">{successMessage}</span>
        </div>
      )}
      
      {!isAdmin && (
        <div className="bg-yellow-100 dark:bg-yellow-900 border border-yellow-200 dark:border-yellow-800 text-yellow-700 dark:text-yellow-300 px-4 py-3 rounded relative mb-4" role="alert">
          <span className="block sm:inline">只有管理员能编辑分类</span>
        </div>
      )}
      
      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">分类管理</h2>
        {isAdmin && !isAdding && (
          <button
            type="button"
            onClick={() => setIsAdding(true)}
            className="flex items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
          >
            <PlusCircle className="mr-2 h-4 w-4" /> 添加分类
          </button>
        )}
      </div>
      
      {isAdding && renderCategoryForm()}
      
      <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                名称
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                描述
              </th>
              {isAdmin && (
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  操作
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {categories.length === 0 ? (
              <tr>
                <td colSpan={isAdmin ? 3 : 2} className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                  暂无分类数据
                </td>
              </tr>
            ) : (
              categories.map((category) => (
                <tr key={category.id}>
                  {editingId === category.id ? (
                    <td colSpan={isAdmin ? 3 : 2} className="px-6 py-4">
                      {renderCategoryForm(false, editForm, setEditForm)}
                    </td>
                  ) : (
                    <>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {category.name}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                        {category.description || '-'}
                      </td>
                      {isAdmin && (
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleEditStart(category)}
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 mr-3"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteCategory(category.id)}
                            className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      )}
                    </>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
} 