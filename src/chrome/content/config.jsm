var EXPORTED_SYMBOLS = ["nextpage_config", "nextpage_debug"];

nextpage_debug = {
    // make sure debugging is turned off when release
    _debugging			: false,
    _debugSpecialCase		: !false,
    _debugGotoNextPage		: !false,
    _debugDomainCheck		: false,
    _debugATag			: false,
    _debugIFrame			: false,
    _debugContentEditable	: false,
    _debugKeyEvents		: false,
    _debugConfigFile             : !false,

    /**
     * public interface to enable debug.
     *
     * (enable-debug)
     */
    enableDebug: function () {
	// enable the most useful debug variables here
	this._debugging = true;
	this._debugSpecialCase = true;
	this._debugGotoNextPage = true;
	this._debugConfigFile = true;
    },
    /**
     * (enable-debug-for-a-tag), that is for <a> tag, not for a tag.
     */
    enableDebugATag: function () {
	this._debugging = true;
	this._debugATag = true;
    },
    /**
     * (enable-debug-for-domain-check)
     */
    enableDebugDomainCheck: function () {
	this._debugging = true;
	this._debugDomainCheck = true;
    },
    /**
     * (disable-debug)
     */
    disableDebug: function () {
	this._debugging = false;
    },

    debugging: function () {
	return this._debugging;
    },
    debugSpecialCase: function () {
	return this._debugging && this._debugSpecialCase;
    },
    debugGotoNextPage: function () {
	return this._debugging && this._debugGotoNextPage;
    },
    debugDomainCheck: function () {
	return this._debugging && this._debugDomainCheck;
    },
    debugATag: function () {
	return this._debugging && this._debugATag;
    },
    debugIFrame: function () {
	return this._debugging && this._debugIFrame;
    },
    debugContentEditable: function () {
	return this._debugging && this._debugContentEditable;
    },
    debugKeyEvents: function () {
	return this._debugging && this._debugKeyEvents;
    },
    debugConfigFile: function () {
	return this._debugging && this._debugConfigFile;
    },

    // convert anchor (link) object to string
    linkToString: function (l) {
	var re, prop;
	re = "link = {\n";
	prop = ["rel", "accessKey", "title", "href", "onclick",
		"innerHTML", "id", "name"];
	for (var i = 0; i < prop.length; i++) {
	    if (l.hasAttribute(prop[i])) {
		re += prop[i] + ": " + l.getAttribute(prop[i]) + ",\n";
	    }
	}
	return re + "}";
    },

    dirStrict: function (obj) {
	var dirResult = [];
	for (prop in obj) if (obj.hasOwnProperty(prop)) {
	    dirResult.push([prop, typeof obj[prop]].join(': '));
	}
	return dirResult.join('\n');
    },

    dir: function (obj) {
	var dirResult = [];
	for (prop in obj) {
	    dirResult.push([prop, typeof obj[prop]].join(': '));
	}
	return dirResult.join('\n');
    },

    show: function (obj, listOfProp) {
	var dirResult = [];
	for (prop in (listOfProp || obj)) {
	    dirResult.push([prop, obj[prop]].join(': '));
	}
	return dirResult.join('\n');
    }
};

/**
 * config file based functions.
 * global bindings are stored in this.bindings object.
 */
var nextpage_config = function () {
    // requires firefox 3.6
    Components.utils.import("resource://gre/modules/FileUtils.jsm");
    Components.utils.import("resource://gre/modules/NetUtil.jsm");
    Components.utils.import("resource://gre/modules/Console.jsm");

    var nextpage = {
    	debug: nextpage_debug,
	log: console.log
    };

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
     * returns true if given nextpage config command is valid.
     */
    // this is used for syntax checking.
    var valid_commands = ["nextpage-maybe",
			  "nextpage",
			  "history-back",
			  "close-tab",
			  "nil"];
    var is_valid_command = function (command) {
	var result = false;
	var i;
	for (i = 0; i < valid_commands.length; ++i) {
	    if (command === valid_commands[i]) {
		return true;
	    }
	}
	return false;
    };

    /**
     * parse nextpage config file. currently only bind is supported.
     * using dumb regexp to do parsing. sexp read style parsing not supported.
     * one bind per line.
     *
     * comments and empty lines are skipped.
     *
     * @return [binding_obj, logs, noerror].
     * binding_obj contains key, command pairs.
     * logs is an array of warning and error messages.
     * noerror indicate whether the parse has no errors. Note that usually
     *         errors will just be discarded. you can still use result in
     *         binding_obj.
     */
    var parse_config_file = function (str) {
	var noerror = true;
	var logs = [];
	var line_index;
	var log = function (msg) {
	    logs.push('line ' + (line_index + 1) + ': ' + msg);
	};

	var in_overlay = typeof(nextpage) !== "undefined";

	var lines = str.split('\n');
	var result = {};
	var r, mo, i;
	var line;
	var command_pattern = /^\(([a-zA-Z][-a-zA-Z0-9]*)(\s+.*)?\)$/;
	var command;		//stores first string in sexp list.
	for (i = 0; i < lines.length; ++i) {
	    line_index = i;
	    line = lines[i].trim();
	    if (line === '' || line.match(/^\s*;/)) {
		// ignore empty lines and comment lines
		continue;
	    }
	    if ((mo = command_pattern.exec(line))) {
		command = mo[1];
	    } else {
		log('Error: bad sexp: ' + line);
		noerror = false;
		continue;
	    };

	    switch (command) {
	    case "enable-debug":
		if (in_overlay) {
		    nextpage_debug.enableDebug();
		};
		break;
	    case "enable-debug-for-a-tag":
		if (in_overlay) {
		    nextpage_debug.enableDebugATag();
		};
		break;
	    case "enable-debug-for-domain-check":
		if (in_overlay) {
		    nextpage_debug.enableDebugDomainCheck();
		};
		break;
	    case "disable-debug":
		if (in_overlay) {
		    nextpage_debug.disableDebug();
		};
		break;
	    case "unbind-all":
		// clear built-in bindings
		bindings = {};
		// clear all bindings read thus far.
		result = {};
		break;
	    case "bind":
		r = function () {
		    var bind_pattern = /\(bind\s+"(.*)"\s+'?([^'\s]*)\s*\)/;
		    var mo = bind_pattern.exec(line);
		    var key, command;

		    if (! mo) {
			log('Error: bind: not well formed: ' + line);
			noerror = false;
			return;
		    };
		    key = mo[1];
		    command = mo[2];
		    if (key.indexOf(' ') !== -1) {
			log('Warning: bind: key sequence is not supported: ' +
			    key);
		    };
		    if (! is_valid_command(command)) {
			log('Error: bind: invalid command: ' + command);
			noerror = false;
		    }
		    if (result.hasOwnProperty(key)) {
			if (result[key] !== command) {
			    log('Warning: bind: overwrite existing binding (' +
				key + ', ' + result[key] + ')');
			} else {
			    log('Warning: bind: duplicate binding (' +
				key + ', ' + result[key] + ')');
			}
		    }
		    result[key] = command;
		}();
		break;
	    default:
		log('Error: unknown command: ' + command);
		noerror = false;
	    };
	}
	return [result, logs, noerror];
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
		var len = 0;
		var data = '';
		try {
		    len = inputStream.available();
		} catch (NS_BASE_STREAM_CLOSED) {
		    // pass
		}
		if (len > 0) {
		    data = NetUtil.readInputStreamToString(inputStream, len);
		}
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
		if (fail) {
		    return fail.apply(null, []);
		}
		return false;
	    }
	    if (succ) {
		return succ.apply(null, []);
	    }
	    return true;
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
     * This is to provide smooth upgrade from old versions.
     *
     * If user has enabled/disabled some bindings from preferences, create a
     * user config file to match those settings.
     *
     * This conversion is only done once when you install nextpage.
     */
    var create_config_file_from_preferences_maybe = function () {
	var prefs = Components.classes["@mozilla.org/preferences-service;1"]
                .getService(Components.interfaces.nsIPrefService)
		.getBranch("extensions.nextpage.");
	/**
	 * like getBoolPref, but return null if key is not in pref branch.
	 * do not throw exception.
	 */
	var getBoolPrefSafe = function (key) {
	    var r;
	    try {
		r = prefs.getBoolPref(key);
	    } catch (NS_ERROR_UNEXPECTED) {
		r = null;
	    };
	    return r;
	};
	/**
	 * convert preferences to user config file.
	 */
	var do_conversion = function () {
	    var use_12 = getBoolPrefSafe("use-1-2");
	    var use_space = getBoolPrefSafe("use-space");
	    var use_np = getBoolPrefSafe("use-n-p");
	    var use_alt_p = getBoolPrefSafe("use-alt-p");
	    var use_alt_n = getBoolPrefSafe("use-alt-n");

	    var using_default_config = (
		use_space && use_np &&
		    (! use_12) && (! use_alt_p) && (! use_alt_n));

	    var result_config = [];
	    if (! using_default_config) {
		result_config.push(';; config converted from preferences in old version');
		if (! use_space) {
		    result_config.push('(bind "SPC" \'nil)');
		};
		if (! use_np) {
		    result_config.push('(bind "n" \'nil)');
		    result_config.push('(bind "p" \'nil)');
		};
		if (use_12) {
		    result_config.push('(bind "1" \'history-back)');
		    result_config.push('(bind "2" \'nextpage)');
		};
		if (use_alt_p) {
		    result_config.push('(bind "M-p" \'history-back)');
		};
		if (use_alt_n) {
		    result_config.push('(bind "M-n" \'nextpage)');
		};
		result_config.push('\n');
		result_config = result_config.join('\n');

		write_config_file(result_config, function () {
		}, function () {
		    // alert user the conversion has failed.
		    if (nextpage.debug.debugConfigFile()) {
			nextpage.log('Error: write config file has failed.');
		    };
		});
	    };
	};

	// main()
	var convert_done = getBoolPrefSafe('convert_done');
	if (! convert_done) {
	    do_conversion();
	    prefs.setBoolPref('convert_done', true);
	};
    };

    /**
     * init this.bindings
     */
    var init_bindings = function () {
	/**
	 * send notification to user explicitly.
	 * @title title of the message
	 * @body content of the message
	 */
	var send_notification = function (title, body) {
	    if (! gBrowser) {
		return;
	    };
	    // running in browser overlay
	    // TODO can't find a good way to report error to user.
	    // do nothing for now.
	};

	var r;
	init_config_file();

	if (! config_file_exists()) {
	    create_config_file_from_preferences_maybe();
	}

	// parse the default config string
	r = parse_config_file(default_config);
	bindings = r[0];
	if (! r[2]) {
	    if (nextpage.debug.debugConfigFile()) {
		nextpage.log('Errors when parsing default config string:');
		nextpage.log(r[1].join("\n"));
	    }
	}
	if (! config_file_exists()) {
	    if (nextpage.debug.debugConfigFile()) {
		nextpage.log("info: user config file not found.");
	    }
	    return;
	}
	// parse user config
	r = read_config_file(function (data) {
	    // nextpage.log("config file content: " + data);
	    var r = parse_config_file(data);
	    update_obj(bindings, r[0]);
	    if (! r[2]) {
		send_notification('Errors when parsing user config file:',
				  r[1].join("\n"));
	    };

	    if (nextpage.debug.debugConfigFile()) {
		nextpage.log("user config file loaded.");
		if (Object.keys) {
		    nextpage.log('keys binded: ' + JSON.stringify(
			Object.keys(bindings))); //requires firefox 4.
		};
		if (! r[2]) {
		    nextpage.log('Errors when parsing user config file:');
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
	config_file_exists: config_file_exists,
	parse_config_file: parse_config_file
    };
}();
