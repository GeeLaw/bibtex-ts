# BST functions mapped to BibTeX-TS

BibTeX-TS aims to provide all the functionalities available in the BST language. Though currently I haven't implemented a BST interpreter (nor do I plan to), the library aims to provide intuitive and mostly compliant implementation of BST functions. (Note some pedantic features are considered harmful. There will be examples.)

## `add.period$` function

In BST language, this function takes a string as input and outputs a string. It appends a period to string if it doesn't end with `.?!` after removing braces.

BibTeX-TS counterpart is `IsCompleteSentence` method on a `Literal` object. It determines whether a period should **not** be added, i.e., whether it ends with `.?!`.

From what I observe, BibTeX (BST) considers a string as ending with `.?!` if it matches regular expression `[.?!][}]*$`, i.e., `.{}` does *not* end with a period. BibTeX-TS currently implements this as the testing result of this regular expression.

## `change.case$` function

In BST language, this function takes a string, another string that specifies the target case, and outputs a string.

- If the target case is `U` or `u` (upper case), the input string will be converted to upper case, except for LaTeX command names inside a special character and anything inside balanced braces that are not inside a special character. The exceptions are `\aa\ae\oe\o\l\i\j\ss` commands inside a special character. They're converted to their equivalent upper-case forms.
- If the target case is `L` or `l` (lower case), the input string will be converted to lower case, except for LaTeX command names inside a special character and anything inside balanced braces that are not inside a special character. An exceptions are `\AA\AE\OE\O\L` commands inside a special character. They're converted to their equivalent lower-case forms.
- If the target case is `T` ot `t` (title case), the input string will be converted to lower case, except for *the first character* and *the first non-whitespace character after a colon with trailing whitespace*, LaTeX command names inside a special character, and anything inside balanced braces that are not inside a special character. The exceptions are `\AA\AE\OE\O\L` commands inside a special character. They're converted to their equivalent lower-case forms *if the special character is not the first character nor the first non-whitespace character after a colon with trailing whitespace*.

Note that if you change `A: {}B` to title case, the result is `A: {}b` because `b` is not the first non-whitespace character after the colon with whitespace.

There are some pedantic features in the BST `change.case$` function.

- It doesn't fully handle the conversion of `\i\j\ss` with other LaTeX commands. For example, `{\ae\ss}` will be converted into `{\AESS}`, instead of the desired `{\AE SS}`. (It does handle the case `{\"\i \j}` being converted to `{\"IJ}`. Note how the space between `\i` and `\j` disappears.)
- It doesn't preserve the eligiblity as a special character. For example, `{\ss}` will be converted into `{SS}`, which is no longer a special character.
- If a special character is the first character or the first character after a colon with whitespace, all characters inside it have their cases preserved. For example, `{\AE\OE}` is `{\AE\OE}` when converted to title case, **not** `{\AE\oe}`.

BibTeX-TS counterpart is `ToXxxCase` and `ToCase` methods on `Literal` instance. BibTeX-TS makes effort to make sure the space between LaTeX commands and non-commands are correctly inserted or removed, and that a special character remains a special character after conversion (by adding `\relax`, e.g. `{\ss}` in upper case is `{\relax SS}`). It faithfully implements the pedantic feature about case preservation inside a special character.

## `format.name$` function

BST `format.name$` function formats a name according to a format string. BibTeX-TS approaches the task by decomposing it into 3 subtasks:

1. Parse names out of a `Literal` using `BibTeX.ParsePersonNames` method.
2. Parse name formats out of a usual string using `BibTeX.ParsePersonNameFormat` method.
3. Format a `PersonName` using `PersonNameFormat.Format` method.

To be written...

## `purify$` function

BST `purify$` function purifies a string. BibTeX-TS counterpart are the `Purified` and `PurifiedPedantic` properties on `Literal` instances (also the `XyzPiece` objects). It should faithfully reimplement the effect of `text.length$`:

- Outside braces or inside braces that do not form a special character, tabs, hyphens and tildes outside braces are replaced with a space character. All non-alphanumerical non-space characters are removed.
- Inside a special character, LaTeX commands and non-alphanumerical character (including whitespace) are removed. The exceptions are `\AA\aa\AE\ae\OE\oe\O\o\L\l\i\j\ss`. `\AA` (resp. `\aa`) is converted to `A` (resp. `a`), and other such commands are converted to their respective names.

The BST function will remove all non-ASCII characters. BibTeX-TS provides two versions: It **not** remove any non-ASCII character when computing `Purified`, and it provides a pedantic version, `PurifiedPedantic`.

## `text.length$` function

BST `text.length$` function computes the length of a string (with balanced braces). BibTeX-TS counterpart is the `Length` property on `Literal` instances (also the `XyzPiece` objects). It should faithfully reimplement the effect of `text.length$`:

- Each character outside braces is counted as one character.
- Each special character is counted as one character (no matter how long it is or how many letters are inside it).
- Each non-brace character inside balanced braces that do not form a special character counts as one character.

Specifically, this means the length of `c{\~ab}{{\LaTeX}}` is 8 (`c`, special character and `\LaTeX`).

## `text.prefix$` function

BST `text.prefix$` function comptues the prefix of a string (with balanced braces) of specified length. BibTeX-TS counterparts are the `Prefix` and `PrefixRaw` methods on `Literal` instances. `Prefix` returns the prefix as a `Literal`, whereas `PrefixRaw` returns the prefix as a plain `string`. The latter avoids overhead of arranging the content into a `Literal` and can be used if the prefix is direcly handled as plain strings.

They should faithfully reimplement the effect of `text.prefix$`:

- Count length as defined by `text.length$`.
- The output will always have balanced braces. Unpaired opening braces are paired by appending as many closing braces to the end of string as needed.

Specifically, this means the prefix of length 4 of `c{\~ab}{{\LaTeX}}` is `c{\~ab}{{\L}}`.

## Why not BST interpreters in JavaScript?

The constructs that the BST language natively supports is very limited and it is cumbersome to program in it. Moreover, some operations don't have idiomatic efficient implementation, e.g., integer multiplication is implmented as repeated addition.

The BST language is used to produce output that the TeX typesetter would like, which is very limited. The original motive of creating this library is to be able to use BibTeX in my blog building system, which requires content be rendered as HTML. BibTeX-TS parses BibTeX databases into objects with methods, and the consumers are supposed to operate over the objects and let it retain that form, except when preparing for final output. Therefore, it suffices to implement the important BST functions and let the usual operations be handled by JavaScript.
