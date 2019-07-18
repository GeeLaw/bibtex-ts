/**
 * Parses an entry.
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
 *          character after the entry's body.
 *          Duplicate field name is a recoverable error and will
 *          not be reported as failure, and the first field value
 *          is kept.
 *          Missing entry id is a recoverable error and will not
 *          be reported as failure. Instead, the part will be
 *          interpreted as a field.
 */
function ParseEntry(type: string,
    text: string, pos: number,
    result: ParsingResult, ret: any): number
{
    ret.error = true;
    const enclosure = Helper.NewEmptyObject();
    pos = ParseEntryEnclosing(text, pos, result, enclosure);
    if (enclosure.error)
    {
        return pos;
    }
    /* Extract the entry citation key. */
    const posIdAttempt = pos;
    const entryId = Helper.NewEmptyObject();
    pos = ParseEntryId(text, posIdAttempt, result, entryId);
    if (entryId.error)
    {
        return pos;
    }
    /* Some sources produce entries without a key.
    ** This is just a small attempt to recover from that.
    ** However, this is not a "supported" scenario, so
    ** no serious attempt is made to understand an
    ** otherwise malformed entry. */
    let commaOrClosing = CheckChar(text, pos, result,
        ',' + '=' + enclosure.closing,
        enclosure.expectingCommaClosing);
    if (commaOrClosing === undefined)
    {
        return pos;
    }
    /* This is a field, not the citation key. */
    if (commaOrClosing === '=' && /^[a-zA-Z]*$/.test(entryId.value))
    {
        entryId.value = '';
        result.ParsingErrors.push(new ParsingError(
            ParsingErrorCodes_NoEntryId,
            posIdAttempt
        ));
        commaOrClosing = ',';
        /* After this, we will always do EatWhitespace(text, pos + 1).
        ** So offset the position by -1. */
        pos = posIdAttempt - 1;
    }
    const entry = new Entry(type, entryId.value);
    /* Loop is skipped e.g. when @type{key}. */
    while (commaOrClosing === ',')
    {
        pos = EatWhitespace(text, pos + 1);
        /* After a comma, text[pos] can be
        ** FieldName or closing delimiter. */
        if (text[pos] === enclosure.closing)
        {
            break;
        }
        /* Get field name. */
        const posField = pos;
        const fieldId = Helper.NewEmptyObject();
        pos = ParseFieldId(text, pos, result, fieldId);
        if (fieldId.error)
        {
            return pos;
        }
        /* Eat '='. */
        if ('=' !== CheckChar(text, pos, result,
            '=', ParsingErrorCodes_ExpectingEqualSign))
        {
            return pos;
        }
        pos = EatWhitespace(text, pos + 1);
        /* Get StringConcat. */
        const fieldVal = Helper.NewEmptyObject();
        pos = ParseStringConcat(text, pos, result, fieldVal);
        if (fieldVal.error)
        {
            return pos;
        }
        /* CheckChar is called on the next round or before return. */
        commaOrClosing = CheckChar(text, pos, result,
            ',' + enclosure.closing, enclosure.expectingPoundCommaClosing);
        if (commaOrClosing === undefined)
        {
            return pos;
        }
        /* Is it a duplicate field? */
        if (fieldId.value in entry.Fields)
        {
            result.ParsingErrors.push(new ParsingError(
                ParsingErrorCodes_DuplicateFieldId,
                posField
            ));
        }
        else
        {
            entry.Fields[fieldId.value] = fieldVal.value;
        }
        /* Loop continues if it's a comma. */
    }
    ret.error = false;
    ret.value = Helper.FreezeDescendants(entry);
    return EatWhitespace(text, pos + 1);
}

ExportBibTeX._Privates.ParseEntry = ParseEntry;
