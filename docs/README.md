# BibTeX-TS

To import the library, put the generated `/lib/bibtex.js` file somewhere and `const BibTeX = require('path/to/bibtex.js')`. The basic idea is that any publicly available classes and functions are consumable from JavaScript and should resist malformed input. Private constructions are available in `BibTeX._Privates` (as well as `obj._Privates` and `obj._MutablePrivates` for objects with private fields).

User familiar with the BST language can find a quick chart in [`BST.md`](BST.md).

## Methods

There are 4 methods available under `BibTeX` object.

- `ParseLiteral` parses a string into a `Strings.Literal` object by returning a `Strings.ParseLiteralResult` object. Inspect the returned object to see whether an error occurred and get the result.
- `ParseDatabase` parses the content of a `.bib` file and returns a `ObjectModel.ParseDatabaseResult` object. Inspect it to get the result.
- `ParsePersonNames` parses a `Strings.Literal` object into an array of `ObjectModel.PersonName`.
- `ParsePersonNameFormat` parses a `string` into an `ObjectModel.PersonNameFormat` object.

## `Strings` namespace

This namespace contains the string model used in BibTeX-TS. It has 3 classes representing fragments of strings, called *pieces*:

- `BasicPiece` represents a fragment of string that is outside braces and contains no braces.
- `SpCharPiece` represents a fragment of string that is considered a *special character*. It is a fragment that begins with `{\` and has balanced braces.
- `BracedPiece` represents a fragment of string enclosed in braces but that is not a special character. It is a fragment that begins with `{` not followed by `\` and has balanced braces.

For example, the string `{\relax Ch}ristopher learnt how to use {{\LaTeX}}.` consists of 4 pieces:

1. `{\relax Ch}` is a `SpCharPiece`. Its *value* is the fragment with the first and last braces removed, i.e, `\relax Ch`.
2. `ristopher learnt how to use ` is a `BasicPiece`. Its value is the fragment itself.
3. `{{\LaTeX}}` is a `BracedPiece`. Its value is the fragment with the first and last braces removed, i.e., `{\LaTeX}`.
4. `.` is another `BasicPiece`.

Pieces can be constructed using their corresponding constructors that accepts the desired *value* (not the fragment itself!). Each class also has its `Empty` static property that stores a canonical empty instance. Note that, however, an empty `SpCharPiece` is actually `{\relax}`, where `\relax` is the LaTeX command that does nothing.

Strings are represented using the `Literal` class. Such an instance can be constructed from the array of its pieces. The following properties are the most important:

- `Raw` stores a string that can be parsed into the equivalent `Literal` instance using `BibTeX.ParseLiteral`.
- `Pieces` provides access to individual pieces. It is guaranteed that the pieces will not have empty `BasicPiece`s nor consecutive `BasicPiece`s.

`Literal` also has a static `Empty` storing a canonical empty instance.

## `ObjectModel` namespace

This namespace contains several classes. Generally, instances of those classes should be parsed and not created by consumers.

`StringRef` and `StringExpr` represent string operation in `.bib` database file. A `StringExpr` consists of several summands, each of which is either a `Literal` or a `StringRef`. For example, `author = {A} # and # "B"` will be parsed into an `EntryData`, whose `Fields.author` is a `StringExpr` consisting of 3 summands, the first and the third being `Literal`s and the second being a `StringRef` to `and` (which is supposed to be defined by a `@string` command).

`Entry` and `EntryData` represent resolved/unresolved entry. By parsing a `.bib` file, you get several `EntryData` instances. By calling the `Resolve` method, you get the `Entry` of that `EntryData`. The difference is whether `Fields` contain `StringExpr`s or `Literal`s.

`BibTeX.ParseDatabase` returns its results as a `ParseDatabaseResult` object, from where you can inspect errors and results. The errors are represented as `ParseDatabaseError` objects. This means all errors will be reported (as opposed to all other parsing methods where only the first error is reported).

`PersonName` represents a name. This is a BST language concept. Names are parsed from `Literal`, where each name is separated by the word `and` surrounded by whitespace. Each name can take the form `First von Last` or `von Last, First` or `von Last, Jr, First`. The `PersonName` object stores the words of each part of the name as well as the separators between consecutive words. Use `BibTeX.ParsePersonName` to obtain instances of this class. For each name, the first error in parsing that name is reported.

`PersonNameFormatComponent` represents a name component in a name format. It's included in the public visible part mainly for `instanceof` testing.

`PersonNameFormat` is a reusable name format object. Use `BibTeX.ParsePersonNameFormat` to obtain an instance. Use `PersonNameFormat.Format` method to format a `PersonName`. See the following example:

```JavaScript
const BibTeX = require('./bibtex.js');
const fmt = '{f. }{vv }{ll}';
const format = BibTeX.ParsePersonNameFormat(fmt);
const name = BibTeX.ParsePersonName(BibTeX.ParseLiteral('Jean-Baptiste de La Salle').Result)[0];
// J.-B. de La~Salle
console.log(format.Format(name));
// (same)
console.log(name.Format(fmt));
```

The advantage of using a `PersonNameFormat` object is efficiency. Each time `PersonName.Format` is called, the string needs to be parsed. If the same format is used for many names, parse the format string into a `PersonNameFormat` and use `PersonNameFormat.Format`.

## `Styles` namespace

This namespace currently contains 1 class, `Alpha`. It provides utilities for formatting an entry in `alpha.bst` style. Most consumers should first use `Alpha.ProcessEntries` method, which sorts the entries and produces the nicknames for a list of entries. After this, consumers can call `Alpha.GetEntryNicknameTeX` and `Alpha.GetEntryCitationTeX` for the TeX rendering of the nicknames and citations.

## `TeX` namespace

See [`TeX.md`](TeX.md).
