browser.runtime.onMessage.addListener( request => {
  if (request.act === 'getSelectionText') {
    let text = window.getSelection().toString();
    text = text.replace(/^\s+|\s+$/g,'');
    if(text) {
      return Promise.resolve({text: text});
    }
    else {
      return Promise.resolve({text: ''});
    }
  }
});
