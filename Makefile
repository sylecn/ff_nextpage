default:
	@echo "make nothing."
ls:
	@echo "${PWD}/nextpage.xpi" | xsel -b
v:
	@echo -n "version: "
	@cat xpi-ff4/install.rdf | sed -n "s;.*<em:version>\(.*\)</em:version>;\1;p"
xpi: xpi4
xpi4: clean-xpi4
	cp -r src/content src/locale xpi-ff4/chrome/
	cp -r src/defaults xpi-ff4/
	cd xpi-ff4/ && zip -r nextpage.xpi *
	mv xpi-ff4/nextpage.xpi ./
	@echo "${PWD}/nextpage.xpi"
	@echo "${PWD}/nextpage.xpi" | xsel -b
	@echo "xpi file path copied to clipboard."
clean-xpi4:
	rm -f xpi-ff4/nextpage.xpi nextpage.xpi
	rm -rf xpi-ff4/chrome/* xpi-ff4/defaults
