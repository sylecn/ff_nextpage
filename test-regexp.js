// -*- mode: js -*-

var nextPattern = /(?:(^|>)(next page|Nächste Seite)(<|$)|(^|>\s*)(next|nächste)(\s*<|$| ?(?:»|›|&gt;)|1?\.(?:gif|jpg|png))|^(››| ?(&gt;)+ ?)$|(下|后)一?(?:页|糗事|章|回|頁)|^(Next Chapter|Thread Next|Go to next page))/i;

var goodMatch = [
    "next", "next page",
    "<span class=\"foo\">next</span>", "<span class=\"foo\">next page</span>",
    "next<img src=\"abc.png\" />", "<img src=\"abc.png\" />next",
    "next ›", "next »", "next &gt;", "Next &gt;&gt;&gt;",

    "››", "&gt;", " &gt;&gt; ",

    "下一页", "下一章",
    "Thread Next",
    "Next Chapter",
    "Next Chapter &gt;",
    "Go to next page",

    "...<span style=\"display: block; margin-left: 53px; text-decoration: underline;\">  Next  </span>", // google search
    "Next Page<img src=\"/images/arrows/arrows-66.gif\" alt=\"arrow\" border=\"0\" height=\"13\" hspace=\"2\" vspace=\"0\" width=\"12\" align=\"baseline\">",
    "下一页&nbsp;»",  //verycd
    "下一页&nbsp;&raquo;"
];

var badMatch = [
    "on next chapter we will",
    "nextit",
    "nextpage",
    "next time you",
    "who is next",
    "who cares who is next anyway"
];

var msgs = [];

var log = function (msg) {
    msgs.push(msg);
    document.getElementById("msg").innerHTML = msgs.join('\n');
};

goodMatch.forEach(function (v) {
    if (! v.match(nextPattern)) {
	log("catch is missing: " + v);
    }
});

badMatch.forEach(function (v) {
    if (v.match(nextPattern)) {
	log("bad catch: " + v);
    }
});

if (msgs.length === 0) {
    log("all pass.");
}
