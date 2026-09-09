let ioInstance = null;

function setIO(io) {
  ioInstance = io;
}

// Broadcasts an event to every connected client.
function emit(event, payload) {
  if (ioInstance) ioInstance.emit(event, payload);
}

module.exports = { setIO, emit };
