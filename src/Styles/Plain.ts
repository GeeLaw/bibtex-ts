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
        this.Nickname = Strings_Literal.Empty;
        if (entry !== undefined)
        {
            const first: string[][] = [];
            const vonLast: string[][] = [];
            const jr: string[][] = [];
            Styles_Helper.CreateSortName(entry, first, vonLast, jr);
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

class Styles_PlainImpl
{
    public static fix_nicknames(
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
                    new Styles_Plain_SortedEntry(entries[i], i));
            }
        }
        result.sort(Styles_Plain_SortedEntry.Compare);
        Styles_PlainImpl.fix_nicknames(result);
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
        if (Styles_AlphaImpl.EntryTypes.indexOf(myEntry.Type) >= 0)
        {
            return ((Styles_AlphaImpl as any)[myEntry.Type] as Function).
                call(Styles_AlphaImpl, myEntry) as string;
        }
        return Styles_AlphaImpl.misc(myEntry);
    }

}
