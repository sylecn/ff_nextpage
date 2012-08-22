var nextpage_pref = function () {
    // firefox utils
    var app = Components.classes["@mozilla.org/fuel/application;1"].getService(Components.interfaces.fuelIApplication);
    var log = app.console.log;

    // some GUI helper
    var log_area = function () {
	var node = document.getElementById("nextpage-log-area");
	return {
	    set: function (msg) {
		node.value = msg + '\n';
	    },
	    log: function (msg) {
		node.value += msg + '\n';
	    },
	    clear: function () {
		node.value = '';
	    }
	};
    }();
    var config_textbox = document.getElementById("nextpage-user-config");

    // user data
    var config_file_path = nextpage_config.get_config_file_path();

    /**
     * function run when prefwindow load.
     * this just fill up the text fields.
     */
    var init = function () {
	document.getElementById("nextpage-config-file-path")
	    .value = config_file_path;

	document.getElementById("nextpage-default-config")
	    .value = nextpage_config.get_default_config();

	// update textbox with file content.
	if (! nextpage_config.config_file_exists()) {
	    log_area.set('No user config file was found, type in the box above and hit "Save & Reload" button to create one.');
	    log_area.log('Click Help button below to learn about config file.');
	} else {
	    nextpage_config.read_config_file(function (data) {
		config_textbox.value = data;
		log_area.set('user config file loaded.');
		config_textbox.focus();
	    }, function (){
		log_area.set("Error: read config file has failed.");
	    });
	}
    };

    /**
     * copy config file path to clipboard.
     */
    var copy_config_file_path = function () {
	const gClipboardHelper = Components.classes["@mozilla.org/widget/clipboardhelper;1"].getService(Components.interfaces.nsIClipboardHelper);
	gClipboardHelper.copyString(config_file_path);
    };

    /**
     * save config file in the textbox to disk.
     * call succ on success, call fail on failure.
     */
    var save = function (succ, fail) {
	var content = config_textbox.value;
	nextpage_config.write_config_file(content, function () {
	    if (succ) {
		succ.apply(null, []);
	    } else {
		log_area.set("config file saved.");
	    };
	}, function () {
	    if (fail) {
		fail.apply(null, []);
	    } else {
		log_area.set("Error: save config file failed.");
	    };
	});
    };

    /**
     * on reload button click
     */
    var reload = function () {
	// send notification to overlay
	Components.classes["@mozilla.org/observer-service;1"]
            .getService(Components.interfaces.nsIObserverService)
            .notifyObservers(null, "nextpage-reload-config", "");
    };

    /**
     * save config file in the textbox to disk. then reload the config to make
     * it active in current session.
     */
    var save_and_reload = function () {
	save(function () {
	    log_area.set("config file saved.");
	    reload();
	}, function () {
	    log_area.set('Error: save failed, config not reloaded.');
	});
    };

    /**
     * show help document in a new tab.
     */
    var help = function () {
	// show this URL in a new tab:
	var url = "chrome://nextpage/content/usage.html";
	openUILinkIn(url, "tab");
    };

    return {
	init: init,
	copy_config_file_path: copy_config_file_path,
	reload: reload,
	save_and_reload: save_and_reload,
	help: help
    };
}();
