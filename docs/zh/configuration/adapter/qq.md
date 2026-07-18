# QQ 适配器

KiraAI 使用 OneBot 协议连接到 QQ，您可以使用以下支持 OneBot 的 QQ 协议端进行连接：
- [NapCat](https://github.com/NapNeko/NapCatQQ)
- [LLBot](https://github.com/LLOneBot/LuckyLilliaBot)

## 配置协议端

根据对应项目的文档进行部署后，进入 `网络配置` -> `新建` -> `WebSocket 服务器`

![ws_server](/zh/images/ws_server.png)

- 输入一个自定义名称
- 按需设置 `host`，如果 KiraAI 和 QQ 协议端位于一台机器上则不用修改，Docker 部署需要两个容器处于一个网络下并将 `host` 改为网络名称
- 如果在公网部署，强烈建议保留 Token 以保证安全性
- 设置完后启用并保存

## 添加适配器

进入 KiraAI WebUI，在适配器页面点击“添加适配器”按钮，选择适配器类型为 QQ，适配器名称强烈建议使用英文小写字母+下划线且语义和平台相关，例：`qq`, `qq_alt`

将 QQ 协议端的网络配置填写到适配器配置中，并配置好 `白名单` 或 `黑名单`。填写 QQ 号以及群号

保存适配器配置后点击开关启用适配器即可，成功登录则会在日志中显示以下信息：
```
等待账号 xxxxx 的登录成功事件
账号 xxxxx 登录成功
```