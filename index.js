// Hubot Dialogs adapter
// ---------------------

// Dialogs deps
const DlgBot = require('@dlghq/dialog-bot-sdk/lib/Bot').default;
const {
  MessageAttachment,
} = require('@dlghq/dialog-bot-sdk');

// Hubot deps
const {
  TextMessage,
  EnterMessage,
  LeaveMessage
} = require('hubot');
const Adapter = require('hubot/src/adapter'); // breaks w/o direct import

class DialogsAdapter extends Adapter {
  async run() {
    try {
      await this._run();
    } catch(e) {
      console.error(`Uncaught exception: ${e}`);
      process.exit(1);
    }
  }

  async _run() {
    this.token = process.env['DIALOGS_TOKEN'];
    this.endpoint = process.env['DIALOGS_ENDPOINT'];
    this.robot.logger.info("dialog: Loaded adapter");

    if (!this.token)
      throw new Error('Environment variable "DIALOGS_TOKEN" is required.');

    if (!this.endpoint)
      throw new Error('Environment variable "DIALOGS_ENDPOINT" is required.');

    this.dialogs = new DlgBot({
      token: this.token,
      endpoints: [this.endpoint]
    });

    this.robot.logger.info(`dialog: Connected to ${this.endpoint}`);

    this.dialogs
      .onMessage(this._processMessage.bind(this))
      .subscribe(
        value => {},
        err =>
          this.robot.logger.error(`dialog: Failed to get message: ${err.stack}`),
        () =>
          this.robot.logger.error(`dialog: Message stream ended.`)
      );

    this.robot.logger.info(`dialog: Running robot ${this.robot.name}`);

    this.dlgSelf = await this.dialogs.getSelf();
    this.robot.logger.info(`dialog: Logged in as @${this.dlgSelf.nick} (#${this.dlgSelf.id})`);

    this.emit('connected');
  }

  async send(envelope, ...strings) {
    await this._send(envelope, null, ...strings);
  }

  async reply(envelope, ...strings) {
    await this._send(
      envelope,
      MessageAttachment.reply(envelope.id),
      ...strings,
    );
  }

  async _send(envelope, attachment, ...strings) {
    try {
      const text = strings.join('\n');
      const peerName = await this._peerToString(envelope.room);

      await this.dialogs.sendText(envelope.room, text, attachment);

      this.robot.logger.info(`dialog: @${this.dlgSelf.nick} <== @${envelope.user.alias} in ${peerName}`);
    } catch (e) {
      this.robot.logger.error(`dialog: Failed to send message: ${e.stack}`)
    }
  }

  async _processMessage(message) {
    switch (message.content.type) {
      case 'text':
        await this._processTextMessage(message);
        break;
      case 'service':
        await this._processServiceMessage(message);
        break;
    }
  }

  async _processTextMessage(message) {
    // Get history message object from message ID
    const historyMsgs = await this.dialogs.fetchMessages([message.id]);
    if (!historyMsgs || !historyMsgs[0])
      return;

    const historyMsg = historyMsgs[0];

    // Get user from user ID
    const dlgUser = await this.dialogs.getUser(historyMsg.senderUserId);
    if (!dlgUser) {
      this.robot.logger.error(`dialog: Couldn't find sender of Dialogs message`);
      return;
    }

    const user = this._userDlgToHubot(dlgUser);
    const peerName = await this._peerToString(message.peer);
    const msg = new TextMessage(user, message.content.text, message.id);
    msg.room = message.peer;
    this.robot.logger.info(`dialog: @${this.dlgSelf.nick} ==> @${user.alias} in ${peerName}`);
    this.receive(msg);
  }

  async _processServiceMessage(message) {
    const ext = message.content.extension;
    if (ext.userInvited)
      await this._processUserEntered(message);
    else if (ext.userKicked)
      await this._processUserLeft(message);
    else
      console.log(message);
  }

  async _processUserEntered(message) {
    const peerName = await this._peerToString(message.peer);
    const dlgUserId = message.content.extension.userInvited.invitedUid;
    if (dlgUserId === this.dlgSelf.id) {
      this.robot.logger.info(`dialog: Bot was invited to ${peerName}`);
      return;
    }
    const dlgUser = await this.dialogs.getUser(dlgUserId);
    const user = this._userDlgToHubot(dlgUser);

    const msg = new EnterMessage(user, null, message.id);
    msg.room = message.peer;
    this.robot.logger.info(`dialog: User @${user.alias} joined ${peerName}`);
    this.receive(msg);
  }

  // TODO: Handle non-kick leave
  async _processUserLeft(message) {
    const peerName = await this._peerToString(message.peer);
    const dlgUserId = message.content.extension.userKicked.kickedUid;
    if (dlgUserId === this.dlgSelf.id) {
      this.robot.logger.info(`dialog: Bot was kicked from ${peerName}`);
      return;
    }
    const dlgUser = await this.dialogs.getUser(dlgUserId);
    const user = this._userDlgToHubot(dlgUser);

    const msg = new LeaveMessage(user, null, message.id);
    msg.room = message.peer;
    this.robot.logger.info(`dialog: User @${user.alias} left ${peerName}`);
    this.receive(msg);
  }

  _userDlgToHubot(dlgUser) {
    return this.robot.brain.userForId(dlgUser.id, {
      name:  dlgUser.name,
      alias: dlgUser.nick,
    });
  }

  async _peerToString(peer) {
    switch (peer.type) {
      case 'private':
        return "private chat";
      case 'group':
        const group = await this.dialogs.getGroup(peer.id);
        if (!group)
          return "unknown group";
        return `group "${group.title}" (#${group.id})`;
      default:
        return `unknown chat`;
    }
  }

}

exports.use = robot => new DialogsAdapter(robot);
