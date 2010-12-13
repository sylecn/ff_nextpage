if (typeof nextpage === 'undefined') {
    var nextpage = {};
};

nextpage.prefs = ["extensions.nextpage.use-1-2",
		  "extensions.nextpage.use-space",
		  "extensions.nextpage.use-n-p",
		  "extensions.nextpage.use-alt-n"];

nextpage.updateHotKeys = function (event) {
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
    var prefs = nextpage.prefs.map(function (prefId) {
		    return Application.prefs.get(prefId);
		});
    var disable12 = !prefs[0].value;
    var disableSpace = !prefs[1].value;
    var disableNP = !prefs[2].value;
    var disableAltN = !prefs[3].value;
    // alert([disable12, disableSpace,
    //        disableNP, disableAltN].join(' | '));

    var disableMaybe = function (id, disable) {
	var key = byId(id);
	if ((! key) || (key.tagName !== 'key')) {
	    alert('Can\'t find key node. id = ' + id);
	}
	if (disable) {
	    key.setAttribute('disabled', true);
	} else {
	    key.removeAttribute('disabled');
	}
    };
    disableMaybe('nextpage-key-1', disable12);
    disableMaybe('nextpage-key-2', disable12);
    disableMaybe('nextpage-key-space', disableSpace);
    disableMaybe('nextpage-key-n', disableNP);
    disableMaybe('nextpage-key-p', disableNP);
    disableMaybe('nextpage-key-alt-n', disableAltN);
};
