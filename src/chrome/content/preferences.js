var nextpage_pref = function () {
    // firefox utils
    var app = Components.classes["@mozilla.org/fuel/application;1"].getService(Components.interfaces.fuelIApplication);
    var log = app.console.log;

    // L10N strings defined in preferences.properties
    var strings = document.getElementById("preferences-strings");
    /**
     * a I18N text wrapper function. text wrapped with this function will have
     * translations in the above mentioned properties file.
     */
    /*
     * Note that:
     *     var _ = strings.getString
     * will not work. It creates a js error and _ does not get binded. this
     * function has to be defined more lazily as below.
     */
    var _ = function (str) {
	return strings.getString(str);
    };

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
     * update user config textbox to match user config file on disk.
     */
    var update_user_config_textbox = function () {
	if (! nextpage_config.config_file_exists()) {
	    log_area.set(_('no_user_config_file_found'));
	    log_area.log(_('tell_user_about_config_file_help'));
	} else {
	    nextpage_config.read_config_file(function (data) {
		config_textbox.value = data;
		log_area.set(_('user_config_file_loaded'));
		config_textbox.focus();
	    }, function (){
		log_area.set(_('read_config_file_failed'));
	    });
	}
    };

    /**
     * function run when prefwindow load.
     * this just fill up the text fields.
     */
    var init = function () {
	document.getElementById("nextpage-config-file-path")
	    .value = config_file_path;

	document.getElementById("nextpage-default-config")
	    .value = nextpage_config.get_default_config();

	update_user_config_textbox();
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
		log_area.set(_('user_config_file_saved'));
	    };
	}, function () {
	    if (fail) {
		fail.apply(null, []);
	    } else {
		log_area.set(_('save_user_config_file_failed'));
	    };
	});
    };

    /**
     * ask nextpage overlay to reload user config file.
     * @param revert_file optional. if true, also update the user config
     *        textbox. default value is true.
     */
    var reload = function (revert_file) {
	// send notification to overlay
	Components.classes["@mozilla.org/observer-service;1"]
            .getService(Components.interfaces.nsIObserverService)
            .notifyObservers(null, "nextpage-reload-config", "");
	if ((typeof(revert_file) === "undefined") || revert_file) {
	    update_user_config_textbox();
	};
    };

    /**
     * save config file in the textbox to disk. then reload the config to make
     * it active in current session.
     */
    var save_and_reload = function () {
	log_area.clear();
	var new_config_string = config_textbox.value;
	var r = nextpage_config.parse_config_file(new_config_string);
	if (r[2]) {
	    // log_area.log("No syntax errors.");
	    save(function () {
		log_area.log(_('user_config_file_saved'));
		reload(false);
	    }, function () {
		log_area.log(_('error_save_failed_config_not_reloaded'));
	    });
	} else {
	    log_area.log(_('has_parsing_errors_file_not_saved'));
	    log_area.log(r[1].join("\n"));
	};
    };

    /**
     * show help document in a new tab.
     */
    var help = function () {
	// show this URL in a new tab:
	var url = _('usage_html_url');
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
