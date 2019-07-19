type ObjectModel_PersonNameLink = '~' | '-';
type ObjectModel_NameErrorCode = 0 | 1 | 2 | 3 | 4 | 5 | 6;

function ObjectModel_LaunderNameWordArray(
    words?: Strings_Literal[]): Strings_Literal[]
{
    const result: Strings_Literal[] = [];
    if (!(words instanceof Array))
    {
        return Helper.FreezeObject(result);
    }
    for (const item of words)
    {
        if (item instanceof Strings_Literal)
        {
            result.push(item);
        }
    }
    return Helper.FreezeObject(result);
}

function ObjectModel_LaunderNameLinkArray(
    words: Strings_Literal[],
    links?: ObjectModel_PersonNameLink[]): ObjectModel_PersonNameLink[]
{
    const result: ObjectModel_PersonNameLink[] = [];
    const maxcount = words.length - 1;
    if (maxcount < 1)
    {
        return Helper.FreezeObject(result);
    }
    const len = (links instanceof Array
        ? links.length : 0);
    let i = 0;
    for (; i !== maxcount && i !== len; ++i)
    {
        const item = '' + (links![i] + '');
        result.push(item === '-' ? '-' : '~');
    }
    for (; i !== maxcount; ++i)
    {
        result.push('~');
    }
    return Helper.FreezeObject(result);
}

class ObjectModel_PersonName
{
    public readonly _Privates: any;
    public readonly ErrorCode: ObjectModel_NameErrorCode;
    public readonly First: Strings_Literal[];
    public readonly FirstLinks: ObjectModel_PersonNameLink[];
    public readonly von: Strings_Literal[];
    public readonly vonLinks: ObjectModel_PersonNameLink[];
    public readonly Last: Strings_Literal[];
    public readonly LastLinks: ObjectModel_PersonNameLink[];
    public readonly Jr: Strings_Literal[];
    public readonly JrLinks: ObjectModel_PersonNameLink[];

    public static readonly ERROR_SUCCESS = 0;
    public static readonly ERROR_EMPTY = 1;
    public static readonly ERROR_TOO_MANY_COMMAS = 2;
    public static readonly ERROR_LEADING_COMMA = 3;
    public static readonly ERROR_TRAILING_COMMA = 4;
    public static readonly ERROR_TOKEN_INTERLEAVE = 5;
    public static readonly ERROR_UNKNOWN = 6;

    public static readonly ErrorMessages =
[
'BibTeX.ParsePersonName: Operation completed successfully.',
'BibTeX.ParsePersonName: The name is empty.',
'BibTeX.ParsePersonName: There are too many commas (use "and" to separate names).',
'BibTeX.ParsePersonName: There is a trailing comma.',
'BibTeX.ParsePersonName: There is a leading comma.',
'BibTeX.ParsePersonName: The word/link tokens should interleave (potential bug).'
];

    /**
     * Initializes a `PersonName` instance.
     * Call `Helper.FreezeDescendants` and `Helper.FreezeObject`
     * on `_Privates` after setting it up.
     */
    public constructor(errcode: ObjectModel_NameErrorCode,
        firstWords?: Strings_Literal[],
        firstLinks?: ObjectModel_PersonNameLink[],
        vonWords?: Strings_Literal[],
        vonLinks?: ObjectModel_PersonNameLink[],
        lastWords?: Strings_Literal[],
        lastLinks?: ObjectModel_PersonNameLink[],
        jrWords?: Strings_Literal[],
        jrLinks?: ObjectModel_PersonNameLink[])
    {
        this._Privates = Helper.NewEmptyObject();
        this.ErrorCode =
            errcode =
            Number(errcode) as ObjectModel_NameErrorCode;
        if (!(errcode >= 0 && errcode < 7))
        {
            this.ErrorCode = ObjectModel_PersonName.ERROR_UNKNOWN;
        }
        else
        {
            this.ErrorCode >>= 0;
        }
        this.First = ObjectModel_LaunderNameWordArray(firstWords);
        this.FirstLinks = ObjectModel_LaunderNameLinkArray(
            this.First, firstLinks);
        this.von = ObjectModel_LaunderNameWordArray(vonWords);
        this.vonLinks = ObjectModel_LaunderNameLinkArray(
            this.von, vonLinks);
        this.Last = ObjectModel_LaunderNameWordArray(lastWords);
        this.LastLinks = ObjectModel_LaunderNameLinkArray(
            this.Last, lastLinks);
        this.Jr = ObjectModel_LaunderNameWordArray(jrWords);
        this.JrLinks = ObjectModel_LaunderNameLinkArray(
            this.Jr, jrLinks);
        Helper.FreezeObject(this);
    }


    /**
     * Formats the name (BST `format.name$` function).
     * 
     * @remarks If you are formatting multiple names
     *          with the same format, consider parsing
     *          the format as `PersonNameFormat` and
     *          use `PersonNameFormat.Format` method
     *          for better efficiency.
     * 
     * @param fmt Format string.
     * 
     * @returns The formatted name.
     */
    public Format(fmt: string): string
    {
        return ObjectModel_ParsePersonNameFormat(fmt).Format(this);
    }

    /**
     * Determines whether the name is `others`.
     */
    public IsEtal(): boolean
    {
        if (this.First.length !== 0
            || this.von.length !== 0
            || this.Jr.length !== 0
            || this.Last.length !== 1)
        {
            return false;
        }
        const pcs = this.Last[0].Pieces;
        if (pcs.length !== 1)
        {
            return false;
        }
        const piece = pcs[0];
        return (piece instanceof Strings_BasicPiece
            && piece.Value === 'others');
    }
}
