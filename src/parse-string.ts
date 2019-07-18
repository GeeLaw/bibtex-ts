/**
 * Parses a string concatenation into a `StringConcat`.
 * 
 * @param text   The full text.
 * @param pos    The position to start. It must be a non-whitespace
 *               immediately preceeding the string concatenation to
 *               be parsed.
 * @param result The `ParsingResult` object.
 * @param ret    Used to receive the non-position results.
 * 
 * @returns      The new position.
 *               If `ret.error`, the new position is the suggested
 *               position to call `ParseTypeId` for recovery.
 *               If the operation succeeded, `ret.value` contains
 *               the `StringConcat` object and the new position is the
 *               first non-whitespace position beyond the parsed part.
 */
function ParseStringConcat(
    text: string, pos: number,
    result: ParsingResult, ret: any): number
{
    ret.error = true;
    const builder = new StringConcatBuilder();
    const opr1: any = Helper.NewEmptyObject();
    pos = ParseStringOperand(text, pos, result, opr1);
    if (opr1.error)
    {
        return pos;
    }
    builder.AddSummand(opr1.value);
    for (let lastChar = text[pos];
        lastChar === '#';
        lastChar = text[pos])
    {
        const opr: any = Helper.NewEmptyObject();
        pos = ParseStringOperand(
            text, EatWhitespace(text, pos + 1),
            result, opr);
        if (opr.error)
        {
            return pos;
        }
        builder.AddSummand(opr.value);
    }
    ret.error = false;
    ret.value = new StringConcat(builder);
    return EatWhitespace(text, pos);
}

/**
 * Parses a string operand into a `GroupedString` or `StringReference`.
 * 
 * @param text   The full text.
 * @param pos    The position to start. Cases for `text[pos]`:
 *               - `"`: will parse a quote-delimited string.
 *               - `{`: will parse a brace-delimited string.
 *               - `0` to `9`: will parse a number (as string).
 *               - `a` to `z` or `A` to `Z`: will parse a string reference.
 * @param result The `ParsingResult` object.
 * @param ret    Used to receive the non-position results.
 * 
 * @returns      The new position.
 *               If `ret.error`, the new position is the suggested
 *               position to call `ParseTypeId` for recovery.
 *               If the operation succeeded, `ret.value` contains
 *               the `GroupedString` object or the `StringReference`
 *               object, and the new position is the first
 *               non-whitespace position beyond the parsed part.
 */
function ParseStringOperand(
    text: string, pos: number,
    result: ParsingResult, ret: any): number
{
    const chr = text[pos];
    if (chr === '"')
    {
        return ParseGroupedString(text, pos, result, ret,
            '"', ParsingErrorCodes_IncompleteStringInQuotes);
    }
    if (chr === '{')
    {
        return ParseGroupedString(text, pos, result, ret,
            '}', ParsingErrorCodes_IncompleteStringInBraces);
    }
    /* Either a number or a string identifier. */
    pos = ParseIdImpl(/[a-zA-Z0-9]/, /[a-zA-Z0-9_.:+/-]/,
        ParsingErrorCodes_ExpectingString,
        ParsingErrorCodes_ExpectingString,
        /* Numbers don't have cases.
         * String identifiers are case-insensitive. */
        false, text, pos, result, ret);
    if (!ret.error)
    {
        if (/[0-9]/.test(chr))
        {
            if (!/^[0-9]*$/.test(ret.value))
            {
                result.ParsingErrors.push(new ParsingError(
                    ParsingErrorCodes_NonNumericStringWithoutDelim,
                    pos
                ));
                ret.error = true;
            }
            else
            {
                ret.value = (new BasicString(ret.value)).Promote();
            }
        }
        else
        {
            ret.value = new StringReference(ret.value,
                result._Privates.NamedStrings);
        }
    }
    return pos;
}

/**
 * Parses a string delimited with `"`, `}` or `)` into a `GroupedString`.
 * The string must have balanced braces.
 * The `text[pos]` passed in is prerended to be the opening delimiter.
 * Note that this method can be used to eat a `@comment` command.
 * 
 * @param text        The full text.
 * @param pos         The position to start. It should point at
 *                    the delimiter.
 * @param result      The `ParsingResult` object.
 * @param ret         Used to receive non-position results.
 * @param delim       The closing delimiter.
 * @param endofstream The error code in case end-of-stream is reached
 *                    when parsing the text.
 * 
 * @returns The new position.
 *          If `ret.error`, it's the suggested recovery position.
 *          Otherwise, it's the first non-whitespace character
 *          beyond the string, and `ret.value` stores the
 *          `GroupedString`.
 */
function ParseGroupedString(
    text: string, pos: number,
    result: ParsingResult, ret: any,
    delim: string, endofstream: number): number
{
    ret.error = true;
    const maxlen = 8192;
    const oldpos = pos;
    var lastpos = pos + 1;
    var current = new GroupedStringBuilder();
    const nesting = [];
    for (var chr = text[++pos]; pos - oldpos < maxlen; chr = text[++pos])
    {
        /* End of stream with incomplete string. */
        if (chr === undefined)
        {
            result.ParsingErrors.push(
                new ParsingError(endofstream, pos));
            return pos;
        }
        /* Brace depth increases. */
        else if (chr === '{')
        {
            if (lastpos < pos)
            {
                current.AddPiece(new BasicString(
                    text.substr(lastpos, pos - lastpos)));
            }
            lastpos = pos + 1;
            nesting.push(current);
            current = new GroupedStringBuilder();
        }
        /* Brace depth decreases.
        ** End of string in braces is NOT handled here. */
        else if (chr === '}' && nesting.length !== 0)
        {
            if (lastpos < pos)
            {
                current.AddPiece(new BasicString(
                    text.substr(lastpos, pos - lastpos)));
            }
            current.PushLeftover();
            lastpos = pos + 1;
            const nestedPiece = new GroupedString(current);
            current = nesting.pop()!;
            current.AddPiece(nestedPiece);
        }
        /* End of string. */
        else if (chr === delim && nesting.length === 0)
        {
            if (lastpos < pos)
            {
                current.AddPiece(new BasicString(
                    text.substr(lastpos, pos - lastpos)));
            }
            current.PushLeftover();
            ret.error = false;
            ret.value = new GroupedString(current);
            return EatWhitespace(text, pos + 1);
        }
    }
    result.ParsingErrors.push(new ParsingError(
        ParsingErrorCodes_StringLiteralTooLong,
        oldpos
    ));
    return pos;
}

ExportBibTeX._Privates.ParseStringConcat = ParseStringConcat;
ExportBibTeX._Privates.ParseStringOperand = ParseStringOperand;
ExportBibTeX._Privates.ParseGroupedString = ParseGroupedString;
