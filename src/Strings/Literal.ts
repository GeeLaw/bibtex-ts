/**
 * An object for efficient construction of `Literal`.
 */
class Strings_LiteralBuilder
{
    public readonly RawPieces: string[];
    public readonly Pieces: Strings_IStringPiece[];
    public Length: number;
    public Case: Case;
    public readonly PurifiedPieces: string[];
    public readonly PurifiedPedanticPieces: string[];
    private LeftoverPiece: Strings_BasicPiece | undefined;
    private LeftoverValue: string[];

    public constructor()
    {
        this.RawPieces = [];
        this.Pieces = [];
        this.Length = 0;
        this.Case = '?';
        this.PurifiedPieces = [];
        this.PurifiedPedanticPieces = [];
        this.LeftoverPiece = undefined;
        this.LeftoverValue = [];
    }

    /**
     * This method is called when constructing a `Literal`.
     * 
     * @returns Whether a piece was pushed.
     */
    public PushLeftover(): boolean
    {
        if (this.LeftoverValue.length === 0)
        {
            return false;
        }
        const newpiece = (this.LeftoverValue.length == 1
            ? this.LeftoverPiece!
            : new Strings_BasicPiece(
                new Strings_BasicPieceBuilder(
                this.LeftoverValue.join(''))));
        this.RawPieces.push(newpiece.Raw);
        this.Pieces.push(newpiece);
        this.Length += newpiece.Length;
        if (this.Case === '?')
        {
            this.Case = newpiece.Case;
        }
        this.PurifiedPieces.push(newpiece.Purified);
        this.PurifiedPedanticPieces.push(newpiece.PurifiedPedantic);
        this.LeftoverPiece = undefined;
        this.LeftoverValue = [];
        return true;
    }

    /**
     * Adds a `BasicPiece` (without type checking).
     * 
     * @param piece The `BasicPiece` to add.
     */
    public AddBasicPiece(piece: Strings_BasicPiece)
    {
        if (piece.Value.length === 0)
        {
            return;
        }
        this.LeftoverPiece = piece;
        this.LeftoverValue.push(piece.Value);
    }

    /**
     * Adds a `SpCharPiece` (without type checking).
     * 
     * @param piece The `SpCharPiece` to add.
     */
    public AddSpCharPiece(piece: Strings_SpCharPiece)
    {
        this.PushLeftover();
        this.RawPieces.push(piece.Raw);
        this.Pieces.push(piece);
        this.Length += piece.Length;
        if (this.Case === '?')
        {
            this.Case = piece.Case;
        }
        this.PurifiedPieces.push(piece.Purified);
        this.PurifiedPedanticPieces.push(piece.PurifiedPedantic);
    }

    /**
     * Adds a `BracedPiece` (without type checking).
     * 
     * @param piece The `BracedPiece` to add.
     */
    public AddBracedPiece(piece: Strings_BracedPiece)
    {
        this.PushLeftover();
        this.RawPieces.push(piece.Raw);
        this.Pieces.push(piece);
        this.Length += piece.Length;
        if (this.Case === '?')
        {
            this.Case = piece.Case;
        }
        this.PurifiedPieces.push(piece.Purified);
        this.PurifiedPedanticPieces.push(piece.PurifiedPedantic);
    }

    /**
     * Adds a piece **with** type checking.
     * 
     * @param piece The piece to add.
     * 
     * @returns Whether the `piece` was added.
     */
    public AddPiece(piece: Strings_IStringPiece): boolean
    {
        if (piece instanceof Strings_BasicPiece)
        {
            this.AddBasicPiece(piece);
            return true;
        }
        if (piece instanceof Strings_SpCharPiece)
        {
            this.AddSpCharPiece(piece);
            return true;
        }
        if (piece instanceof Strings_BracedPiece)
        {
            this.AddBracedPiece(piece);
            return true;
        }
        return false;
    }

}

/**
 * Represents a BibTeX string.
 */
class Strings_Literal
{
    /**
     * Gets the raw string, which can be parsed into this instance.
     */
    public readonly Raw: string;

    /**
     * The pieces of this string, consisting of
     * `BasicPiece`s, `SpCharPiece`s and `BracedPiece`s.
     * It is guaranteed to not have empty `BasicPiece`s
     * or consecutive `BasicPiece`s.
     */
    public readonly Pieces: Strings_IStringPiece[];

    /**
     * Gets the length of this `Literal`,
     * as defined by BST function `text.length$`.
     */
    public readonly Length: number;

    /**
     * The case of this string as a word (`U` or `l` or `?`).
     * Consider the first alphabetical character
     * that is in a `BasicPiece` or the first
     * non-LaTeX command alphabetical character
     * or `\i\j\o\O\l\L\oe\OE\ae\AE\aa\AA\ss`
     * that is in a `SpCharPiece`. Its case
     * determines the case of this word.
     */
    public readonly Case: Case;

    /**
     * The purified form (BST `purify$` function).
     */
    public readonly Purified: string;

    /**
     * `Purified` with non-ASCII characters
     * also removed.
     */
    public readonly PurifiedPedantic: string;

    /**
     * Initializes a `Literal` instance.
     * The instance is immediately deeply frozen.
     * If `pieces` is not `LiteralBuilder`,
     * a builder is created to sanitized the pieces.
     * 
     * @param pieces An array of pieces or a `LiteralBuilder`.
     */
    public constructor(pieces?:
        Strings_IStringPiece[] | Strings_LiteralBuilder)
    {
        if (!(pieces instanceof Strings_LiteralBuilder))
        {
            pieces = Strings_LaunderPieces(pieces);
        }
        pieces.PushLeftover();
        this.Raw = pieces.RawPieces.join('');
        this.Pieces = pieces.Pieces;
        this.Length = pieces.Length;
        this.Case = pieces.Case;
        this.Purified = pieces.PurifiedPieces.join('');
        this.PurifiedPedantic = pieces.PurifiedPedanticPieces.join('');
        Helper.FreezeObject(this.Pieces);
        Helper.FreezeObject(this);
    }

    /**
     * A canonical instance of an empty `Literal`.
     */
    public static readonly Empty = new Strings_Literal();
    
    /**
     * Concatenates several `Literal`s.
     * 
     * @param summands An array of `Literal`s.
     * @returns The concatenated `Literal`.
     */
    public static Concat(
        summands: Strings_Literal[]): Strings_Literal
    {
        if (!(summands instanceof Array)
            || summands.length === 0)
        {
            return Strings_Literal.Empty;
        }
        if (summands.length === 1)
        {
            const summand = summands[0];
            return (summand instanceof Strings_Literal
                ? summand
                : Strings_Literal.Empty);
        }
        const builder = new Strings_LiteralBuilder();
        for (const item of summands)
        {
            if (item instanceof Strings_Literal)
            {
                for (const piece of item.Pieces)
                {
                    builder.AddPiece(piece);
                }
            }
        }
        return new Strings_Literal(builder);
    }

    /**
     * Converts `this` to upper case (BST `change.case$` function).
     * The object itself is not modified (it's immutable), instead
     * the changed copy is returned.
     * 
     * @remarks `BracedPiece`s are never changed, so `{iP}hone`,
     *          when converted to upper case, becomes `{iP}HONE`.
     *          However, `SpCharPiece`s are subject to conversion,
     *          e.g., `{\H\i}` becomes `{\H I}`.
     * 
     * @returns The `Literal` in upper case.
     */
    public ToUpperCase(): Strings_Literal
    {
        return Strings_ChangeCase(this, 'U');
    }

    /**
     * Converts `this` to lower case (BST `change.case$` function).
     * The object itself is not modified (it's immutable), instead
     * the changed copy is returned.
     * 
     * @remarks `BracedPiece`s are never changed, so `Hello, {J}ohn`,
     *          when converted to lower case, becomes `hello, {J}ohn`.
     *          However, `SpCharPiece`s are subject to conversion,
     *          e.g., `{\relax Ch}ristopher` is converted to
     *          `{\relax ch}ristopher`.
     * 
     * @returns The `Literal` in lower case.
     */
    public ToLowerCase(): Strings_Literal
    {
        return Strings_ChangeCase(this, 'L');
    }

    /**
     * Converts `this` to title case (BST `change.case$` function).
     * The object itself is not modified (it's immutable), instead
     * the changed copy is returned.
     * 
     * @remarks The first character and the first character after
     *          a colon with more than 1 whitespace characters
     *          will have their cases preserved, and all other
     *          characters will have their case lowered.
     *          If a `SpCharPiece` is subject to case preservation,
     *          the procedure does **not** look inside the piece.
     *          Moreover, `BracedPiece`s are never converted.
     *          E.g., `My Best {F}riend: {\'EM}iLiE` becomes
     *          `My best {F}riend: {\'EM}ilie`.
     * 
     * @returns The `Literal` in title case.
     */
    public ToTitleCase(): Strings_Literal
    {
        return Strings_ChangeCase(this, 'T');
    }

    /**
     * Converts `this` to the specified case (BST `change.case$` function).
     * See `ToUpperCase`, `ToLowerCase` and `ToTitleCase` methods.
     * 
     * @param casing Indicates what case is desired:
     *               - `U` or `u` for upper case.
     *               - `L` or `l` for lower case.
     *               - `T` or `t` or anything else for title case.
     */
    public ToCase(casing: Strings_TargetCase): Strings_Literal
    {
        return Strings_ChangeCase(this, casing);
    }

    /**
     * Computes the prefix of this `Literal` (BST `text.prefix$`
     * function), counting each character in `BasicPiece`s as
     * one, each `SpCharPiece` as one (no matter how many actual
     * characters it has), and each non-brace characters in
     * `BracedPiece`s as one. If a `BracedPiece` is truncated,
     * its braces will be rebalanced.
     * 
     * @param len The (maximum) length of the prefix.
     * 
     * @returns The prefix.
     */
    public Prefix(len: number): Strings_Literal
    {
        len = (len || 0) >>> 0;
        return Strings_TextPrefix(this, len);
    }

    /**
     * Same as `Prefix` method, except it directly
     * computes the `Raw` value of that prefix.
     * Better performance if the structured form
     * is no longer needed after extraction of
     * the prefix.
     * 
     * @param len The (maximum) length of the prefix.
     * 
     * @returns The prefix's `Raw` property.
     */
    public PrefixRaw(len: number): string
    {
        len = (len || 0) >>> 0;
        return Strings_TextPrefixRaw(this, len);
    }

    /**
     * Determines whether the `Literal` ends
     * with a period, an exclamation mark or
     * a question mark (criterion for period
     * appending in BST `add.period$` function).
     * 
     * @remarks BibTeX doesn't consider `.{}` or
     * `{.{}}` as ending with a period. In other
     * words, the literal ends with a period if
     * and only if it ends with period and zero
     * or more consecutive closing braces.
     */
    public IsCompleteSentence(): boolean
    {
        /* Question: Is the runtime clever
         * enough to match backwards? */
        return /[.?!][}]*$/.test(this.Raw);
    }

}
