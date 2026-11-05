# Telegram 适配器

KiraAI 可以接入 Telegram 官方机器人，实现私聊和群聊收发消息

## 创建机器人

打开 Telegram，在搜索栏找到 `@BotFather`，点击 `Start`，点击左下角 `Open` 进入 Bot 创建页面，填写好基本信息后会拿到一个 token

如果需要接收群聊消息，需要进入 `Bot Settings`

![](/images/tg_bot_settings.png)

## 创建适配器

进入 KiraAI WebUI，在适配器页面点击“添加适配器”按钮，选择适配器类型为 Telegram，适配器名称强烈建议使用英文小写字母+下划线且语义和平台相关，例：`tg`, `telegram`

- Bot Username: 填写你的 Bot 的用户名，例如：`your_bot`
- Bot Token：填写之前保存的 token
- Permission Mode：选择白名单或黑名单模式
- Group ** List / User ** List：使用 `@useridinfobot` 查询自己或者群组的 ID并且填写进来

保存并启用后适配器，成功连接后会打印出如下日志：
```
start listening incoming messages for <your_bot>
```