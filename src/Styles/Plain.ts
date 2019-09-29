type Styles_Plain_ReadonlySortedEntry = Readonly<Styles_Plain_SortedEntry>;

class Styles_Plain_SortedEntry implements Styles_IWithName, Styles_IWithDate
{
    public readonly Source: Styles_EntryOrEntryData | undefined;
    public readonly Entry: ObjectModel_Entry | undefined;
    public Nickname: Strings_Literal;
    public readonly First: string[][];
    public readonly vonLast: string[][];
    public readonly Jr: string[][];
    public readonly Year: number;
    public readonly Month: number;
    public readonly Title: string[];
    public readonly OriginalIndex: number;

    /**
     * Compares two `SortedEntry` objects within the same series.
     * `Anon` entries are put at the end.
     * 
     * The entries are sorted:
     * - In increasing order of names.
     * - In increasing order of date.
     * - In increasing order of title.
     * - In original order.
     */
    public static Compare(entry1: Styles_Plain_ReadonlySortedEntry,
        entry2: Styles_Plain_ReadonlySortedEntry): number
    {
        return (entry1.OriginalIndex === entry2.OriginalIndex
            ? 0
            : Styles_Helper.CompareNames(
                entry1, entry2
            ) || Styles_Helper.CompareDate(
                entry1, entry2
            ) || Styles_Helper.CompareWords(
                entry1.Title, entry2.Title
            ) || Styles_Helper.CompareNumbers(
                entry1.OriginalIndex,
                entry2.OriginalIndex
            ));
    }

    public constructor(abbrv: boolean,
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
        this.Nickname = Strings_Literal.Empty;
        if (entry !== undefined)
        {
            const first: string[][] = [];
            const vonLast: string[][] = [];
            const jr: string[][] = [];
            Styles_Helper.CreateSortName(entry, abbrv, first, vonLast, jr);
            this.First = Helper.FreezeObject(first);
            this.vonLast = Helper.FreezeObject(vonLast);
            this.Jr = Helper.FreezeObject(jr);
            this.Year = Styles_ResolveYear(entry);
            this.Month = Styles_ResolveMonth(entry);
            this.Title = Styles_Helper.ChopWords(entry, 'title');
        }
        else
        {
            const emptyArray = Styles_Helper.EmptyArray;
            this.First = emptyArray;
            this.vonLast = emptyArray;
            this.Jr = emptyArray;
            this.Year = Number.NaN;
            this.Month = Number.NaN;
            this.Title = emptyArray;
        }
        this.OriginalIndex = idx;
    }

}

/* This is different from the actual plain.bst.
 * In many places, cases are kept instead of being changed to "t" case.
 */
class Styles_PlainImpl
{
    public static ProcessEntry(entry: ObjectModel_Entry): string
    {
        const that: any = Styles_StandardStyle.Plain;
        if (Styles_StandardStyle.EntryTypes.indexOf(entry.Type) >= 0)
        {
            return that[entry.Type].call(that, entry) as string;
        }
        return that.misc(entry);
    }

    public static FixNicknames(
        entries: Styles_Plain_SortedEntry[]): void
    {
        let i = 0;
        for (const entry of entries)
        {
            const builder = new Strings_LiteralBuilder();
            builder.AddBasicPiece(new Strings_BasicPiece(
                new Strings_BasicPieceBuilder(
                    (++i).toString())));
            entry.Nickname = new Strings_Literal(builder);
        }
    }
}

class Styles_Plain
{
    public static readonly SortedEntry = Styles_Plain_SortedEntry;

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
        entries: Styles_EntryOrEntryData[]): Styles_Plain_ReadonlySortedEntry[]
    {
        const result: Styles_Plain_SortedEntry[] = [];
        if (entries instanceof Array)
        {
            const len = entries.length;
            for (let i = 0; i !== len; ++i)
            {
                result.push(
                    new Styles_Plain_SortedEntry(true, entries[i], i,
                        Styles_Plain.Macros));
            }
        }
        result.sort(Styles_Plain_SortedEntry.Compare);
        Styles_PlainImpl.FixNicknames(result);
        for (const item of result)
        {
            Helper.FreezeObject(item);
        }
        return result;
    }

    public static GetEntryNicknameTeX(
        entry: Styles_Plain_SortedEntry): string
    {
        if (!(entry instanceof Styles_Plain_SortedEntry))
        {
            return '';
        }
        return entry.Nickname.Raw;
    }

    public static GetEntryCitationTeX(
        entry: Styles_Plain_SortedEntry): string
    {
        if (!(entry instanceof Styles_Plain_SortedEntry))
        {
            return '';
        }
        const myEntry = entry.Entry;
        if (myEntry === undefined)
        {
            return '';
        }
        return Styles_PlainImpl.ProcessEntry(myEntry);
    }

}
