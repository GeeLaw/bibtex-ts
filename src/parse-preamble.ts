/**
 * Parses a `preamble` command.
 * 
 * @param text   The full text.
 * @param pos    The position to start.
 *               It should point to `(` or `{`.
 * @param result The `ParsingResult` object.
 * @param ret    Used to receive non-position results.
 * 
 * @returns The new position.
 *          If `ret.error`, it's the suggested recovery position.
 *          Otherwise, it's the first non-whitespace character
 *          after the `preamble` command, and `ret.value` stores
 *          the result `StringConcat`.
 */
function ParsePreamble(text: string, pos: number,
    result: ParsingResult, ret: any): number
{
    ret.error = true;
    const enclosure = Helper.NewEmptyObject();
    pos = ParseEntryEnclosing(text, pos, result, enclosure);
    if (enclosure.error)
    {
        return pos;
    }
    const strcon = Helper.NewEmptyObject();
    pos = ParseStringConcat(text, pos, result, strcon);
    if (strcon.error ||
        enclosure.closing !== CheckChar(text, pos, result,
        enclosure.closing, enclosure.expectingPoundClosing))
    {
        return pos;
    }
    ret.error = false;
    ret.value = strcon.value;
    return EatWhitespace(text, pos + 1);
}

ExportBibTeX._Privates.ParsePreamble = ParsePreamble;
