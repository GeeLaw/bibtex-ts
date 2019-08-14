# `TeX` namespace

This namespace has an abstract class `SimpleHandler`. It is a sufficient template to handle most TeX rendering you need in a `.bib` file. A handler can be created by deriving the class and implementing `EatXxx` methods and `Finish` method. However, it's usually not worth the effort to directly implement `SimpleHandler`.

## `SimpleRenderer` class

The `SimpleRenderer` class is an example of how to use `SimpleHandler`. It implements a basic recursive TeX handling template. The handler tokenises the character stream, asks its derived class in a structural way to render the content.

The rendering process is stack-based. There is a nested class `SimpleRenderer.StackFrame` that stores a frame in the stack. Each stack frame consists of several runs of text, each of which is split into 2 parts, `Char1` and `Char2`. Rendering diacritics will require knowing where to put the combinding diacritical mark --- after `Char1`. The class provides `Append` and `StringConcatInto`. The latter method is handy if the rendering process is string concatenation.

The `SimpleRenderer` uses the model of `SimpleHandler`, which treats `{`, `}`, `$$`, `$` as group opening delimiter, group closing delimiter, display equation switching delimiter and inline equation switching delimiter. It also treats `\<symbol>` and `\Letters   ` as control sequences.

### Rendering control sequences

Upon each control sequence, `SimpleRenderer` relies on the dervide class to determine the nature of the control sequence --- whether it is a command that accepts 0 or more arguments (e.g., `\"`, `\relax`, `\LaTeX`, etc.), an in-group alternation (e.g., `\bf`, `\scshape`, `\normalsize`, etc., whose effects persisit until the end of the enclosing group), a group opening delimiter (e.g., `\bgroup`), a group closing delimiter (e.g., `\egroup`), an inline equation opening delimiter (e.g., `\(`), an inline equation closing delimiter (e.g., `\)`), an inline equation switching delimter, a display equation opening delimiter (e.g., `\[`), a display equation closing delimiter (e.g., `\]`) or a display equation switching delimiter. The derived class should implement `CtrlSeqType` and `CtrlSeqTypeInMath` to determine the nature of control sequences.

TeX commands frequently appearing in BibTeX files are identified by the static `SimpleRenderer.CtrlSeqType` method. However, it is not necessary that an implementation handles all these commands.

A control sequence identified as a command accepting 0 or more arguments will eat arguments and be completed when the number of arguments is enough, or when the enclosing group is closed. Upon completion, `RenderCtrlSeq` is called on the instance. In case the number of arguments is insufficient, `null`s are pushed into `Char1` and `Char2`. The derived class should implement this method (taking parameters `csname`, `args` and `target`), which renders the control sequence with arguments in `args` into `target`.

A control sequence identified as in-group alternation will be treated as a 1-argument control sequence and will open a virtual group. When the enclosing group is closed, the nested virtual groups are closed and those control sequences are completed.

A control sequence identified as delimiters will be equivalent to that delimiter and is handled by `SimpleRenderer`.

An unidentified control sequence should be (somehow) rendered by the derived class as if it were text (preferably with an error message and without smart punctuations).

### Rendering groups, virtual groups, equations and finishing up

The dervied class should implement `RenderGroup`, `RenderVirtGroup`, `RenderMathInline` and `RenderMathDisplay` to render the contents. When rendering a group or a virtual group, the method should push exactly 1 pair of `Char1` and `Char2` into `target`. Usually, `args.Char1[0]` should become the `Char1` pushed into `target`. When rendering an equation, the method should push exactly 1 pair of `Char1` and `Char2` into `target`. Usually, the pushed `Char1` should be empty so that no diacritical marks is put on the equation (if something in the equation itself needs a diacritical mark, it should be rendered within the equation).

To finish rendering, implement `RenderAll`.

### Rendering text

The derived class should implement `RenderText` to render textual content. The `text` passed into this method is as-is, and the implementation should perform punctuation transformations.

Note that the class might receive consecutive calls to `RenderText`. Each time, the implementation should push exactly 1 pair of `Char1` and `Char2` into `target`. `SimpleRenderer` takes care of argument identification (possibly without braces), i.e., rendering `\csname abcd` might have the following call history:

- `CtrlSeqType`, called for `csname`, returns 2, indicating that `\csname` takes 2 arguments.
- `RenderText` is called for `a`.
- `RenderText` is called for `b`.
- `RenderCtrlSeq` is called for `csname` (with arguments `a` and `b`).
- `RenderText` is called for `cd`.

In contrast, rendering `\csname{ab}cd` is the following:

- `CtrlSeqType`, called for `csname`, returns 2, indicating that `\csname` takes 2 arguments.
- `SimpleRenderer` internally calls `OpenGroup`, which creates a new stack frame.
- `RenderText` is called for `ab`.
- `RenderGroup` is called for this group. The rendering result should be transferred to the argument stack for `csname`.
- `RenderText` is called for `c`.
- `RenderCtrlSeq` is called for `csname` (with arguments `ab` and `c`).
- `RenderText` is called for `d`.

## `TextRenderer` class

The `TextRenderer` class is an example of how to use `SimpleRenderer`. It implements a basic TeX to plain text converter that handles many (La)TeX commands. The handler does not handle equations (it outputs them verbatim).
