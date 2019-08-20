type Styles_Alpha_ReadonlySortedEntry = Readonly<Styles_Alpha_SortedEntry>;

class Styles_Alpha_SortedEntry implements Styles_IWithDate, Styles_IWithName
{
    public readonly Source: Styles_EntryOrEntryData | undefined;
    public readonly Entry: ObjectModel_Entry | undefined;
    public Nickname: Strings_Literal;
    public NicknameSort: string;
    public readonly Year: number;
    public readonly Month: number;
    public readonly First: string[][];
    public readonly vonLast: string[][];
    public readonly Jr: string[][];
    public readonly Title: string[];
    public readonly OriginalIndex: number;

    /**
     * Compares two `SortedEntry` objects within the same series.
     * `Anon` entries are put at the end.
     * 
     * The entries are sorted:
     * - In alphabetical order of 3-letter (without `+` and
     *   with `Anon` turned into the empty string).
     * - In increasing order of date.
     * - In increasing order of names.
     * - In increasing order of title.
     * - In original order.
     */
    public static Compare(entry1: Styles_Alpha_ReadonlySortedEntry,
        entry2: Styles_Alpha_ReadonlySortedEntry): number
    {
        return (entry1.OriginalIndex === entry2.OriginalIndex
            ? 0
            : Styles_Helper.CompareStrings(
                entry1.NicknameSort,
                entry2.NicknameSort
            ) || Styles_Helper.CompareDate(
                entry1, entry2
            ) || Styles_Helper.CompareNames(
                entry1, entry2
            ) || Styles_Helper.CompareWords(
                entry1.Title, entry2.Title
            ) || Styles_Helper.CompareNumbers(
                entry1.OriginalIndex,
                entry2.OriginalIndex
            ));
    }

    public constructor(
        src: Styles_EntryOrEntryData | undefined,
        idx: number)
    {
        this.Source = src;
        const entry = (src instanceof ObjectModel_EntryData
            ? src.Resolve()
            : src instanceof ObjectModel_Entry
            ? src
            : undefined);
        this.Entry = entry;
        if (entry !== undefined)
        {
            const first: string[][] = [];
            const vonLast: string[][] = [];
            const jr: string[][] = [];
            this.Nickname = Styles_AlphaImpl.format_label_text(entry);
            this.NicknameSort = Styles_AlphaImpl.format_label_sort(entry);
            this.Year = Styles_ResolveYear(entry);
            this.Month = Styles_ResolveMonth(entry);
            Styles_Helper.CreateSortName(entry, first, vonLast, jr);
            this.First = Helper.FreezeObject(first);
            this.vonLast = Helper.FreezeObject(vonLast);
            this.Jr = Helper.FreezeObject(jr);
            this.Title = Styles_Helper.ChopWords(entry, 'title');
        }
        else
        {
            const emptyArray = Styles_Helper.EmptyArray;
            this.Nickname = Strings_Literal.Empty;
            this.NicknameSort = '';
            this.Year = Number.NaN;
            this.Month = Number.NaN;
            this.First = emptyArray;
            this.vonLast = emptyArray;
            this.Jr = emptyArray;
            this.Title = emptyArray;
        }
        this.OriginalIndex = idx;
    }

}

/* This is different from the actual alpha.bst.
 * In many places, cases are kept instead of being changed to "t" case.
 */
class Styles_AlphaImpl
{
    private static format_name_vl(
        name: ObjectModel_PersonName): Strings_Literal
    {
        const builder = new Strings_LiteralBuilder();
        for (const vonName of name.von)
        {
            for (const piece of vonName.Prefix(1).Pieces)
            {
                builder.AddPiece(piece);
            }
        }
        for (const lastName of name.Last)
        {
            for (const piece of lastName.Prefix(1).Pieces)
            {
                builder.AddPiece(piece);
            }
        }
        builder.PushLeftover();
        return new Strings_Literal(builder);
    }

    private static format_name_ll(
        name: ObjectModel_PersonName): Strings_Literal
    {
        const vl = this.format_name_vl(name);
        if (vl.Length > 1)
        {
            return vl;
        }
        for (const word of name.Last)
        {
            if (word.Length !== 0)
            {
                return word.Prefix(3);
            }
        }
        return vl;
    }

    private static readonly AnonName =
        Strings_ParseLiteral('Anon').Result;
    private static readonly EtalChar =
        Strings_ParseLiteral('{\\etalchar{+}}').Result;
    private static format_label_names(entry: ObjectModel_Entry): Strings_Literal
    {
        let etal: boolean = false;
        const namestring = entry.Fields['author'] ||
            entry.Fields['editor'];
        if (namestring === undefined)
        {
            const key = entry.Fields['key'];
            if (key !== undefined)
            {
                return key.Prefix(3);
            }
            return this.AnonName;
        }
        const people = ObjectModel_ParsePersonNames(namestring);
        let ll = undefined;
        let vls = [];
        for (const person of people)
        {
            if (person.IsEtal())
            {
                etal = true;
                continue;
            }
            const vl = this.format_name_vl(person);
            if (vl.Length === 0)
            {
                continue;
            }
            vls.push(vl);
            if (vls.length === 1)
            {
                ll = this.format_name_ll(person);
            }
        }
        if (vls.length === 0)
        {
            return this.AnonName;
        }
        if (vls.length === 1)
        {
            vls[0] = ll!;
        }
        else if (vls.length > 4)
        {
            vls = vls.slice(0, 3);
            etal = true;
        }
        if (etal)
        {
            vls.push(this.EtalChar);
        }
        return Strings_Literal.Concat(vls);
    }

    private static format_label_year(entry: ObjectModel_Entry): Strings_Literal
    {
        let year = Styles_ResolveYear(entry);
        if (year != year)
        {
            return Strings_Literal.Empty;
        }
        if (year < 0)
        {
            year = -year;
        }
        if (year < 10)
        {
            return Strings_ParseLiteral(
                year.toString()).Result;
        }
        year %= 100;
        return Strings_ParseLiteral(year < 10
            ? '0' + year.toString()
            : year.toString()).Result;
    }

    public static format_label_text(entry: ObjectModel_Entry): Strings_Literal
    {
        return Strings_Literal.Concat([
            this.format_label_names(entry),
            this.format_label_year(entry)]);
    }

    public static format_label_sort(entry: ObjectModel_Entry): string
    {
        const namestring = entry.Fields['author'] ||
            entry.Fields['editor'];
        if (namestring === undefined)
        {
            const key = entry.Fields['key'];
            if (key !== undefined)
            {
                return Styles_Helper.purified_uppercase(key.Prefix(3));
            }
            return '';
        }
        const people = ObjectModel_ParsePersonNames(namestring);
        let ll = undefined;
        let vls = [];
        for (const person of people)
        {
            if (person.IsEtal())
            {
                continue;
            }
            const vl = this.format_name_vl(person);
            if (vl.Length === 0)
            {
                continue;
            }
            vls.push(vl);
            if (vls.length === 1)
            {
                ll = this.format_name_ll(person);
            }
        }
        if (vls.length === 0)
        {
            return '';
        }
        if (vls.length === 1)
        {
            vls[0] = ll!;
        }
        else if (vls.length > 4)
        {
            vls = vls.slice(0, 3);
        }
        return Styles_Helper.purified_uppercase(
            Strings_Literal.Concat(vls));
    }

    private static readonly NicknameSuffix =
    [
        Strings_ParseLiteral('a').Result,
        Strings_ParseLiteral('b').Result,
        Strings_ParseLiteral('c').Result,
        Strings_ParseLiteral('d').Result,
        Strings_ParseLiteral('e').Result,
        Strings_ParseLiteral('f').Result,
        Strings_ParseLiteral('g').Result,
        Strings_ParseLiteral('h').Result,
        Strings_ParseLiteral('i').Result,
        Strings_ParseLiteral('j').Result,
        Strings_ParseLiteral('k').Result,
        Strings_ParseLiteral('l').Result,
        Strings_ParseLiteral('m').Result,
        Strings_ParseLiteral('n').Result,
        Strings_ParseLiteral('o').Result,
        Strings_ParseLiteral('p').Result,
        Strings_ParseLiteral('q').Result,
        Strings_ParseLiteral('r').Result,
        Strings_ParseLiteral('s').Result,
        Strings_ParseLiteral('t').Result,
        Strings_ParseLiteral('u').Result,
        Strings_ParseLiteral('v').Result,
        Strings_ParseLiteral('w').Result,
        Strings_ParseLiteral('x').Result,
        Strings_ParseLiteral('y').Result,
        Strings_ParseLiteral('z').Result,
        Strings_ParseLiteral('α').Result,
        Strings_ParseLiteral('β').Result,
        Strings_ParseLiteral('γ').Result,
        Strings_ParseLiteral('δ').Result,
        Strings_ParseLiteral('ε').Result,
        Strings_ParseLiteral('ζ').Result,
        Strings_ParseLiteral('η').Result,
        Strings_ParseLiteral('θ').Result,
        Strings_ParseLiteral('ι').Result,
        Strings_ParseLiteral('κ').Result,
        Strings_ParseLiteral('λ').Result,
        Strings_ParseLiteral('μ').Result,
        Strings_ParseLiteral('ξ').Result,
        Strings_ParseLiteral('π').Result,
        Strings_ParseLiteral('ρ').Result,
        Strings_ParseLiteral('σ').Result,
        Strings_ParseLiteral('τ').Result,
        Strings_ParseLiteral('φ').Result,
        Strings_ParseLiteral('χ').Result,
        Strings_ParseLiteral('ψ').Result,
        Strings_ParseLiteral('ω').Result
    ];
    private static readonly NicknameConnector =
        Strings_ParseLiteral('-').Result;

    public static fix_nicknames(
        entries: Styles_Alpha_SortedEntry[]): void
    {
        const name1: any = Helper.NewEmptyObject();
        const name2: any = Helper.NewEmptyObject();
        /* Count base nicknames. */
        for (const entry of entries)
        {
            const baseNickname = entry.Nickname.Purified;
            if (baseNickname in name1)
            {
                ++name1[baseNickname];
            }
            else
            {
                name1[baseNickname] = 1;
                name2[baseNickname] = 0;
            }
        }
        const suffix = this.NicknameSuffix;
        /* Append suffices for collisions. */
        for (const entry of entries)
        {
            const baseNickname = entry.Nickname.Purified;
            if (baseNickname.length === 0 ||
                name1[baseNickname] <= 1)
            {
                continue;
            }
            const order = name2[baseNickname]++;
            const nickname = [entry.Nickname,
                Strings_Literal.Empty,
                Strings_Literal.Empty];
            if (order < suffix.length)
            {
                if (!/[0-9]$/.test(baseNickname))
                {
                    nickname[1] = this.NicknameConnector;
                }
                nickname[2] = suffix[order];
            }
            else
            {
                nickname[1] = this.NicknameConnector;
                nickname[2] = Strings_ParseLiteral(
                    (order + 1).toString()).Result;
            }
            entry.Nickname = Strings_Literal.Concat(nickname);
        }
    }

}

class Styles_Alpha
{
    public static readonly SortedEntry = Styles_Alpha_SortedEntry;

    public static ProcessEntries(
        entries: Styles_EntryOrEntryData[]): Styles_Alpha_ReadonlySortedEntry[]
    {
        const result: Styles_Alpha_SortedEntry[] = [];
        if (entries instanceof Array)
        {
            const len = entries.length;
            for (let i = 0; i !== len; ++i)
            {
                result.push(
                    new Styles_Alpha_SortedEntry(entries[i], i));
            }
        }
        result.sort(Styles_Alpha_SortedEntry.Compare);
        Styles_AlphaImpl.fix_nicknames(result);
        for (const item of result)
        {
            Helper.FreezeObject(item);
        }
        return result;
    }

    public static GetEntryNicknameTeX(
        entry: Styles_Alpha_SortedEntry): string
    {
        if (!(entry instanceof Styles_Alpha_SortedEntry))
        {
            return '';
        }
        return entry.Nickname.Raw;
    }

    public static GetEntryCitationTeX(
        entry: Styles_Alpha_SortedEntry): string
    {
        if (!(entry instanceof Styles_Alpha_SortedEntry))
        {
            return '';
        }
        const myEntry = entry.Entry;
        if (myEntry === undefined)
        {
            return '';
        }
        if (Styles_PlainImpl.EntryTypes.indexOf(myEntry.Type) >= 0)
        {
            return ((Styles_PlainImpl as any)[myEntry.Type] as Function).
                call(Styles_PlainImpl, myEntry) as string;
        }
        return Styles_PlainImpl.misc(myEntry);
    }

}
