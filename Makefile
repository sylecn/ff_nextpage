default:
	@echo "make nothing."
ls:
	@echo "${PWD}/nextpage.xpi" | xsel -b
v:
	@echo -n "version: "
	@cat xpi-pack/install.rdf | sed -n "s;.*<em:version>\(.*\)</em:version>;\1;p"
xpi:
	cd src && zip -r nextpage.jar content/ locale/
	mv src/nextpage.jar xpi-pack/chrome/
	cd xpi-pack && zip -r nextpage.xpi *
	mv xpi-pack/nextpage.xpi ./
	@echo "${PWD}/nextpage.xpi" | xsel -b
	@echo "xpi file path copied to clipboard."
xpi4: clean-xpi4
	cp -r src/content src/locale xpi-ff4/chrome/
	cd xpi-ff4/ && zip -r nextpage-ff4.xpi *
	mv xpi-ff4/nextpage-ff4.xpi ./
	@echo "${PWD}/nextpage-ff4.xpi"
	@echo "${PWD}/nextpage-ff4.xpi" | xsel -b
	@echo "xpi file path copied to clipboard."
clean-xpi4:
	rm -f xpi-ff4/nextpage-ff4.xpi nextpage-ff4.xpi
	rm -rf xpi-ff4/chrome/*
