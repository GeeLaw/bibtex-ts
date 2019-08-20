type Styles_EntryOrEntryData = ObjectModel_Entry | ObjectModel_EntryData;

interface Styles_IWithDate
{
    readonly Year: number;
    readonly Month: number;
}

interface Styles_IWithName
{
    readonly First: string[][];
    readonly vonLast: string[][];
    readonly Jr: string[][];
}

class Styles_FormattedNames
{
    public readonly Count: number;
    public readonly Value: string;

    public constructor(count: number, value: string)
    {
        this.Count = count;
        this.Value = value;
        Helper.FreezeObject(this);
    }

    public static readonly Empty = new Styles_FormattedNames(0, '');
}

class Styles_Helper
{
    public static sentence(text: string): string
    {
        return (text.length === 0
            ? ''
            : /[.?!]\}*$/.test(text)
            ? text + '\n'
            : text + '.\n');
    }

    public static clause(clause1: string, clause2: string): string
    {
        return (clause1.length === 0
            ? clause2
            : clause2.length === 0
            ? clause1
            : clause1 + ', ' + clause2);
    }

    public static field(entry: ObjectModel_Entry,
        field: string): Strings_Literal
    {
        const presence = entry.Fields[field];
        return presence || Strings_Literal.Empty;
    }

    public static emph(text: string): string
    {
        return (text.length === 0
            ? ''
            : '{\\em ' + text + '}');
    }

    public static purified_uppercase(text: Strings_Literal): string
    {
        return text.Purified.replace(/[a-z]+/g,
            function (x) { return x.toUpperCase(); });
    }

    public static readonly NameFormat_ffvvlljj =
        ObjectModel_ParsePersonNameFormat('{ff }{vv~}{ll}{, jj}');
    public static format_names(format: ObjectModel_PersonNameFormat,
        people: ObjectModel_PersonName[]): Styles_FormattedNames
    {
        const result = [];
        let etal = false;
        for (const person of people)
        {
            if (person.IsEtal())
            {
                etal = true;
                continue;
            }
            result.push(format.Format(person));
        }
        if (result.length === 0)
        {
            return Styles_FormattedNames.Empty;
        }
        if (etal)
        {
            return new Styles_FormattedNames(result.length + 1,
                result.length === 1
                ? result[0] + ' et~al.'
                : result.join(', ') + ', et~al.');
        }
        if (result.length === 1)
        {
            return new Styles_FormattedNames(1, result[0]);
        }
        return new Styles_FormattedNames(result.length,
            result.slice(0, result.length - 1).join(', ')
            + (result.length === 2 ? ' and ' : ', and ')
            + result[result.length - 1]);
    }

    public static readonly MonthNamesLong = Helper.FreezeObject([
        '', 'January', 'February', 'March',
        'April', 'May', 'June', 'July', 'August',
        'September', 'October', 'November', 'December']);

    public static n_dashify(text: string): string
    {
        return text.replace(/[ \t\v\f\r\n]*-+[ \t\v\f\r\n]*/g, '--');
    }

    private static LaunderNamePart(name: ObjectModel_PersonName,
        target: ObjectModel_PersonNameFormatComponentTarget,
        result: string[]): string[]
    {
        for (const word of name[target])
        {
            result.push(this.purified_uppercase(word));
        }
        return result;
    }

    public static ChopWords(entry: ObjectModel_Entry,
        field: string): string[]
    {
        const value = this.purified_uppercase(this.field(entry, field));
        const result: string[] = [];
        const rgx = /[^ \t\v\f\r\n]+/g;
        let match: string[] | null = null;
        rgx.lastIndex = 0;
        while (match = rgx.exec(value))
        {
            result.push(match[0]);
        }
        return Helper.FreezeObject(result);
    }

    public static readonly EmptyArray = Helper.FreezeObject([]);

    public static CreateSortName(entry: ObjectModel_Entry,
        first: string[][], vonLast: string[][], jr: string[][]): void
    {
        const authors = entry.Fields['author'];
        for (const person of (authors !== undefined
            ? ObjectModel_ParsePersonNames(authors)
            : this.EmptyArray))
        {
            if (person.IsEtal())
            {
                continue;
            }
            first.push(Helper.FreezeObject(
                this.LaunderNamePart(person, 'First', [])));
            vonLast.push(Helper.FreezeObject(
                this.LaunderNamePart(person, 'Last',
                this.LaunderNamePart(person, 'von', []))));
            jr.push(Helper.FreezeObject(
                this.LaunderNamePart(person, 'Jr', [])));
        }
        if (vonLast.length !== 0)
        {
            return;
        }
        const editors = entry.Fields['editors'];
        for (const person of (editors !== undefined
            ? ObjectModel_ParsePersonNames(editors)
            : this.EmptyArray))
        {
            if (person.IsEtal())
            {
                continue;
            }
            first.push(Helper.FreezeObject(
                this.LaunderNamePart(person, 'First', [])));
            vonLast.push(Helper.FreezeObject(
                this.LaunderNamePart(person, 'Last',
                this.LaunderNamePart(person, 'von', []))));
            jr.push(Helper.FreezeObject(
                this.LaunderNamePart(person, 'Jr', [])));
        }
        if (vonLast.length !== 0)
        {
            return;
        }
        const org = this.ChopWords(entry, 'organization');
        if (org.length === 0)
        {
            return;
        }
        first.push(this.EmptyArray);
        vonLast.push(org);
        jr.push(this.EmptyArray);
    }

    public static CompareNumbers(n1: number, n2: number): -1 | 0 | 1
    {
        return (n1 != n1
            ? n2 != n2
                ? 0 /* n1, n2 are NaN */
                : 1 /* n1 is NaN; n2 is a number */
            : n2 != n2
                ? -1 /* n1 is a number, n2 is NaN */
            : n1 < n2 ? -1 : n1 > n2 ? 1 : 0);
    }

    public static CompareStrings(
        str1: string, str2: string): -1 | 0 | 1
    {
        return (str1 === ''
            ? str2 === '' ? 0 : 1
            : str2 === '' ? -1
            : str1 < str2 ? -1 : str1 > str2 ? 1 : 0);
    }

    public static CompareWords(
        words1: string[], words2: string[]): -1 | 0 | 1
    {
        const l1 = words1.length;
        const l2 = words2.length;
        for (let i = 0; i !== l1 && i !== l2; ++i)
        {
            const n1 = words1[i];
            const n2 = words2[i];
            if (n1 < n2)
            {
                return -1;
            }
            if (n1 > n2)
            {
                return 1;
            }
        }
        return l1 < l2 ? -1 : l1 > l2 ? 1 : 0;
    }

    public static CompareParts(
        parts1: string[][], parts2: string[][]): -1 | 0 | 1
    {
        const l1 = parts1.length;
        const l2 = parts2.length;
        for (let i = 0; i !== l1 && i !== l2; ++i)
        {
            const result = this.CompareWords(parts1[i], parts2[i]);
            if (result)
            {
                return result;
            }
        }
        return l1 < l2 ? -1 : l1 > l2 ? 1 : 0;
    }

    public static CompareNames(
        entry1: Styles_IWithName,
        entry2: Styles_IWithName): -1 | 0 | 1
    {
        return (entry1.vonLast.length !== 0
            ? entry2.vonLast.length !== 0
            ? this.CompareParts(
                entry1.vonLast, entry2.vonLast
            ) || this.CompareParts(
                entry1.First, entry2.First
            ) || this.CompareParts(
                entry1.Jr, entry2.Jr
            )
            : -1
            : entry2.vonLast.length !== 0
            ? 1
            : 0);
    }

    public static CompareDate(
        entry1: Styles_IWithDate,
        entry2: Styles_IWithDate): -1 | 0 | 1
    {
        return Styles_Helper.CompareNumbers(
                entry1.Year, entry2.Year
            ) || Styles_Helper.CompareNumbers(
                entry1.Month, entry2.Month
            );
    }
}
