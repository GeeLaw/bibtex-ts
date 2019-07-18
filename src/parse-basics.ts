/**
 * Parses a BibTeX string.
 * 
 * @remarks The method type checks the input so that
 * it's safe to be consumed from JavaScript.
 * 
 * @param text The string to parse.
 */
function Parse(text: string): ParsingResult
{
    text = '' + (text || '');
    text = text.replace(/\r\n|\r/g, '\n');
    const result = new ParsingResult();
    const preamble: StringConcat[] = [];
    const namedstrs: { [id: string]: StringConcat | undefined } =
        Helper.NewEmptyObject();
    const entryKeys: { [id: string]: boolean | undefined } =
        Helper.NewEmptyObject();
    let ret: any = undefined;
    result._Privates.NamedStrings = namedstrs;
    for (let pos = ParseTypeId(text, 0, result,
            ret = Helper.NewEmptyObject());
        !ret.error;
        pos = ParseTypeId(text, pos, result,
            ret = Helper.NewEmptyObject()))
    {
        if (ret.value === 'comment')
        {
            pos = ParseComment(text, pos, result);
        }
        else if (ret.value === 'preamble')
        {
            pos = ParsePreamble(text, pos, result,
                ret = Helper.NewEmptyObject());
            if (!ret.error)
            {
                preamble.push(ret.value);
            }
        }
        else if (ret.value === 'string')
        {
            const posString = pos;
            pos = ParseStringDefinition(text, pos, result,
                ret = Helper.NewEmptyObject());
            if (!ret.error)
            {
                if (ret.strid in namedstrs)
                {
                    result.ParsingErrors.push(new ParsingError(
                        ParsingErrorCodes_DuplicateStringId,
                        posString
                    ));
                }
                namedstrs[ret.strid] = ret.value;
            }
        }
        else
        {
            const entryType = ret.value;
            const posEntry = pos;
            pos = ParseEntry(entryType, text, pos,
                result, ret = Helper.NewEmptyObject());
            if (!ret.error)
            {
                if (ret.value.Id !== '' && entryKeys[ret.value.Id])
                {
                    result.ParsingErrors.push(new ParsingError(
                        ParsingErrorCodes_DuplicateEntryId,
                        posEntry
                    ));
                }
                else
                {
                    entryKeys[ret.value.Id] = true;
                    result.Entries.push(ret.value);
                }
            }
        }
    }
    result.Preamble = StringConcat.Concat(preamble);
    Helper.FreezeDescendants(result);
    return Helper.FreezeObject(result);
}

/**
 * Eats the prefix that follows `pattern`.
 * 
 * @param pattern The pattern to eat.
 * @param text    The full text.
 * @param pos     The position to start.
 * 
 * @returns The new position `qos` >= `pos`
 *          s.t. `text[i]` matches `pattern` for all
 *               `pos` <= `i` < `qos`.
 */
function Eat(pattern: RegExp, text: string, pos: number): number
{
    for (let chr = text[pos];
        chr !== undefined && pattern.test(chr);
        chr = text[++pos])
        ;
    return pos;
}

type EatMethod = (text: string, pos: number) => number;

/**
 * Eats the whitespace characters. See `Eat`.
 */
const EatWhitespace: EatMethod = Eat.bind(Eat, /[ \t\v\n]/);
/**
 * Eats until an `@` symbol is encountered. See `Eat`.
 */
const EatNonAt: EatMethod = Eat.bind(Eat, /[^@]/);
/**
 * Eats ASCII letters. See `Eat`.
 */
const EatAsciiAlpha: EatMethod = Eat.bind(Eat, /[a-zA-Z]/);

/**
 * Checks whether `text[pos]` is one of the allowed characters.
 * If not, append a parsing error.
 * 
 * @param text    The full text.
 * @param pos     The position to examine.
 * @param result  The `ParsingResult` object.
 * @param allowed The allowed characters.
 * @param errcode The error code if the character doesn't match.
 * 
 * @returns The character `text[pos]` (if it is allowed)
 *          or `undefined` (otherwise).
 */
function CheckChar(text: string, pos: number,
    result: ParsingResult,
    allowed: string, errcode: number): string | undefined
{
    const chr = text[pos];
    if (chr !== undefined && allowed.indexOf(chr) >= 0)
    {
        return chr;
    }
    result.ParsingErrors.push(new ParsingError(errcode, pos));
    return undefined;
}

/**
 * Parses an entry-enclosure delimiter and returns the delimitation information.
 * 
 * @param text   The full text.
 * @param pos    The position to start (whitespace must have been eaten).
 *               If `text[pos]` is `(`, the enclosure is parenthesis-delimited.
 *               If `text[pos]` is `{`, the enclosure is brace-delimited.
 * @param result The `ParsingResult` object.
 * @param ret    Used to receive non-position results.
 * 
 * @returns The new position.
 *          If `ret.error`, `text[pos]` doesn't start an enclosure (for entry
 *          or `comment/preamble/string` command), and the old position is
 *          returned.
 *          Otherwise, the position of the first non-whitespace character
 *          after the opening delimiter is returned. Moreover, `ret` will
 *          have the following fields:
 *          - `opening` is `text[pos]`
 *          - `closing` is the closing delimiter
 *          - `expectingClosing`, `expectingPoundClosing`,
 *            `expectingCommaClosing`, `expectingPoundCommaClosing`
 *            are the error codes for the enclosure delimiter pair.
 */
function ParseEntryEnclosing(text: string, pos: number,
    result: ParsingResult, ret: any): number
{
    ret.error = true;
    const chr = text[pos];
    if (chr === '(')
    {
        ret.error = false;
        ret.opening = '(';
        ret.closing = ')';
        ret.expectingClosing =
            ParsingErrorCodes_ExpectingRightParen;
        ret.expectingPoundClosing =
            ParsingErrorCodes_ExpectingConcatOrRightParen;
        ret.expectingCommaClosing =
            ParsingErrorCodes_ExpectingCommaOrRightParen;
        ret.expectingPoundCommaClosing =
            ParsingErrorCodes_ExpectingConcatOrCommaOrRightParen;
        return EatWhitespace(text, pos + 1);
    }
    if (chr === '{')
    {
        ret.error = false;
        ret.opening = '{';
        ret.closing = '}';
        ret.expectingClosing =
            ParsingErrorCodes_ExpectingRightBrace;
        ret.expectingPoundClosing =
            ParsingErrorCodes_ExpectingConcatOrRightBrace;
        ret.expectingCommaClosing =
            ParsingErrorCodes_ExpectingCommaOrRightBrace;
        ret.expectingPoundCommaClosing =
            ParsingErrorCodes_ExpectingConcatOrCommaOrRightBrace;
        return EatWhitespace(text, pos + 1);
    }
    result.ParsingErrors.push(new ParsingError(
        ParsingErrorCodes_ExpectingLeftParenOrLeftBrace,
        pos
    ));
    return pos;
}

ExportBibTeX.Parse = Parse;
ExportBibTeX._Privates.Eat = Eat;
ExportBibTeX._Privates.EatWhitespace = EatWhitespace;
ExportBibTeX._Privates.EatNonAt = EatNonAt;
ExportBibTeX._Privates.EatAsciiAlpha = EatAsciiAlpha;
ExportBibTeX._Privates.CheckChar = CheckChar;
ExportBibTeX._Privates.ParseEntryEnclosing = ParseEntryEnclosing;
