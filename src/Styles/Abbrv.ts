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

    public static FixNicknames(
        entries: Styles_Abbrv_SortedEntry[]): void
    {
        return Styles_PlainImpl.FixNicknames(entries);
    }
}

class Styles_Abbrv
{
    public static readonly SortedEntry = Styles_Plain_SortedEntry;

    public static readonly Macros: ObjectModel_StrLitDict = (function (obj)
    {
        obj['jan'] = Strings_ParseLiteral('Jan.').Result;
        obj['feb'] = Strings_ParseLiteral('Feb.').Result;
        obj['mar'] = Strings_ParseLiteral('Mar.').Result;
        obj['apr'] = Strings_ParseLiteral('Apr.').Result;
        obj['may'] = Strings_ParseLiteral('May').Result;
        obj['jun'] = Strings_ParseLiteral('June').Result;
        obj['jul'] = Strings_ParseLiteral('July').Result;
        obj['aug'] = Strings_ParseLiteral('Aug.').Result;
        obj['sep'] = Strings_ParseLiteral('Sept.').Result;
        obj['oct'] = Strings_ParseLiteral('Oct.').Result;
        obj['nov'] = Strings_ParseLiteral('Nov.').Result;
        obj['dec'] = Strings_ParseLiteral('Dec.').Result;
        obj['acmcs'] = Strings_ParseLiteral('ACM Comput. Surv.').Result;
        obj['acta'] = Strings_ParseLiteral('Acta Inf.').Result;
        obj['cacm'] = Strings_ParseLiteral('Commun. ACM').Result;
        obj['ibmjrd'] = Strings_ParseLiteral('IBM J. Res. Dev.').Result;
        obj['ibmsj'] = Strings_ParseLiteral('IBM Syst.~J.').Result;
        obj['ieeese'] = Strings_ParseLiteral('IEEE Trans. Softw. Eng.').Result;
        obj['ieeetc'] = Strings_ParseLiteral('IEEE Trans. Comput.').Result;
        obj['ieeetcad'] = Strings_ParseLiteral('IEEE Trans. Comput.-Aided Design Integrated Circuits').Result;
        obj['ipl'] = Strings_ParseLiteral('Inf. Process. Lett.').Result;
        obj['jacm'] = Strings_ParseLiteral('J.~ACM').Result;
        obj['jcss'] = Strings_ParseLiteral('J.~Comput. Syst. Sci.').Result;
        obj['scp'] = Strings_ParseLiteral('Sci. Comput. Programming').Result;
        obj['sicomp'] = Strings_ParseLiteral('SIAM J. Comput.').Result;
        obj['tocs'] = Strings_ParseLiteral('ACM Trans. Comput. Syst.').Result;
        obj['tods'] = Strings_ParseLiteral('ACM Trans. Database Syst.').Result;
        obj['tog'] = Strings_ParseLiteral('ACM Trans. Gr.').Result;
        obj['toms'] = Strings_ParseLiteral('ACM Trans. Math. Softw.').Result;
        obj['toois'] = Strings_ParseLiteral('ACM Trans. Office Inf. Syst.').Result;
        obj['toplas'] = Strings_ParseLiteral('ACM Trans. Prog. Lang. Syst.').Result;
        obj['tcs'] = Strings_ParseLiteral('Theoretical Comput. Sci.').Result;
        return obj;
    })(Helper.NewEmptyObject()) as ObjectModel_StrLitDict;

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
                    new Styles_Plain_SortedEntry(true, entries[i], i,
                        Styles_Abbrv.Macros));
            }
        }
        result.sort(Styles_Plain_SortedEntry.Compare);
        Styles_AbbrvImpl.FixNicknames(result);
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
