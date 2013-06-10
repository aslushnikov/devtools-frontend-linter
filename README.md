# DevTools Frontend Linter

This linter currently does only a single check that
private variables defined in super classes do not get overwritten
by subclasses (unless both superclass and subclass are defined
in the same file).

## Installation

```
$ git clone git://github.com/aslushnikov/devtools-frontend-linter.git
$ cd devtools-frontend-linter
$ npm install .
```

## Usage

```
$ ./lint.js <path to front_end folder>/*.js
```

Note that file order does not matter for the linter at the moment.

## Tests & Coverage

```
$ make test # runs mocha tests
$ make cover $ runs istanbul to analyze code coverage

## Details

The linter analyzes AST (with [esprima](https://github.com/ariya/esprima) to infer classes, their inheritance and their ivars.

