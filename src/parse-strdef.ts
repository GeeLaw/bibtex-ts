/**
 * Parses a `string` command.
 * 
 * @param text   The full text.
 * @param pos    The position to start.
 *               It should point to `(` or `{`.
 * @param result The `ParsingResult` object.
 * @param ret    Used to receive non-position results.
 * 
 * @returns The new position.
 *          If `ret.error`, it's the suggested recovery position.
 *          Otherwise, it points to the first non-whitespace
 *          character after `@string` command's body, and
 *          `ret.strid` stores the identifier in lowercase
 *          and `ret.value` stores the `StringConcat`.
 */
function ParseStringDefinition(text: string, pos: number,
    result: ParsingResult, ret: any): number
{
    ret.error = true;
    const enclosure = Helper.NewEmptyObject();
    pos = ParseEntryEnclosing(text, pos, result, enclosure);
    if (enclosure.error)
    {
        return pos;
    }
    const strid = Helper.NewEmptyObject();
    pos = ParseStringId(text, pos, result, strid);
    if (strid.error)
    {
        return pos;
    }
    if ('=' !== CheckChar(text, pos, result,
        '=', ParsingErrorCodes_ExpectingEqualSign))
    {
        return pos;
    }
    pos = EatWhitespace(text, pos + 1);
    const strval = Helper.NewEmptyObject();
    pos = ParseStringConcat(text, pos, result, strval);
    if (strval.error ||
        enclosure.closing !== CheckChar(text, pos, result,
        enclosure.closing, enclosure.expectingPoundClosing))
    {
        return pos;
    }
    ret.error = false;
    ret.strid = strid.value;
    ret.value = strval.value;
    return EatWhitespace(text, pos + 1);
}

ExportBibTeX._Privates.ParseStringDefinition = ParseStringDefinition;
