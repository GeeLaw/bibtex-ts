type Styles_EntryOrEntryData = ObjectModel_Entry | ObjectModel_EntryData;

class Styles_Alpha
{
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
     * A name is non-empty, if `GetLastName1Letter` is non-empty.
     * If `author` is present, it is used to resolve names.
     * Otherwise, if `editor` is present, it is used to resolve names.
     * Otherwise, the list of names is the empty list.
     * Case 1: All names are empty.
     *         If `key` field is present, the result is the prefix
     *         of that field of length (at most) 3.
     *         Otherwise, the result is the string `Anon`.
     * Case 2: Exactly 1 name is non-empty.
     *         The result is `GetLastName3Letters` on that name.
     * Case 3: 1 to 3 names are non-empty.
     *         The result is the join of `GetLastName1Letter` on them.
     * Case 4: More than 3 names are non-empty, `usePlus` is `false`.
     *         Same as case 3.
     * Case 5: More than 3 names are non-empty, `usePlus` is `true`.
     *         The result is the join of `GetLastName1Letter` on
     *         the first 3 names followed by a `+` sign.
     * 
     * @remarks The return value might well be longer than 3 for
     *          various reasons, including those specified in
     *          `GetLastName1Letter` and `GetLastName3Letters`.
     * 
     * @param usePlus Whether or not the list should be
     *                truncated if there are more than 3
     *                non-empty names.
     * @param entry   The `Entry` or `EntryData` object.
     */
    public static GetEntry3Letters(usePlus: boolean,
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
        for (const name of names)
        {
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
        if (result.length === 0)
        {
            const key = entry.Fields['key'];
            if (key !== undefined)
            {
                return key.Raw.substr(0, 3);
            }
            return 'Anon';
        }
        if (result.length === 1)
        {
            return ltr3;
        }
        if (result.length > 3 && !!usePlus)
        {
            return result[0] + result[1] + result[2] + '+';
        }
        return result.join('');
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
        if (entry instanceof ObjectModel_EntryData)
        {
            entry = entry.Resolve();
        }
        if (!(entry instanceof ObjectModel_Entry))
        {
            return '';
        }
        const year = entry.Fields['year'];
        if (year === undefined)
        {
            return '';
        }
        const match =
            /([0-9])?[^0-9]*([0-9])[^0-9]*$/.exec(year.PurifiedPedantic);
        return (match === null
            ? ''
            : match[1] !== undefined
            ? match[1] + match[2]
            : match[2]);
    }

    /**
     * `GetEntry3Letters` + `GetEntryYear2Digits`.
     * 
     * @param usePlus See `GetEntry3Letters`.
     * @param entry   The `Entry` or `EntryData` object.
     */
    public static GetEntryBaseNickname(usePlus: boolean,
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
        return Styles_Alpha.GetEntry3Letters(usePlus, entry) +
            Styles_Alpha.GetEntryYear2Digits(entry);
    }

    private static readonly NicknameSuffix =
        'abcdefghijklmnopqrstuvwxyzαβγδεζηθικλμξπρστφχψω';

    public static GetEntriesNicknames(usePlus: boolean,
        entries: Styles_EntryOrEntryData[]): string[]
    {
        const result: string[] = [];
        if (!(entries instanceof Array))
        {
            return result;
        }
        const ltr3: string[] = [];
        const yr2: string[] = [];
        const name1: any = Helper.NewEmptyObject();
        const name2: any = Helper.NewEmptyObject();
        usePlus = !!usePlus;
        /* Decide and count base nicknames. */
        for (let entry of entries)
        {
            if (entry instanceof ObjectModel_EntryData)
            {
                entry = entry.Resolve();
            }
            if (!(entry instanceof ObjectModel_Entry))
            {
                ltr3.push('');
                yr2.push('');
                continue;
            }
            const ltr3entry = Styles_Alpha.GetEntry3Letters(usePlus, entry);
            const yr2entry = Styles_Alpha.GetEntryYear2Digits(entry);
            ltr3.push(ltr3entry);
            yr2.push(yr2entry);
            const baseNickname = ltr3entry + yr2entry;
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
        for (let i = 0, len = ltr3.length; i !== len; ++i)
        {
            const ltr3entry = ltr3[i];
            const yr2entry = yr2[i];
            const baseNickname = ltr3entry + yr2entry;
            if (baseNickname.length === 0)
            {
                result.push('');
                continue;
            }
            if (name1[baseNickname] === 1)
            {
                result.push(baseNickname);
                continue;
            }
            const order = name2[baseNickname]++;
            if (order < suffix.length)
            {
                result.push(baseNickname + (yr2entry.length === 0
                    ? '-' + suffix[order]
                    : suffix[order]));
            }
            else
            {
                result.push(baseNickname + '-' + (order + 1));
            }
        }
        return result;
    }
}
