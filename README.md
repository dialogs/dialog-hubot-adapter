# Hubot adapter for dialog

Easily bring the friendly robot sidekick [Hubot](https://hubot.github.com/) to [dialog](https://dlg.im/en)!

### Setup: Docker

The quickest way to run Hubot is the Docker image!

```sh
docker run -it \
    -e DIALOGS_TOKEN=xxx \
    -e DIALOGS_ENDPOINT=https://grpc-test.transmit.im:9443 \
    -e BOT_SCRIPTS=hubot-pugme,hubot-help \
    terorie/hubot-dialogs
```

To include custom scripts, use `-v $PWD/scripts:/home/hubot/scripts \ `.

See all settings [here](#environment-variable-reference).
Syntax is `-e <Key>=<value> \ `

_(Based on [Rocketchat's image](https://github.com/RocketChat/hubot-rocketchat))_

### Setup: Manual

```shell
# 1. Install command-line tools
npm i -g yo generator-hubot

# 2. Create workspace
mkdir hubot && cd hubot

# 3. Generate new bot
yo hubot

# 4. Install Dialog adapter
npm i hubot-dialogs

# 5. Edit external-scripts.json
     and/or install your own scripts
# ...

# 6. Start the bot
#    It will now respond to any Dialog
#    messages prefixed with "coolbot".
#    You can change the name (-n flag).
bin/hubot -a dialogs -n coolbot
```

More information in the [Hubot docs](https://hubot.github.com/docs/)

### Environment variable reference

| Key | Meaning | Example |
| --- | --- | --- |
| `BOT_NAME` | Bot Name | `CoolBot` |
| `BOT_SCRIPTS` | Comma-separated list of script packages on npm | `hubot-pugme,hubot-help` |
| `DIALOGS_ENDPOINT` | GRPC Server URL | `https://grpc-test.transmit.im:9443` |
| `DIALOGS_TOKEN` | Dialog bot token | looks like `a6bc21d0...` |
