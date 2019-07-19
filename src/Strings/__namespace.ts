type Case = 'U' | 'l' | '?';

interface Strings_IStringPiece
{
    /**
     * The raw form of this `IStringPiece`.
     */
    readonly Raw: string;

    /**
     * The value of this `IStringPiece`.
     */
    readonly Value: string;

    /**
     * The length (BST `text.length$` function).
     */
    readonly Length: number;

    /**
     * The case of this `IStringPiece`, can be
     * `U` or `l` or `?`.
     */
    readonly Case: Case;

    /**
     * The purified version (BST `purify$` function
     * but does not remove non-ASCII characters).
     */
    readonly Purified: string;

    /**
     * The purified version (BST `purify$` function).
     * `Purified` with non-ASCII characters also removed.
     */
    readonly PurifiedPedantic: string;
}

function Strings_BalanceBraces(value?: string): string
{
    value = '' + (value || '');
    let depth = 0;
    value = value.replace(/([^{}]*)([{}])|[^{}]+$/g,
        function (match, nonbrace, brace)
        {
            /* Depth increases, no replacement. */
            if (brace === '{')
            {
                ++depth;
                return match;
            }
            /* Trailing part without braces.
             * Note that at this point, the braces might
             * be unbalanced. This is handled later. */
            if (brace !== '}')
            {
                return match;
            }
            /* Unpaired '}', e.g., in '{}}',
             * prepend a '{' immediately before
             * this brace to rebalance it. */
            if (depth === 0)
            {
                return nonbrace + '{}';
            }
            /* Depth decreases, no replacement. */
            --depth;
            return match;
        });
    return value + Helper.RepeatString('}', depth);
}

function Strings_LaunderPieces(pieces?:
    Strings_IStringPiece[]): Strings_LiteralBuilder
{
    const builder = new Strings_LiteralBuilder();
    if (!(pieces instanceof Array)
        || pieces.length === 0)
    {
        return builder;
    }
    for (const piece of pieces)
    {
        builder.AddPiece(piece);
    }
    return builder;
}

ExportBibTeX.Strings = (function (ns: any): any
{
ns.BasicPiece = Strings_BasicPiece;
ns.SpCharPiece = Strings_SpCharPiece;
ns.BracedPiece = Strings_BracedPiece;

ns.Literal = Strings_Literal;
ns.ParseLiteralResult = Strings_ParseLiteralResult;

return ns;
})(Helper.NewEmptyObject());

ExportBibTeX._Privates.Strings = (function (ns: any): any
{

ns.BasicPieceBuilder = Strings_BasicPieceBuilder;
ns.BalanceBraces = Strings_BalanceBraces;
ns.BasicPiece = Strings_BasicPiece;

ns.SpCharPieceBuilder = Strings_SpCharPieceBuilder;
ns.SpCharPiece = Strings_SpCharPiece;
ns.BracedPieceBuilder = Strings_BracedPieceBuilder;
ns.BracedPiece = Strings_BracedPiece;

ns.LiteralBuilder = Strings_LiteralBuilder;
ns.LaunderPieces = Strings_LaunderPieces;
ns.Literal = Strings_Literal;

ns.ParseLiteralResult = Strings_ParseLiteralResult;
ns.ParseLiteral = Strings_ParseLiteral;

ns.SpCharToLowerCase = Strings_SpCharToLowerCase;
ns.ToLowerCaseStateMachine = Strings_ToLowerCaseStateMachine;
ns.SpCharToUpperCase = Strings_SpCharToUpperCase;
ns.ToUpperCaseStateMachine = Strings_ToUpperCaseStateMachine;
ns.ToTitleCaseStateMachine = Strings_ToTitleCaseStateMachine;
ns.ChangeCase = Strings_ChangeCase;

ns.TextPrefix = Strings_TextPrefix;
ns.TextPrefixRaw = Strings_TextPrefixRaw;

return ns;
})(Helper.NewEmptyObject());

ExportBibTeX.ParseLiteral = Strings_ParseLiteral;
