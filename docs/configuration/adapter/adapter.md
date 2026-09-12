# Adapter Configuration

Adapters connect KiraAI to chat and social platforms: they receive platform messages, pass them to KiraAI, and send responses back to the original conversation. Each adapter instance stores its own platform credentials, connection settings, and access rules; you can create multiple instances of one platform.

## Add an adapter

1. Open **Adapters** in the WebUI and select **Add Adapter**.
2. Enter a unique instance name and choose a platform type. The name is used in session identifiers and cannot contain a colon (`:`).
3. Complete the connection and access-control fields shown for that platform. The selected adapter—or an enabled plugin—supplies these fields dynamically.
4. Save the configuration. Enabling the switch starts the adapter; updating the name, description, or configuration of an enabled adapter automatically reloads its instance.
5. Use the **Logs** page to confirm that the platform has signed in or started listening for messages.

::: warning Keep credentials private
Bot tokens, App Secrets, WebSocket tokens, and BiliBili cookies are sensitive credentials. Never put them in screenshots, logs, or shared configuration files. If you suspect a credential was exposed, revoke and regenerate it with the relevant platform immediately.
:::

## Built-in adapters

| Platform type | Purpose and connection | Main configuration |
| --- | --- | --- |
| QQ | Connects QQ through a OneBot-compatible QQ protocol endpoint. | Bot QQ number, WebSocket URL and token, plus group and private-chat allow or deny lists. See [QQ Adapter](./qq). |
| QQ Official Bot | Connects group chats and friend DMs through the QQ Bot Open Platform. | AppID and AppSecret; alternatively, leave both empty and bind the bot by scanning a QR code in the QQ mobile app after enabling the adapter. Sandbox mode and access lists are available. |
| Telegram | Receives and sends private and group messages through an official Telegram bot. | Bot username, the Bot Token created by `@BotFather`, and group/user access lists. See [Telegram Adapter](./telegram). |
| Discord | Connects Discord channels and DMs through a Discord bot. | Bot Token from the Discord Developer Portal, Gateway Intents, an optional HTTP proxy, and channel/user access lists. You can also scope slash-command synchronization. |
| BiliBili | Listens for comments on a specified BiliBili video. | Bot UID, the video BVID to watch, polling and message-processing intervals, and login values from browser cookies or LocalStorage. See [BiliBili Adapter](./bilibili). |
| Personal WeChat | Connects Personal WeChat DMs through the OpenClaw API. | The default API and CDN URLs normally need no changes. After saving and enabling, scan the QR-code URL from the logs to bind the account. This adapter does not support group chats. See [WeChat Adapter](./wechat). |

The platform selector also shows adapter types registered by enabled plugins. Their fields and sign-in flow are defined by the plugin; follow that plugin's documentation.

## Access control

QQ, QQ Official Bot, Telegram, Discord, and Personal WeChat adapters provide access control. The available group, channel, and user fields vary by platform.

- **Allow list**: Respond only to the users, groups, or channels in the list.
- **Deny list**: Ignore the users, groups, or channels in the list.

Review the selected mode and IDs before enabling an adapter. The required identifier can be a QQ number, OpenID, Telegram user or group ID, or Discord user, channel, or guild ID. Do not substitute a display name for the platform ID.

## Test and troubleshoot

After saving and enabling an adapter, send the bot a test message and inspect the **Logs** page for the platform's sign-in, connection, or listening records.

1. Confirm that the instance name is unique and contains no `:`.
2. Recheck that tokens, AppID/AppSecret, WebSocket URLs, proxy URLs, and cookies belong to the same bot or account.
3. Verify platform-side permissions. For example, Discord must enable the Gateway Intents you selected, and the QQ OneBot endpoint must expose a reachable WebSocket service.
4. Check that access-list IDs are correct and that the intended access-control mode is selected.
5. When an enabled instance is updated, wait for it to reload automatically. If it still cannot connect, disable and re-enable it, then check the specific log error.

To develop an adapter for another chat platform, see [Adapter Development](/development/adapters).
