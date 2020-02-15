type ObjectModel_PersonNameFormatComponentTarget =
    'First' | 'von' | 'Last' | 'Jr';

function ObjectModel_FormatPersonNameWords(
    words: Strings_Literal[],
    links: ObjectModel_PersonNameLink[]): string
{
    const results: string[] = [];
    const count = links.length;
    for (let i = 0; i !== count; ++i)
    {
        results.push(words[i].Raw);
        results.push(links[i]);
    }
    results.push(words[count].Raw);
    return results.join('');
}

function ObjectModel_FormatPersonNameInitials(
    words: Strings_Literal[],
    links: ObjectModel_PersonNameLink[]): string
{
    const results: string[] = [];
    const count = links.length;
    for (let i = 0; i !== count; ++i)
    {
        const lnk = links[i];
        results.push(Strings_TextPrefixRaw(words[i], 1));
        results.push('.', lnk);
    }
    results.push(Strings_TextPrefixRaw(words[count], 1));
    return results.join('');
}

function ObjectModel_FormatPersonNameWordsWithLink(
    words: Strings_Literal[],
    link: string): string
{
    const results: string[] = [];
    for (const word of words)
    {
        results.push(word.Raw);
    }
    return results.join(link);
}

function ObjectModel_FormatPersonNameInitialsWithLink(
    words: Strings_Literal[], link: string): string
{
    const results: string[] = [];
    for (const word of words)
    {
        results.push(Strings_TextPrefixRaw(word, 1));
    }
    return results.join(link);
}

/**
 * Represents the format of a component of the name.
 */
class ObjectModel_PersonNameFormatComponent
{
    public readonly VerbatimBefore: string;
    public readonly Taret: ObjectModel_PersonNameFormatComponentTarget;
    public readonly OnlyInitials: boolean;
    public readonly VerbatimLink: string | undefined;
    public readonly VerbatimAfter: string;

    /**
     * Initializes a `PersonNameFormatComponent` instance.
     * 
     * @remarks The constructor type checks the input
     * so that it's safe to be consumed from JavaScript.
     * 
     * @param verbatimBefore The content before the target.
     * @param target         The target, `First`, `von`, `Jr` or `Last`.
     * @param onlyInitials   Whether or not to use only initials.
     * @param verbatimLink   The linking content between names.
     *                       A `string` or `undefined` (default
     *                       behavior is used).
     * @param verbatimAfter  The content after the target.
     */
    public constructor(verbatimBefore: string,
        target: ObjectModel_PersonNameFormatComponentTarget,
        onlyInitials: boolean,
        verbatimLink: string | undefined,
        verbatimAfter: string)
    {
        this.VerbatimBefore = '' + (verbatimBefore || '');
        this.Taret = (target === 'First'
            || target === 'von'
            || target === 'Jr'
            ? target : 'Last');
        this.OnlyInitials = !!onlyInitials;
        this.VerbatimLink = (verbatimLink !== undefined
            ? '' + (verbatimLink || '')
            : undefined);
        this.VerbatimAfter = '' + (verbatimAfter || '');
        Helper.FreezeObject(this);
    }

    public Format(name: ObjectModel_PersonName): string
    {
        if (!(name instanceof ObjectModel_PersonName))
        {
            return '';
        }
        const words = name[this.Taret];
        if (words.length === 0)
        {
            return '';
        }
        const initials = this.OnlyInitials;
        const vblnk = this.VerbatimLink;
        const links = ((name as any)[this.Taret
            + 'Links'] as ObjectModel_PersonNameLink[]);
        const rendered = (initials
            ? vblnk === undefined
                ? ObjectModel_FormatPersonNameInitials(words, links)
                : ObjectModel_FormatPersonNameInitialsWithLink(words, vblnk)
            : vblnk === undefined
                ? ObjectModel_FormatPersonNameWords(words, links)
                : ObjectModel_FormatPersonNameWordsWithLink(words, vblnk));
        return this.VerbatimBefore + rendered + this.VerbatimAfter;
    }
}

type ObjectModel_PersonNameFormatErrorCode = 0 | 1 | 2 | 3 | 4;

/**
 * An object for efficient construction of `PersonNameFormat`.
 */
class ObjectModel_PersonNameFormatBuilder
{
    public readonly Components:
        (ObjectModel_PersonNameFormatComponent | string)[];
    private VerbatimPieces: string[];

    public constructor()
    {
        this.Components = [];
        this.VerbatimPieces = [];
    }

    public PushLeftover(): boolean
    {
        if (this.VerbatimPieces.length === 0)
        {
            return false;
        }
        this.Components.push(this.VerbatimPieces.join(''));
        this.VerbatimPieces = [];
        return true;
    }

    public AddVerbatimContent(value: string)
    {
        if (value.length !== 0)
        {
            this.VerbatimPieces.push(value);
        }
    }

    public AddComponent(cmpnt: ObjectModel_PersonNameFormatComponent)
    {
        this.PushLeftover();
        this.Components.push(cmpnt);
    }
}


function ObjectModel_LaunderPersonNameFormatComponentArray(
    array: (ObjectModel_PersonNameFormatComponent | string)[]
): ObjectModel_PersonNameFormatBuilder
{
    const result = new ObjectModel_PersonNameFormatBuilder();
    if (!(array instanceof Array) || array.length === 0)
    {
        return result;
    }
    for (const item of array)
    {
        if (item instanceof ObjectModel_PersonNameFormatComponent)
        {
            result.AddComponent(item);
        }
        else
        {
            result.AddVerbatimContent('' + (item || ''));
        }
    }
    return result;
}

type ObjectModel_PersonNameComponentCtorArg =
    (ObjectModel_PersonNameFormatComponent | string)[] |
    ObjectModel_PersonNameFormatBuilder;

/**
 * Represents a format for the name.
 */
class ObjectModel_PersonNameFormat
{
    public readonly ErrorPos: number;
    public readonly ErrorCode: ObjectModel_PersonNameFormatErrorCode;
    public readonly Components:
        (ObjectModel_PersonNameFormatComponent | string)[];

    public static readonly ERROR_SUCCESS = 0;
    public static readonly ERROR_UNCLOSED_BRACE = 1;
    public static readonly ERROR_RBRACE = 2;
    public static readonly ERROR_INVALID_CHAR = 3;
    public static readonly ERROR_UNKNOWN = 4;

    public static readonly ErrorMessages =
[
'BibTeX.ParsePersonNameFormat: Operation completed successfully.',
'BibTeX.ParsePersonNameFormat: Unclosed brace.',
'BibTeX.ParsePersonNameFormat: Unexpected closing brace.',
'BibTeX.ParsePersonNameFormat: Invalid character in component specifier (wrap inside braces?).',
'BibTeX.ParsePersonNameFormat: Unknown error.'
];

    /**
     * @remarks The constructor type checks the input
     * so that it's safe to be consumed from JavaScript.
     */
    public constructor(errpos: number,
        errcode: ObjectModel_PersonNameFormatErrorCode,
        components: ObjectModel_PersonNameComponentCtorArg)
    {
        this.ErrorPos = ((errpos || 0) >>> 0);
        errcode =
            Number(errcode || 0) as ObjectModel_PersonNameFormatErrorCode;
        if (!(errcode >= 0 && errcode < 5))
        {
            errcode = ObjectModel_PersonNameFormat.ERROR_UNKNOWN;
        }
        this.ErrorCode = errcode;
        if (!(components instanceof ObjectModel_PersonNameFormatBuilder))
        {
            components =
                ObjectModel_LaunderPersonNameFormatComponentArray(
                    components);
        }
        components.PushLeftover();
        this.Components = components.Components;
        Helper.FreezeObject(this);
    }

    public Format(name: ObjectModel_PersonName): string
    {
        const result: string[] = [];
        for (const component of this.Components)
        {
            if (component instanceof ObjectModel_PersonNameFormatComponent)
            {
                result.push(component.Format(name));
            }
            else
            {
                result.push(component);
            }
        }
        /* This hack aims to be compatible with forced ties
        ** and the technique of using \relax to remove the space
        ** between von and Last. Suppose we format
        **     "d'\relax Ormesson, Jean".
        ** If I write {vv~~}{ll}, BibTeX will output
        **     "d'\relax~Ormesson".
        ** If I write {vv~}{ll}, BibTeX will output
        **     "d'\relax Ormesson"
        ** because it thinks a tie is unnecessary.
        ** In BibTeX-TS, we do not implement discretionary tie,
        ** and all words within a name are tied together.
        ** Moreover, the standard styles tie von and Last.
        ** To make sure
        **     "d'\relax Ormesson, Jean" #1 "{vv~}{ll}" format.name$
        ** yields "d'\relax Ormesson" and let forced tie work as expected,
        ** we do the following conversions:
        **            "\relax~" => "\relax "
        **     consecutive ties => one tie
        ** Note that simply finding "\relax~" doesn't mean we should
        ** replace it with "\relax ", because it might as well be
        **     "\\relax~" (line break + "relax" + tie)
        ** or  "\relax~~" (\relax + forced tie).
        **/
        return result.join('').replace(/(\\+relax)?(~+)/g,
            function (_, relax, tie)
            {
                if (relax)
                {
                    if (relax.length % 2 === 0 && tie.length === 1)
                    {
                        return relax + ' ';
                    }
                    return relax + '~';
                }
                return '~';
            });
    }
}
