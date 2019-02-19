FROM node:10-alpine

RUN npm install -g yo generator-hubot \
 && adduser -S hubot
USER hubot
WORKDIR /home/hubot

ENV BOT_NAME "dialogbot"
ENV BOT_SCRIPTS=hubot-diagnostics,hubot-help,hubot-google-images,hubot-google-translate,hubot-pugme,hubot-maps,hubot-rules,hubot-shipit

RUN yo hubot --name="$BOT_NAME" --adapter=dialogs --defaults

CMD node -e "console.log(JSON.stringify('$BOT_SCRIPTS'.split(',')))" > external-scripts.json \
 && npm install $(node -e "console.log('$BOT_SCRIPTS'.split(',').join(' '))") \
 && bin/hubot -n $BOT_NAME -a dialogs

# Based on https://github.com/RocketChat/hubot-rocketchat/blob/master/LICENSE
#
#
# The MIT License (MIT)
#
# Copyright (c) 2015 Rocket.Chat
#
# Permission is hereby granted, free of charge, to any person obtaining a copy
# of this software and associated documentation files (the "Software"), to deal
# in the Software without restriction, including without limitation the rights
# to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
# copies of the Software, and to permit persons to whom the Software is
# furnished to do so, subject to the following conditions:
#
# The above copyright notice and this permission notice shall be included in all
# copies or substantial portions of the Software.
