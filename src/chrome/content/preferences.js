(function() {
    // import nextpage_config to current namespace.
    Components.utils.import("chrome://nextpage/content/config.jsm");

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
     * @param succ optional, callback to run when read and update is successful.
     * @param fail optional, callback to run when read has failed.
     */
    var update_user_config_textbox = function (succ, fail) {
	if (! nextpage_config.config_file_exists()) {
	    log_area.set(_('no_user_config_file_found'));
	    log_area.log(_('tell_user_about_config_file_help'));
	    config_textbox.focus();
	} else {
	    nextpage_config.read_config_file(function (data) {
		config_textbox.value = data;
		if (succ) {
		    succ.apply(null, []);
		} else {
		    log_area.set(_('user_config_file_loaded'));
		    log_area.log(_('tell_user_about_config_file_help'));
		    config_textbox.focus();
		}
	    }, function () {
		if (fail) {
		    fail.apply(null, []);
		} else {
		    log_area.set(_('read_config_file_failed'));
		}
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
     * check the user config in config_textbox. report any errors in log_area.
     * @returns true if there is no error, false otherwise.
     */
    var check_syntax_and_report = function (leading_error_msg) {
	log_area.clear();
	var config_string = config_textbox.value;
	var r = nextpage_config.parse_config_file(config_string);
	if (! r[2]) {
	    log_area.log(leading_error_msg);
	    log_area.log(r[1].join("\n"));
	};
	return r[2];
    };

    /**
     * ask nextpage overlay to reload user config file.
     */
    var send_reload_notification = function () {
	Components.classes["@mozilla.org/observer-service;1"]
	    .getService(Components.interfaces.nsIObserverService)
	    .notifyObservers(null, "nextpage-reload-config", "");
	log_area.log(_('config_reloaded'));
    };

    /**
     * reload button click callback.
     */
    var reload = function () {
	update_user_config_textbox(function () {
	    // check for errors
	    var noerror = check_syntax_and_report(
		_('has_parsing_errors_config_not_reloaded'));
	    if (noerror) {
		send_reload_notification();
	    };
	});
    };

    /**
     * save config file in the textbox to disk. then reload the config to make
     * it active in current session.
     */
    var save_and_reload = function () {
	var noerror = check_syntax_and_report(
	    _('has_parsing_errors_file_not_saved'));
	if (noerror) {
	    save(function () {
		log_area.log(_('user_config_file_saved'));
		send_reload_notification();
	    }, function () {
		log_area.log(_('error_save_failed_config_not_reloaded'));
	    });
	}
    };

    /**
     * show help document in a new tab.
     */
    var help = function () {
	// show this URL in a new tab:
	var url = _('usage_html_url');
	openUILinkIn(url, "tab");
    };

    // preferences.xul init
    window.addEventListener("load", function (e) {
	init();

	document.getElementById(
	    "nextpage-copy-file-path").addEventListener(
		"command", copy_config_file_path, false);
	document.getElementById(
	    "nextpage-save-and-reload").addEventListener(
		"command", save_and_reload, false);
	document.getElementById(
	    "nextpage-reload").addEventListener(
		"command", reload, false);
	document.getElementById(
	    "nextpage-help").addEventListener(
		"command", help, false);
    }, false);

})();
