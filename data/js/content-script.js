self.port.on('setData', function (ttsData) {
  unsafeWindow.ttsData = cloneInto(ttsData, unsafeWindow);
  var data = {
    cmd : 'setData'
  };
  var evt = new CustomEvent('addon-message', { bubbles: false, detail: JSON.stringify(data) });
  document.body.dispatchEvent(evt);
});

self.port.on('setText', function (text) {
  var data = {
    cmd : 'setText',
    text: text
  };
  var evt = new CustomEvent('addon-message', { bubbles: false, detail: JSON.stringify(data) });
  document.body.dispatchEvent(evt);
});
