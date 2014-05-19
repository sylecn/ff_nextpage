// Copyright (C) 2009, 2010, 2011, 2012, 2013, 2014  Yuanle Song <sylecn@gmail.com>
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
    init: function () {
	// the FUEL Application
	this.app = Components.classes["@mozilla.org/fuel/application;1"].getService(Components.interfaces.fuelIApplication);
	this.log = this.app.console.log;

	/**
	 * l10n strings defined in locale/en-US/nextpage.properties
	 */
	this.strings = document.getElementById("nextpage-strings");

	/**
	 * read user's config file if there is one.
	 */
	nextpage_config.init_bindings();

	/**
	 * Some websites use the same hotkeys as nextpage. To prevent nextpage
	 * from capturing the hotkeys, add the website and key binding they
	 * use in this alist.
	 *
	 * the key of the alist is a regexp that matches to document URL.
	 * the value of the alist is a list of keys to ignore.
	 *
	 * the key of the alist can be a literal string as well, which will be
	 * converted to regexp by calling new RegExp(str).
	 *
	 * nextpage will stop when it finds the first match, so you should put
	 * more specific regexp earlier in the list.
	 */
	// TODO make this list configurable.
	this.ignoreBindingAList = [
	    [/https?:\/\/www\.google\.com\/reader\/view/i, ['SPC', '1', '2']],
	    [/https?:\/\/www\.google\.com\/transliterate/i, "*"],
	    // exception rule, pipermail mailing list is not webmail.
	    [/mail\..*\/pipermail/i, ""],
	    // ignore common webmail hosts, nextpage bindings can do little on
	    // these domains.
	    [/\W(web)?mail\.[^.]+\.(com|org|net|edu)/i, "*"]
	];

	if (nextpage.debug.debugging()) {
	    nextpage.log("nextpage ready.");
	    // TODO console.open() does not work well under firefox 11.
	    // see bug #71.
	    // nextpage.app.console.open();
	}
    },

    /**
     * @param key a keyname returned by utils.describeKeyInEmacsNotation(e)
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
	    if (url.match(v[0])) {
		if (v[1] === "") {
		    // user explicitly says do not ingore any key
		    return false;
		}
		if (v[1] === "*" || this.utils.inArray(key, v[1])) {
		    if (this.debug.debugging()) {
			this.log("ignore " + key + " for " + v[0]);
		    }
		    return true;
		}
		return false;
	    }
	}
	return false;
    },

    keypress: function (e) {
	var command;
	// /**/this.log(this.debug.show(e.target));

	// ignore keyevents in XUL, only catch keyevents in content.
	if (e.target["namespaceURI"] ===
	    "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul") {
	    return;
	}
	// ignore keyevents in HTML input controls.
	var focusElement = content.document.activeElement;
	// walk down the frames to get the bottom level activeElement
	while (focusElement.tagName.match(/^FRAME$/i)) {
	    focusElement = focusElement.contentDocument.activeElement;
	}
	if (focusElement.tagName.match(/^(INPUT|TEXTAREA|SELECT)$/i)) {
	    return;
	}
	if (nextpage.debug.debugContentEditable()) {
	    this.log(focusElement.tagName +
		     "\nfocusElement.contentEditable=" +
		     focusElement.contentEditable);
	}
	// when contentEditable is set to true, a BODY tag or DIV tag will
	// become editable, so treat them just like other input controls.
	if (focusElement.contentEditable === "true") {
	    return;
	}
	// IFRAME is a also an input control when inner document.designMode is
	// set to "on". Some blog/webmail rich editor use IFRAME instead of
	// TEXTAREA.
	if (nextpage.debug.debugIFrame()) {
	    if (focusElement.tagName === "IFRAME") {
		this.log(focusElement.tagName +
			 "\nfocusElement.contentEditable=" +
			 focusElement.contentEditable +
			 "\ndocument.designMode=" +
			 focusElement.contentDocument.designMode +
			 "\nbody.contentEditable=" +
			 focusElement.contentDocument.body.contentEditable);
	    }
	}
	// TODO some website is using IFRAME for textarea, but designMode is
	// not set to "on", including: gmail, qq mail. I don't know how they
	// make that work.
	if (focusElement.tagName === "IFRAME" &&
	    (focusElement.contentDocument.designMode.toLowerCase() === "on" ||
	     focusElement.contentDocument.body.contentEditable)) {
	    return;
	}

	var key = this.utils.describeKeyInEmacsNotation(e);
	if (nextpage.debug.debugKeyEvents()) {
	    nextpage.log("keypressed: " + key);
	}
	if (! this.ignore(key)) {
	    command = nextpage_config.get_bindings()[key];
	    if (typeof(command) !== "undefined") {
		nextpage.commands.runUserCommand(command);
	    };
	};
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
	if (nextpage.debug.debugDomainCheck()) {
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
	if (matchResult[2].indexOf(content.document.domain) !== -1) {
	    return true;
	}
	if (nextpage.debug.debugDomainCheck()) {
	    nextpage.log("domain compare: link at " + matchResult[2] +
			 ", this doc at " + content.document.domain);
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
	// str could be null
	if (! str) return false;
	str = str.trim();
	// str could be space only
	if (! str) return false;

	// to add more languages, load
	// /home/sylecn/projects/firefox/nextpage/make-regexp.el
	// M-x insert-nextpage-regexp

	// TODO make this regexp configurable
	var nextPattern = /(?:(^|>)(next page|Nächste Seite|la page suivante|следующей страницы)(<|$)|(^|>\s*)(next|nächste|Suivant|Следующая)(\s*<|$| ?(?:▸|»|›|&gt;)|1?\.(?:gif|jpg|png))|^(››| ?(&gt;)+ ?)$|(下|后)一?(?:页|糗事|章|回|頁)|^(Next Chapter|Thread Next|Go to next page))/i;
	return nextPattern.test(str) || nextPattern.test(str.slice(1, -1));
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
	imgMaybe = l.getElementsByTagName("img");
	if (imgMaybe.length !== 0) {
	    if (nextpage.matchesNext(imgMaybe[0].getAttribute('alt')) ||
		nextpage.matchesNext(imgMaybe[0].getAttribute('name')) ||
		nextpage.matchesNext(imgMaybe[0].getAttribute('src'))) {
		return true;
	    }
	}
	// check inner <span> tag
	spanMaybe = l.getElementsByTagName("span");
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

    /*
     * hook functions for special cases defined in
     * nextpage.getNextPageLink.preGeneric and postGeneric.
     *
     * all hook functions are called with two arguments: url and doc.
     * hook function should return false if no link is found, otherwise,
     * it should return the link object.
     */
    getLinkForBaiduSearch: function (url, doc) {
	// locate A tag with class="n"
	var nodes = doc.getElementsByClassName("n");
	if (nodes.length < 1) {
	    return false;
	}
	for (i = 0; i < nodes.length; ++i) {
	    if (nodes[i].innerHTML === "下一页&gt;") {
		return nodes[i];
	    }
	}
	return false;
    },
    getLinkForOsdirML: function (url, doc) {
	// last <a> in div.osDirPrevNext. I wish I have jQuery at my disposal.
	// $("div.osDirPrevNext > a:last")
	var nodes = doc.getElementsByClassName("osDirPrevNext");  // FF3 only.
	if (nodes.length < 1) {
	    return false;
	}
	var links = nodes[0].getElementsByTagName("a");
	var link = links[links.length - 1];
	// /**/nextpage.log('innerHTML' + link.innerHTML);
	if (link.innerHTML === "&gt;&gt;") {
	    return link;
	}
	return false;
    },
    getLinkForDerkeilerML: function (url, doc) {
	// when there is a ul.links element, locate it first. then find li
	// node that contains "Next (in|by) thread:", then search in this node
	// for a link. see bug #139, #208.
	var nodes = doc.getElementsByClassName("links");
	var links;
	if (nodes.length > 0) {
	    nodes = nodes[0].getElementsByTagName("li");
	} else {
	    nodes = doc.getElementsByTagName("li");
	}
	for (i = 0; i < nodes.length; ++i) {
	    if (nodes[i].innerHTML.match(/Next (in|by) thread:/)) {
		links = nodes[i].getElementsByTagName("a");
		if (links.length > 0) {
		    return links[0];
		}
	    }
	}
	return false;
    },
    getLinkForWikiSource: function (url, doc) {
	var nodes = doc.getElementsByTagName("td");
	var links;
	for (i = 0; i < nodes.length; ++i) {
	    if (nodes[i].innerHTML.match(/→/)) {
		links = nodes[i].getElementsByTagName("a");
		if (links.length > 0) {
		    return links[0];
		}
	    }
	}
	return false;
    },
    getLinkForDiscuz: function (url, doc) {
	var generator;
	var className;
	if (content.discuzVersion == "X2") {
	    className = "nxt";
	} else {
	    generator = nextpage.utils.getMeta("generator");
	    if (! generator) {
		return false;
	    };
	    if (generator.match(/^Discuz! X/)) {
		className = "nxt";
	    } else if (generator.match(/^Discuz! /)) {
		className = "next";
	    } else {
		return false;
	    }
	}
	var nodes = doc.getElementsByClassName(className);
	if (nodes.length < 1) {
	    return false;
	}
	return nodes[0];
    },

    /**
     * parse next page links in current document
     * @return an anchor object containing the next page link if one is found.
     * @return false if next page link not found.
     */
    getNextPageLink: function () {
	var links;
	var nodes;
	var i, j;
	var tagName;
	// var re;

	/*
	 * special case for some website, pre-generic
	 */
	var preGeneric = [
	    [/\/((thread|forum)-|(viewthread|forumdisplay)\.php)/i, this.getLinkForDiscuz],
	    [/^http:\/\/osdir\.com\/ml\//i, this.getLinkForOsdirML],
	    [/^http:\/\/coding\.derkeiler\.com\/Archive\//i, this.getLinkForDerkeilerML],
	    [/\.wikisource\.org\//i, this.getLinkForWikiSource],
	    [/^http:\/\/www\.baidu\.com\/s\?wd=/i, this.getLinkForBaiduSearch]
	];
	var url = this.utils.getURL();
	for (i = 0; i < preGeneric.length; ++i) {
	    if (url.match(preGeneric[i][0])) {
		var re = preGeneric[i][1](url, content.document);
		if (this.debug.debugSpecialCase()) {
		    this.log("special case for " + preGeneric[i][0]);
		    this.log("hook function returned " + re);
		}
		if (re) {
		    return re;
		}
	    }
	}

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
	    if (lastElement &&
		(lastElement.tagName.toUpperCase() === "LINK") &&
		lastElement.hasAttribute('rel') &&
		(lastElement.getAttribute('rel').toLowerCase() === "next")) {
		// find a next page link
		if (this.debug.debugging()) {
		    this.log("found <LINK rel=\"next\"> href=" + lastElement.href);
		}
		return lastElement;
	    }
	}

	// check <a> links
	var tagNameToCheck = ["a"];
	for (i = 0; i < tagNameToCheck.length; i++) {
	    links = content.document.getElementsByTagName(tagNameToCheck[i]);
	    for (j = 0; j < links.length; j++) {
		if (nextpage.debug.debugATag()) {
		    // define your filter condition here:
		    if (false) {
			nextpage.log("A-tag innerHTML:" + links[j].innerHTML);
			nextpage.debug._debugATag = false;
			// can enable other debug options here.
			nextpage.debug._debugDomainCheck = true;
		    }
		}
		if (nextpage.isNextPageLink(links[j])) {
		    return links[j];
		}
	    }
	}

	// check <input type="button" ...>
	nodes = content.document.getElementsByTagName('input');
	for (j = 0; j < nodes.length; j++) {
	    if (nextpage.isNextPageButton(nodes[j])) {
		return nodes[j];
	    }
	}

	// check for <a class="foo next"> <button class="foo next">
	// <input type="button" class="foo next">
	nodes = content.document.getElementsByClassName('next');

	for (j = 0; j < nodes.length; j++) {
	    tagName = nodes[j].tagName.toUpperCase();
	    if (tagName === "A" ||
		tagName === "BUTTON" ||
		(tagName === "INPUT" &&
		 nodes[j].getAttribute("type") === "button")) {
		if (this.debug.debugging()) {
		    this.log("found <" + tagName + " class=\"foo next\">");
		}
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

nextpage.commands = {
    historyBack: function () {
	var historyObj = content.history;
	historyObj.back();
    },

    /**
     * goto next page if a next page link was found. otherwise do nothing.
     */
    gotoNextPage: function () {
	if (nextpage.debug.debugGotoNextPage()) {
	    nextpage.log("in gotoNextPage()");
	}
	var nextpageLink = nextpage.getNextPageLink();
	if (nextpageLink) {
	    if (nextpage.debug.debugGotoNextPage()) {
		nextpage.log("got nextpage link:\n" +
			     nextpage.debug.linkToString(nextpageLink));
	    }
	    if (nextpageLink.hasAttribute("onclick")) {
		if (nextpage.debug.debugGotoNextPage()) {
		    nextpage.log("will click the element");
		}
		if (nextpageLink.click) {
		    // buttons has .click() function
		    nextpageLink.click();
		} else {
		    // <a> link doesn't have a .click() function
		    var clickEvent =
			content.document.createEvent("MouseEvents");
		    clickEvent.initMouseEvent("click", true, true, window,
					      0, 0, 0, 0, 0,
					      false, false, false, false, 0,
					      null);
		    nextpageLink.dispatchEvent(clickEvent);
		}
	    } else if (nextpageLink.hasAttribute("href")) {
		if (nextpage.debug.debugGotoNextPage()) {
		    nextpage.log("will follow link.href if it's good");
		}
		// don't follow javascript:void(0);
		// instead simulate a click event.
		if (nextpageLink.href.match(/void/i)) {
		    nextpageLink.click();
		}
		// FIX Issue 4: don't follow a link to index.html
		if (nextpageLink.href.match(/index\....l?$/i)) {
		    return false;
		}
		// don't follow a link to current page
		if (nextpageLink.href === nextpage.utils.getURL()) {
		    return false;
		}
		content.location = nextpageLink.href;
	    }
	    // if there is a chance to return anything.
	    return true;
	} else {
	    // TODO show a nice auto timeout message at the bottom of the
	    // content window. using html and css. use msg in
	    // nextpage.strings.getString("msg_no_link_found")
	    if (nextpage.debug.debugging()) {
		nextpage.log("No link/button found. will stay at current page.");
	    }
	    return false;
	}
    },

    /**
     * this function will be bind to SPC key by default
     */
    gotoNextPageMaybe: function () {
	if (nextpage.isAtBottom()) {
	    // go to next page
	    return nextpage.commands.gotoNextPage();
	}
	return false;
    },

    // (close-tab)
    closeTab: function () {
	gBrowser.removeCurrentTab();
    },

    // (undo-close-tab)
    undoCloseTab: function () {
	// not implemented yet.
    },

    // (enable-debug)
    enableDebug : function () {
	// enable the most useful debug variables here
	nextpage.debug._debugging = true;
	nextpage.debug._debugSpecialCase = true;
	nextpage.debug._debugGotoNextPage = true;
	nextpage.debug._debugConfigFile = true;
    },

    /**
     * run user command
     */
    runUserCommand: function (command) {
	switch (command) {
	case "nextpage-maybe": return this.gotoNextPageMaybe();
	case "nextpage": return this.gotoNextPage();
	case "history-back": return this.historyBack();
	case "close-tab": return this.closeTab();
	case "nil": break;	//do nothing.
	default:
	    if (nextpage.debug.debugging()) {
		nextpage.log('will not run unknown command: ' + command);
	    };
	    break;
	};
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
	// /**/if (nextpage.debug.debugging()) {
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
	// /**/if (nextpage.debug.debugging()) {
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
    getURL: function (win) {
	if (! win) {
	    win = content;
	}
	return win.location.toString();
    },

    /**
     * @return <meta> tag with given name. in jQuery syntax:
     * $("meta[name=$name]").attr("content")
     * @return false if the name is not found.
     */
    getMeta: function (name, doc) {
	if (! doc) {
	    doc = content.document;
	}
	var metas = doc.getElementsByTagName("meta");
	for (var i = 0; i < metas.length; ++i) {
	    if (metas[i].getAttribute("name") === name) {
		return metas[i].getAttribute("content");
	    }
	}
	return false;
    }
};

// watch for notifications sent from preferences window.
nextpage.watcher = {
    observe: function (aSbuject, aTopic, aData) {
	nextpage_config.init_bindings();
    }
};

window.addEventListener("load", function (e) {
    // main()
    nextpage.init();

    // watch config change event.
    var observerService = Components.classes["@mozilla.org/observer-service;1"]
            .getService(Components.interfaces.nsIObserverService);
    observerService.addObserver(nextpage.watcher,
				"nextpage-reload-config", false);
}, false);

window.addEventListener("unload", function (e) {
    var observerService = Components.classes["@mozilla.org/observer-service;1"]
            .getService(Components.interfaces.nsIObserverService);
    observerService.removeObserver(nextpage.watcher, "nextpage-reload-config");
}, false);

window.addEventListener('keypress', function (e) {
    nextpage.keypress(e);
}, false);
