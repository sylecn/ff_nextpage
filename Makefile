#root of add-on code
PROJECT_ROOT = $(PWD)
SRC = src
BUILD = build
VERSION = $(shell ./utils/parse-version.py)
XPI_FILE = $(PROJECT_ROOT)/$(BUILD)/nextpage-$(VERSION).xpi

default:
	@echo "Usage: make [xpi|ls|test|v]"
build: xpi4
ls:
	@echo "$(XPI_FILE)" | xsel -b
	@echo "xpi file path copied to clipboard."
v:
	@echo -n "version: "
	@cat $(SRC)/install.rdf | sed -n "s;.*<em:version>\(.*\)</em:version>;\1;p"
xpi: xpi4 ls
xpi4: clean-xpi4
	mkdir -p $(BUILD)
	cd $(SRC)/ && zip -r $(XPI_FILE) *
	@echo "$(XPI_FILE)"
clean-xpi4:
	rm -f $(XPI_FILE)
code-review:
	git diff --color release..HEAD src/chrome/content/nextpage.js
test1:
	@firefox 'http://www.debian.org/releases/stable/i386/' 'http://www.google.com/search?q=dict&ie=utf-8&oe=utf-8&aq=t&rls=org.mozilla:en-US:unofficial&client=iceweasel-a'
test:
	@firefox 'http://www.debian.org/releases/stable/i386/' 'http://www.boost.org/doc/libs/1_41_0/doc/html/array.html' 'http://www.google.com/search?q=dict&ie=utf-8&oe=utf-8&aq=t&rls=org.mozilla:en-US:unofficial&client=iceweasel-a' 'http://www.bestbuy.com/site/olstemplatemapper.jsp?id=pcat17071&type=page&initialize=false&sp=&nrp=15&iht=y&list=n&sc=Global&st=ac+adapter&usc=All+Categories&ks=960&prids=&cp=2&qp=&_requestid=133557' 'http://lists.mplayerhq.hu/pipermail/mplayer-users/2005-March/051882.html' 'http://www.amazon.de/b/ref=amb_link_157473167_36?ie=UTF8&node=427954031&pf_rd_m=A3JWKAKR8XB7XF&pf_rd_s=center-4&pf_rd_r=1CH1PP7HYH2BHAM3A0NT&pf_rd_t=101&pf_rd_p=233563287&pf_rd_i=514699031#/ref=sr_pg_3?rh=n%3A340843031%2Cn%3A!340844031%2Cn%3A427954031&page=3&ie=UTF8&qid=1301216915' 'http://search.yahoo.com/search;_ylt=A0oG7hM1TJBNBl0AOwal87UF;_ylc=X1MDUCM5NTgxMDQ2OQRfcgMyBGFvAzEEZnIDc2ZwBGZyMgNzYnRuBGhvc3RwdmlkA1VmaU1xa29HN3Y3OU9NQUFUVU5UMHcwZFJuRFR3MDJRVERVQUIwMFIEbl9ncHMDMTAEb3JpZ2luA3NycARxdWVyeQN5YWhvbyBzZWFyY2gEc2FvAzEEdnRlc3RpZAM-?p=yahoo+search&fr=sfp&fr2=&iscqry=' 'http://www.bing.com/search?q=search+bing&go=&qs=n&sk=&first=11&FORM=PORE' 'http://www.verycd.com/base/movie/' 'http://mail.python.org/pipermail/python-3000/2008-September/014713.html' 'http://image.baidu.com/i?tn=baiduimage&ct=201326592&lm=-1&cl=2&word=%CC%EC%D6%AE%BA%DB'
