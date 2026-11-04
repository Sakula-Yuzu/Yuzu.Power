import {
  Activity,
  AppWindow,
  Cpu,
  ExternalLink,
  Gauge,
  LayoutGrid,
  LineChart,
  Snowflake,
  Smartphone,
  Zap,
} from "lucide-react";
import { PhoneDemo } from "@/components/phone-demo";
import { ShotGallery } from "@/components/shot-gallery";
import { SiteHeader } from "@/components/site-header";
import {
  biliUrl,
  credits,
  faqs,
  features,
  issuesUrl,
  latest,
  releasesUrl,
  repoUrl,
  support,
  versions,
} from "@/data/content";

const featureIcons = [Zap, LayoutGrid, AppWindow, LineChart, Gauge, Cpu, Activity, Snowflake, Smartphone];

export default function App() {
  return (
    <>
      <a
        href="#top"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-accent focus:px-4 focus:py-2 focus:text-on-accent"
      >
        跳到内容
      </a>
      <SiteHeader />
      <main id="top">
        <section className="mx-auto grid w-full max-w-6xl items-start gap-12 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-[minmax(0,1fr)_22rem] lg:py-20">
          <div>
            <p className="text-sm font-medium text-accent">
              正式版 {latest.version} · {latest.date} · Android
            </p>
            <h1 className="mt-4">
              <span className="font-display block text-5xl tracking-tight text-ink sm:text-6xl">
                Yuzu.Power
              </span>
              <span className="mt-3 block text-3xl font-medium tracking-tight text-ink sm:text-4xl">
                无需外接功率计，即可查看充放电功率
              </span>
            </h1>
            <p className="mt-5 max-w-xl text-base text-muted sm:text-lg">
              Yuzu.Power（柚.Power）是哔哩哔哩 UP 主 Sakula_小柚柚面向数码爱好者开发的轻量级 Android 应用。应用在同一界面呈现瞬时功率、电压、电流与温度，并支持组件自定义、悬浮窗，以及将单次充放电记录为曲线。
            </p>
            <p className="mt-3 max-w-xl text-base text-ink">
              {latest.version} 新增功耗统计，并提供仍处于测试阶段的应用冰箱。
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="#download"
                className="inline-flex min-h-11 items-center rounded-full bg-accent px-5 text-sm font-medium text-on-accent transition-colors duration-200 hover:bg-ink hover:text-paper"
              >
                获取 {latest.version}
              </a>
              <a
                href={repoUrl}
                className="inline-flex min-h-11 items-center gap-2 rounded-full border border-line bg-card px-5 text-sm font-medium text-ink"
              >
                GitHub
                <ExternalLink className="size-4" aria-hidden />
              </a>
            </div>
            <dl className="mt-10 grid grid-cols-3 gap-3 border-t border-line pt-6">
              <div>
                <dt className="text-xs text-muted">标注覆盖</dt>
                <dd className="mt-1 font-display text-2xl text-ink">98.6%</dd>
              </div>
              <div>
                <dt className="text-xs text-muted">系统</dt>
                <dd className="mt-1 font-display text-2xl text-ink">12+</dd>
              </div>
              <div>
                <dt className="text-xs text-muted">安装包</dt>
                <dd className="mt-1 font-display text-2xl text-ink">{latest.size}</dd>
              </div>
            </dl>
            <p className="mt-4 text-sm text-muted">
              自 1.8.0 起需要 Android 12，更低版本请使用 1.4.0。右侧数值为浏览器示意，不会读取本机电池。
            </p>
          </div>
          <PhoneDemo />
        </section>

        <section id="features" className="scroll-mt-24 border-t border-line">
          <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
            <h2 className="text-3xl font-medium tracking-tight">功能概览</h2>
            <p className="mt-3 max-w-2xl text-muted">
              本应用为轻量级充放电功率查看器。下列能力均已包含于当前正式版。
            </p>
            <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((feature, i) => {
                const Icon = featureIcons[i] ?? Zap;
                return (
                  <li key={feature.title} className="rounded-2xl border border-line bg-card p-5">
                    <Icon className="size-5 text-accent" aria-hidden />
                    <h3 className="mt-4 text-lg font-medium">{feature.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted">{feature.body}</p>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>

        <section id="shots" className="scroll-mt-24 border-t border-line">
          <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
              <div>
                <h2 className="text-3xl font-medium tracking-tight">界面截图</h2>
                <p className="mt-3 max-w-2xl text-muted">
                  以下画面取自作者发布于 GitHub Releases 的说明，并非本页绘制。点击可查看完整截图。
                </p>
              </div>
            </div>
            <div className="mt-10">
              <ShotGallery />
            </div>
          </div>
        </section>

        <section id="devices" className="scroll-mt-24 border-t border-line">
          <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
            <h2 className="text-3xl font-medium tracking-tight">机型适配</h2>
            <p className="mt-3 max-w-2xl text-muted">
              支持情况依据仓库 README，本站未另行编列机型名单。部分异形屏的显示仍可能不够理想，欢迎反馈。
            </p>
            <ul className="mt-8 grid gap-4 sm:grid-cols-2">
              {support.map((item) => (
                <li key={item.k} className="rounded-2xl border border-line bg-card p-5">
                  <p className="text-lg font-medium">{item.k}</p>
                  <p className="mt-1 text-sm text-muted">{item.v}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section id="versions" className="scroll-mt-24 border-t border-line">
          <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
              <h2 className="text-3xl font-medium tracking-tight">版本</h2>
              <a href={releasesUrl} className="text-sm font-medium text-accent">
                查看全部发布
              </a>
            </div>
            <ol className="mt-8 divide-y divide-line border-y border-line">
              {versions.map((item) => (
                <li key={item.version} className="grid gap-3 py-6 sm:grid-cols-[9rem_1fr] sm:gap-8">
                  <div>
                    <p className="font-medium">
                      {item.version}
                      {item.current ? (
                        <span className="ml-2 rounded-full bg-accent px-2 py-0.5 text-xs font-medium text-on-accent">
                          现行
                        </span>
                      ) : null}
                    </p>
                    <time className="text-sm text-muted" dateTime={item.date}>
                      {item.date}
                    </time>
                  </div>
                  <div>
                    <ul className="space-y-1 text-sm text-ink">
                      {item.notes.map((note) => (
                        <li key={note}>{note}</li>
                      ))}
                    </ul>
                    <a href={item.href} className="mt-2 inline-flex min-h-11 items-center text-sm text-accent">
                      查看发布页
                    </a>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section id="faq" className="scroll-mt-24 border-t border-line">
          <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
            <h2 className="text-3xl font-medium tracking-tight">常见问题</h2>
            <div className="mt-6 max-w-3xl divide-y divide-line border-y border-line">
              {faqs.map((item) => (
                <details key={item.q} className="group">
                  <summary className="flex min-h-14 list-none items-center justify-between gap-4 py-3 font-medium">
                    {item.q}
                    <span className="text-muted transition-transform duration-200 group-open:rotate-45" aria-hidden>
                      +
                    </span>
                  </summary>
                  <p className="pb-4 text-sm leading-relaxed text-muted">{item.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section id="thanks" className="scroll-mt-24 border-t border-line">
          <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
            <h2 className="text-3xl font-medium tracking-tight">致谢</h2>
            <p className="mt-3 max-w-2xl text-sm text-muted">
              名单摘自仓库 README。自 1.9.0 起，应用内的特别鸣谢位于「关于 → 更新与声明」。
            </p>
            <dl className="mt-8 grid gap-4 sm:grid-cols-2">
              {credits.map((item) => (
                <div key={item.role} className="rounded-2xl border border-line bg-card p-5">
                  <dt className="text-xs text-muted">{item.role}</dt>
                  <dd className="mt-1 font-medium">{item.names}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <section id="download" className="scroll-mt-24">
          <div className="mx-auto w-full max-w-6xl px-4 pb-16 sm:px-6 sm:pb-20">
            <div className="rounded-3xl bg-ink px-6 py-10 text-paper sm:px-10">
              <p className="text-sm text-paper/70">Android · 正式版 {latest.version}</p>
              <h2 className="mt-2 text-3xl font-medium tracking-tight">安装说明</h2>
              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-paper/80">
                本站不提供安装包托管。文件发布于 GitHub Releases，文件名为 {latest.apk}，大小约 {latest.size}。安装前请允许来自该来源的应用。
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <a
                  href={latest.downloadUrl}
                  className="inline-flex min-h-11 items-center rounded-full bg-paper px-5 text-sm font-medium text-ink"
                >
                  下载 {latest.apk}
                </a>
                <a
                  href={latest.releaseUrl}
                  className="inline-flex min-h-11 items-center rounded-full border border-paper/30 px-5 text-sm font-medium text-paper"
                >
                  查看发布页
                </a>
              </div>
              <ul className="mt-8 max-w-2xl space-y-3 text-sm leading-relaxed text-paper/80">
                <li>1.8.0 及之后的版本需要 Android 12 及以上。系统版本更低，或新版本出现闪退时，请改用 1.4.0。</li>
                <li>自 1.4.0 升级时，请先备份充电数据；升级后清除应用数据，再进入应用重新导入。</li>
                <li>自 1.8.0 升级至 1.9.0 后，Shizuku 授权将失效。请停止 Shizuku 后重新激活。作者建议使用 AxManager。</li>
                <li>1.8.0 为重大更新。安装后建议清除本应用数据，以避免卡顿及兼容问题。</li>
              </ul>
              <p className="mt-6 text-sm">
                <a className="text-paper underline decoration-paper/40 underline-offset-4" href={versions[2]?.href}>
                  1.4.0 发布页（适用于 Android 12 以下）
                </a>
              </p>
            </div>
          </div>
        </section>
      </main>
      <footer className="border-t border-line">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-8 text-sm text-muted sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>Yuzu.Power · Sakula_小柚柚</p>
          <nav className="flex flex-wrap gap-x-4 gap-y-2" aria-label="更多">
            <a href={repoUrl} className="min-h-11 inline-flex items-center hover:text-ink">
              GitHub
            </a>
            <a href={issuesUrl} className="min-h-11 inline-flex items-center hover:text-ink">
              Issues
            </a>
            <a href={biliUrl} className="min-h-11 inline-flex items-center hover:text-ink">
              哔哩哔哩
            </a>
            <a href={releasesUrl} className="min-h-11 inline-flex items-center hover:text-ink">
              Releases
            </a>
          </nav>
        </div>
        <p className="mx-auto w-full max-w-6xl px-4 pb-10 text-xs leading-relaxed text-muted sm:px-6">
          本仓库目前未指定开源许可证。Yuzu.Power 并非游戏模拟器，仅用于记录手机充放电功率。
        </p>
      </footer>
    </>
  );
}
