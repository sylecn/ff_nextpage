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
    var byId = function (id) {
	if (typeof nextpage.mainWindow === 'undefined')
	    nextpage.mainWindow = window.QueryInterface(
		Components.interfaces.nsIInterfaceRequestor)
	    .getInterface(Components.interfaces.nsIWebNavigation)
	    .QueryInterface(Components.interfaces.nsIDocShellTreeItem)
	    .rootTreeItem
	    .QueryInterface(Components.interfaces.nsIInterfaceRequestor)
	    .getInterface(Components.interfaces.nsIDOMWindow);
	return nextpage.mainWindow.document.getElementById(id);
	// return window.document.getElementById(id);
    };

    // get pref values
    this.prefValues = this.prefList.map(function (prefId) {
	// fetch value for this prefId.
	return nextpage.prefWatcher.prefs.getBoolPref(prefId);
    });

    var disable12    = !nextpage.prefWatcher.prefList[0];
    var disableSpace = !nextpage.prefWatcher.prefList[1];
    var disableNP    = !nextpage.prefWatcher.prefList[2];
    var disableAltN  = !nextpage.prefWatcher.prefList[3];

    var disableMaybe = function (id, disable) {
    	var key = byId(id);
    	if ((! key) || (key.tagName !== 'key')) {
    	    alert('Can\'t find key node. id = ' + id);
    	}
    	if (disable) {
    	    key.disabled = true;
    	} else {
    	    key.disabled = false;
    	    // key.removeAttribute('disabled');
    	}
    };
    disableMaybe('nextpage-key-1', disable12);
    disableMaybe('nextpage-key-2', disable12);
    disableMaybe('nextpage-key-space', disableSpace);
    disableMaybe('nextpage-key-n', disableNP);
    disableMaybe('nextpage-key-p', disableNP);
    disableMaybe('nextpage-key-alt-n', disableAltN);
};

// main()
window.addEventListener("load", function(e) {
    nextpage.prefWatcher.startup();
}, false);
window.addEventListener("unload", function(e) {
    nextpage.prefWatcher.shutdown();
}, false);
