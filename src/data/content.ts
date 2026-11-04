export const repoUrl = "https://github.com/Sakula-Yuzu/Yuzu.Power";
export const issuesUrl = "https://github.com/Sakula-Yuzu/Yuzu.Power/issues";
export const biliUrl = "https://b23.tv/DTTEDLU";
export const releasesUrl = "https://github.com/Sakula-Yuzu/Yuzu.Power/releases";

export const latest = {
  version: "1.9.0",
  date: "2026-11-04",
  apk: "Yuzu.Power_1.9.0_PL.apk",
  size: "19.7 MB",
  downloadUrl:
    "https://github.com/Sakula-Yuzu/Yuzu.Power/releases/download/%E6%AD%A3%E5%BC%8F%E7%89%881.9.0/Yuzu.Power_1.9.0_PL.apk",
  releaseUrl:
    "https://github.com/Sakula-Yuzu/Yuzu.Power/releases/tag/%E6%AD%A3%E5%BC%8F%E7%89%881.9.0",
};

function releaseTag(tag: string) {
  return `https://github.com/Sakula-Yuzu/Yuzu.Power/releases/tag/${encodeURIComponent(tag)}`;
}

export const nav = [
  { href: "#features", label: "功能" },
  { href: "#shots", label: "界面" },
  { href: "#devices", label: "适配" },
  { href: "#versions", label: "版本" },
  { href: "#faq", label: "问题" },
];

export const features = [
  {
    title: "同屏读数",
    body: "同一界面显示瞬时功率（W）、电压（V）、电流与温度（°C）。负值表示耗电，正值表示充入。电流单位随系统识别，亦可在应用内切换为 μA 或 mA。",
  },
  {
    title: "主界面自定义",
    body: "自 1.8.0 起，主界面组件可增可删。功率、循环次数、各路温度、刷新率与核心频率，均可按使用习惯排列。",
  },
  {
    title: "悬浮窗",
    body: "可在其他应用上层显示关键数据。展开与收起各自对应一套布局，尺寸与深浅色均可调整，并支持保存为方案。使用前需授予「显示在其他应用上层」权限。",
  },
  {
    title: "充放电记录",
    body: "记录单次充放电的起止电量、时长、峰值与平均功率、电流、温度，以及电荷量变化。功率、温度与电量曲线可对照查看。",
  },
  {
    title: "功率校准",
    body: "1.8.0 引入校准功能，1.9.0 进一步优化算法。校准进行期间，功率、电流、电压与电荷量仍保持显示。",
  },
  {
    title: "处理器与温度",
    body: "可查看处理器型号、频率与各核心占用。部分温度及处理器数据需通过 Shizuku 获取。作者建议使用 AxManager 完成授权。",
  },
  {
    title: "功耗统计",
    body: "1.9.0 新增。可按应用统计一段时间内前台、后台、前台服务与缓存的电荷量（mAh），并显示各自占比。",
  },
  {
    title: "应用冰箱",
    body: "1.9.0 的测试功能，发布说明标注为 Beta。冷藏室与冷冻室仍在完善中，尚不宜作为稳定功能使用。",
  },
  {
    title: "灵动岛与后台读取",
    body: "支持在国产手机灵动岛及部分第三方灵动岛中显示实时功率。离开主界面后，应用会尽量继续读取。「隐藏后台」自 1.9.0 起移至「稳定运行」。",
  },
];

export const shots = [
  {
    src: "shots/home.jpg",
    title: "主界面",
    version: "1.8.0",
    caption: "功率、温度、刷新率与处理器信息同屏显示。",
  },
  {
    src: "shots/layout.jpg",
    title: "自定义组件",
    version: "1.8.0",
    caption: "可添加原先未提供的组件。带标记的项目可能需要 Shizuku。",
  },
  {
    src: "shots/float.jpg",
    title: "悬浮窗",
    version: "1.8.0",
    caption: "展开与收起各有一套布局。尺寸与主题可调，亦可另存为方案。",
  },
  {
    src: "shots/calibrate.jpg",
    title: "校准",
    version: "1.8.0",
    caption: "校准过程中仍可查看功率、电流、电压与电荷量。",
  },
  {
    src: "shots/stats.jpg",
    title: "耗电统计",
    version: "1.9.0",
    caption: "按应用区分前台、后台、服务与缓存的电荷量。",
  },
  {
    src: "shots/fridge.jpg",
    title: "应用冰箱",
    version: "1.9.0 Beta",
    caption: "测试功能。冷藏室与冷冻室尚不稳定。",
  },
  {
    src: "shots/about.jpg",
    title: "关于",
    version: "1.8.0",
    caption: "版本、作者与官网。1.9.0 起，特别鸣谢移至「更新与声明」。",
  },
];

export const support = [
  { k: "98.6%", v: "仓库所标注的主流机型覆盖率" },
  { k: "中兴 / 努比亚 / 红魔", v: "说明中表现最佳的机型" },
  { k: "OPPO 系", v: "已针对电流单位差异作适配；读数异常时可手动切换 μA / mA" },
  { k: "无电池设备", v: "亦可查看功率" },
];

export const versions: {
  version: string;
  date: string;
  href: string;
  current?: boolean;
  notes: string[];
}[] = [
  {
    version: "1.9.0",
    date: "2026-11-04",
    href: releaseTag("正式版1.9.0"),
    current: true,
    notes: [
      "优化校准算法，并调整部分界面排版。",
      "特别鸣谢移至「关于 → 更新与声明」；隐藏后台移至「稳定运行」。",
      "新增功耗统计，以及应用冰箱（测试）。",
      "自 1.8.0 升级后，Shizuku 授权将失效，需停止后重新激活。",
    ],
  },
  {
    version: "1.8.0",
    date: "2026-10-31",
    href: releaseTag("正式版1.8.0"),
    notes: [
      "应用全面重构，新增校准、界面自定义与悬浮窗。",
      "可查看 CPU 信息；温度数据需要 Shizuku。",
      "关于页更新官网地址。升级前请备份充电数据，安装后建议清除应用数据。",
    ],
  },
  {
    version: "1.4.0",
    date: "2026-09-15",
    href: releaseTag("正式版1.4.0"),
    notes: [
      "重构界面，并新增软件优化。",
      "若停留在优化界面，请在应用信息中清除数据后重新打开。",
      "系统低于 Android 12，或无法使用 1.8.0 及之后版本时，请安装此版本。",
    ],
  },
  {
    version: "1.3.0",
    date: "2026-09-01",
    href: releaseTag("正式版1.3.0"),
    notes: ["优化部分异形屏显示异常。", "补充了第三方灵动岛的进度说明。"],
  },
  {
    version: "1.2.0",
    date: "2026-08-20",
    href: releaseTag("正式版1.2.0"),
    notes: ["修复部分界面返回时的卡顿或黑屏。", "重新调整了界面文字排版。"],
  },
  {
    version: "1.0.0",
    date: "2026-08-09",
    href: releaseTag("正式版1.0.0"),
    notes: ["首个正式版。据作者说明，此为第 34 个版本，历经约一个月打磨。"],
  },
  {
    version: "0.2 众测",
    date: "2026-08-05",
    href: releaseTag("众测版"),
    notes: ["早期测试版本。反馈请通过作者的哔哩哔哩主页提交。"],
  },
];

export const faqs = [
  {
    q: "本应用是否为 Switch 模拟器？",
    a: "不是。Yuzu.Power 仅记录手机的充放电功率。名称中的 Yuzu 取自作者所用的「柚」，与任天堂主机及游戏模拟器无关。",
  },
  {
    q: "为何部分温度没有数值？",
    a: "温度及部分处理器数据需要 Shizuku 权限。编辑组件时，应用也会提示该项可能须通过 Shizuku 获取。自 1.8.0 升级至 1.9.0 后，授权将失效，请先停止 Shizuku，再重新激活。作者建议使用 AxManager 进行授权。",
  },
  {
    q: "支持哪些手机？",
    a: "本应用适用于 Android。仓库说明所标主流机型支持率为 98.6%，中兴、努比亚与红魔表现最佳，并已针对 OPPO 系不同的电流单位进行适配。无电池设备亦可查看功率。部分异形屏的显示仍可能不够理想。1.8.0 及之后的版本需要 Android 12 及以上。",
  },
  {
    q: "功率单位显示异常时如何处理？",
    a: "应用会自动识别电流单位。若显示异常，可在设置中手动切换 μA / mA。",
  },
  {
    q: "安装包从何处获取？",
    a: "本站不托管安装文件。1.9.0 的安装包位于 GitHub Releases，文件名为 Yuzu.Power_1.9.0_PL.apk，大小约 19.7 MB。请仅从该发布页下载。",
  },
  {
    q: "升级是否会导致记录丢失？",
    a: "自 1.4.0 升级时，请先备份充电数据；升级后清除应用数据，再进入应用重新导入。1.8.0 为重大更新，作者亦建议安装后清除数据，以避免卡顿或兼容问题。",
  },
  {
    q: "停留在优化界面，或打开后立即退出，应如何处理？",
    a: "若停留在优化界面，请在系统「应用信息」中清除本应用数据后重新打开。若 1.8.0 及之后的版本出现闪退，请先确认系统是否为 Android 12 及以上；低于该版本时，请改用 1.4.0。",
  },
  {
    q: "发现问题应如何反馈？",
    a: "可通过 GitHub Issues 提交，或经由作者的哔哩哔哩主页联系。作者曾说明：若某项问题被采纳并完成修正，反馈者可能会被列入贡献者名单。",
  },
];

export const credits = [
  { role: "制作", names: "Sakula_小柚柚" },
  { role: "图标设计与制作", names: "九烨" },
  { role: "宣传", names: "时葱葱呀zZ" },
  { role: "资金援助", names: "黑衣清衫、牙科么肆么_免费方式、嘉豪" },
  { role: "测试", names: "时葱葱呀zZ、Key、黑衣清衫、不是夕瓜我不吃、牙科么肆么_免费方式" },
];
