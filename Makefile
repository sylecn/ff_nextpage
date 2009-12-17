default:
	@echo "make nothing."
ls:
	@echo "${PWD}/nextpage.xpi"
	@echo "${PWD}/nextpage.xpi" | xsel -b
v:
	@echo -n "version: "
#TODO rewrite the two egrep command using one sed command.
	@cat xpi-pack/install.rdf | egrep "<em:version>.*</em:version>" | egrep -o "[0-9.]+"
	@cat xpi-pack/install.rdf | egrep "<em:version>.*</em:version>" | egrep -o "[0-9.]+" | tr -d '\n' | xsel -b
xpi:
	cd src && zip -r nextpage.jar content/ locale/
	mv src/nextpage.jar xpi-pack/chrome/
	cd xpi-pack && zip -r nextpage.xpi *
	mv xpi-pack/nextpage.xpi ./
