type Styles_Abbrv_SortedEntry = Styles_Plain_SortedEntry;
type Styles_Abbrv_ReadonlySortedEntry = Readonly<Styles_Plain_SortedEntry>;

class Styles_AbbrvImpl
{
    public static ProcessEntry(entry: ObjectModel_Entry): string
    {
        const that: any = Styles_StandardStyle.Abbrv;
        if (Styles_StandardStyle.EntryTypes.indexOf(entry.Type) >= 0)
        {
            return that[entry.Type].call(that, entry) as string;
        }
        return that.misc(entry);
    }

    public static fix_nicknames(
        entries: Styles_Abbrv_SortedEntry[]): void
    {
        return Styles_PlainImpl.fix_nicknames(entries);
    }
}

class Styles_Abbrv
{
    public static readonly SortedEntry = Styles_Plain_SortedEntry;

    public static ProcessEntries(
        entries: Styles_EntryOrEntryData[]): Styles_Abbrv_ReadonlySortedEntry[]
    {
        const result: Styles_Abbrv_SortedEntry[] = [];
        if (entries instanceof Array)
        {
            const len = entries.length;
            for (let i = 0; i !== len; ++i)
            {
                result.push(
                    new Styles_Plain_SortedEntry(true, entries[i], i));
            }
        }
        result.sort(Styles_Plain_SortedEntry.Compare);
        Styles_AbbrvImpl.fix_nicknames(result);
        for (const item of result)
        {
            Helper.FreezeObject(item);
        }
        return result;
    }

    public static GetEntryNicknameTeX(
        entry: Styles_Abbrv_SortedEntry): string
    {
        if (!(entry instanceof Styles_Plain_SortedEntry))
        {
            return '';
        }
        return entry.Nickname.Raw;
    }

    public static GetEntryCitationTeX(
        entry: Styles_Abbrv_SortedEntry): string
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
        return Styles_AbbrvImpl.ProcessEntry(myEntry);
    }

}
