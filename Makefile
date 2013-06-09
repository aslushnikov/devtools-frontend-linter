
test:
	mocha

coverage:
	istanbul cover _mocha

.PHONY: test coverage
