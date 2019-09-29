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
        idx: number,
        macros: ObjectModel_StrLitDict)
    {
        this.Source = src;
        const entry = (src instanceof ObjectModel_EntryData
            ? src.Resolve(macros)
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
            Styles_Helper.CreateSortName(entry, false, first, vonLast, jr);
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
    public static ProcessEntry(entry: ObjectModel_Entry): string
    {
        const that: any = Styles_StandardStyle.Alpha;
        if (Styles_StandardStyle.EntryTypes.indexOf(entry.Type) >= 0)
        {
            return that[entry.Type].call(that, entry) as string;
        }
        return that.misc(entry);
    }

    private static MakeLiteral(str: string): Strings_Literal
    {
        const builder = new Strings_LiteralBuilder();
        builder.AddBasicPiece(new Strings_BasicPiece(
            new Strings_BasicPieceBuilder(str)
        ));
        return new Strings_Literal(builder);
    }

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
        Styles_AlphaImpl.MakeLiteral('Anon');
    private static readonly EtalChar = (function (builder)
    {
        builder.AddSpCharPiece(new Strings_SpCharPiece(
            new Strings_SpCharPieceBuilder('\\etalchar{+}')
        ));
        return new Strings_Literal(builder);
    })(new Strings_LiteralBuilder());
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
            return this.MakeLiteral(year.toString());
        }
        year %= 100;
        return this.MakeLiteral(year < 10
            ? '0' + year.toString()
            : year.toString());
    }

    public static format_label_text(entry: ObjectModel_Entry): Strings_Literal
    {
        return Strings_Literal.Concat([
            this.format_label_names(entry),
            this.format_label_year(entry)]);
    }

    public static format_label_sort(entry: ObjectModel_Entry): string
    {
        return Styles_Helper.purified_uppercase(
            this.format_label_names(entry));
    }

    private static readonly NicknameSuffix =
    [
        Styles_AlphaImpl.MakeLiteral('a'),
        Styles_AlphaImpl.MakeLiteral('b'),
        Styles_AlphaImpl.MakeLiteral('c'),
        Styles_AlphaImpl.MakeLiteral('d'),
        Styles_AlphaImpl.MakeLiteral('e'),
        Styles_AlphaImpl.MakeLiteral('f'),
        Styles_AlphaImpl.MakeLiteral('g'),
        Styles_AlphaImpl.MakeLiteral('h'),
        Styles_AlphaImpl.MakeLiteral('i'),
        Styles_AlphaImpl.MakeLiteral('j'),
        Styles_AlphaImpl.MakeLiteral('k'),
        Styles_AlphaImpl.MakeLiteral('l'),
        Styles_AlphaImpl.MakeLiteral('m'),
        Styles_AlphaImpl.MakeLiteral('n'),
        Styles_AlphaImpl.MakeLiteral('o'),
        Styles_AlphaImpl.MakeLiteral('p'),
        Styles_AlphaImpl.MakeLiteral('q'),
        Styles_AlphaImpl.MakeLiteral('r'),
        Styles_AlphaImpl.MakeLiteral('s'),
        Styles_AlphaImpl.MakeLiteral('t'),
        Styles_AlphaImpl.MakeLiteral('u'),
        Styles_AlphaImpl.MakeLiteral('v'),
        Styles_AlphaImpl.MakeLiteral('w'),
        Styles_AlphaImpl.MakeLiteral('x'),
        Styles_AlphaImpl.MakeLiteral('y'),
        Styles_AlphaImpl.MakeLiteral('z'),
        Styles_AlphaImpl.MakeLiteral('α'),
        Styles_AlphaImpl.MakeLiteral('β'),
        Styles_AlphaImpl.MakeLiteral('γ'),
        Styles_AlphaImpl.MakeLiteral('δ'),
        Styles_AlphaImpl.MakeLiteral('ε'),
        Styles_AlphaImpl.MakeLiteral('ζ'),
        Styles_AlphaImpl.MakeLiteral('η'),
        Styles_AlphaImpl.MakeLiteral('θ'),
        Styles_AlphaImpl.MakeLiteral('ι'),
        Styles_AlphaImpl.MakeLiteral('κ'),
        Styles_AlphaImpl.MakeLiteral('λ'),
        Styles_AlphaImpl.MakeLiteral('μ'),
        Styles_AlphaImpl.MakeLiteral('ξ'),
        Styles_AlphaImpl.MakeLiteral('π'),
        Styles_AlphaImpl.MakeLiteral('ρ'),
        Styles_AlphaImpl.MakeLiteral('σ'),
        Styles_AlphaImpl.MakeLiteral('τ'),
        Styles_AlphaImpl.MakeLiteral('φ'),
        Styles_AlphaImpl.MakeLiteral('χ'),
        Styles_AlphaImpl.MakeLiteral('ψ'),
        Styles_AlphaImpl.MakeLiteral('ω')
    ];
    private static readonly NicknameConnector =
        Styles_AlphaImpl.MakeLiteral('-');

    public static FixNicknames(
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

    public static readonly Macros: ObjectModel_StrLitDict = (function (obj)
    {
        obj['jan'] = Strings_ParseLiteral('January').Result;
        obj['feb'] = Strings_ParseLiteral('February').Result;
        obj['mar'] = Strings_ParseLiteral('March').Result;
        obj['apr'] = Strings_ParseLiteral('April').Result;
        obj['may'] = Strings_ParseLiteral('May').Result;
        obj['jun'] = Strings_ParseLiteral('June').Result;
        obj['jul'] = Strings_ParseLiteral('July').Result;
        obj['aug'] = Strings_ParseLiteral('August').Result;
        obj['sep'] = Strings_ParseLiteral('September').Result;
        obj['oct'] = Strings_ParseLiteral('October').Result;
        obj['nov'] = Strings_ParseLiteral('November').Result;
        obj['dec'] = Strings_ParseLiteral('December').Result;
        obj['acmcs'] = Strings_ParseLiteral('ACM Computing Surveys').Result;
        obj['acta'] = Strings_ParseLiteral('Acta Informatica').Result;
        obj['cacm'] = Strings_ParseLiteral('Communications of the ACM').Result;
        obj['ibmjrd'] = Strings_ParseLiteral('IBM Journal of Research and Development').Result;
        obj['ibmsj'] = Strings_ParseLiteral('IBM Systems Journal').Result;
        obj['ieeese'] = Strings_ParseLiteral('IEEE Transactions on Software Engineering').Result;
        obj['ieeetc'] = Strings_ParseLiteral('IEEE Transactions on Computers').Result;
        obj['ieeetcad'] = Strings_ParseLiteral('IEEE Transactions on Computer-Aided Design of Integrated Circuits').Result;
        obj['ipl'] = Strings_ParseLiteral('Information Processing Letters').Result;
        obj['jacm'] = Strings_ParseLiteral('Journal of the ACM').Result;
        obj['jcss'] = Strings_ParseLiteral('Journal of Computer and System Sciences').Result;
        obj['scp'] = Strings_ParseLiteral('Science of Computer Programming').Result;
        obj['sicomp'] = Strings_ParseLiteral('SIAM Journal on Computing').Result;
        obj['tocs'] = Strings_ParseLiteral('ACM Transactions on Computer Systems').Result;
        obj['tods'] = Strings_ParseLiteral('ACM Transactions on Database Systems').Result;
        obj['tog'] = Strings_ParseLiteral('ACM Transactions on Graphics').Result;
        obj['toms'] = Strings_ParseLiteral('ACM Transactions on Mathematical Software').Result;
        obj['toois'] = Strings_ParseLiteral('ACM Transactions on Office Information Systems').Result;
        obj['toplas'] = Strings_ParseLiteral('ACM Transactions on Programming Languages and Systems').Result;
        obj['tcs'] = Strings_ParseLiteral('Theoretical Computer Science').Result;
        return obj;
    })(Helper.NewEmptyObject()) as ObjectModel_StrLitDict;

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
                    new Styles_Alpha_SortedEntry(entries[i], i,
                        Styles_Alpha.Macros));
            }
        }
        result.sort(Styles_Alpha_SortedEntry.Compare);
        Styles_AlphaImpl.FixNicknames(result);
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
        return Styles_AlphaImpl.ProcessEntry(myEntry);
    }

}
