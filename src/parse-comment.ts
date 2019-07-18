/**
 * Eats a `comment` command.
 * Note that there is no `ret` parameter!
 * 
 * @param text   The full text.
 * @param pos    The position to start.
 *               It should point to `(` or `{`.
 * @param result The `ParsingResult` object.
 * 
 * @returns The new position.
 *          If an error occurred, it's the suggested recovery.
 *          Otherwise, it's the first non-whitespace character
 *          after the `comment` command's body.
 */
function ParseComment(text: string, pos: number,
    result: ParsingResult): number
{
    const enclosure = Helper.NewEmptyObject();
    pos = ParseEntryEnclosing(text, pos, result, enclosure);
    if (enclosure.error)
    {
        return pos;
    }
    return ParseGroupedString(text, pos,
        result, Helper.NewEmptyObject(),
        enclosure.closing,
        enclosure.opening === ')'
        ? ParsingErrorCodes_IncompleteCommentInParen
        : ParsingErrorCodes_IncompleteCommentInBraces);
}

ExportBibTeX._Privates.ParseComment = ParseComment;
