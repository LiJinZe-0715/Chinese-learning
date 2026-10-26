# ことば — 中日词语与语法对照

面向日语使用者的中文文法学习网站，包含中日查询、逐词对照、课程导航和选择题练习。纯静态 React + TypeScript + Vite 项目，可部署到 GitHub Pages。

## 本地开发

需要 Node.js 22.18+（推荐 Node.js 26）和 pnpm 12.9.1。

```sh
npm install --global pnpm@12.15.0
pnpm install --frozen-lockfile
pnpm dev
```

```sh
pnpm lint    # 检查所有源代码
pnpm test    # 领域/应用逻辑和完整教学数据检查
pnpm build   # TypeScript 检查并生成 dist/
pnpm preview # 预览生产构建
```

学习进度保留在当前页面内，刷新会重置。课程支持跨级前后导航、完整课程选择和分页列表。

## 分层架构

围绕“课程学习”领域分层，界面、业务函数和数据分别维护。

| 目录                  | 职责                                                                     |
| --------------------- | ------------------------------------------------------------------------ |
| `src/domain/`         | 课程模型、搜索规则和学习会话；答题、重试、完成课程、继续与复习均为纯函数 |
| `src/application/`    | 注入课程目录的查询与学习用例；计算课程进度和导航结果，不读取具体 JSON    |
| `src/infrastructure/` | 静态数据与可选 WebMCP 接口适配器；不依赖 React                           |
| `src/presentation/`   | 页面、讲解、练习、查询组件，以及分页、焦点等显示状态和 CSS               |
| `src/data/`           | 网站使用的课程、词汇与疑问表达数据                                       |
| `src/bootstrap.ts`    | 将静态数据注入应用服务                                                   |
| `content/`            | 大纲转录与人工编写的教学源数据                                           |

## 教学数据与来源

依据 [HSK 官方大纲](https://www.chinesetest.cn/syllabus) 2025 年 11 月版本的“语法”印刷页 383–403。PDF 文件页码比印刷页码多 3 页。586 行有内容的语法表格和 7 个独立空内容标题合计为 **593 个本站教学单元**，并非官方语法项目总数。七至九级合并为一个区分。

| 级别 | 课程数 |
| ---- | -----: |
| 1    |     70 |
| 2    |     78 |
| 3    |     96 |
| 4    |     95 |
| 5    |     70 |
| 6    |     50 |
| 7–9  |    134 |

`content/syllabus.json` 保存课程顺序和来源，`content/level-*.tsv` 使用真正的制表符分隔四个字段：来源 ID、日语讲解、中文例句、日语译文。`content/notes-*.tsv` 每课一行，包含七个字段：来源 ID、日语使用说明、练习问题、正确选项、两个错误选项、答案解析。593 课均须有对应的说明和专属练习；生成器不再从其他课抽取译文作为选项。

`content/glossary.tsv` 使用稳定的来源 ID、中文词语、日本语译文三个字段，课程顺序变化不会改变词汇归属。当前包含 438 组、978 条语句对照。译义是当前语法用法的提示，慣用句不能逐字代入解释；搜索同时覆盖完整讲解和使用说明。

`content/course.json` 保存级别名称、大纲来源和章节边界，`content/pronunciation.json` 保存多音词的语境读音。生成器只处理编译规则，不再内嵌课程章节和站点元数据。

`content/questions.json` 保存 27 组中文疑问表达、日本语意思、例句和中文句法说明，生成到 `src/data/questions.json`，同时编译表达拼音 `py` 和例句拼音 `examplePy`。页面面向日语母语者，不再用日语读音作为学习重点。“多大”按语境表示年龄或大小，“几岁”询问年龄，分别收录。

只有修改教学数据时才需要 Python 3 和 pypinyin：

```sh
python -m pip install --target work/vendor -r scripts/requirements.txt
pnpm content:build
pnpm test
```

生成结果写入 `src/data/` 下的四个 JSON 和 `content/coverage.json`，有变动的生成文件需要与源文件一起提交。正常开发和部署使用已提交的 JSON，无需 Python。拼音按音节分隔，“一”和“不”保留本调；常见儿化词的韵尾并入前一音节，哪儿为 nǎr，点儿为 diǎnr。多音字与助词使用语境修正，房屋量词“幢”采用大陆普通话 zhuàng。

数据检查覆盖课程完整性、顺序、页码、教学源文件、词汇源文件、元数据及覆盖清单与生成结果的一致性、词汇分词、593 组说明与练习的归属、选项唯一性、正确答案和重点拼音。它会拒绝缺失课程的说明、与该课源数据不一致的选项、与讲解完全相同的答题反馈及过期生成数据。学习流程另有纯函数测试，覆盖错误重试、禁止提交空答案、重复完成、跨级、最后一课与复习。自动检查不能替代语言审校。本次检查记录及课程范围见 [内容检查记录](content/CONTENT_REVIEW.md)。

大纲转录中的词语拼接和源表明显笔误使用 `sourceOriginal` 保留原文，`sourceCorrection` 说明修正依据，并在课程中显示说明。例如区分“句、公斤”、分隔两种状语，以及将存现句中的“所处”修正为“处所”。

## GitHub Pages

仓库的 **Settings → Pages → Build and deployment → Source** 选择 **GitHub Actions**。推送到 `main` 后，`.github/workflows/deploy-pages.yml` 会安装锁定依赖、运行 lint 和测试、构建并部署 `dist/`。Pull Request 只执行验证与构建。

工作流在构建前通过 `configure-pages` 读取真实站点路径，项目仓库、用户主页仓库和自定义域名均自动适配；PR 构建使用仓库名模拟项目路径。本仓库默认使用 `/chinese-japanese/`，首页链接与 favicon 同样使用这个前缀。部署只允许仓库默认分支，其他分支的手动构建不会发布。没有服务端 API 或需要服务器回退的路由。

本地验证相同部署路径（PowerShell）：

```powershell
$env:PAGES_BASE_PATH = '/chinese-japanese/'
pnpm build
pnpm preview
```

访问 `http://localhost:4173/chinese-japanese/`。本地模拟用户主页仓库或自定义域名时将 `PAGES_BASE_PATH` 设为 `/`，线上工作流自动读取此值。本地普通开发不需要设置该变量。工作流和本地路径构建均须通过后，再以线上 Actions 的部署成功状态确认实际发布。

## 提交内容

提交 `src/`、`content/`、`scripts/`、`tests/`、`public/`、`.github/` 和根目录配置、说明与锁文件。`node_modules/`、`dist/`、`work/`、`.pnpm-store/`、`.idea/` 和日志由 `.gitignore` 排除。

## Android App

已提供可离线使用的 Android 项目。构建、设备语音与备份说明见 [Android 使用说明](android/README.md)。运行 `pnpm android:build` 生成个人试用 APK，`pnpm android:test` 检查 Android 适配逻辑。

## APK 下载发布

网站提供本项目独立的 Android APK 下载按钮。发布文件为 `public/downloads/Chinese-learning.apk`，属于需要提交的下载资源。GitHub Pages 构建会将它复制到网站，点击按钮下载原始 APK。

更新安装包：

```sh
pnpm android:build
pnpm android:publish
```

`android:publish` 把已编译的 APK 复制到下载目录。将下载副本和网页改动一起提交、推送，等待现有 Pages 工作流部署成功。发布目录中的 APK 需要进入 Git；Android 构建输出、缓存和签名文件仍不提交。

生成新 APK 前提高 `android/app/build.gradle` 中的 `versionCode`，并保留原 `.signing/debug.keystore`，才能覆盖安装。Android 打包自动排除网站下载目录，安装版中隐藏 APK 下载入口。
