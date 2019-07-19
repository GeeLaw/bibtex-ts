function ObjectModel_LaunderNameTokens(
    tokens: ObjectModel_IPersonNameToken[],
    words: Strings_Literal[],
    links: ObjectModel_PersonNameLink[]
): ObjectModel_NameErrorCode
{
    /* 0 = word, 1 = link */
    let target = 0;
    let err: ObjectModel_NameErrorCode =
        ObjectModel_PersonName.ERROR_SUCCESS;
    for (const token of tokens)
    {
        if (target === 0 &&
            token instanceof ObjectModel_PersonNameTokenWord)
        {
            words.push(token.Value);
            target = 1;
        }
        else if (target === 0 &&
            words.length === 0 &&
            token instanceof ObjectModel_PersonNameTokenLink)
        {
            /* Leading whitespace is OK. */
        }
        else if (target === 1 &&
            token instanceof ObjectModel_PersonNameTokenLink)
        {
            target = 0;
            links.push(token.Link);
        }
        else
        {
            err = err || ObjectModel_PersonName.ERROR_TOKEN_INTERLEAVE;
        }
    }
    if (words.length === 0)
    {
        err = err || ObjectModel_PersonName.ERROR_EMPTY;
    }
    else
    {
        while (links.length >= words.length)
        {
            links.pop();
        }
    }
    return err;
}

function ObjectModel_ResolveName_First_von_Last(
    tokens: ObjectModel_IPersonNameToken[]
): ObjectModel_PersonName
{
    const words: Strings_Literal[] = [];
    const links: ObjectModel_PersonNameLink[] = [];
    const errcode = ObjectModel_LaunderNameTokens(tokens, words, links);
    if (words.length === 0)
    {
        return new ObjectModel_PersonName(errcode
            || ObjectModel_PersonName.ERROR_EMPTY);
    }
    /* First = [0, firstEnds)
     *   von = [firstEnds, lastBegins)
     *  Last = [lastBegins, words.length)
     */
    let firstEnds = 0;
    let lastBegins = words.length - 1;
    /* First ends at the first lower-case word. */
    while (firstEnds !== lastBegins &&
        words[firstEnds].Case !== 'l')
    {
        ++firstEnds;
    }
    /* Last begins after the last lower-case word. */
    while (lastBegins !== firstEnds &&
        words[lastBegins - 1].Case !== 'l')
    {
        --lastBegins;
    }
    return new ObjectModel_PersonName(errcode,
        words.slice(0, firstEnds),
        links.slice(0, firstEnds - 1),
        words.slice(firstEnds, lastBegins),
        links.slice(firstEnds, lastBegins - 1),
        words.slice(lastBegins),
        links.slice(lastBegins));
}

function ObjectModel_ResolveName_von_Last_Jr_First(
    vonLastTokens: ObjectModel_IPersonNameToken[],
    jrTokens: ObjectModel_IPersonNameToken[],
    firstTokens: ObjectModel_IPersonNameToken[],
    errfallback: ObjectModel_NameErrorCode
): ObjectModel_PersonName
{
    const vonLastWords: Strings_Literal[] = [];
    const vonLastLinks: ObjectModel_PersonNameLink[] = [];
    const vonLastErr = ObjectModel_LaunderNameTokens(
        vonLastTokens, vonLastWords, vonLastLinks);
    const jrWords: Strings_Literal[] = [];
    const jrLinks: ObjectModel_PersonNameLink[] = [];
    const jrErr = ObjectModel_LaunderNameTokens(
        jrTokens, jrWords, jrLinks);
    const firstWords: Strings_Literal[] = [];
    const firstLinks: ObjectModel_PersonNameLink[] = [];
    const firstErr = ObjectModel_LaunderNameTokens(
        firstTokens, firstWords, firstLinks);
    const errcode =
        (vonLastErr === ObjectModel_PersonName.ERROR_EMPTY
            ? ObjectModel_PersonName.ERROR_LEADING_COMMA
            : vonLastErr) ||
        (jrErr === ObjectModel_PersonName.ERROR_EMPTY
            ? ObjectModel_PersonName.ERROR_SUCCESS
            : jrErr) ||
        (firstErr === ObjectModel_PersonName.ERROR_EMPTY
            ? ObjectModel_PersonName.ERROR_TRAILING_COMMA
            : firstErr) || errfallback;
    /*  von = [0, lastBegins)
     * Last = [lastBegins, vonLastWords.legth)
     */
    let lastBegins = (vonLastWords.length === 0
        ? 0
        : vonLastWords.length - 1);
    while (lastBegins !== 0 &&
        vonLastWords[lastBegins].Case !== 'l')
    {
        --lastBegins;
    }
    return new ObjectModel_PersonName(errcode,
        firstWords, firstLinks,
        vonLastWords.slice(lastBegins),
        vonLastLinks.slice(lastBegins),
        vonLastWords.slice(0, lastBegins),
        vonLastLinks.slice(0, lastBegins - 1),
        jrWords, jrLinks);
}

function ObjectModel_ResolveName(
    tokens: ObjectModel_IPersonNameToken[],
    parts: ObjectModel_IPersonNameToken[][],
    commas: number
): ObjectModel_PersonName
{
    const name = (commas === 0
        ? ObjectModel_ResolveName_First_von_Last(parts[0])
        : commas === 1
        ? ObjectModel_ResolveName_von_Last_Jr_First(
            parts[0], parts[2], parts[1],
            ObjectModel_PersonName.ERROR_SUCCESS)
        : ObjectModel_ResolveName_von_Last_Jr_First(
            parts[0], parts[1], parts[2],
            commas === 2
            ? ObjectModel_PersonName.ERROR_SUCCESS
            : ObjectModel_PersonName.ERROR_TOO_MANY_COMMAS));
    name._Privates.Tokens = tokens;
    name._Privates.Parts = parts;
    name._Privates.Commas = commas;
    Helper.FreezeDescendants(name._Privates);
    Helper.FreezeObject(name._Privates);
    return name;
}

function ObjectModel_ParsePersonNames(
    names: Strings_Literal): ObjectModel_PersonName[]
{
    if (!(names instanceof Strings_Literal)
        || names.Pieces.length === 0)
    {
        return [];
    }
    if (names.Pieces.length === 1)
    {
        const onlyPiece = names.Pieces[0];
        if (onlyPiece instanceof Strings_BasicPiece
            && /^[ \t\v\r\n]*$/.test(onlyPiece.Raw))
        {
            return [];
        }
    }
    let tokens: ObjectModel_IPersonNameToken[] = [];
    let parts: ObjectModel_IPersonNameToken[][] = [[], [], []];
    let commas = 0;
    const result: ObjectModel_PersonName[] = [];
    for (const token of ObjectModel_GetPersonNameTokens(names))
    {
        if (token instanceof ObjectModel_PersonNameTokenComma)
        {
            tokens.push(token);
            ++commas;
        }
        else if (token instanceof ObjectModel_PersonNameTokenLink
            || token instanceof ObjectModel_PersonNameTokenWord)
        {
            tokens.push(token);
            parts[commas < 3 ? commas : 2].push(token);
        }
        else /* "and" */
        {
            const name = ObjectModel_ResolveName(tokens, parts, commas);
            result.push(name);
            tokens = [];
            parts = [[], [], []];
            commas = 0;
        }
    }
    const name = ObjectModel_ResolveName(tokens, parts, commas);
    result.push(name);
    return result;
}
