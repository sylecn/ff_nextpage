if (typeof nextpage === 'undefined') {
    var nextpage = {};
};

nextpage.prefWatcher = {
    prefs: null,
    prefList: ["extensions.nextpage.use-1-2",
	       "extensions.nextpage.use-space",
	       "extensions.nextpage.use-n-p",
	       "extensions.nextpage.use-alt-n"],
    prefValues: [],
    startup: function () {
	// Register to receive notifications of preference changes

	this.prefs = Components.classes["@mozilla.org/preferences-service;1"]
            .getService(Components.interfaces.nsIPrefService)
            .getBranch("extensions.nextpage.");
	this.prefs.QueryInterface(Components.interfaces.nsIPrefBranch2);
	// TODO where is addObserver documented?
	this.prefs.addObserver("", this, false);

	// get pref values
	this.prefValues = this.prefList.map(function (prefId) {
	    // fetch value for this prefId.
	    return nextpage.prefWater.prefs.getBoolPref(prefId);
	});

	nextpage.updateHotKeys();
    },
    shutdown: function()
    {
	this.prefs.removeObserver("", this);
    },
    observe: function(subject, topic, data)
    {
	if (topic != "nsPref:changed")
	{
	    return;
	}

	nextpage.updateHotKeys();
    }
};

nextpage.updateHotKeys = function () {
    // TODO how to enable/disable <key> in overlay.xul
    document.getElementById("nextpage-key-1").disabled = true;
    document.getElementById("nextpage-key-2").disabled = true;
};

// main()
window.addEventListener("load", function(e) {
    nextpage.prefWatcher.startup();
}, false);
window.addEventListener("unload", function(e) {
    nextpage.prefWatcher.shutdown();
}, false);
