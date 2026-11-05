# FAQ

## General

::: details Why does the backend show AI replied but I didn't receive the message?
This is a common issue usually caused by the following reasons:

1. **AI output format error** — KiraAI requires the AI to format its output as XML to construct message chains. Incorrect XML formatting may prevent messages from being sent correctly. The DeepSeek V4 model in particular tends to omit or misuse XML formatting.

2. **Adapter message sending failed** — The AI generated a reply successfully, but the adapter failed to deliver the message to the chat platform. Check the adapter logs for error messages related to message sending.

3. **Message was filtered or rate-limited** — Some chat platforms have content moderation or rate-limiting policies. The message may have been silently dropped by the platform. Try sending a simpler message to test.

4. **Bot permissions insufficient** — The bot account may lack permission to send messages in the current group or conversation. Verify that the bot has the necessary permissions.

5. **Network issues** — A temporary network interruption between the bot and the chat platform can cause message delivery failures. Check your network connection and retry.
:::
