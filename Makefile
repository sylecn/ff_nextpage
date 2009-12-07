default:
	@echo "make nothing."
ls:
	@echo "${PWD}/nextpage.xpi"
	@echo "${PWD}/nextpage.xpi" | xsel -b && echo "copied to x clipboard."
xpi:
	cd src && zip -r nextpage.jar content/ locale/
	mv src/nextpage.jar xpi-pack/chrome/
	cd xpi-pack && zip -r nextpage.xpi *
	mv xpi-pack/nextpage.xpi ./
