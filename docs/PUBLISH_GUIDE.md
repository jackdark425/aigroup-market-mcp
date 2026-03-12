# aigroup-market-mcp 发布指南

## 发布新版本步骤

### 1. 更新版本号
```bash
# 方式1: 手动更新 package.json 中的 version 字段
# 方式2: 使用 npm version 命令
npm version patch    # 小版本更新 (x.x.1 → x.x.2)
npm version minor    # 次版本更新 (x.1.x → x.2.0)
npm version major    # 主版本更新 (1.x.x → 2.0.0)
```

### 2. 构建项目
```bash
# 执行构建脚本，将 TypeScript 编译为 JavaScript
npm run build
```

### 3. 发布到 npm
```bash
# 发布到 npm 仓库
npm publish
```

## 重要说明

### 认证配置
- 发布前先执行 `npm whoami` 确认当前机器的 npm 登录状态
- 认证信息通常由当前系统用户的 `~/.npmrc` 管理
- 若当前机器未登录，请先执行 `npm login`

### 发布前检查清单
- [ ] 更新 `package.json` 中的版本号
- [ ] 确保所有代码变更已提交
- [ ] 运行 `npm run build` 确保构建成功
- [ ] 测试构建后的功能是否正常
- [ ] 更新 CHANGELOG.md（若已建立）

### 版本号规范
- **主版本号 (major)**：不兼容的 API 修改
- **次版本号 (minor)**：向下兼容的功能性新增
- **修订号 (patch)**：向下兼容的问题修正

### 注意事项
- 发布前确保 `.npmignore` 配置正确，避免发布不必要的文件
- 发布前建议执行 `npm whoami`、`npm run build`、以及基础启动验证
- 发布后可在 [npmjs.com](https://www.npmjs.com/package/aigroup-market-mcp) 查看包状态
- 如需重新登录，使用 `npm login` 命令

## 快速发布命令
```bash
# 一键发布（更新版本号 + 构建 + 发布）
npm version patch && npm run build && npm publish
```

---

*最后更新：2025-11-08*