self.port.on('setData', function (ttsData) {
  //https://blog.mozilla.org/addons/2014/04/10/changes-to-unsafewindow-for-the-add-on-sdk/
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
