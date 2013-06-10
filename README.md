# DevTools Frontend Linter

This linter checks that private variables
defined in super classes do not get overwritten
by subclasses (unless both superclass and subclass are defined
in the same file). This code convention is forced by Chromium DevTools
team but is not checked by closure compiler.

The convention might by illustrated with [Foo.js](https://github.com/aslushnikov/devtools-frontend-linter/blob/master/test/raw/devtoolsFoo.js)
and [Bar.js](https://github.com/aslushnikov/devtools-frontend-linter/blob/master/test/raw/devtoolsBar.js).
In this case class `Bar` must not write anything to `_shortcuts` variable,
but class `Baz` has full access to `_shortcuts` and can even redefine `_registerShortcuts`.

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
$ make cover # runs istanbul to analyze code coverage
```

## Details

The linter analyzes AST (which is built with [esprima](https://github.com/ariya/esprima)) to infer classes, their inheritance and their ivars.

