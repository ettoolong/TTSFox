var self = require('sdk/self');
var contextMenu = require("sdk/context-menu");

// var name = "extensions.@ttsfox.SpeechLanguage";
// var pref = require("sdk/preferences/service");
// require("sdk/simple-prefs").on("", function(prefName){
//   var lang = tts.lang[pref.get(name)];
// });

var menuItem = contextMenu.Item({
    label: "Speech",
    context: contextMenu.SelectionContext(),
    contentScriptFile: "./tts.js",
    onMessage: function (selectionText) {
  }
});

