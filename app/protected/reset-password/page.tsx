import { resetPasswordAction } from "@/app/actions";
import { FormMessage, Message } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default async function ResetPassword(props: {
  searchParams: Promise<Message>;
}) {
  const searchParams = await props.searchParams;
  return (
    <div className="w-full max-w-md mx-auto bg-white dark:bg-gray-800 rounded-xl p-8 shadow-sm border border-gray-100 dark:border-gray-700">
      <form className="flex flex-col">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">设置新密码</h1>
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-8">
          请在下方输入您的新密码
        </p>
        <div className="flex flex-col gap-4">
          <div className="space-y-2">
            <Label htmlFor="password" className="text-gray-700 dark:text-gray-200">新密码</Label>
            <Input
              type="password"
              name="password"
              placeholder="输入新密码"
              required
              className="w-full border-gray-200 dark:border-gray-700 focus:ring-purple-500"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-gray-700 dark:text-gray-200">确认密码</Label>
            <Input
              type="password"
              name="confirmPassword"
              placeholder="再次输入密码"
              required
              className="w-full border-gray-200 dark:border-gray-700 focus:ring-purple-500"
            />
          </div>
          <SubmitButton 
            pendingText="提交中..." 
            formAction={resetPasswordAction}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-lg mt-2"
          >
            更新密码
          </SubmitButton>
          <FormMessage message={searchParams} />
        </div>
      </form>
    </div>
  );
}
