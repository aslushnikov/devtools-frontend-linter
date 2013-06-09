
test:
	./node_modules/mocha/bin/mocha

coverage:
	istanbul cover ./node_modules/mocha/bin/_mocha

.PHONY: test coverage
