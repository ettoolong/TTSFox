self.port.on('setData', function (ttsData) {
  //https://blog.mozilla.org/addons/2014/04/10/changes-to-unsafewindow-for-the-add-on-sdk/
  unsafeWindow.ttsData = cloneInto(ttsData, unsafeWindow);
  var data = {
    cmd : 'setData'
  };
  var evt = new CustomEvent('addon-message', { bubbles: false, detail: JSON.stringify(data) });
  document.body.dispatchEvent(evt);
});

self.port.on('setText', function (data) {
  var data = {
    cmd : 'setText',
    text: data.text,
    autoStart: data.autoStart
  };
  var evt = new CustomEvent('addon-message', { bubbles: false, detail: JSON.stringify(data) });
  document.body.dispatchEvent(evt);
});
