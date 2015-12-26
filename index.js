var self = require('sdk/self');
var data = self.data;
var contextMenu = require("sdk/context-menu");
var pageMod = require("sdk/page-mod");

//read all preferences - start
var name = "extensions.@ttsfox.";
var pref = require("sdk/preferences/service");
var ttsPrefs = {};
var prefsList = ['lang', 'pitch', 'rate', 'volume'];
for(var i=0;i<prefsList.length;++i){
  ttsPrefs[prefsList[i]] = pref.get(name + prefsList[i]);
}
//read all preferences - end

var menuItem = contextMenu.Item({
    label: "Speech",
    context: contextMenu.SelectionContext(),
    contentScriptFile: data.url("tts.js"),
    onMessage: function (selectionText) {
  }
});

pageMod.PageMod({
  include: ["*"],
  contentScriptFile: data.url("content-script.js"),
  contentScriptWhen: 'ready',
  onAttach: function(worker) {
    worker.port.emit("prefsChange", ttsPrefs);
    require("sdk/simple-prefs").on("", function(prefName){
      ttsPrefs[prefName] = pref.get(name + prefName);
      worker.port.emit("prefsChange", ttsPrefs);
    });
    worker.port.on("gotVoiceList", function(voices) {
      //TODO: get voices options and add them to preferences drop-down menu
      //console.log(voices);
    });
  }
});
