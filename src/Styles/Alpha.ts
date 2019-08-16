type Styles_EntryOrEntryData = ObjectModel_Entry | ObjectModel_EntryData;
type Styles_Alpha_ReadonlySortedEntry = Readonly<Styles_Alpha_SortedEntry>;

class Styles_Alpha_SortedEntry
{
    public readonly Source: Styles_EntryOrEntryData | undefined;
    public readonly Entry: ObjectModel_Entry | undefined;
    public Nickname: string;
    public Entry3LetterUpperCase: string;
    public readonly First: string[][];
    public readonly von: string[][];
    public readonly Last: string[][];
    public readonly Jr: string[][];
    public readonly Year: number;
    public readonly Month: number;
    public readonly OriginalIndex: number;

    private static CompareWords(
        words1: string[], words2: string[]): number
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

    private static CompareParts(parts1: string[][], parts2: string[][])
    {
        const l1 = parts1.length;
        const l2 = parts2.length;
        for (let i = 0; i !== l1 && i !== l2; ++i)
        {
            const result = Styles_Alpha_SortedEntry.CompareWords(
                parts1[i], parts2[i]);
            if (result)
            {
                return result;
            }
        }
        return l1 < l2 ? -1 : l1 > l2 ? 1 : 0;
    }

    private static CompareNumbers(n1: number, n2: number): number
    {
        return (n1 != n1
            ? n2 != n2
                ? 0 /* n1, n2 are NaN */
                : 1 /* n1 is NaN; n2 is a number */
            : n2 != n2
                ? -1 /* n1 is a number, n2 is NaN */
            : n1 < n2 ? -1 : n1 > n2 ? 1 : 0);
    }

    private static CompareStrings(str1: string, str2: string): number
    {
        return (str1 === ''
            ? str2 === '' ? 0 : 1
            : str2 === '' ? -1
            : str1 < str2 ? -1 : str1 > str2 ? 1 : 0);
    }

    /**
     * Compares two `SortedEntry` objects within the same series.
     * `Anon` entries are put at the end.
     * 
     * The entries are sorted:
     * - In alphabetical order of 3-letter (without `+`).
     * - In increasing order of `year`.
     * - In increasing order of `month`.
     * - In increasing order of Last parts of the names.
     * - In increasing order of von parts of the names.
     * - In increasing order of Jr parts of the names.
     * - In increasing order of First parts of the names.
     * - In original order.
     */
    public static Compare(entry1: Styles_Alpha_ReadonlySortedEntry,
        entry2: Styles_Alpha_ReadonlySortedEntry): number
    {
        return (entry1.OriginalIndex === entry2.OriginalIndex
            ? 0
            : Styles_Alpha_SortedEntry.CompareStrings(
                entry1.Entry3LetterUpperCase,
                entry2.Entry3LetterUpperCase
            ) || Styles_Alpha_SortedEntry.CompareNumbers(
                entry1.Year, entry2.Year
            ) || Styles_Alpha_SortedEntry.CompareNumbers(
                entry1.Month, entry2.Month
            ) || Styles_Alpha_SortedEntry.CompareParts(
                entry1.Last, entry2.Last
            ) || Styles_Alpha_SortedEntry.CompareParts(
                entry1.von, entry2.von
            ) || Styles_Alpha_SortedEntry.CompareParts(
                entry1.Jr, entry2.Jr
            ) || Styles_Alpha_SortedEntry.CompareParts(
                entry1.First, entry2.First
            ) || Styles_Alpha_SortedEntry.CompareNumbers(
                entry1.OriginalIndex, entry2.OriginalIndex)
            );
    }

    public static LaunderWords(name: ObjectModel_PersonName,
        target: ObjectModel_PersonNameFormatComponentTarget): string[]
    {
        const result: string[] = [];
        for (const word of name[target])
        {
            result.push(word.Purified.replace(/[a-z]+/g,
                function (x) { return x.toUpperCase(); }));
        }
        return Helper.FreezeObject(result);
    }

    public constructor(trunc: boolean,
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
        this.Nickname = '';
        if (entry !== undefined)
        {
            const last = [], first = [], von = [], jr = [];
            const people = entry.Fields['author'] || entry.Fields['editor'];
            for (const person of (people !== undefined
                ? ObjectModel_ParsePersonNames(people)
                : []))
            {
                if (person.IsEtal())
                {
                    continue;
                }
                first.push(
                    Styles_Alpha_SortedEntry.LaunderWords(person, 'First'));
                von.push(
                    Styles_Alpha_SortedEntry.LaunderWords(person, 'von'));
                last.push(
                    Styles_Alpha_SortedEntry.LaunderWords(person, 'Last'));
                jr.push(
                    Styles_Alpha_SortedEntry.LaunderWords(person, 'Jr'));
            }
            this.Nickname = Styles_Alpha.GetEntryBaseNickname(
                trunc, entry);
            this.Entry3LetterUpperCase =
                Styles_Alpha.GetEntry3Letters(trunc, true, entry).replace(
                /[a-z]+/g, function (x) { return x.toUpperCase() });
            this.First = Helper.FreezeObject(first);
            this.von = Helper.FreezeObject(von);
            this.Last = Helper.FreezeObject(last);
            this.Jr = Helper.FreezeObject(jr);
            this.Year = Styles_ResolveYear(entry);
            this.Month = Styles_ResolveMonth(entry);
        }
        else
        {
            const emptyArray = Helper.FreezeObject([]);
            this.Nickname = '';
            this.Entry3LetterUpperCase = '';
            this.First = emptyArray;
            this.von = emptyArray;
            this.Last = emptyArray;
            this.Jr = emptyArray;
            this.Year = Number.NaN;
            this.Month = Number.NaN;
        }
        this.OriginalIndex = idx;
    }

}

class Styles_Alpha
{
    public static readonly SortedEntry = Styles_Alpha_SortedEntry;

    /**
     * Gets the last name in 1-letter format.
     * A word is non-empty if its purified form is non-empty.
     * Let `w` be the first non-empty word in the last name.
     * If the length-1 prefix of `w` is a non-empty word,
     * the result is the purified form of this prefix.
     * Otherwise, the result is the prefix of the purified
     * form of `w` of length 1.
     * If the last name only has empty words, the result
     * is the empty string.
     * 
     * @remarks The return value might have more than 1
     * letters. For example, if the first word in the last
     * name is `{\relax Ch}ristophe`, then the return value
     * will be `Ch`.
     * 
     * @param name The `PersonName` object.
     */
    private static GetLastName1Letter(
        name: ObjectModel_PersonName): string
    {
        for (const lastName of name.Last)
        {
            const pfx1 = lastName.Prefix(1).Purified ||
                lastName.Purified.substr(0, 1);
            if (pfx1.length !== 0)
            {
                return pfx1;
            }
        }
        return '';
    }

    private static readonly LastNameInitialsFormat =
        ObjectModel_ParsePersonNameFormat('{l{}}');
    /**
     * Gets the last name in 3-letter format.
     * A word is non-empty if its purified form is non-empty.
     * Case 1: Only 1 non-empty word in the last name.
     *         If the purified form of the length-1 prefix
     *         of the word is of length greater than 1,
     *         the result is that purified string.
     *         Otherwise, it's the prefix of the purified
     *         form of the word of length (at most) 3.
     * Case 2: More than 1 non-empty words in the last name.
     *         The result is the name formatted in `{l{}}`.
     * Case 3: 0 non-empty words in the last name.
     *         The result is the empty string.
     * 
     * @remarks The return value might be longer than 3.
     *          If there are more than 3 non-empty words,
     *          the result will be longer than 3.
     *          If there is exactly 1 non-empty word,
     *          the result might be longer than 3.
     *          E.g., the word is `{\relax ABCD}E`. 
     * 
     * @param name The `PersonName` object.
     */
    private static GetLastName3Letters(
        name: ObjectModel_PersonName): string
    {
        let ltr3 = '';
        let nonEmptyParts = 0;
        for (const lastName of name.Last)
        {
            if (lastName.Purified.length !== 0)
            {
                if (++nonEmptyParts > 1)
                {
                    break;
                }
                const pfx1 = lastName.Prefix(1).Purified;
                const pfx3 = lastName.Purified.substr(0, 3);
                ltr3 = (pfx1.length <= 1 ? pfx3 : pfx1);
            }
        }
        if (nonEmptyParts <= 1)
        {
            return ltr3;
        }
        return Styles_Alpha.LastNameInitialsFormat.Format(name);
    }

    /**
     * Gets the 3-letter nickname of the entry.
     * 
     * @remarks The return value might well be longer than 3 for
     *          various reasons, including those specified in
     *          `GetLastName1Letter` and `GetLastName3Letters`.
     * 
     * @param trunc  Whether or not the list should be
     *               truncated if there are more than 4
     *               non-empty names.
     * @param noPlus Whether or not the "and-others" `+`
     *               sign should be suppressed.
     * @param entry  The `Entry` or `EntryData` object.
     */
    public static GetEntry3Letters(trunc: boolean,
        noPlus: boolean,
        entry: Styles_EntryOrEntryData): string
    {
        if (entry instanceof ObjectModel_EntryData)
        {
            entry = entry.Resolve();
        }
        if (!(entry instanceof ObjectModel_Entry))
        {
            return '';
        }
        const people = entry.Fields['author'] ||
            entry.Fields['editor'];
        const names = (people === undefined ? []
            : ObjectModel_ParsePersonNames(people));
        const result = [];
        let ltr3 = '';
        let etal: '' | '+' = '';
        for (const name of names)
        {
            /* "others" is always written as "+". */
            if (name.IsEtal())
            {
                etal = '+';
                continue;
            }
            const ltr1 = Styles_Alpha.GetLastName1Letter(name);
            if (ltr1.length !== 0)
            {
                result.push(ltr1);
                if (result.length === 1)
                {
                    ltr3 = Styles_Alpha.GetLastName3Letters(name);
                }
            }
        }
        /* All names are empty or etal. */
        if (result.length === 0)
        {
            const key = entry.Fields['key'];
            if (key !== undefined)
            {
                return key.Raw.substr(0, 3);
            }
            return '';
        }
        /* There are 5+ non-empty non-etal names,
         * or there are 4 non-empty non-etal names and 1 etal.
         * In short, the length is exceeding 4 (incl. the "+").
         * In this case, we might want to truncate the list.
         */
        if ((result.length > 4 || (result.length === 4 && etal === '+'))
            && !!trunc)
        {
            while (result.length !== 3)
            {
                result.pop();
            }
            etal = '+';
        }
        if (!!noPlus)
        {
            etal = '';
        }
        return (result.length === 1
            ? ltr3
            : result.join('')) + etal;
    }

    /**
     * Gets the year of the entry in 2 digits.
     * If `year` contains exactly 1 digit, that digit is returned.
     * If there is no year information, or `year` contains
     * less than 2 digits, the result is the empty string.
     * 
     * @param entry The `Entry` or `EntryData` object.
     */
    public static GetEntryYear2Digits(
        entry: Styles_EntryOrEntryData): string
    {
        let year = Styles_ResolveYear(entry);
        if (year != year)
        {
            return '';
        }
        if (year < 0)
        {
            year = -year;
        }
        if (year < 10)
        {
            return year.toString();
        }
        year %= 100;
        return (year < 10
            ? '0' + year.toString()
            : year.toString());
    }

    /**
     * `GetEntry3Letters` + `GetEntryYear2Digits`.
     * If `GetEntry3Letters` is the empty string,
     * `Anon` is used instead.
     * If `entry` is not an entry, the empty string
     * is returned.
     * 
     * @param trunc See `GetEntry3Letters`.
     * @param entry   The `Entry` or `EntryData` object.
     */
    public static GetEntryBaseNickname(trunc: boolean,
        entry: Styles_EntryOrEntryData): string
    {
        if (entry instanceof ObjectModel_EntryData)
        {
            entry = entry.Resolve();
        }
        if (!(entry instanceof ObjectModel_Entry))
        {
            return '';
        }
        return (Styles_Alpha.GetEntry3Letters(trunc, false, entry)
            || 'Anon') + Styles_Alpha.GetEntryYear2Digits(entry);
    }

    public static readonly NicknameSuffix =
        'abcdefghijklmnopqrstuvwxyzαβγδεζηθικλμξπρστφχψω';

    /**
     * Gets the nicknames with suffices to prevent collisions.
     * This method cannot be called twice for the same array.
     * 
     * @param entries An array of `SortedEntry` objects.
     */
    private static GetEntriesNicknames(
        entries: Styles_Alpha_SortedEntry[]): void
    {
        const name1: any = Helper.NewEmptyObject();
        const name2: any = Helper.NewEmptyObject();
        /* Count base nicknames. */
        for (const entry of entries)
        {
            const baseNickname = entry.Nickname;
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
        const suffix = Styles_Alpha.NicknameSuffix;
        /* Append suffices for collisions. */
        for (const entry of entries)
        {
            const baseNickname = entry.Nickname;
            if (baseNickname.length === 0 ||
                name1[baseNickname] <= 1)
            {
                continue;
            }
            const order = name2[baseNickname]++;
            entry.Nickname +=
                (order < suffix.length
                    ? /[0-9]$/.test(baseNickname)
                        ? suffix[order]
                        : '-' + suffix[order]
                    : '-' + (order + 1).toString());
        }
    }

    public static SortEntriesAndGetNicknames(
        trunc: boolean,
        entries: Styles_EntryOrEntryData[]): Styles_Alpha_ReadonlySortedEntry[]
    {
        const result: Styles_Alpha_SortedEntry[] = [];
        if (entries instanceof Array)
        {
            const len = entries.length;
            for (let i = 0; i !== len; ++i)
            {
                result.push(
                    new Styles_Alpha_SortedEntry(trunc, entries[i], i));
            }
        }
        result.sort(Styles_Alpha_SortedEntry.Compare);
        Styles_Alpha.GetEntriesNicknames(result);
        for (const item of result)
        {
            Helper.FreezeObject(item);
        }
        return result;
    }
}
