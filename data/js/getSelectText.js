//self.port.emit("selection", window.getSelection().toString());
self.postMessage(window.getSelection().toString());
