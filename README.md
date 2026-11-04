# Yuzu.Power

**新一代轻量级充放电功率查看器**

Yuzu.Power 是由哔哩哔哩 UP 主 [Sakula_小柚柚](https://b23.tv/DTTEDLU) 基于人工智能技术开发的现代化 Android 应用，专注于实时监测手机充放电功率，对主流机型的支持率达到 **98.6%**。

[![GitHub release](https://img.shields.io/github/v/release/Sakula-Yuzu/Yuzu.Power?style=flat-square)](https://github.com/Sakula-Yuzu/Yuzu.Power/releases)
[![GitHub stars](https://img.shields.io/github/stars/Sakula-Yuzu/Yuzu.Power?style=flat-square)](https://github.com/Sakula-Yuzu/Yuzu.Power/stargazers)
[![Downloads](https://img.shields.io/github/downloads/Sakula-Yuzu/Yuzu.Power/total?style=flat-square)](https://github.com/Sakula-Yuzu/Yuzu.Power/releases)
[![Android](https://img.shields.io/badge/Platform-Android-3DDC84?style=flat-square&logo=android)](https://github.com/Sakula-Yuzu/Yuzu.Power)

> 将每一次充放电过程，转化为可视化曲线记录。

**官方网站**：[https://sakula-yuzu.github.io/Yuzu.Power/](https://sakula-yuzu.github.io/Yuzu.Power/)

---

## 功能特性

- **实时功率监测**：同一界面显示瞬时功率（W）、电压（V）、电流（mA/μA）及温度（°C）
- **自动单位适配**：自动识别系统电流单位（μA / mA），支持手动切换
- **现代化用户界面**：提供多元主题，支持自定义壁纸、透明度与模糊效果
- **界面自定义**：允许用户自由添加、删除组件并调整布局与尺寸
- **悬浮窗功能**：支持展开与收起两种布局，可切换主题并保存方案
- **充放电会话记录**：完整记录起止电量、峰值与平均功率、温度变化及结束原因
- **功率曲线可视化**：展示充放电过程中功率、温度与电量的变化趋势
- **校准功能**：提供功率校准算法（1.9.0 版本进一步优化）
- **处理器信息查看**：显示芯片型号、频率及各核心占用情况（部分温度数据需 Shizuku 授权）
- **功耗统计**：新增功耗统计分析功能（1.9.0）
- **应用冰箱**：测试功能，用于辅助管理后台进程（1.9.0）
- **后台保活机制**：支持后台持续运行，状态栏实时显示充放电状态
- **灵动岛兼容**：支持国产手机系统灵动岛及部分第三方灵动岛应用
- **无电池设备适配**：针对无电池设备进行专门优化
- **OPPO 系统优化**：针对 OPPO 系列电流单位差异进行适配
- **最佳适配机型**：中兴、努比亚、红魔系列设备表现最优

---

## 支持情况

| 项目               | 说明                           |
|--------------------|--------------------------------|
| 主流机型支持率     | **98.6%**                      |
| 最佳运行设备       | 中兴、努比亚、红魔             |
| 特别优化           | OPPO 系统电流单位差异          |
| 特殊适配           | 无电池设备、部分异形屏         |
| 最低系统要求       | Android 12 及以上（1.8.0 及后续版本） |

> 部分异形屏设备可能存在显示适配不足的情况，欢迎通过反馈渠道提交问题。  
> **系统要求说明**：1.8.0 及后续版本需运行于 Android 12 及以上系统；较低版本系统请使用 1.4.0 版本。

---

## 下载与安装

请前往 [Releases 页面](https://github.com/Sakula-Yuzu/Yuzu.Power/releases) 下载最新正式版。

**当前最新版本**：正式版 1.9.0

### 版本历史概览

| 版本      | 发布日期     | 主要更新内容                                                                 |
|-----------|--------------|------------------------------------------------------------------------------|
| **1.9.0** | 2026-11-04   | 优化校准算法与界面排版；新增应用冰箱（测试版）与功耗统计功能；特别鸣谢迁移至关于页面 |
| **1.8.0** | 2026-10-31   | 全面重构应用架构；新增校准功能、CPU 信息查看、界面自定义与悬浮窗功能；更新官方网站 |
| **1.4.0** | 2026-09-15   | 重构用户界面；新增软件优化功能（若卡在优化界面，请清除应用数据后重试）           |
| **1.3.0** | 2026-09-01   | 优化部分异形屏显示异常；补充第三方灵动岛进度显示说明                             |
| **1.2.0** | 2026-08-20   | 修复界面返回时卡顿或黑屏问题；优化文字排版                                     |
| **1.0.0** | 2026-08-09   | 正式版发布（经过 34 个版本迭代打磨）                                           |
| 众测版    | 2026-08-05   | 早期测试版本                                                                 |

> **升级注意事项**：  
> - 自 1.4.0 升级时，请提前备份数据，升级后清除应用数据并重新导入。  
> - 自 1.8.0 升级至 1.9.0 后，如 Shizuku 授权失效，请停止 Shizuku 服务后重新激活（推荐使用 AxManager 进行授权管理）。  
> - 更新前建议备份充电相关数据。

---

## 使用说明

1. 下载并安装 APK 文件（需允许安装来自未知来源的应用）。
2. 启动应用后，系统将自动识别电流单位。
3. 如功率显示异常，可在设置中手动切换 μA 或 mA 单位。
4. 支持后台运行，可配合灵动岛实时查看功率信息。
5. 部分温度及处理器数据需通过 **Shizuku** 授权获取（推荐使用 AxManager 管理授权）。
6. 1.8.0 及后续版本支持界面自定义、悬浮窗与校准等功能，可在应用内进行配置。

---

## 反馈与支持

如发现缺陷或有改进建议，欢迎通过以下渠道反馈：

- **作者哔哩哔哩主页**：[Sakula_小柚柚](https://b23.tv/DTTEDLU)
- **GitHub Issues**：[提交 Issue](https://github.com/Sakula-Yuzu/Yuzu.Power/issues)
- **官方网站**：[https://sakula-yuzu.github.io/Yuzu.Power/](https://sakula-yuzu.github.io/Yuzu.Power/)

> 经采纳的有效反馈，有机会被列入贡献者名单。

---

## 截图

<img width="840" height="1867" alt="主界面" src="https://github.com/user-attachments/assets/b8a0fb94-24c6-4e47-89ef-7262c6b5031c" />
<img width="840" height="1867" alt="会话记录" src="https://github.com/user-attachments/assets/e7acbb6c-d6bb-4291-815e-f4cf334ae414" />
<img width="840" height="1867" alt="自定义组件" src="https://github.com/user-attachments/assets/a6e9ff39-c363-4d75-82bf-93b864f4d2af" />
<img width="840" height="1867" alt="悬浮窗" src="https://github.com/user-attachments/assets/04285bd0-1dfb-4f96-bb43-1a5efa9dd51c" />
<img width="840" height="1867" alt="校准" src="https://github.com/user-attachments/assets/d2697ec1-e281-4693-b045-c9f1576f81db" />
<img width="840" height="1867" alt="关于" src="https://github.com/user-attachments/assets/56f44652-bf4f-49ec-9e53-fe4bb1ab6ec7" />

更多截图请参阅 [Releases 页面](https://github.com/Sakula-Yuzu/Yuzu.Power/releases) 或 [官方网站](https://sakula-yuzu.github.io/Yuzu.Power/)。

---

## 常见问题

**本应用是否为 Switch 模拟器？**  
否。Yuzu.Power 仅用于记录手机充放电功率。名称中的 “Yuzu” 源自作者“柚”字，与任天堂主机及游戏模拟器无关。

**支持哪些设备？**  
本应用为 Android 平台软件。作者标注主流机型支持率为 98.6%，中兴、努比亚、红魔系列表现最佳，并对 OPPO 系列电流单位进行了适配。部分异形屏可能存在显示问题。1.8.0 及后续版本要求 Android 12 及以上系统。

**部分温度数据为何为空？**  
CPU、NPU 及表面温度等数据需通过 Shizuku 授权获取。编辑组件时，应用会提示相关权限要求。

**功率单位显示异常如何处理？**  
应用会自动识别系统电流单位。若显示异常，可在设置中手动切换 μA 或 mA。

**安装后卡在优化界面或出现闪退？**  
请至系统“应用信息”中清除本应用数据后重新启动。若出现闪退，请确认设备系统版本为 Android 12 及以上。

**安装包获取途径？**  
请仅从 [GitHub Releases](https://github.com/Sakula-Yuzu/Yuzu.Power/releases) 下载。官方网站不提供 APK 文件托管。

---

## 许可证

本项目目前未指定开源许可证。使用前请尊重作者权益。

---

## 致谢

感谢所有测试用户与反馈者的支持。

- **作者**：Sakula_小柚柚
- **图标设计与制作**：九烨
- **宣传**：时葱葱呀zZ
- **资金援助**：黑衣清衫、牙科么肆么_免费方式、嘉豪
- **测试**：时葱葱呀zZ、Key、黑衣清衫、不是夕瓜我不吃、牙科么肆么_免费方式

由 **Sakula_小柚柚** 制作。