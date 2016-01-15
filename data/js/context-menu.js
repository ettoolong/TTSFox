self.on('click', function(){
  var text = unsafeWindow.getSelection().toString();
  self.postMessage(text);
});
