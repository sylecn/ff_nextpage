var nextpage = {
  onLoad: function() {
    // initialization code
    this.initialized = true;
    this.strings = document.getElementById("nextpage-strings");
  },
  onMenuItemCommand: function(e) {
    var promptService = Components.classes["@mozilla.org/embedcomp/prompt-service;1"]
                                  .getService(Components.interfaces.nsIPromptService);
    promptService.alert(window, this.strings.getString("helloMessageTitle"),
                                this.strings.getString("helloMessage"));
  },

};
window.addEventListener("load", function(e) { nextpage.onLoad(e); }, false);
