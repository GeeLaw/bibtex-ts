/**
 * Represents an error in `Strings.Parse`.
 */
type Strings_ParseLiteralError = 0 | 1 | 2;

/**
 * Represents a parsing result.
 */
class Strings_ParseLiteralResult
{
    public readonly Text: string;
    public readonly ErrorPos: number;
    public readonly ErrorCode: Strings_ParseLiteralError;
    public readonly Result: Strings_Literal;

    /**
     * Consumers: Do not use this constructor.
     */
    public constructor(text: string,
        errpos: number, errno: Strings_ParseLiteralError,
        result: Strings_Literal)
    {
        this.Text = text;
        this.ErrorPos = errpos;
        this.ErrorCode = errno;
        this.Result = result;
        Helper.FreezeObject(this);
    }

    public static readonly ERROR_SUCCESS = 0;
    public static readonly ERROR_CLOSING_BRACE = 1;
    public static readonly ERROR_UNCLOSED_BRACE = 2;

    public static readonly ErrorMessages =
[
'BibTeX.ParseString: Operation completed successfullly.',
'BibTeX.ParseString: Outstanding closing brace.',
'BibTeX.ParseString: Unclosed brace (end of string).'
];
}

/**
 * Parses a string into `Literal`.
 * 
 * @param text  The string to be parsed.
 * 
 * @returns A result object.
 */
function Strings_ParseLiteral(text: string): Strings_ParseLiteralResult
{
    text = '' + (text || '');
    const builder = new Strings_LiteralBuilder();
    let depth = 0, beginpos = 0, errpos = -1;
    let token: string[] | null = null;
    const rgx: RegExp = /([^{}]*)([{}])/g;
    while (token = rgx.exec(text))
    {
        if (token[2] === '{')
        {
            /* A possible BasicPiece ends.
             * SpChar or Braced begins. */
            if (depth++ === 0)
            {
                const content = token[1];
                if (content.length !== 0)
                {
                    builder.AddBasicPiece(
                    new Strings_BasicPiece(
                    new Strings_BasicPieceBuilder(
                        content
                    )));
                }
                beginpos = rgx.lastIndex;
            }
            continue;
        }
        /* This is an unpaired '}'.
         * Recover by pretending there were a '{'
         * immediately before this '}'. */
        if (depth === 0)
        {
            const content = token[1];
            /* A virtual BracePiece is inserted so
             * beginpos must point to the character
             * after this '}'. */
            beginpos = rgx.lastIndex;
            errpos = (errpos === -1 ? beginpos - 1 : errpos);
            if (content.length !== 0)
            {
                builder.AddBasicPiece(
                new Strings_BasicPiece(
                new Strings_BasicPieceBuilder(
                    content
                )));
            }
            /* The {} becomes an empty BracedPiece. */
            builder.AddBracedPiece(Strings_BracedPiece.Empty);
            continue;
        }
        /* Depth decreases without closing the
         * current SpCharPiece or BracedPiece. */
        if (--depth !== 0)
        {
            continue;
        }
        /* SpCharPiece or BracedPiece ends. */
        const content = text.substr(beginpos,
            rgx.lastIndex - 1 - beginpos);
        /* Need to track beginpos for a possible trailing
         * BasicPiece, because the trailing piece is not
         * processed by the loop. */
        beginpos = rgx.lastIndex;
        if (content[0] === '\\')
        {
            builder.AddSpCharPiece(
            new Strings_SpCharPiece(
            new Strings_SpCharPieceBuilder(
                content
            )));
        }
        else
        {
            builder.AddBracedPiece(
            new Strings_BracedPiece(
            new Strings_BracedPieceBuilder(
                content
            )));
        }
    }
    /* Process the possible trailing piece.
     * Decrease depth for later convenience.
     */
    if (depth-- === 0)
    {
        if (beginpos !== text.length)
        {
            builder.AddBasicPiece(
            new Strings_BasicPiece(
            new Strings_BasicPieceBuilder(
                text.substr(beginpos)
            )));
        }
        /* Report the first error. */
        return new Strings_ParseLiteralResult(
            text,
            errpos === -1 ? text.length : errpos,
            errpos === -1
            ? Strings_ParseLiteralResult.ERROR_SUCCESS
            : Strings_ParseLiteralResult.ERROR_CLOSING_BRACE,
            new Strings_Literal(builder)
        );
    }
    /* Unclosed '{'. Remember depth has decreased by 1.
     * Recover by appending (depth + 1) closing braces
     * (for Raw), so it's depth closing braces for Value.
     */
    const content = text.substr(beginpos) +
        Helper.RepeatString('}', depth);
    if (content[0] === '\\')
    {
        builder.AddSpCharPiece(
        new Strings_SpCharPiece(
        new Strings_SpCharPieceBuilder(
            content
        )));
    }
    else
    {
        builder.AddBracedPiece(
        new Strings_BracedPiece(
        new Strings_BracedPieceBuilder(
            content
        )));
    }
    /* Report the first error. */
    return new Strings_ParseLiteralResult(
        text, errpos === -1 ? text.length : errpos,
        errpos === -1
        ? Strings_ParseLiteralResult.ERROR_UNCLOSED_BRACE
        : Strings_ParseLiteralResult.ERROR_CLOSING_BRACE,
        new Strings_Literal(builder)
    );
}
