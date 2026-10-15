# BiliBili Adapter

The BiliBili adapter receives account DMs and reply/mention comment notifications. Its Feed capability supports browsing, searching, publishing posts, and sending comments. DM and Feed capabilities are registered separately; Feed remains available when DMs are disabled.

## Login and basic setup

1. Add a BiliBili instance in WebUI **Adapters**, give it a unique name, and save.
2. Enable it and follow the QR login flow, or enter the account UID and credentials manually.
3. Configure DMs and comment notifications as needed, then check login and listener status in the logs.

QR login can populate the account UID and credentials. Manual credential fields include `sessdata`, `bili_jct`, `buvid3`, `dedeuserid`, and `ac_time_value`. Keep cookies, LocalStorage values, and login QR codes private.

## Direct messages

| Field | Default | Meaning |
| --- | --- | --- |
| `enable_im` | `true` | Registers and starts the DM capability |
| `permission_mode` | `allow_list` | Allow-list or deny-list mode for incoming DMs |
| `user_allow_list` | `[]` | User UIDs allowed in allow-list mode |
| `user_deny_list` | `[]` | User UIDs blocked in deny-list mode |

The default allow list is empty, so ordinary user DMs are not accepted. Add the UIDs you want to allow, or choose deny-list mode as appropriate. Use account UIDs rather than nicknames.

DMs require valid `sessdata`. Current output supports text, images, and emoji, declared as XML output elements `text`, `img`, and `emoji`. Do not assume replies, mentions, or video shares can all be sent.

## Reply and mention comment notifications

`enable_comment_notifications` is enabled by default. It listens for new comments replying to or mentioning the account after startup, requires login credentials and an account UID, and **does not require a video BVID**. `listening_interval` controls polling, defaulting to 20 seconds.

The built-in **Default Comments** (`default-comment`) plugin handles comments not claimed by another plugin and uses the configured default LLM to generate persona-based replies. Enabling the adapter alone does not configure a model or persona.

`listening_bvid` remains available for polling a specified video's comments, but is used only when the account comment-notification listener has not started. It does not start a second listener alongside account notifications. `message_process_interval`, defaulting to 5 seconds, controls video-comment processing intervals.

## Feed and developer APIs

Feed browsing, search, publishing, and comments use `FeedCapability`, which interprets platform-specific options. Migrate away from `SocialMediaAdapter`, and do not assume every enabled BiliBili instance has `IMCapability`.

See [Adapter Development](../../development/adapters) and [Comment Events](../../development/plugins/hooks#comment-events).
