import { signInAction } from "@/app/actions";
import { FormMessage, Message } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";

export default async function Login(props: { searchParams: Promise<Message> }) {
  const searchParams = await props.searchParams;
  return (
    <div className="w-full max-w-md mx-auto bg-white dark:bg-gray-800 rounded-xl p-8 shadow-sm border border-gray-100 dark:border-gray-700">
      <form className="flex flex-col">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">登录</h1>
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-8">
          还没有账号？{" "}
          <Link className="text-purple-600 dark:text-purple-400 font-medium hover:underline" href="/sign-up">
            注册账号
          </Link>
        </p>
        <div className="flex flex-col gap-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-gray-700 dark:text-gray-200">邮箱</Label>
            <Input 
              name="email" 
              placeholder="you@example.com" 
              required 
              className="w-full border-gray-200 dark:border-gray-700 focus:ring-purple-500"
            />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="password" className="text-gray-700 dark:text-gray-200">密码</Label>
              <Link
                className="text-sm text-purple-600 dark:text-purple-400 hover:underline"
                href="/forgot-password"
              >
                忘记密码？
              </Link>
            </div>
            <Input
              type="password"
              name="password"
              placeholder="输入密码"
              required
              className="w-full border-gray-200 dark:border-gray-700 focus:ring-purple-500"
            />
          </div>
          <SubmitButton 
            pendingText="登录中..." 
            formAction={signInAction}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-lg mt-2"
          >
            登录
          </SubmitButton>
          <FormMessage message={searchParams} />
        </div>
      </form>
    </div>
  );
}
