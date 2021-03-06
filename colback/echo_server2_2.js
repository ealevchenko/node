const events = require('events');
const net = require('net');
const channel = new events.EventEmitter();
channel.clients = {};
channel.subscriptions = {};

channel.on('join', function(id, client) {
  this.clients[id] = client;
  this.subscriptions[id] = (senderId, message) => {
    if (id != senderId) {
      this.clients[id].write(message);
    };
  };
  this.on('broadcast', this.subscriptions[id]);
});
channel.on('leave', function(id) {
  channel.removeListener('broadcast', this.subscriptions[id]);
  channel.emit('broadcast', id, `${id} has le ft the chatroom.\n`);
});
channel.on('shutdown', () => {
  channel.emit('broadcast', '', 'The server has shut down.\n');
  channel.removeAllListeners('broadcast');
});

const server = net.createServer(client => {
  const id = `${client.remoteAddress}:${client.remotePort}`;
  client.write('>_');

  channel.emit('join', id, client);

  client.on('close', () => {
    channel.emit('leave', id);
  });

  client.on('data', data => {
    data = data.toString();
    if (data === 'shutdown\r\n') {
      channel.emit('shutdown');
    }
    channel.emit('broadcast', id, data);
  });
});

server.listen(8888);
