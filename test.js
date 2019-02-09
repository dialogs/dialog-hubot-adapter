const { Brain } = require('hubot');
const newDialogs = require('./index').use;

let adapter;

// Mock Hubot setup for quick testing
const robot = new class {
  emit(event) {
    console.log(`Robot event: ${event}`)
  }

  receive(m) {
    if (!m.text)
      return;

    if (m.match(/send.*/))
      adapter.send(m, m.text.substr(4));
    else if (m.match(/reply.*/))
      adapter.reply(m, m.text.substr(5));
    else if (m.match(/react.*/))
      adapter.emote(m, "🚀");
    else
      adapter.send(m, "Commands: send, reply, react");
  }

  on(event, callback) {}
}();

robot.name = "TestBot";
robot.brain = new Brain(robot);
robot.logger = {
  debug: m => console.log(`DEBUG: ${m}`),
  info:  m => console.log(`INFO: ${m}`),
  error: m => console.log(`ERROR: ${m}`),
};

adapter = newDialogs(robot);
adapter.run();
