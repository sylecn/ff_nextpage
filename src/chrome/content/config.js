/**
 * config file based functions.
 * global bindings are stored in this.bindings object.
 */
var nextpage_config = function () {
    // requires firefox 3.6
    Components.utils.import("resource://gre/modules/FileUtils.jsm");
    Components.utils.import("resource://gre/modules/NetUtil.jsm");

    /**
     * bindings to use in nextpage overlay.
     *
     * This must be set for nextpage keypress function to work. It will be
     * replaced by config from user's config files or nextpage's default.
     * see `init_bindings', which is called by nextpage.init()
     */
    var bindings = {};
    // to store a nsIFile object. readonly.
    var config_file = null;
    /**
     * config file's full path. readonly.
     */
    var config_file_path = null;
    /**
     * the built-in default config.
     *
     * This is always parsed before user config file.
     */
    var default_config = '\
(bind "SPC" \'nextpage-maybe)\n\
(bind "n" \'nextpage)\n\
(bind "p" \'history-back)\n';
    /**
     * map command used in config file to real function objects.
     */
    // implemented as a lazy variable that uses the singleton pattern.
    var command_name_map = null;
    var get_command_name_map = function () {
	if (command_name_map === null) {
	    command_name_map = {
		"nextpage-maybe": nextpage.commands.gotoNextPageMaybe,
		"nextpage": nextpage.commands.gotoNextPage,
		// "close-tab": nextpage.commands.closeTab,
		// "undo-close-tab": nextpage.commands.undoCloseTab,
		"history-back": nextpage.commands.historyBack,
		"close-tab": nextpage.commands.closeTab,
		"nil": null
	    };
	};
	return command_name_map;
    };

    /**
     * parse nextpage config file. currently only bind is supported.
     * using dumb regexp to do parsing. sexp read style parsing not supported.
     * one bind per line.
     *
     * comments and empty lines are skipped.
     *
     * @return [binding_obj, logs].
     * binding_obj contains key, command pairs.
     * logs is an array of warning and error messages.
     */
    var parse_config_file = function (str) {
	var logs = [];
	var line_index;
	var log = function (msg) {
	    logs.push('line ' + (line_index + 1) + ': ' + msg);
	};
	var bind_pattern = /\(bind\s+"(.*)"\s+'?([^']*)\)/;

	/**
	 * parse binding in line, if failed, return false.
	 * @returns [key, command] pair in an array.
	 */
	var get_key_binding_pair = function (line) {
	    var mo = bind_pattern.exec(line);
	    var key, command;
	    if (mo) {
		key = mo[1];
		command = mo[2];
		if (get_command_name_map().hasOwnProperty(command)) {
		    return [key, command];
		}
		log('ignore bind ' + key + ' with unkown command ' + command);
	    }
	    return false;
	};

	var lines = str.split('\n');
	var result = {};
	var r;
	var i;
	var line;
	for (i = 0; i < lines.length; ++i) {
	    line_index = i;
	    line = lines[i];
	    if (line.match(/^\s*;/)) {
		continue;
	    }
	    if (line.match(/(unbind-all)/)) {
		// clear built-in bindings
		bindings = {};
		// clear all bindings read thus far.
		result = {};
	    }
	    r = get_key_binding_pair(line);
	    if (r) {
		if (result.hasOwnProperty(r[0])) {
		    if (result[r[0]] !== r[1]) {
			log('overwrite existing binding (' + r[0] +
			    ', ' + result[r[0]] + ')');
		    } else {
			log('duplicate binding (' + r[0] +
			    ', ' + result[r[0]] + ')');
		    }
		}
		result[r[0]] = get_command_name_map()[r[1]];
	    }
	}
	return [result, logs];
    };

    /**
     * init this.config_file and this.config_file_path
     */
    var init_config_file = function () {
	if (config_file !== null) {
	    return;
	};
	config_file = FileUtils.getFile(
	    "Home", [".config", "nextpage.lisp"]);
	config_file_path = config_file.path;
    };

    /**
     * returns true if config file exists
     */
    var config_file_exists = function () {
	init_config_file();
	return config_file.exists();
    };

    /**
     * Read config file and call succ or fail callback function.
     *
     * @param succ the succ callback, called with the read string.
     * @param fail the fail callback, called with no args. optional.
     */
    var read_config_file = function (succ, fail) {
	init_config_file();
	var channel = NetUtil.newChannel(config_file);
	channel.contentType = "text/plain";

	if (config_file.exists()) {
	    NetUtil.asyncFetch(config_file, function(inputStream, status) {
		if (!Components.isSuccessCode(status)) {
		    return fail.apply(null, []);
		}
		var data = NetUtil.readInputStreamToString(
		    inputStream, inputStream.available());
		return succ.apply(null, [data]);
	    });
	} else {
	    if (fail) {
		fail.apply(null, []);
	    };
	}
    };

    /**
     * Write given content to config file.
     * succ and fail are callbacks.
     *
     * succ is called with no args.
     * fail is called with no args. (I don't know how to get error message.)
     */
    var write_config_file = function (content, succ, fail) {
	init_config_file();
	var ostream = FileUtils.openSafeFileOutputStream(config_file);
	var converter = Components.classes["@mozilla.org/intl/scriptableunicodeconverter"].createInstance(Components.interfaces.nsIScriptableUnicodeConverter);
	converter.charset = "UTF-8";
	var istream = converter.convertToInputStream(content);
	NetUtil.asyncCopy(istream, ostream, function(status) {
	    if (! Components.isSuccessCode(status)) {
		return fail.apply(null, []);
	    }
	    return succ.apply(null, []);
	});
    };

    /**
     * a utility function to update obj as if they are dictionary.
     * it updates PLACE object using key, value pairs in UPDATES object.
     * if a key appears in both object, use the value in UPDATES object.
     *
     * this function modifies PLACE object in place. (destructive)
     *
     * like dict.update(anotherDict) in python.
     */
    var update_obj = function (place, updates) {
	for (key in updates) if (updates.hasOwnProperty(key)) {
	    place[key] = updates[key];
	}
	return place;
    };

    /**
     * init this.bindings
     */
    var init_bindings = function () {
	var r;
	init_config_file();
	// parse the default config string
	r = parse_config_file(default_config);
	bindings = r[0];
	if (! config_file_exists()) {
	    if (nextpage.debug.debugConfigFile()) {
		if (r[1].length) {
		    nextpage.log('Errors when parsing default config string:');
		    nextpage.log(r[1].join("\n"));
		};
		nextpage.log("info: user config file not found.");
	    };
	    return;
	};
	// parse user config
	r = read_config_file(function (data) {
	    // nextpage.log("config file content: " + data);
	    var r = parse_config_file(data);
	    update_obj(bindings, r[0]);
	    if (nextpage.debug.debugConfigFile()) {
		nextpage.log("user config file loaded.");
		nextpage.log('keys binded: ' + JSON.stringify(
		    Object.keys(nextpage.config.bindings))); //requires ff4
		if (r[1].length) {
		    nextpage.log('Errors when parsing user config file:');
		    // TODO should show it to user more obviously, could use
		    // non blocking pop up.
		    // could use preferences to store ""last error".
		    // then show it in preferences window or create a html
		    // page to show it if it is easy to do so.
		    nextpage.log(r[1].join("\n"));
		}
	    }
	}, function () {
	    if (nextpage.debug.debugConfigFile()) {
		nextpage.log("Error: read config file has failed.");
	    }
	});
    };

    var get_config_file_path = function () {
	init_config_file();
	return config_file_path;
    };

    return {
	init_bindings: init_bindings,
	get_bindings: function () {
	    return bindings;
	},
	get_config_file_path: get_config_file_path,
	read_config_file: read_config_file,
	write_config_file: write_config_file,
	get_default_config: function () {
	    return default_config;
	},
	config_file_exists: config_file_exists
    };
}();
