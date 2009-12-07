// Copyright (C) Yuanle Song <sylecn@gmail.com>
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
var nextpage = {};

// @return true if we are at bottom of a page.
// @return false otherwise.
nextpage.is_at_bottom = function () {
    if (document.height === window.pageYOffset + window.innerHeight) {
	return true;
    } else {
	return false;
    }
};

// goto next page if a next page link was found. otherwise do nothing.
nextpage.goto_next_page = function () {
    var next_page_url = nextpage.get_next_page_link();
    if (next_page_url) {
	window.location.replace(next_page_url);
    }
    return this;
};

// this function will be bind to SPC key by default
nextpage.goto_next_page_maybe = function () {
    if (is_at_bottom()) {
	// go to next page
	nextpage.goto_next_page();
    } else {
	// scroll down a page
	window.scrollByPages(1);
    }
};

// @param url a url string
// @return true if the url is a file:// url or if the url matches the
// document domain. thus the url passed the domain_check.
// @return false otherwise. thus the url failed the domain_check.
nextpage.domain_check = function (url) {
    var parse_domain = /^([^:]+):\/\/\/?([^:\/]+)/;
    var match_result = parse_domain.exec(url);
    if (match_result[1] === "file") {
	return true;
    }
    if (match_result[2] === document.domain) {
	return true;
    }
    return false;
};

// @return true if given string matches one of the words that's
// equivalent to 'next'.
// @return false otherwise.
nextpage.matches_next = function (str) {
    var parse_next = /(?:next|>|>>|下一页)/i;
    var match_result = parse_next.exec(str);
    return match_result;
}

// @param l an anchor object
// @return true if this anchor is link to next page
// @return false otherwise
nextpage.is_next_page_link = function (l) {
    // check rel
    if (l.rel) {
	if (nextpage.matches_next(l.rel)) {
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
    if (! nextpage.domain_check(l.href)) {
	return false;
    }

    // check innerHTML
    if (nextpage.matches_next(l.innerHTML)) {
	return true;
    } else {
	return false;
    }
};

// convert anchor object to string
nextpage.link_to_string = function (l) {
    var re, prop;
    re = "link ";
    prop = ["href", "id", "name", "innerHTML", "accessKey", "rel"];
    for (var i = 0; i < prop.length; i++) {
	if (l[prop[i]]) {
	    re += prop[i] + "=" + l[prop[i]] + " ";
	}
    }
    return re;
};

// parse next page links in current document
// @return an anchor object containing the next page link if one is found.
// @return false if next page link not found.
nextpage.get_next_page_link = function () {
    var links = document.getElementsByTagName("A");
    for (var i = 0; i < links.length; i++) {
	if (nextpage.is_next_page_link(links[i])) {
	    return links[i];
	}
    }
    return false;
};


// ----------------------------------------------------------------------
// debug section below
// ----------------------------------------------------------------------
document.writeln("debug info");

// if (document.domain) {
//     document.writeln("domain is ", document.domain);
// } else {
//     document.writeln("no domain.");
// };

// nextpage.print_all_links = function () {
//     var links = document.getElementsByTagName("A");
//     for (var i = 0; i < links.length; i++) {
// 	document.writeln(nextpage.link_to_string(links[i]));
//     }
//     return this;
// };

// nextpage.print_all_links();

// document.writeln(nextpage.matches_next(" Next "));
// document.writeln(nextpage.matches_next("下一页"));
// document.writeln(nextpage.matches_next(">"));
// document.writeln(nextpage.matches_next("Prev"));  // doesn't match.

// document.writeln(nextpage.get_next_page_link());

