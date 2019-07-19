type ObjectModel_IPersonNameToken =
    ObjectModel_PersonNameTokenComma |
    ObjectModel_PersonNameTokenAnd |
    ObjectModel_PersonNameTokenLink |
    ObjectModel_PersonNameTokenWord;


class ObjectModel_PersonNameTokenComma
{
    private constructor()
    {
        Helper.FreezeObject(this);
    }

    public static readonly Instance =
        new ObjectModel_PersonNameTokenComma();
}

class ObjectModel_PersonNameTokenAnd
{
    private constructor()
    {
        Helper.FreezeObject(this);
    }

    public static readonly Instance =
        new ObjectModel_PersonNameTokenAnd();
}

class ObjectModel_PersonNameTokenLink
{
    public readonly Link: ObjectModel_PersonNameLink;
    public readonly Verbatim: string;

    public constructor(link: ObjectModel_PersonNameLink,
        verbatim: string)
    {
        this.Link = link;
        this.Verbatim = verbatim;
        Helper.FreezeObject(this);
    }
}

class ObjectModel_PersonNameTokenWord
{
    public readonly Value: Strings_Literal;

    public constructor(value: Strings_Literal)
    {
        this.Value = value;
        Helper.FreezeObject(this);
    }
}

function ObjectModel_GetPersonNameTokens(
    names: Strings_Literal): ObjectModel_IPersonNameToken[]
{
    const results: ObjectModel_IPersonNameToken[] = [];
    let builder = new Strings_LiteralBuilder();
    const rgxWhitespace = /[ \t\v\r\n]/;
    /**
     * Case 1: a comma
     * Case 2: a link
     * Case 3: a word
     */
    const rgx =
/(,)|([ \t\v\r\n~-])[ \t\v\r\n~-]*|[^, \t\v\r\n~-]+/g;
    /* used to track whether the current "and" is a keyword
     * or a normal word */
    let sawWhitespace = false;
    let wordPending = false;
    for (const piece of names.Pieces)
    {
        if (piece instanceof Strings_SpCharPiece)
        {
            sawWhitespace = false;
            wordPending = true;
            builder.AddSpCharPiece(piece);
            continue;
        }
        if (piece instanceof Strings_BracedPiece)
        {
            sawWhitespace = false;
            wordPending = true;
            builder.AddBracedPiece(piece);
            continue;
        }
        /* piece is a BasicPiece */
        const text = piece.Value;
        let token: string[] | null = null;
        while (token = rgx.exec(text))
        {
            if (token[1] !== undefined)
            {
                sawWhitespace = false;
                if (wordPending)
                {
                    results.push(new ObjectModel_PersonNameTokenWord(
                        new Strings_Literal(builder)));
                    builder = new Strings_LiteralBuilder();
                    wordPending = false;
                }
                results.push(
                    ObjectModel_PersonNameTokenComma.Instance);
                continue;
            }
            const link = token[2];
            if (link !== undefined)
            {
                const verbatim = token[0];
                sawWhitespace =
                    rgxWhitespace.test(verbatim[verbatim.length - 1]);
                if (wordPending)
                {
                    results.push(new ObjectModel_PersonNameTokenWord(
                        new Strings_Literal(builder)));
                    builder = new Strings_LiteralBuilder();
                    wordPending = false;
                }
                results.push(new ObjectModel_PersonNameTokenLink(
                    link === '-' ? '-' : '~',
                    verbatim));
                continue;
            }
            /* it's a word */
            const word = token[0];
            /* wordInProgress and sawWhitespace are mutually exclusive.
             * Note that in "A and", the "and" is considered as
             * a last name by BibTeX.
             * This handling unifies the case when there is another
             * piece after this BasicPiece, e.g., "A and{x}" will
             * be correctly handled.
             * However, the behavior on these edge cases shouldn't
             * be relied upon.
             */
            if (word === 'and'
                && sawWhitespace /* can't ba part of a larger word */
                /* there is a space after this "and" */
                && rgxWhitespace.test(text[rgx.lastIndex] || 'x'))
            {
                results.push(
                    ObjectModel_PersonNameTokenAnd.Instance);
                continue;
            }
            sawWhitespace = false;
            wordPending = true;
            builder.AddBasicPiece(
            new Strings_BasicPiece(
            new Strings_BasicPieceBuilder(
                word
            )));
        }
    }
    if (wordPending)
    {
        results.push(new ObjectModel_PersonNameTokenWord(
            new Strings_Literal(builder)));
    }
    return results;
}
