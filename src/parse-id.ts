/**
 * Parses a type identifier.
 * 
 * @param text   The full text.
 * @param pos    The position to start. It can be any position,
 *               including the suggested origin of error recovery.
 * @param result The `ParsingResult` object.
 * @param ret    Used to receive non-position results.
 * 
 * @returns The new position.
 *          If `ret.error`, there is no more valid type identifiers
 *          and the returned position is past-the-end.
 *          Otherwise, the returned position points to the first
 *          non-whitespace character after the parsed type identifier.
 *          The type identifier is stored in `ret.value` in lowercase.
 */
function ParseTypeId(
    text: string, pos: number,
    result: ParsingResult, ret: any): number
{
    ret.error = true;
    while (true)
    {
        pos = EatNonAt(text, pos);
        /* End of string */
        if (text[pos] !== '@')
        {
            return pos;
        }
        /* Try to see if there's a type identifier */
        const typeStartsAt = EatWhitespace(text, pos + 1);
        if (text[pos] === undefined) /* hanging @ */
        {
            result.ParsingErrors.push(new ParsingError(
                ParsingErrorCodes_ExpectingTypeId,
                pos /* pos points to '@' now */
            ));
        }
        pos = EatAsciiAlpha(text, typeStartsAt);
        /* The first non-whitespace character after @ is not a letter */
        if (pos === typeStartsAt)
        {
            result.ParsingErrors.push(new ParsingError(
                ParsingErrorCodes_TypeIdMustStartWithLetter,
                pos
            ));
            /* Treat as comment to recover.
            ** In case this character is '@', it will
            ** be a candidate for a new entry.
            */
            continue;
        }
        /* A type identifier was extracted */
        ret.error = false;
        ret.value =
            text.substr(typeStartsAt, pos - typeStartsAt).toLowerCase();
        return EatWhitespace(text, pos);
    }
}

/**
 * Parses an identifier.
 * 
 * @param rgx0        The pattern of the first character.
 * @param rgx1        The pattern of each following character.
 * @param endofstream The error code for end of stream.
 * @param wrongstart  The error code for non-matching first character.
 * @param casing      `true` for preserved casing; `false` for lowercase.
 * @param text        The full text.
 * @param pos         The position to start. Note that whitespace is not
 *                    eaten, so eat it before calling this method if
 *                    that's the desired behavior.
 * @param result      The `ParsingResult` object.
 * @param ret         Used to receive non-position results.
 * 
 * @returns The new position.
 *          If `ret.error`, the returned position is the old position.
 *          Otherwise, the returned position points to the first non-
 *          whitespace character after the parsed identifier, and
 *          `ret.value` stores the parsed identifier.
 */
function ParseIdImpl(
    rgx0: RegExp, rgx1: RegExp,
    endofstream: number, wrongstart: number,
    casing: boolean,
    text: string, pos: number,
    result: ParsingResult, ret: any): number
{
    ret.error = true;
    var chr = text[pos];
    if (chr === undefined)
    {
        result.ParsingErrors.push(new ParsingError(endofstream, pos));
        return pos;
    }
    if (!rgx0.test(chr))
    {
        result.ParsingErrors.push(new ParsingError(wrongstart, pos));
        return pos;
    }
    const idStartsAt = pos;
    for (chr = text[++pos]; rgx1.test(chr); chr = text[++pos])
        ;
    ret.error = false;
    const theId = text.substr(idStartsAt, pos - idStartsAt);
    ret.value = (casing ? theId : theId.toLowerCase());
    return EatWhitespace(text, pos);
}

type ParseIdMethod =
(text: string, pos: number,
    result: ParsingResult, ret: any) => number;

/**
 * String identifiers match `[a-zA-Z_][a-zA-Z0-9_.:+/-]*`
 * and are case-insensitive.
 * Pass `text`, `pos`, `result` and `ret` for `ParseIdImpl`.
 */
const ParseStringId: ParseIdMethod =
ParseIdImpl.bind<any, any, any>(ParseIdImpl,
    /[a-zA-Z_]/, /[a-zA-Z0-9_.:+/-]/,
    ParsingErrorCodes_ExpectingStringId,
    ParsingErrorCodes_StringIdMustStartWithLetter,
    false
) as ParseIdMethod;

/**
 * Entry identifiers match `[a-zA-Z0-9_.:+/-]+`.
 * and are **case-sensitive**.
 * Pass `text`, `pos`, `result` and `ret` for `ParseIdImpl`.
 */
const ParseEntryId: ParseIdMethod =
ParseIdImpl.bind<any, any, any>(ParseIdImpl,
    /[a-zA-Z0-9_.:+/-]/, /[a-zA-Z0-9_.:+/-]/,
    ParsingErrorCodes_ExpectingEntryId,
    ParsingErrorCodes_EntryIdMustStartWithValidChars,
    true
) as ParseIdMethod;

/**
 * Field identifiers match `[a-zA-Z]+`
 * and are case-insensitive.
 * Pass `text`, `pos`, `result` and `ret` for `ParseIdImpl`.
 */
const ParseFieldId: ParseIdMethod =
ParseIdImpl.bind<any, any, any>(ParseIdImpl,
    /[a-zA-Z]/, /[a-zA-Z]/,
    ParsingErrorCodes_ExpectingFieldId,
    ParsingErrorCodes_FieldIdMustStartWithLetter,
    false
) as ParseIdMethod;

ExportBibTeX._Privates.ParseTypeId = ParseTypeId;
ExportBibTeX._Privates.ParseIdImpl = ParseIdImpl;
ExportBibTeX._Privates.ParseStringId = ParseStringId;
ExportBibTeX._Privates.ParseEntryId = ParseEntryId;
ExportBibTeX._Privates.ParseFieldId = ParseFieldId;
