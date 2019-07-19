/**
 * Computes the prefix of a `Literal` (BST `text.prefix$`
 * function). The rules for counting characters:
 * Each character in `BasicPiece` counts as one.
 * Each `SpCharPiece` counts as one character.
 * Each non-brace character in `BracedPiece` counts
 * as one.
 * Any truncated `BracedPiece` will have appropriate
 * number of closing braces appended to make sure
 * the result is still has balanced braces.
 * 
 * @param str The `Literal` object.
 * @param len The (maximum) length of the prefix.
 * 
 * @returns The prefix of the `Literal`.
 */
function Strings_TextPrefix(str: Strings_Literal,
    len: number): Strings_Literal
{
    if (!(str instanceof Strings_Literal))
    {
        return Strings_Literal.Empty;
    }
    len >>>= 0;
    if (len === 0)
    {
        return Strings_Literal.Empty;
    }
    if (str.Length <= len)
    {
        return str;
    }
    const builder = new Strings_LiteralBuilder();
    for (const piece of str.Pieces)
    {
        if (piece.Length <= len)
        {
            builder.AddPiece(piece);
            len -= piece.Length;
            if (len === 0)
            {
                break;
            }
            continue;
        }
        if (piece instanceof Strings_BasicPiece)
        {
            builder.AddPiece(
            new Strings_BasicPiece(
            new Strings_BasicPieceBuilder(
                piece.Value.substr(0, len)
            )));
            break;
        }
        /* unreachable */
        if (piece instanceof Strings_SpCharPiece)
        {
            break;
        }
        /* piece instanceof Strings_BracedPiece */
        const rgx = /([^{}]*)([{}])/g;
        const text = piece.Value;
        let depth = 0, prefix = 0;
        let token: string[] | null = null;
        while (token = rgx.exec(text))
        {
            const partlen = token[1].length;
            /* When partlen == len, avoid extra braces. */
            if (partlen < len)
            {
                prefix += partlen + 1;
                len -= partlen;
                depth += (token[2] === '{' ? 1 : -1);
            }
            else
            {
                prefix += len;
                len = 0;
                /* Depth is not adjusted because
                 * the (prefix+len)-prefix of Value
                 * doesn't include the '}'. */
                break;
            }
        }
        /* Note the there might be a trailing part
         * not handled in the loop, so it's
         * prefix+len not just prefix. */
        builder.AddPiece(
        new Strings_BracedPiece(
        new Strings_BracedPieceBuilder(
            text.substr(0, prefix + len) +
            Helper.RepeatString('}', depth)
        )));
        break;
    }
    return new Strings_Literal(builder);
}

/**
 * Same as `TextPrefix`, except it directly computes
 * the `Raw` property. Better performance if you do
 * not need the structured object after extraction
 * of prefix.
 */
function Strings_TextPrefixRaw(str: Strings_Literal,
    len: number): string
{
    if (!(str instanceof Strings_Literal))
    {
        return '';
    }
    len >>>= 0;
    if (len === 0)
    {
        return '';
    }
    if (str.Length <= len)
    {
        return str.Raw;
    }
    const result: string[] = [];
    for (const piece of str.Pieces)
    {
        if (piece.Length <= len)
        {
            result.push(piece.Raw);
            len -= piece.Length;
            if (len === 0)
            {
                break;
            }
            continue;
        }
        if (piece instanceof Strings_BasicPiece)
        {
            result.push(piece.Value.substr(0, len));
            break;
        }
        if (piece instanceof Strings_SpCharPiece)
        {
            break;
        }
        const rgx = /([^{}]*)([{}])/g;
        const text = piece.Value;
        let depth = 0, prefix = 0;
        let token: string[] | null = null;
        while (token = rgx.exec(text))
        {
            const partlen = token[1].length;
            if (partlen < len)
            {
                prefix += partlen + 1;
                len -= partlen;
                depth += (token[2] === '{' ? 1 : -1);
            }
            else
            {
                prefix += len;
                len = 0;
                break;
            }
        }
        result.push('{');
        result.push(text.substr(0, prefix + len));
        result.push(Helper.RepeatString('}', depth + 1));
        break;
    }
    return result.join('');
}
