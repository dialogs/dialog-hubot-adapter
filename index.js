const Adapter = require('hubot/src/adapter');
const { TextMessage } = require('hubot');
const DlgBot = require('@dlghq/dialog-bot-sdk/lib/Bot').default;
const DlgMessageAttachment = require('@dlghq/dialog-bot-sdk/lib/entities/messaging/MessageAttachment');

class DialogsAdapter extends Adapter {
  run() {
    this.token = process.env['DIALOGS_TOKEN'];
    this.endpoint = process.env['DIALOGS_ENDPOINT'];
    this.robot.logger.info("dialogs: Loaded adapter");

    if (!this.token)
      throw new Error('Environment variable "DIALOGS_TOKEN" is required.');

    if (!this.endpoint)
      throw new Error('Environment variable "DIALOGS_ENDPOINT" is required.');

    this.dialogs = new DlgBot({
      token: this.token,
      endpoints: [this.endpoint]
    });

    this.robot.logger.info(`dialogs: Connected to ${this.endpoint}`);

    this.dialogs.onMessage(message => this._processMessage(message)).toPromise().catch(e => this.robot.logger.error(`dialogs: Failed to get message: ${e.stack}`));

    this.robot.logger.info(`dialogs: Running robot ${this.robot.name}`);

    this.emit('connected');
  }

  async send(envelope, ...strings) {
    console.log("Hubot send envelope:");
    console.log(envelope);
    await this._send(envelope, null, ...strings);
  }

  async reply(envelope, ...strings) {
    console.log("Hubot reply envelope:");
    console.log(envelope);
    await this._send(
      envelope.room,
      DlgMessageAttachment.reply(envelope.messageId),
      ...strings,
    );
  }

  async _send(envelope, attachment, ...strings) {
    try {
      const text = strings.join('\n');

      await this.dialogs.sendText(envelope.room, text, attachment);

      this.robot.logger.debug("dialog: Sent message");
    } catch (e) {
      this.robot.logger.error(`dialog: Failed to send message: ${e.stack}`)
    }
  }

  async _processMessage(message) {
    // Get history message object from message ID
    const historyMsgs = await this.dialogs.fetchMessages([message.id]);
    if (!historyMsgs || !historyMsgs[0])
      return;

    const historyMsg = historyMsgs[0];

    // Get user from user ID
    const dlgUser = await this.dialogs.getUser(historyMsg.senderUserId);

    //console.log(historyMsg);

    let user;
    if (!dlgUser) {
      console.log("Couldn't find user");
      return;
    } else {
      user = this.robot.brain.userForId(dlgUser.id, {
        name: dlgUser.name,
        alias: dlgUser.nick,
        room: message.peer
      });
    }

    switch (message.content.type) {
      case 'text':
        const msg = new TextMessage(user, message.content.text, message.id);
        msg.room = message.peer;
        msg.messageId = message.id;
        this.robot.logger.info(`dialog: Got message from @${dlgUser.nick} in peer ${message.peer.id}`);
        /* TextMessage {
          user: User { id: '1', name: 'Shell', room: 'Shell' },
          done: false,
          room: 'Shell',
          text: 'hador badger',
          id: 'messageId' }
        */
        this.receive(msg);
        break;
      case 'service':
        /* DLG:
          Message {
            id:
             UUID {
               msb: Long { low: 642650601, high: -1093562656, unsigned: false },
               lsb: Long { low: -381618155, high: 1254453651, unsigned: false } },
            peer: Peer { id: 2078580324, type: 'group', strId: null },
            date: 1969-12-15T08:38:52.366Z,
            content:
             ServiceContent {
               text: 'User invited to the group',
               extension: { userInvited: [Object] },
               type: 'service' },
            attachment: null }
         */

        /* HUBOT return this.robot.receive(new EnterMessage(user, null, message._id)) */
        break;
    }
  }
}

exports.use = robot => new DialogsAdapter(robot);
