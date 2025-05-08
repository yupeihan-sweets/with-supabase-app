-- 初始化数据脚本 
-- 运行此脚本前请先执行 table.sql 创建表结构

-- 设置第一个用户为管理员（替换 YOUR_USER_ID 为实际的 UUID）
-- 如果已经通过UI注册了用户，请在Supabase的Authentication部分找到用户ID
-- 假如还没有注册用户，请先注册，然后将下面的YOUR_USER_ID替换为实际ID
INSERT INTO public.profiles (id, email, role, created_at, updated_at)
VALUES 
  ('YOUR_USER_ID', 'admin@example.com', 'admin', now(), now())
ON CONFLICT (id) DO UPDATE SET role = 'admin';

-- 插入分类数据
INSERT INTO public.categories (id, name, description, created_at, updated_at)
VALUES
  ('11111111-1111-1111-1111-111111111111', '聊天助手', 'AI聊天和对话类工具，提供自然语言交流服务', now(), now()),
  ('22222222-2222-2222-2222-222222222222', '图像生成', '基于文本提示生成图像的AI工具', now(), now()),
  ('33333333-3333-3333-3333-333333333333', '视频工具', 'AI视频创作、编辑和处理工具', now(), now()),
  ('44444444-4444-4444-4444-444444444444', '音频工具', 'AI音频生成、转换和处理工具', now(), now()),
  ('55555555-5555-5555-5555-555555555555', '编程辅助', '提升开发效率的AI编程工具', now(), now()),
  ('66666666-6666-6666-6666-666666666666', '办公助手', '提高办公效率的AI工具', now(), now()),
  ('77777777-7777-7777-7777-777777777777', '学习工具', '辅助学习和教育的AI工具', now(), now()),
  ('88888888-8888-8888-8888-888888888888', '创意写作', 'AI辅助写作和内容创作工具', now(), now());

-- 插入工具数据
INSERT INTO public.tools (id, name, description, url, icon, category_id, created_at, updated_at, clicks_count)
VALUES
  -- 聊天助手
  ('11111111-aaaa-1111-aaaa-111111111111', 'ChatGPT', 'OpenAI开发的对话式大型语言模型，可以进行自然对话、回答问题、创作内容', 'https://chat.openai.com', 'https://www.google.com/s2/favicons?domain=openai.com&sz=128', '11111111-1111-1111-1111-111111111111', now(), now(), 0),
  ('11111111-bbbb-1111-bbbb-111111111111', 'Claude', 'Anthropic开发的AI助手，擅长长文本理解和安全回答', 'https://claude.ai', 'https://www.google.com/s2/favicons?domain=claude.ai&sz=128', '11111111-1111-1111-1111-111111111111', now(), now(), 0),
  ('11111111-cccc-1111-cccc-111111111111', 'Bard', 'Google开发的AI聊天助手，集成Google搜索功能', 'https://bard.google.com', 'https://www.google.com/s2/favicons?domain=bard.com&sz=128', '11111111-1111-1111-1111-111111111111', now(), now(), 0),
  ('11111111-dddd-1111-dddd-111111111111', 'Perplexity', '基于AI的智能搜索引擎，提供引用来源的答案', 'https://www.perplexity.ai', 'https://www.google.com/s2/favicons?domain=perplexity.ai&sz=128', '11111111-1111-1111-1111-111111111111', now(), now(), 0),
  
  -- 图像生成
  ('22222222-aaaa-2222-aaaa-222222222222', 'DALL-E', 'OpenAI开发的AI图像生成模型，可根据文本描述创建图像', 'https://labs.openai.com', 'https://www.google.com/s2/favicons?domain=openai.com&sz=128', '22222222-2222-2222-2222-222222222222', now(), now(), 0),
  ('22222222-bbbb-2222-bbbb-222222222222', 'Midjourney', '通过Discord使用的高质量AI图像生成工具，擅长艺术风格创作', 'https://www.midjourney.com', 'https://www.google.com/s2/favicons?domain=midjourney.com&sz=128', '22222222-2222-2222-2222-222222222222', now(), now(), 0),
  ('22222222-cccc-2222-cccc-222222222222', 'Stable Diffusion', '开源的AI图像生成模型，可在本地或云端运行', 'https://stability.ai', 'https://www.google.com/s2/favicons?domain=stability.ai&sz=128', '22222222-2222-2222-2222-222222222222', now(), now(), 0),
  ('22222222-dddd-2222-dddd-222222222222', 'Leonardo.AI', '为游戏开发者和创意专业人士设计的AI图像生成平台', 'https://leonardo.ai', 'https://www.google.com/s2/favicons?domain=leonardo.ai&sz=128', '22222222-2222-2222-2222-222222222222', now(), now(), 0),
  
  -- 视频工具
  ('33333333-aaaa-3333-aaaa-333333333333', 'RunwayML', '专业级AI视频编辑和生成工具，支持多种视频效果和转换', 'https://runwayml.com', 'https://www.google.com/s2/favicons?domain=runwayml.com&sz=128', '33333333-3333-3333-3333-333333333333', now(), now(), 0),
  ('33333333-bbbb-3333-bbbb-333333333333', 'Synthesia', 'AI视频生成平台，可创建逼真的数字人视频', 'https://www.synthesia.io', 'https://www.google.com/s2/favicons?domain=synthesia.io&sz=128', '33333333-3333-3333-3333-333333333333', now(), now(), 0),
  ('33333333-cccc-3333-cccc-333333333333', 'Descript', '集成AI功能的视频和播客编辑软件，支持文本编辑视频', 'https://www.descript.com', 'https://www.google.com/s2/favicons?domain=descript.com&sz=128', '33333333-3333-3333-3333-333333333333', now(), now(), 0),
  ('33333333-dddd-3333-dddd-333333333333', 'HeyGen', '专业的AI视频生成平台，适合营销和培训视频制作', 'https://www.heygen.com', 'https://www.google.com/s2/favicons?domain=heygen.com&sz=128', '33333333-3333-3333-3333-333333333333', now(), now(), 0),
  
  -- 音频工具
  ('44444444-aaaa-4444-aaaa-444444444444', 'Mubert', 'AI音乐生成服务，可为各种场景创建无版权音乐', 'https://mubert.com', 'https://www.google.com/s2/favicons?domain=mubert.com&sz=128', '44444444-4444-4444-4444-444444444444', now(), now(), 0),
  ('44444444-bbbb-4444-bbbb-444444444444', 'ElevenLabs', '高质量AI语音合成平台，支持多种语言和音色', 'https://elevenlabs.io', 'https://www.google.com/s2/favicons?domain=elevenlabs.io&sz=128', '44444444-4444-4444-4444-444444444444', now(), now(), 0),
  ('44444444-cccc-4444-cccc-444444444444', 'LOVO AI', '提供自然语音合成的AI配音工具', 'https://www.lovo.ai', 'https://www.google.com/s2/favicons?domain=lovo.ai&sz=128', '44444444-4444-4444-4444-444444444444', now(), now(), 0),
  ('44444444-dddd-4444-dddd-444444444444', 'Descript Audio', 'AI驱动的音频编辑工具，支持文本编辑音频', 'https://www.descript.com/audio', 'https://www.google.com/s2/favicons?domain=descript.com&sz=128', '44444444-4444-4444-4444-444444444444', now(), now(), 0),
  
  -- 编程辅助
  ('55555555-aaaa-5555-aaaa-555555555555', 'GitHub Copilot', '微软和OpenAI合作开发的AI编程助手，集成在代码编辑器中', 'https://github.com/features/copilot', 'https://www.google.com/s2/favicons?domain=github.com&sz=128', '55555555-5555-5555-5555-555555555555', now(), now(), 0),
  ('55555555-bbbb-5555-bbbb-555555555555', 'Replit', '集成AI编码功能的在线IDE和协作平台', 'https://replit.com', 'https://www.google.com/s2/favicons?domain=replit.com&sz=128', '55555555-5555-5555-5555-555555555555', now(), now(), 0),
  ('55555555-cccc-5555-cccc-555555555555', 'Tabnine', 'AI代码补全工具，支持多种编程语言和开发环境', 'https://www.tabnine.com', 'https://www.google.com/s2/favicons?domain=tabnine.com&sz=128', '55555555-5555-5555-5555-555555555555', now(), now(), 0),
  ('55555555-dddd-5555-dddd-555555555555', 'Cursor', '基于AI的代码编辑器，内置强大的代码生成和重构功能', 'https://cursor.sh', 'https://www.google.com/s2/favicons?domain=cursor.sh&sz=128', '55555555-5555-5555-5555-555555555555', now(), now(), 0),
  
  -- 办公助手
  ('66666666-aaaa-6666-aaaa-666666666666', 'Notion AI', 'Notion集成的AI写作和内容生成助手', 'https://www.notion.so/product/ai', 'https://www.google.com/s2/favicons?domain=notion.so&sz=128', '66666666-6666-6666-6666-666666666666', now(), now(), 0),
  ('66666666-bbbb-6666-bbbb-666666666666', 'Jasper', 'AI内容创作平台，帮助营销团队生成各种类型的内容', 'https://www.jasper.ai', 'https://www.google.com/s2/favicons?domain=jasper.ai&sz=128', '66666666-6666-6666-6666-666666666666', now(), now(), 0),
  ('66666666-cccc-6666-cccc-666666666666', 'Otter.ai', 'AI会议记录和转录工具，自动生成会议摘要', 'https://otter.ai', 'https://www.google.com/s2/favicons?domain=otter.ai&sz=128', '66666666-6666-6666-6666-666666666666', now(), now(), 0),
  ('66666666-dddd-6666-dddd-666666666666', 'Mem.ai', 'AI驱动的个人知识管理工具，自动组织和连接信息', 'https://mem.ai', 'https://www.google.com/s2/favicons?domain=mem.ai&sz=128', '66666666-6666-6666-6666-666666666666', now(), now(), 0),
  
  -- 学习工具
  ('77777777-aaaa-7777-aaaa-777777777777', 'Duolingo Max', 'Duolingo的AI增强版，提供更个性化的语言学习体验', 'https://www.duolingo.com/max', 'https://www.google.com/s2/favicons?domain=duolingo.com&sz=128', '77777777-7777-7777-7777-777777777777', now(), now(), 0),
  ('77777777-bbbb-7777-bbbb-777777777777', 'Khan Academy Khanmigo', 'Khan Academy的AI辅导工具，提供个性化学习支持', 'https://www.khanacademy.org/khanmigo', 'https://www.google.com/s2/favicons?domain=khanacademy.org&sz=128', '77777777-7777-7777-7777-777777777777', now(), now(), 0),
  ('77777777-cccc-7777-cccc-777777777777', 'Quizlet Q-Chat', 'Quizlet的AI学习助手，帮助解答问题和准备考试', 'https://quizlet.com/features/q-chat', 'https://www.google.com/s2/favicons?domain=quizlet.com&sz=128', '77777777-7777-7777-7777-777777777777', now(), now(), 0),
  ('77777777-dddd-7777-dddd-777777777777', 'ELSA Speak', 'AI语言发音教练，帮助学习者提高口语能力', 'https://elsaspeak.com', 'https://www.google.com/s2/favicons?domain=elsaspeak.com&sz=128', '77777777-7777-7777-7777-777777777777', now(), now(), 0),
  
  -- 创意写作
  ('88888888-aaaa-8888-aaaa-888888888888', 'Sudowrite', '专为小说家和创意写作者设计的AI写作助手', 'https://www.sudowrite.com', 'https://www.google.com/s2/favicons?domain=sudowrite.com&sz=128', '88888888-8888-8888-8888-888888888888', now(), now(), 0),
  ('88888888-bbbb-8888-bbbb-888888888888', 'Copy.ai', '营销文案和商业内容的AI生成工具', 'https://www.copy.ai', 'https://www.google.com/s2/favicons?domain=copy.ai&sz=128', '88888888-8888-8888-8888-888888888888', now(), now(), 0),
  ('88888888-cccc-8888-cccc-888888888888', 'Writesonic', '多功能AI写作平台，适合博客、广告和社交媒体内容', 'https://writesonic.com', 'https://www.google.com/s2/favicons?domain=writesonic.com&sz=128', '88888888-8888-8888-8888-888888888888', now(), now(), 0),
  ('88888888-dddd-8888-dddd-888888888888', 'NovelAI', '专注于叙事和故事创作的AI写作工具', 'https://novelai.net', 'https://www.google.com/s2/favicons?domain=novelai.net&sz=128', '88888888-8888-8888-8888-888888888888', now(), now(), 0);

-- 插入一些示例点击数据（可选）
INSERT INTO public.clicks (tool_id, clicked_at)
VALUES
  ('11111111-aaaa-1111-aaaa-111111111111', now() - interval '2 day'),
  ('11111111-aaaa-1111-aaaa-111111111111', now() - interval '1 day'),
  ('11111111-aaaa-1111-aaaa-111111111111', now()),
  ('22222222-aaaa-2222-aaaa-222222222222', now() - interval '3 day'),
  ('22222222-aaaa-2222-aaaa-222222222222', now()),
  ('33333333-aaaa-3333-aaaa-333333333333', now());

-- 更新工具的点击计数（与前面的点击数据匹配）
UPDATE public.tools SET clicks_count = 3 WHERE id = '11111111-aaaa-1111-aaaa-111111111111';
UPDATE public.tools SET clicks_count = 2 WHERE id = '22222222-aaaa-2222-aaaa-222222222222';
UPDATE public.tools SET clicks_count = 1 WHERE id = '33333333-aaaa-3333-aaaa-333333333333';

-- 插入收藏测试数据（假设admin用户收藏了ChatGPT和DALL-E）
INSERT INTO public.favorites (user_id, tool_id, created_at)
VALUES
  ('YOUR_USER_ID', '11111111-aaaa-1111-aaaa-111111111111', now()), -- ChatGPT
  ('YOUR_USER_ID', '22222222-aaaa-2222-aaaa-222222222222', now()); -- DALL-E 