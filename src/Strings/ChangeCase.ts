/**
 * Represents a case change processor.
 */
interface Strings_IChangeCaseStateMachine
{
    /**
     * Appends a `BasicPiece`.
     * @param bp The `BasicPiece` object.
     */
    HandleBasic(bp: Strings_BasicPiece): void;

    /**
     * Appends a special character.
     * @param spch The `SpCharPiece` object.
     */
    HandleSpChar(spch: Strings_SpCharPiece): void;

    /**
     * Appends a `BracedPiece`.
     * @param braced The `BracedPiece` object.
     */
    HandleBraced(braced: Strings_BracedPiece): void;

    /**
     * Notifies the machine that the string is completed.
     * 
     * @returns The string with the case changed.
     */
    Finish(): Strings_Literal;
}

/**
 * Changes a special character to lower case.
 * LaTeX commands other than `\AA\AE\OE\O\L` are not
 * affected. ASCII letters are converted to lower case.
 * 
 * @param spch The special character.
 * 
 * @returns The character with case changed.
 */
function Strings_SpCharToLowerCase(
    spch: Strings_SpCharPiece): Strings_SpCharPiece
{
/* Case 1: Upper-case letters (batch-eat non-backslash
 *         ASCII characters for efficiency).
 * Case 2: Convert \AA\AE\OE\O\L.
 * Case 3: Other LaTeX commands with alphabetical names.
 * Case 4: LaTeX commands with non-alphabetical names.
 * Others: Keep as-is (not A to Z, not backslash, or
 *         trailing backslash).
 */
    const replaced = spch.Value.replace(
/([A-Z])[\u0000-\u005b\u005d-\u007f]*|\\(AA|AE|OE|O|L)(?![a-zA-Z])|\\[a-zA-Z]+\*?|\\[^a-zA-Z]/g,
        function (match, alpha, spcmd)
        {
            return (alpha !== undefined || spcmd !== undefined
                ? match.toLowerCase()
                : match);
        });
    return new Strings_SpCharPiece(
        new Strings_SpCharPieceBuilder(
        replaced));
}

class Strings_ToLowerCaseStateMachine
    implements Strings_IChangeCaseStateMachine
{
    private readonly Builder: Strings_LiteralBuilder;

    public constructor()
    {
        this.Builder = new Strings_LiteralBuilder();
    }

    public HandleBasic(bp: Strings_BasicPiece): void
    {
        this.Builder.AddBasicPiece(new Strings_BasicPiece(
        new Strings_BasicPieceBuilder(bp.Value.replace(
            /* Batch-eat ASCII characters for efficiency. */
            /[A-Z][\u0000-\u007f]*/g,
            function (x) { return x.toLowerCase(); }
        ))));
    }

    public HandleSpChar(spch: Strings_SpCharPiece): void
    {
        this.Builder.AddSpCharPiece(Strings_SpCharToLowerCase(spch));
    }

    public HandleBraced(braced: Strings_BracedPiece): void
    {
        this.Builder.AddBracedPiece(braced);
    }

    public Finish(): Strings_Literal
    {
        return new Strings_Literal(this.Builder);
    }
}

/**
 * Changes a special character to upper case.
 * LaTeX commands other than `\aa\ae\oe\o\l\i\j\ss`
 * are not affected.
 * `\i`, `\j` and `\ss` are converted to `I`, `J`
 * and `SS`, respectively.
 * 
 * @param spch  The special character.
 * 
 * @returns The special character in upper case.
 */
function Strings_SpCharToUpperCase(
    spch: Strings_SpCharPiece): Strings_SpCharPiece
{
/* Case 1: Lower-case letters (batch-eat non-backslash
 *         ASCII characters for efficiency).
 * Case 2: Convert \aa\ae\oe\o\l.
 * Case 3: Convert \i\j\ss and eat trailing whitespace.
 * Case 4: Convert \i\j\ss without trailing whitespace.
 * Case 5: Other LaTeX commands with alphabetical names.
 * Case 6: LaTeX commands with non-alphabetical names.
 * Case 7: Non-backslash non-lower-case. Keep as-is.
 *         Looking at this token is necessary to
 *         leave the "pasting" state.
 * Others: The only missing case is a trailing slash.
 *         This is OK because its case needn't changed
 *         and we no longer need to maintain "pasting"
 *         state at this point.
 * 
 * It is necessary to separate case 3/4 or the expression
 * becomes even more obscure. It is incorrect to write
 * \\(i|j|ss)[ \t\v\f\r\n]*(?![a-zA-Z]).
 * Write x for the space character. The first token in
 * \ixxy will be \ix instead of \ixx, which leads to
 * the incorrect result "I Y" (or rather, \relax I Y)
 * instead of "IY" (or rather, \relax IY).
 * 
 * Immediately after tokens in case 1/3, the state is
 * said to be "pasting": \i must be converted to " I"
 * and similarly for \j\ss.
 */
    let pasting = false;
    const converted = spch.Value.replace(
/([a-z])[\u0000-\u005b\u005d-\u007f]*|\\(aa|ae|oe|o|l)(?![a-zA-Z])|\\(i|j|ss)[ \t\v\f\r\n]+|\\(i|j|ss)(?![a-zA-Z])|(\\)[a-zA-Z]+\*?|\\[^a-zA-Z]|[^a-z\\]+/g,
        function (match, alpha, spcmd, ijss1, ijss2, pastes)
        {
            const wasPasting = pasting;
            const ijss = ijss1 || ijss2;
            pasting = (spcmd !== undefined || pastes !== undefined);
            return (alpha !== undefined || spcmd !== undefined
                ? match.toUpperCase()
                : ijss !== undefined
                    ? wasPasting
                    ? ' ' + ijss.toUpperCase()
                    : ijss.toUpperCase()
                : match);
        }
    );
    /* E.g., when the special character is {\i},
     * the desired result is {\relax I}.
     * Do the inspection manually and use
     * SpCharPieceBuilder to avoid expensive
     * laundering that would otherwise be
     * performed. */
    return new Strings_SpCharPiece(
        new Strings_SpCharPieceBuilder(
        converted[0] !== '\\'
            ? '\\relax ' + converted
            : converted
    ));
}

class Strings_ToUpperCaseStateMachine
    implements Strings_IChangeCaseStateMachine
{
    private readonly Builder: Strings_LiteralBuilder;

    public constructor()
    {
        this.Builder = new Strings_LiteralBuilder();
    }

    public HandleBasic(bp: Strings_BasicPiece): void
    {
        this.Builder.AddPiece(
            new Strings_BasicPiece(
            new Strings_BasicPieceBuilder(
            bp.Value.replace(
                /* Batch-eat ASCII characters for efficiency. */
                /[a-z][\u0000-\u007f]*/g,
                function (x) { return x.toUpperCase(); }
        ))));
    }

    public HandleSpChar(spch: Strings_SpCharPiece): void
    {
        this.Builder.AddPiece(Strings_SpCharToUpperCase(spch));
    }

    public HandleBraced(braced: Strings_BracedPiece): void
    {
        this.Builder.AddPiece(braced);
    }

    public Finish(): Strings_Literal
    {
        return new Strings_Literal(this.Builder);
    }
}

class Strings_ToTitleCaseStateMachine
    implements Strings_IChangeCaseStateMachine
{
    /* Whether the next character is eligible
     * for case preservation. */
    private Preserving: boolean;
    private readonly Builder: Strings_LiteralBuilder;

    public constructor()
    {
        this.Preserving = true;
        this.Builder = new Strings_LiteralBuilder();
    }

    public HandleBasic(bp: Strings_BasicPiece): void
    {
        let thisPreserving = this.Preserving;
        this.Builder.AddPiece(
            new Strings_BasicPiece(
            new Strings_BasicPieceBuilder(
            bp.Value.replace(
/* Case 1: Upper-case letters (batch-eat non-colon
 *         ASCII characters for efficiency).
 * Case 2: A colon with trailing whitespace.
 * Case 3: A colon without trailing whitespace
 *         (batch-eat non-colon non-uppercase).
 * Case 4: Non-uppercase non-colons.
 *         It is necessary to look at this token
 *         to cancel case preservation for later
 *         characters.
 * 
 * After a token in case 2, the next character is
 * eligible for case preservation. Note that the
 * "Preserving" state must be managed in the object
 * itself because the next character might be a SpCharPiece.
 */
/([A-Z])[\u0000-\u0039\u003b-\u007f]*|(:)[ \t\v\f\r\n]+|:[^A-Z:]*|[^A-Z:]+/g,
            function (match, alpha, colon)
            {
                const wasPreserving = thisPreserving;
                thisPreserving = (colon !== undefined);
                return (alpha !== undefined
                    ? wasPreserving
                        ? match[0] + match.substr(1).toLowerCase()
                        : match.toLowerCase()
                    : match);
            }
        ))));
        this.Preserving = thisPreserving;
    }

    public HandleSpChar(spch: Strings_SpCharPiece): void
    {
        const wasPreserving = this.Preserving;
        this.Preserving = false;
        /* Even if the special character has multiple
         * characters inside, its case is kept as a whole.
         * This is the same as the implementation in BibTeX.
         */
        this.Builder.AddPiece(wasPreserving
            ? spch
            : Strings_SpCharToLowerCase(spch));
    }

    public HandleBraced(braced: Strings_BracedPiece): void
    {
        /* Even if this BracedPiece has length 0 (e.g., {}),
         * the next character will not have its case preserved.
         */
        this.Preserving = false;
        this.Builder.AddPiece(braced);
    }

    public Finish(): Strings_Literal
    {
        return new Strings_Literal(this.Builder);
    }
}

type Strings_TargetCase =
    'L' | 'l' | 'U' | 'u' | 'T' | 't';

/**
 * Change case of a string literal (`change.case$` function).
 * The rule is very complicated:
 * - Usual groups (non-special characters) are not changed.
 * - Inside special characters, LaTeX commands are recognized
 *   and have their cases preserved.
 * - Inside special characters, cases of letters are converted.
 * - Outside special characters, LaTeX commands are not recognized
 *   and might be interpreted as letter, and cases of letters are
 *   converted.
 * - For the title case (`T` or `t`), case is lowered for eligible
 *   letters and case is preserved in the following situations:
 *   - the letter is the first letter; or
 *   - the letter is the first non-whitespace character after
 *     a colon and a whitespace character.
 * - If a brace starts a special character, it does not necessarily
 *   make characters inside it non-initial, e.g., `{\'{E}}cole` will
 *   have its case preserved when converting to the title case.
 * - Inside special characters, LaTeX commands `\AA\AE\OE\O\L` and
 *   `\aa\ae\oe\o\l\i\j\ss` are regarded as letters and are subject
 *   to case conversion.
 * 
 * @remarks The method type checks the input so that it's safe
 *          to be consumed from JavaScript.
 * 
 * @param str    The string literal represented as a `Strings_Literal`.
 * @param casing The target case:
 *               - `L` or `l` for lower case.
 *               - `U` or `u` for upper case.
 *               - `T` or `t` for title case (default).
 * 
 * @returns The string literal with case changed.
 */
function Strings_ChangeCase(str: Strings_Literal,
    casing: Strings_TargetCase): Strings_Literal
{
    if (!(str instanceof Strings_Literal)
        || str.Pieces.length === 0)
    {
        return Strings_Literal.Empty;
    }
    const cssm: Strings_IChangeCaseStateMachine =
        (casing === 'L' || casing === 'l'
            ? new Strings_ToLowerCaseStateMachine()
            : casing === 'U' || casing === 'u'
            ? new Strings_ToUpperCaseStateMachine()
            : new Strings_ToTitleCaseStateMachine());
    for (const piece of str.Pieces)
    {
        if (piece instanceof Strings_BasicPiece)
        {
            cssm.HandleBasic(piece);
        }
        else if (piece instanceof Strings_SpCharPiece)
        {
            cssm.HandleSpChar(piece);
        }
        else
        {
            cssm.HandleBraced(piece);
        }
    }
    return cssm.Finish();
}
