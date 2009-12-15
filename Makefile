default:
	@echo "make nothing."
ls:
	@echo "${PWD}/nextpage.xpi"
	@echo "${PWD}/nextpage.xpi" | xsel -b
v:
	@echo -n "version: "
	@cat xpi-pack/install.rdf | egrep "<em:version>.*</em:version>" | egrep -o "[0-9.]+" | xsel -b | xsel -b -o
xpi:
	cd src && zip -r nextpage.jar content/ locale/
	mv src/nextpage.jar xpi-pack/chrome/
	cd xpi-pack && zip -r nextpage.xpi *
	mv xpi-pack/nextpage.xpi ./
