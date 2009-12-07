default:
	@echo "make nothing."
xpi:
	cd src && zip -r nextpage.jar content/ locale/
	cd src && mv nextpage.jar xpi-pack/chrome/
	cd xpi-pack && zip -r nextpage.xpi *
	mv xpi-pack/nextpage.xpi ./
