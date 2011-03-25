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

// all our functions and vars will be inside this object.
if (typeof nextpage === 'undefined') {
    var nextpage = {};
};

/**
 * l10n strings defined in locale/en-US/nextpage.properties
 */
nextpage.strings = document.getElementById("nextpage-strings");

/**
 * @return true if we are at bottom of a page.
 * @return false otherwise.
 */
nextpage.isAtBottom = function () {
    // this bad site doesn't have a correct html markup, firefox can't
    // return the right document height, so I want SPC to just scroll
    // up.
    var hasBadMarkupDomainList = [ "msdn.microsoft.com",
				       "bbs.sgamer.com" ];
    if (nextpage.inArray(content.document.domain, hasBadMarkupDomainList)) {
	return false;
    }

    if (content.scrollMaxY <= content.scrollY) {
	return true;
    } else {
	return false;
    }
};

nextpage.historyBack = function () {
    var historyObj = content.history;
    historyObj.back();
};

/**
 * goto next page if a next page link was found. otherwise do nothing.
 * this function will be bind to 2 key by default
 */
nextpage.gotoNextPage = function () {
    var nextpageLink = nextpage.getNextPageLink();
    if (nextpageLink) {
	content.location = nextpageLink.href;
    }
    // else {
    // 	//TODO show a nice auto timeout message at the bottom of the
    // 	//     content window.  using html and css.
    //  use msg in nextpage.strings.getString("msg_no_link_found")
    // }
    return this;
};

/**
 * this function will be bind to SPC key by default
 */
nextpage.gotoNextPageMaybe = function () {
    // return if event fired on a checkbox.
    // space on checkbox should do check/uncheck only.
    var focusElement = content.document.activeElement;
    if (focusElement.tagName.toLowerCase() === "input") {
	return undefined;
    }

    if (nextpage.isAtBottom()) {
	// go to next page
	nextpage.gotoNextPage();
    } else {
	// scroll up a page
	content.scrollByPages(1);
    }
    return undefined;
};

/**
 * test whether an element is in an array
 * @return true if it is.
 * @return false otherwise.
 */
nextpage.inArray = function (element, array) {
    for (var i = 0; i < array.length; i++) {
    	if (element === array[i]) {
    	    return true;
    	}
    }
    return false;
};

/**
 * @param url a url string
 * @return true if the url is a file:// url or if the url matches the
 * document domain. thus the url passed the domain check.
 * @return false otherwise. thus the url failed the domain check.
 */
nextpage.checkDomain = function (url) {
    var domainPattern = /^([^:]+):\/\/\/?([^:\/]+)/;
    var matchResult = domainPattern.exec(url);
    if (! matchResult) {
	return false;
    }
    if (matchResult[1] === "file") {
	return true;
    }
    if (matchResult[2] === content.document.domain) {
	return true;
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
    if (nextpage.inArray(matchResult[2], domainWhitelist)) {
	return true;
    }
    return false;
};

/**
 * @return true if given string matches one of the words that's
 * equivalent to 'next'.
 * @return false otherwise.
 */
nextpage.matchesNext = function (str) {
    // ignore case.
    // TODO make this regexp configurable
    var nextPattern = /(?:^\s*next page|^\s*next\s*$|^\s*next\s*<|>\s*next$|>\s*next\W|next1?\.(?:gif|jpg|png)|下一(?:页|糗事|章|回)|下页|\[下一页\]|后一页|^››$|^(?:&gt;)+$|Next (Chapter )?»|^Thread Next$| &gt;&gt; )/i;
    return nextPattern.test(str);
};

/**
 * @param l an anchor object
 * @return true if this anchor is link to next page
 * @return false otherwise
 */
nextpage.isNextPageLink = function (l) {
    var imgMaybe;

    // check rel
    if (l.rel) {
	if (nextpage.matchesNext(l.rel)) {
	    // if rel is used, it's usually the right link. GNU info
	    // html doc is using rel to represent the relation of the
	    // nodes.
	    return true;
	}
    }

    // check accesskey
    if (l.accesskey === 'n') {
	// some well written html already use accesskey n to go to
	// next page, in firefox you could just use Alt-Shift-n.
	return true;
    }

    // if we come here, it's not that clear we get a next page link, so more
    // restrict rules apply.

    // check domain
    if (! nextpage.checkDomain(l.href)) {
    	return false;
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

    return false;
};


/**
 * parse next page links in current document
 * @return an anchor object containing the next page link if one is found.
 * @return false if next page link not found.
 */
nextpage.getNextPageLink = function () {
    var links;
    var re;

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
	if ((lastElement.tagName.toLowerCase() === "link") &&
	    lastElement.hasAttribute('rel') &&
	    (lastElement.getAttribute('rel').toLowerCase() === "next")) {
	    // find a next page link
	    return lastElement;
	}
    }

    // check <a> links
    var tagNameToCheck = ["A"];
    for (var i = 0; i < tagNameToCheck.length; i++) {
	links = content.document.getElementsByTagName(tagNameToCheck[i]);
	for (var j = 0; j < links.length; j++) {
	    if (nextpage.isNextPageLink(links[j])) {
		return links[j];
	    }
	}
    }

    // check <input type="button" ...>
    nodes = content.document.getElementsByTagName('INPUT');
    for (var j = 0; j < links.length; j++) {
	if (nextpage.isNextPageButton(links[j])) {
	    return links[j];
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
    // 		return ((this.src == "walking.gif") ||
    // 			(this.src == "flying.gif"))
    // 	    }
    // 	).get(0);
    // 	if (re) {
    // 	    return re;
    // 	}
    // }

    return false;
};

// main()
// updateHotKeys on startup.
window.addEventListener("load", nextpage.updateHotKeys, false);

/**
 * debug only functions
 */

// // convert anchor object to string
// nextpage.linkToString = function (l) {
//     var re, prop;
//     re = "link ";
//     prop = ["href", "id", "name", "innerHTML", "accessKey", "rel"];
//     for (var i = 0; i < prop.length; i++) {
// 	if (l[prop[i]]) {
// 	    re += prop[i] + "=" + l[prop[i]] + " ";
// 	}
//     }
//     return re;
// }
