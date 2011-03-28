// Copyright (C) 2009, 2010, 2011  Yuanle Song <sylecn@gmail.com>
//
// The JavaScript code in this page is free software: you can
// redistribute it and/or modify it under the terms of the GNU
// General Public License (GNU GPL) as published by the Free Software
// Foundation, either version 3 of the License, or (at your option)
// any later version.  The code is distributed WITHOUT ANY WARRANTY;
// without even the implied warranty of MERCHANTABILITY or FITNESS
// FOR A PARTICULAR PURPOSE.  See the GNU GPL for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <http://www.gnu.org/licenses/>.
//
// As additional permission under GNU GPL version 3 section 7, you
// may distribute non-source (e.g., minimized or compacted) forms of
// that code without the copy of the GNU GPL normally required by
// section 4, provided you include this license notice and a URL
// through which recipients can access the Corresponding Source.

// TODO search for debugging code, with mark: /**/

var nextpage = {
    prefsNameList: ["extensions.nextpage.use-space",
		    "extensions.nextpage.use-n-p",
		    "extensions.nextpage.use-1-2",
		    "extensions.nextpage.use-alt-n"],

    init: function () {
	// the FUEL Application
	this.app = Components.classes["@mozilla.org/fuel/application;1"].getService(Components.interfaces.fuelIApplication);
	this.log = this.app.console.log;

	/**
	 * l10n strings defined in locale/en-US/nextpage.properties
	 */
	this.strings = document.getElementById("nextpage-strings");

	// Note: if you edit keys in this object, also edit in this.status.
	this.binding = {
	    'SPC' : nextpage.commands.gotoNextPageMaybe,
	    'n' : nextpage.commands.gotoNextPage,
	    'p' : nextpage.commands.historyBack,
	    '1' : nextpage.commands.historyBack,
	    '2' : nextpage.commands.gotoNextPage,
	    'M-n' : nextpage.commands.gotoNextPage
	};

	/**
	 * Some websites use the same hotkeys as nextpage. To prevent nextpage
	 * from capturing the hotkeys, add the website and key binding they
	 * use in this alist.
	 *
	 * the key of the alist is a regexp that matches to document URL.
	 * the value of the alist is a list of keys to ignore.
	 *
	 * the key can be a literal string as well, which will be converted to
	 * regexp by calling new RegExp(str).
	 */
	this.ignoreBindingAList = [
	    [/https?:\/\/www.google.com\/reader\/view/i, ['SPC', '1', '2']]
	];

	if (nextpage.debug.debugging) {
	    nextpage.log("nextpage ready.");
	    nextpage.app.console.open();
	}
    },

    /**
     * @return true if key should be ignored.
     *
     * this method use this.ignoreBinding object to decide which keys to ignore.
     */
    ignore: function (key) {
	var url = this.utils.getURL();
	var it = Iterator(this.ignoreBindingAList);
	for (var pair in it) {
	    // ignore the index, get the value in pair.
	    v = pair[1];
	    if (url.match(v[0]) && this.utils.inArray(key, v[1])) {
		if (this.debug.debugging) {
		    this.log("ignore " + key + " for " + v[0]);
		}
		return true;
	    }
	};
	return false;
    },

    keypress: function (e) {
	// /**/this.log(this.debug.show(e.target));

	// ignore keyevents in XUL, only catch keyevents in content.
	if (e.target["namespaceURI"] ===
	    "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul") {
	    return;
	}
	// ignore keyevents in HTML input controls.
	var focusElement = content.document.activeElement;
	if (focusElement.tagName.match(/^(INPUT|TEXTAREA)$/i)) {
	    return;
	}

	var key = this.utils.describeKeyInEmacsNotation(e);
	if (nextpage.debug.debugging) {
	    nextpage.log("keypressed: " + key);
	}
	if (this.status[key] && ! this.ignore(key)
	    && (re = this.binding[key])) {
	    re();

	    e.stopPropagation();
	    e.preventDefault();
	} else {
	    return;
	}
    },

    updateStatus: function () {
	this.prefsValueList = this.prefsNameList.map(function (v, index, ar) {
	    return nextpage.app.prefs.getValue(v, false);
	});
	// Note: if you edit keys in this object, also edit in this.binding.
	this.status = {
	    'SPC' : this.prefsValueList[0],
	    'n' : this.prefsValueList[1],
	    'p' : this.prefsValueList[1],
	    '1' : this.prefsValueList[2],
	    '2' : this.prefsValueList[2],
	    'M-n' : this.prefsValueList[3]
	};
    },

    updateHotKeys: function () {
	this.updateStatus();
    },

    /**
     * @return true if we are at bottom of a page.
     * @return false otherwise.
     */
    isAtBottom: function () {
	// this bad site doesn't have a correct html markup, firefox can't
	// return the right document height, so I want SPC to just scroll
	// up.
	var hasBadMarkupDomainList = [ "msdn.microsoft.com",
				       "bbs.sgamer.com" ];
	if (nextpage.utils.inArray(content.document.domain,
				   hasBadMarkupDomainList)) {
	    return false;
	}

	if (content.scrollMaxY <= content.scrollY) {
	    return true;
	} else {
	    return false;
	}
    },

    /**
     * @param url a url string
     * @return true if the url pass the domain check.
     * This means the url matches the document domain, or it's a file:// or
     * javascript: url.
     * @return false otherwise. thus the url failed the domain check.
     */
    checkDomain: function (url) {
	if (nextpage.debug.debugging && nextpage.debug.debugDomainCheck) {
	    nextpage.log("checkDomain " + url);
	}

	if (url.match(/^javascript:/i)) {
	    return true;
	}

	var domainPattern = /^([^:]+):\/\/\/?([^:\/]+)/;
	var matchResult = domainPattern.exec(url);

	if (! matchResult) {
	    // should be a relative link.
	    return true;
	}
	if (matchResult[1] === "file") {
	    return true;
	}
	if (matchResult[2] === content.document.domain) {
	    return true;
	}
	if (nextpage.debug.debugging && nextpage.debug.debugDomainCheck) {
	    nextpage.log("domain compare:" + matchResult[2] + " vs " + content.domain.domain);
	}
	/**
	 * some document have a different domain than that in the url,
	 * here is a white list for those urls.
	 *
	 *     tieba.baidu.com
	 *     zhidao.baidu.com
	 *
	 * content.document.domain for them is baidu.com. so it will fail
	 * the domain test if not in the white list.
	 */
	// TODO make this list customizable
	var domainWhitelist = [ "tieba.baidu.com", "zhidao.baidu.com" ];
	if (nextpage.utils.inArray(matchResult[2], domainWhitelist)) {
	    return true;
	}
	if (nextpage.debug.debugging && nextpage.debug.debugDomainCheck) {
	    nextpage.log("domain check failed.");
	}
	return false;
    },

    /**
     * @return true if given string matches one of the words that's
     * equivalent to 'next'.
     * @return false otherwise.
     */
    matchesNext: function (str) {
	if (! str) return false;
	// TODO make this regexp configurable
	var nextPattern = /(?:^\s*(Go to )?(next page|Nächste Seite)|^\s*(next|nächste)\s*$|^\s*(next|nächste)\s*<|>\s*(next|nächste)$|>\s*(next|nächste)\W|(next|nächste)1?\.(?:gif|jpg|png)|下一(?:页|糗事|章|回)|下页|\[下一页\]|后一页|^(››| ?(&gt;)+ ?)$|Next (Chapter )?(?:»|›)|^Thread Next$)/i;
	return nextPattern.test(str);
    },

    /**
     * @param l an anchor object
     * @return true if this anchor is link to next page
     * @return false otherwise
     */
    isNextPageLink: function (l) {
	var imgMaybe;
	var spanMaybe;

	// check rel
	if (l.hasAttribute("rel")) {
	    if (nextpage.matchesNext(l.getAttribute("rel"))) {
		// if rel is used, it's usually the right link. GNU info
		// html doc is using rel to represent the relation of the
		// nodes.
		return true;
	    }
	}

	// check accesskey
	if (l.getAttribute("accesskey") === 'n') {
	    // some well written html already use accesskey n to go to
	    // next page, in firefox you could just use Alt-Shift-n.
	    return true;
	}

	if (l.hasAttribute("title")) {
	    if (nextpage.matchesNext(l.getAttribute("title"))) {
		return true;
	    }
	}

	// if we come here, it's not that clear we get a next page link, so more
	// restrict rules apply.

	// check domain
	if (l.hasAttribute("href")) {
	    // this version will expand l.href to full URL. if it's a relative URL.
	    // if (! nextpage.checkDomain(l.href)) {
	    if (! nextpage.checkDomain(l.getAttribute("href"))) {
    		return false;
	    }
	}

	// check innerHTML
	if (nextpage.matchesNext(l.innerHTML)) {
	    return true;
	}

	// check inner <img> tag
	imgMaybe = l.getElementsByTagName("IMG");
	if (imgMaybe.length !== 0) {
	    if (nextpage.matchesNext(imgMaybe[0].alt) ||
		nextpage.matchesNext(imgMaybe[0].name)) {
		return true;
	    }
	}
	// check inner <span> tag
	spanMaybe = l.getElementsByTagName("SPAN");
	if (spanMaybe.length !== 0) {
	    if (nextpage.matchesNext(spanMaybe[0].innerHTML))
		return true;
	}

	return false;
    },

    /**
     * @param l an INPUT type="button" object
     * @return true if this button is link to next page
     * @return false otherwise
     */
    isNextPageButton: function (l) {
	// check value
	if (nextpage.matchesNext(l.getAttribute("value"))) {
	    return true;
	}

	// check title
	if (l.hasAttribute("title")) {
	    if (nextpage.matchesNext(l.getAttribute("title"))) {
		return true;
	    }
	}

	// check accesskey
	if (l.getAttribute("accesskey") === 'n') {
	    // some well written html already use accesskey n to go to
	    // next page, in firefox you could just use Alt-Shift-n.
	    return true;
	}

	return false;
    },


    /**
     * parse next page links in current document
     * @return an anchor object containing the next page link if one is found.
     * @return false if next page link not found.
     */
    getNextPageLink: function () {
	var links;
	var nodes;
	// var re;

	/*
	 * special case for some website, pre-generic
	 */
	// nothing yet.

	/*
	  note: on some generated document (such as this one:
	  http://www.netlib.org/lapack/lug/node5.html), there are two LINK tag with
	  rel "next". I don't know what that means. it's probably a broken page.
	  As a result, LINK tag support is removed for now.
	*/
	// var tagNameToCheck = ["LINK", "A"];

	// check last none-text node in <head>
	var head = content.document.getElementsByTagName('head');
	if (head) {
	    var lastElement = head[0].lastElementChild;
	    if ((lastElement.tagName.toUpperCase() === "LINK") &&
		lastElement.hasAttribute('rel') &&
		(lastElement.getAttribute('rel').toLowerCase() === "next")) {
		// find a next page link
		if (this.debug.debugging) {
		    this.log("found <LINK rel=\"next\"> href=" + lastElement.href);
		}
		return lastElement;
	    }
	}

	// check <a> links
	var tagNameToCheck = ["A"];
	for (var i = 0; i < tagNameToCheck.length; i++) {
	    links = content.document.getElementsByTagName(tagNameToCheck[i]);
	    for (var j = 0; j < links.length; j++) {
		if (nextpage.debug.debugging) {
		    if (nextpage.debug.debugATag) {
			// define your filter condition here:
			if (false) {
			    nextpage.log("A-tag innerHTML:" + links[j].innerHTML);
			    nextpage.debug.debugATag = false;
			    // can enable other debug options here.
			    nextpage.debug.debugDomainCheck = true;
			}
		    }
		}
		if (nextpage.isNextPageLink(links[j])) {
		    return links[j];
		}
	    }
	}

	// check <input type="button" ...>
	nodes = content.document.getElementsByTagName('INPUT');
	for (var j = 0; j < nodes.length; j++) {
	    if (nextpage.isNextPageButton(nodes[j])) {
		return nodes[j];
	    }
	}

	/*
	 * special case for some website, post-generic
	 */

	// // for acl2 tour
	// if ($('a[href="acl2-doc-info.html"] > img[src="index.gif"]',
	// 	  content.document).get(0)) {
	// 	re = $('a > img[src$=".gif"]', content.document).filter(
	// 	    function (index) {
	// 		return ((this.src === "walking.gif") ||
	// 			(this.src === "flying.gif"))
	// 	    }
	// 	).get(0);
	// 	if (re) {
	// 	    return re;
	// 	}
	// }

	return false;
    }
};

nextpage.debug = {
    debugging: false,
    debugATag: false,
    debugDomainCheck: false,

    // convert anchor (link) object to string
    linkToString: function (l) {
	var re, prop;
	re = "link = {\n";
	prop = ["rel", "accessKey", "title", "href", "innerHTML",
		"id", "name"];
	for (var i = 0; i < prop.length; i++) {
	    if (l[prop[i]]) {
		re += prop[i] + ": " + l[prop[i]] + ",\n";
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

nextpage.commands = {
    historyBack: function () {
	var historyObj = content.history;
	historyObj.back();
    },

    /**
     * goto next page if a next page link was found. otherwise do nothing.
     */
    gotoNextPage: function () {
	if (nextpage.debug.debugging) {
	    nextpage.log("in gotoNextPage()");
	}
	var nextpageLink = nextpage.getNextPageLink();
	if (nextpageLink) {
	    if (nextpageLink.hasAttribute("href")) {
		if (nextpage.debug.debugging) {
		    nextpage.log("will goto link:" + nextpageLink.href +
				 nextpage.debug.linkToString(nextpageLink));
		}
		// FIX Issue 4: don't follow a link to index.html
		if (nextpageLink.href.match(/index\....l?$/i)) {
		    return;
		}
		// don't follow a link to current page
		if (nextpageLink.href === this.utils.getURL()) {
		    return;
		}
		content.location = nextpageLink.href;
	    } else if (nextpageLink.hasAttribute("onclick")) {
		if (nextpage.debug.debugging) {
		    nextpage.log("will now execute click().");
		}
		nextpageLink.click();
	    }
	} else {
	    // TODO show a nice auto timeout message at the bottom of the content
	    // window. using html and css. use msg in
	    // nextpage.strings.getString("msg_no_link_found")
	    if (nextpage.debug.debugging) {
		nextpage.log("No link/button found. will stay at current page.");
	    }
	}
	return;
    },

    /**
     * this function will be bind to SPC key by default
     */
    gotoNextPageMaybe: function () {
	if (nextpage.isAtBottom()) {
	    // go to next page
	    nextpage.commands.gotoNextPage();
	} else {
	    // scroll up a page
	    content.scrollByPages(1);
	}
	return;
    }
};

nextpage.utils = {
    /**
     * test whether an element is in an array
     * @return true if it is.
     * @return false otherwise.
     */
    inArray: function (element, array) {
	for (var i = 0; i < array.length; i++) {
    	    if (element === array[i]) {
    		return true;
    	    }
	}
	return false;
    },

    /**
     * integer to ASCII
     */
    itoa: function (i) {
	return String.fromCharCode(i);
    },

    /**
     * ASCII to integer
     */
    atoi: function (a) {
	return a.charCodeAt();
    },

    /**
     * describe key pressed in emacs notation. return a string.
     * examples: n, N, C-a, M-n, SPC, DEL, <f2>, <insert>, C-M-n
     * <C-backspace>, <C-S-f7>, C-M-*, M-S-RET, <backspace>, <C-M-S-return>
     * @param e a KeyEvent
     * @return a string that describes which key was pressed.
     */
    describeKeyInEmacsNotation: function (e) {
	// /**/if (nextpage.debug.debugging) {
	//     nextpage.log("keyCode charCode:" + e.keyCode + " " + e.charCode);
	// }
	var getNameForKeyCode = function (keyCode) {
	    switch (keyCode) {
	    case KeyEvent.DOM_VK_INSERT : return "insert";
	    case KeyEvent.DOM_VK_DELETE : return "delete";
	    case KeyEvent.DOM_VK_HOME : return "home";
	    case KeyEvent.DOM_VK_END : return "end";
	    case KeyEvent.DOM_VK_PAGE_UP : return "prior";
	    case KeyEvent.DOM_VK_PAGE_DOWN : return "next";

	    case KeyEvent.DOM_VK_BACK_SPACE : return "backspace";
	    case KeyEvent.DOM_VK_ESCAPE: return "escape";

	    case KeyEvent.DOM_VK_F1 : return "f1";
	    case KeyEvent.DOM_VK_F2 : return "f2";
	    case KeyEvent.DOM_VK_F3 : return "f3";
	    case KeyEvent.DOM_VK_F4 : return "f4";
	    case KeyEvent.DOM_VK_F5 : return "f5";
	    case KeyEvent.DOM_VK_F6 : return "f6";
	    case KeyEvent.DOM_VK_F7 : return "f7";
	    case KeyEvent.DOM_VK_F8 : return "f8";
	    case KeyEvent.DOM_VK_F9 : return "f9";
	    case KeyEvent.DOM_VK_F10 : return "f10";
	    case KeyEvent.DOM_VK_F11 : return "f11";
	    case KeyEvent.DOM_VK_F12 : return "f12";

	    case KeyEvent.DOM_VK_LEFT : return "left";
	    case KeyEvent.DOM_VK_UP : return "up";
	    case KeyEvent.DOM_VK_RIGHT : return "right";
	    case KeyEvent.DOM_VK_DOWN : return "down";

	    case KeyEvent.DOM_VK_RETURN : return "RET";

	    default: return "KEYCODE" + keyCode;
	    }
	};
	var keyIsChar = (e.charCode != 0);
	var keyname = keyIsChar ? this.itoa(e.charCode) :
	    getNameForKeyCode(e.keyCode);
	if (keyname === " ") keyname = "SPC";  //SPC is emacs syntax and it's
					      //more readable.
	// /**/if (nextpage.debug.debugging) {
	//     nextpage.log("keyname:" + keyname);
	// }
	var ctrl = e.ctrlKey ? "C-": "";
	var meta = (e.altKey || e.metaKey) ? "M-": "";
	var shift = e.shiftKey ? "S-": "";
	var re = keyIsChar ? ctrl + meta + keyname :
	    '<' + ctrl + meta + shift + keyname + '>';
	return re;
    },

    /**
     * @return current page's URL as a string.
     */
    getURL: function () {
	return content.location.toString();
    }
};

nextpage.prefWatcher = {
    prefs: null,
    startup: function () {
	// Register to receive notifications of preference changes

	this.prefs = Components.classes["@mozilla.org/preferences-service;1"]
            .getService(Components.interfaces.nsIPrefService)
            .getBranch("extensions.nextpage.");
	this.prefs.QueryInterface(Components.interfaces.nsIPrefBranch2);
	this.prefs.addObserver("", this, false);

	nextpage.updateHotKeys();
    },
    shutdown: function ()
    {
	this.prefs.removeObserver("", this);
    },
    observe: function (subject, topic, data)
    {
	if (topic != "nsPref:changed")
	{
	    return;
	}

	nextpage.updateHotKeys();
    }
};

window.addEventListener("load", function (e) {
    // main()
    nextpage.init();
    nextpage.prefWatcher.startup();
}, false);

window.addEventListener("unload", function (e) {
    nextpage.prefWatcher.shutdown();
}, false);

window.addEventListener('keypress', function (e) {
    nextpage.keypress(e);
}, false);
