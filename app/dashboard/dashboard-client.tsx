'use client';

import { useState, useEffect } from 'react';
import { ArrowUpRight, BarChart3, ListFilter, CalendarDays, PieChart as PieChartIcon, LineChart as LineChartIcon, BarChart as BarChartIcon } from 'lucide-react';
import { 
  PieChart, Pie, BarChart, Bar, LineChart, Line, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, Cell 
} from 'recharts';
import Link from 'next/link';

interface Analytics {
  id: string;
  name: string;
  url: string;
  category: string;
  clicks_count: number;
  clicks_last_30_days: number;
  unique_users: number;
}

interface Category {
  id: string;
  name: string;
  description: string;
}

interface ClickTrend {
  tool_id: string;
  clicked_at: string;
}

export function DashboardClient({
  analytics,
  categories,
  clickTrends
}: {
  analytics: Analytics[];
  categories: Category[];
  clickTrends: ClickTrend[];
}) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [timeRange, setTimeRange] = useState<string>('30days');
  const [sortBy, setSortBy] = useState<string>('total');
  const [chartView, setChartView] = useState<'pie' | 'bar' | 'line'>('pie');

  // 过滤并排序数据
  const filteredAnalytics = analytics.filter(item => 
    selectedCategory === 'all' || item.category === selectedCategory
  ).sort((a, b) => {
    if (sortBy === 'total') {
      return b.clicks_count - a.clicks_count;
    } else if (sortBy === 'recent') {
      return b.clicks_last_30_days - a.clicks_last_30_days;
    } else {
      return b.unique_users - a.unique_users;
    }
  });

  // 计算总点击数
  const totalClicks = analytics.reduce((sum, item) => sum + item.clicks_count, 0);
  const recentClicks = analytics.reduce((sum, item) => sum + item.clicks_last_30_days, 0);
  
  // 按分类汇总数据
  const categoryStats = categories.map(category => {
    const toolsInCategory = analytics.filter(tool => tool.category === category.name);
    const totalClicksInCategory = toolsInCategory.reduce((sum, tool) => sum + tool.clicks_count, 0);
    const recentClicksInCategory = toolsInCategory.reduce((sum, tool) => sum + tool.clicks_last_30_days, 0);
    
    return {
      id: category.id,
      name: category.name,
      totalClicks: totalClicksInCategory,
      recentClicks: recentClicksInCategory,
      toolCount: toolsInCategory.length
    };
  }).sort((a, b) => b.totalClicks - a.totalClicks);

  // 计算最高的点击值以设置图表比例
  const maxClicks = Math.max(...filteredAnalytics.map(item => item.clicks_count), 1);
  
  // 为饼图准备数据
  const pieChartData = categoryStats
    .filter(category => category.totalClicks > 0)
    .map(category => ({
      name: category.name,
      value: category.totalClicks
    }));

  // 为柱状图准备数据 - 展示点击量前10的工具
  const barChartData = [...filteredAnalytics]
    .sort((a, b) => b.clicks_count - a.clicks_count)
    .slice(0, 10)
    .map(tool => ({
      name: tool.name,
      "总点击量": tool.clicks_count,
      "近30天": tool.clicks_last_30_days
    }));

  // 为折线图准备数据 - 展示过去30天的点击趋势
  const clicksByDay = new Map();
  
  // 初始化过去30天的所有日期
  const today = new Date();
  for (let i = 0; i < 30; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateString = date.toISOString().split('T')[0];
    clicksByDay.set(dateString, 0);
  }
  
  // 统计每天的点击数
  clickTrends.forEach(click => {
    const date = new Date(click.clicked_at).toISOString().split('T')[0];
    if (clicksByDay.has(date)) {
      clicksByDay.set(date, clicksByDay.get(date) + 1);
    }
  });
  
  // 转换为图表数据格式，并按日期正序排列
  const lineChartData = Array.from(clicksByDay.entries())
    .map(([date, count]) => ({ 
      date, 
      "点击次数": count 
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
  
  // 图表颜色
  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#a4de6c', '#d0ed57'];

  return (
    <div className="space-y-8">
      {/* 数据总览卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">总点击量</h3>
            <BarChart3 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{totalClicks}</p>
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
            最近30天: {recentClicks} 次点击
          </p>
        </div>
        
        <Link href="/dashboard/tools" className="block">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-800 transition-all duration-200">
            <div className="flex items-center justify-between">
              <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">工具总数</h3>
              <ListFilter className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{analytics.length}</p>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 flex items-center">
              管理AI工具 <ArrowUpRight className="w-3 h-3 ml-1" />
            </p>
          </div>
        </Link>
        
        <Link href="/dashboard/categories" className="block">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-800 transition-all duration-200">
            <div className="flex items-center justify-between">
              <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">分类总数</h3>
              <CalendarDays className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{categories.length}</p>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 flex items-center">
              管理AI分类 <ArrowUpRight className="w-3 h-3 ml-1" />
            </p>
          </div>
        </Link>
      </div>
      
      {/* 过滤和排序控件 */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            分类
          </label>
          <select 
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white py-2 px-3"
          >
            <option value="all">所有分类</option>
            {categories.map(category => (
              <option key={category.id} value={category.name}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
        
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            排序方式
          </label>
          <select 
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white py-2 px-3"
          >
            <option value="total">总点击量</option>
            <option value="recent">近期点击</option>
            <option value="users">独立用户</option>
          </select>
        </div>
      </div>
      
      {/* 工具点击排行榜 */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="p-4 border-b border-gray-100 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">工具点击排行</h2>
        </div>
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
                  点击量
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  近30天
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  独立用户
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  可视化
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {filteredAnalytics.map((tool) => (
                <tr key={tool.id} className="hover:bg-gray-50 dark:hover:bg-gray-750">
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {tool.name}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs rounded-full bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                      {tool.category}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {tool.clicks_count}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {tool.clicks_last_30_days}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {tool.unique_users}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
                      <div 
                        className="bg-purple-600 h-2.5 rounded-full" 
                        style={{ width: `${(tool.clicks_count / maxClicks) * 100}%` }}
                      ></div>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredAnalytics.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                    暂无数据
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* 分类统计 */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="p-4 border-b border-gray-100 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">分类统计</h2>
        </div>
        <div className="p-4">
          <div className="space-y-4">
            {categoryStats.map(category => (
              <div key={category.id} className="flex items-center">
                <div className="w-1/4 sm:w-1/6 truncate">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {category.name}
                  </span>
                </div>
                <div className="w-3/4 sm:w-5/6 flex items-center">
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 mr-2 overflow-hidden">
                    <div 
                      className="bg-indigo-600 dark:bg-indigo-500 h-4 rounded-full"
                      style={{ width: `${Math.max((category.totalClicks / (analytics.reduce((sum, a) => sum + a.clicks_count, 0) || 1)) * 100, 1)}%` }}
                    ></div>
                  </div>
                  <div className="min-w-[80px] text-right">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {category.totalClicks} 次
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* 数据可视化图表 */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">数据可视化</h2>
          <div className="flex space-x-2">
            <button 
              onClick={() => setChartView('pie')}
              className={`p-2 rounded-md ${chartView === 'pie' 
                ? 'bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-300' 
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}
              title="饼图"
            >
              <PieChartIcon className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setChartView('bar')}
              className={`p-2 rounded-md ${chartView === 'bar' 
                ? 'bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-300' 
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}
              title="柱状图"
            >
              <BarChartIcon className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setChartView('line')}
              className={`p-2 rounded-md ${chartView === 'line' 
                ? 'bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-300' 
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}
              title="折线图"
            >
              <LineChartIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div className="p-4">
          <div className="h-80">
            {chartView === 'pie' && pieChartData.length > 0 && (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={130}
                    fill="#8884d8"
                    dataKey="value"
                    label={false}
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} 次点击`, '点击量']} />
                  <Legend 
                    layout="horizontal" 
                    verticalAlign="bottom" 
                    align="center"
                    formatter={(value, entry, index) => {
                      const { payload } = entry;
                      if (!payload) return value;
                      const percent = (payload.value / pieChartData.reduce((a, b) => a + b.value, 0) * 100).toFixed(0);
                      return (
                        <span className="text-sm inline-block mr-2 mb-1">
                          <span className="text-gray-800 dark:text-gray-200">{value}</span>
                          <span className="text-gray-500 dark:text-gray-400">: {percent}%</span>
                        </span>
                      );
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
            
            {chartView === 'bar' && barChartData.length > 0 && (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={barChartData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} angle={-45} textAnchor="end" height={60} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="总点击量" fill="#8884d8" />
                  <Bar dataKey="近30天" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            )}
            
            {chartView === 'line' && lineChartData.length > 0 && (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={lineChartData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12 }} 
                    angle={-45} 
                    textAnchor="end" 
                    height={60}
                    tickFormatter={(date) => {
                      const d = new Date(date);
                      return `${d.getMonth() + 1}/${d.getDate()}`;
                    }}
                  />
                  <YAxis />
                  <Tooltip labelFormatter={(date) => `日期: ${date}`} />
                  <Legend />
                  <Line type="monotone" dataKey="点击次数" stroke="#8884d8" activeDot={{ r: 8 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
            
            {((chartView === 'pie' && pieChartData.length === 0) ||
              (chartView === 'bar' && barChartData.length === 0) ||
              (chartView === 'line' && lineChartData.length === 0)) && (
              <div className="h-full flex items-center justify-center">
                <p className="text-gray-500 dark:text-gray-400">暂无足够数据生成图表</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 