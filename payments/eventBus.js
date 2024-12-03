// eventBus.js
const EventEmitter = require('events');
class MyEmitter extends EventEmitter {}
const eventBus = new MyEmitter();

module.exports = eventBus;

