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

/* This is different from the actual alpha.bst.
 * In many places, cases are kept instead of being changed to "t" case.
 */
class Styles_AlphaImpl
{
    private static sentence(text: string): string
    {
        return (text.length === 0
            ? ''
            : /[.?!]\}*$/.test(text)
            ? text + '\n'
            : text + '.\n');
    }

    private static clause(clause1: string, clause2: string): string
    {
        return (clause1.length === 0
            ? clause2
            : clause2.length === 0
            ? clause1
            : clause1 + ', ' + clause2);
    }

    private static field(entry: ObjectModel_Entry,
        field: string): Strings_Literal
    {
        const presence = entry.Fields[field];
        return presence || Strings_Literal.Empty;
    }

    private static emph(text: string): string
    {
        return (text.length === 0
            ? ''
            : '{\\em ' + text + '}');
    }

    private static readonly NameFormat =
        ObjectModel_ParsePersonNameFormat('{ff }{vv~}{ll}{, jj}');
    private static format_names(people: ObjectModel_PersonName[]): any
    {
        const format = this.NameFormat;
        const result = [];
        let etal = false;
        const ret = Helper.NewEmptyObject();
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
            ret.value = '';
            ret.count = 0;
            return ret;
        }
        if (etal)
        {
            ret.value = result.join(', ') + ' et~al.';
            ret.count = result.length + 1;
            return ret;
        }
        if (result.length === 1)
        {
            ret.value = result[0];
            ret.count = 1;
            return ret;
        }
        ret.value = result.slice(0, result.length - 1).join(', ') +
            ' and ' + result[result.length - 1];
        ret.count = result.length;
        return ret;
    }

    private static format_authors(entry: ObjectModel_Entry): string
    {
        return this.format_names(
            ObjectModel_ParsePersonNames(
            this.field(entry, 'author'))).value;
    }

    private static format_editors(entry: ObjectModel_Entry): string
    {
        const formatted = this.format_names(
            ObjectModel_ParsePersonNames(
            this.field(entry, 'editor')));
        return (formatted.count > 1
            ? formatted.value + ', editors'
            : formatted.value === 1
            ? formatted.value + ', editor'
            : '');
    }

    private static format_title(entry: ObjectModel_Entry): string
    {
        return this.field(entry, 'title').Raw;
    }

    private static n_dashify(text: string): string
    {
        return text.replace(/[ \t\v\f\r\n]*-+[ \t\v\f\r\n]*/g, '--');
    }

    private static readonly MonthNames = [
        '', 'January', 'February', 'March',
        'April', 'May', 'June', 'July', 'August',
        'September', 'October', 'November', 'December'];
    private static format_date(entry: ObjectModel_Entry): string
    {
        const year = this.field(entry, 'year').Raw;
        const month = this.field(entry, 'month').Raw;
        const monthNum = Styles_ResolveMonth(entry);
        if (monthNum != monthNum)
        {
            return month.length === 0 ? year : month + ' ' + year;
        }
        return (year.length !== 0
            ? this.MonthNames[monthNum] + ' ' + year
            : this.MonthNames[monthNum]);
    }

    private static format_btitle(entry: ObjectModel_Entry): string
    {
        return this.emph(this.field(entry, 'title').Raw);
    }

    private static format_bvolume(entry: ObjectModel_Entry): string
    {
        const volume = this.field(entry, 'volume').Raw;
        if (volume.length === 0)
        {
            return '';
        }
        const series = this.field(entry, 'series').Raw;
        return 'volume~' + volume + (series.length === 0
            ? ''
            : ' of ' + series);
    }

    private static format_number_series(entry: ObjectModel_Entry,
        insentence: boolean): string
    {
        const volume = this.field(entry, 'volume').Raw;
        if (volume.length !== 0)
        {
            return '';
        }
        const number = this.field(entry, 'number').Raw;
        const series = this.field(entry, 'series').Raw;
        if (number.length === 0)
        {
            return series;
        }
        return (insentence ? 'number~' : 'Number~') + number +
            (series.length !== 0 ? ' in ' + series : '');
    }

    private static format_edition(entry: ObjectModel_Entry)
    {
        const edition = this.field(entry, 'edition').Raw;
        return edition.length !== 0 ? edition + ' edition' : '';
    }

    private static format_pages(entry: ObjectModel_Entry): string
    {
        const pages = this.field(entry, 'pages').Raw;
        if (pages.length === 0)
        {
            return '';
        }
        return (/[-,]/.test(pages)
            ? 'pages ' + this.n_dashify(pages)
            : 'page ' + pages);
    }

    private static format_vol_num_pages(entry: ObjectModel_Entry): string
    {
        let result = this.field(entry, 'volume').Raw;
        const number = this.field(entry, 'number').Raw;
        if (number.length !== 0)
        {
            result += '(' + number + ')';
        }
        const pages = this.field(entry, 'pages').Raw;
        if (pages.length !== 0)
        {
            result += ':' + pages;
        }
        return result;
    }

    private static format_chapter_pages(entry: ObjectModel_Entry)
    {
        const chapter = this.field(entry, 'chapter').Raw;
        const pages = this.format_pages(entry);
        if (chapter.length === 0)
        {
            return pages;
        }
        const type = this.field(entry, 'type');
        const myType = (type.Raw.length === 0
            ? 'chapter' : type.ToLowerCase().Raw);
        return myType + ' ' + chapter +
            (pages.length !== 0 ? ', ' + pages : '');
    }

    private static format_in_ed_booktitle(entry: ObjectModel_Entry): string
    {
        const booktitle = this.field(entry, 'booktitle').Raw;
        if (booktitle.length === 0)
        {
            return '';
        }
        const editors = this.format_editors(entry);
        return 'In ' +
            (editors.length !== 0 ? editors + ', ' : '') +
            this.emph(booktitle);
    }

    private static readonly MastersThesisType =
        Strings_ParseLiteral("{M}aster's thesis").Result;
    private static readonly PhDThesisType =
        Strings_ParseLiteral('{P}h{D} thesis').Result;
    private static format_thesis_type(entry: ObjectModel_Entry,
        fallback: Strings_Literal): string
    {
        const type = this.field(entry, 'type');
        const myType = (type.Raw.length === 0 ? fallback : type);
        return myType.ToTitleCase().Raw;
    }

    private static readonly TRType =
        Strings_ParseLiteral('Technical report').Result;
    private static format_tr_number(entry: ObjectModel_Entry)
    {
        const type = this.field(entry, 'type');
        const myType = (type.Raw.length === 0 ? this.TRType : type);
        const number = this.field(entry, 'number').Raw;
        if (number.length === 0)
        {
            return myType.ToTitleCase().Raw;
        }
        return myType.Raw + '~' + number;
    }

    private static readonly CrossRefEditorFormat =
        ObjectModel_ParsePersonNameFormat('{vv~}{ll}');
    private static format_crossref_editor(entry: ObjectModel_Entry): string
    {
        const people = ObjectModel_ParsePersonNames(
            this.field(entry, 'editor'));
        const editors = [];
        let etal = false;
        for (const person of people)
        {
            if (person.IsEtal())
            {
                etal = true;
                continue;
            }
            const name = this.CrossRefEditorFormat.Format(person);
            if (name.length !== 0)
            {
                editors.push(name);
            }
        }
        if (editors.length === 0)
        {
            return '';
        }
        return (etal || editors.length > 2
            ? editors[0] + ' et~al.'
            : editors.length === 2
            ? editors[0] + ' and ' + editors[1]
            : editors[0]);
    }

    private static format_book_crossref(entry: ObjectModel_Entry): string
    {
        const crossref = this.field(entry, 'crossref').Raw;
        const volume = this.field(entry, 'volume').Raw;
        let result = (volume.length !== 0
            ? 'Volume~' + volume + ' of' : 'In');
        const series = this.field(entry, 'series').Raw;
        if (series.length !== 0)
        {
            result += ' ' + this.emph(series);
        }
        else
        {
            const editors = this.format_crossref_editor(entry);
            if (editors.length !== 0)
            {
                result += ' ' + editors;
            }
        }
        result += '~\\cite{' + crossref + '}';
        return result;
    }

    private static format_incoll_inproc_crossref(
        entry: ObjectModel_Entry): string
    {
        const crossref = this.field(entry, 'crossref').Raw;
        const booktitle = this.field(entry, 'booktitle').Raw;
        let result = 'In';
        if (booktitle.length !== 0)
        {
            result += ' ' + booktitle;
        }
        else
        {
            const editors = this.format_crossref_editor(entry);
            if (editors.length !== 0)
            {
                result += ' ' + editors;
            }
        }
        result += '~\\cite{' + crossref + '}';
        return result;
    }

    public static readonly EntryTypes = ['article', 'book',
        'booklet', 'inbook', 'incollection', 'inproceedings',
        'conference', 'manual', 'mastersthesis', 'misc',
        'phdthesis', 'proceedings', 'techreport', 'unpublished'];

    public static article(entry: ObjectModel_Entry): string
    {
        let result = '';
        result += this.sentence(this.format_authors(entry));
        result += this.sentence(this.format_title(entry));
        const crossref = this.field(entry, 'crossref').Raw;
        if (crossref.length === 0)
        {
            let journal = this.emph(this.field(entry, 'journal').Raw);
            journal = this.clause(journal, this.format_vol_num_pages(entry));
            journal = this.clause(journal, this.format_date(entry));
            if (journal.length !== 0)
            {
                journal = 'In ' + journal;
                result += this.sentence(journal);
            }
        }
        else
        {
            let journal = 'In';
            const jrnl = this.emph(this.field(entry, 'journal').Raw);
            if (jrnl.length !== 0)
            {
                journal += ' ' + jrnl;
            }
            journal += '~\\cite{' + crossref + '}';
            journal = this.clause(journal, this.format_pages(entry));
            result += this.sentence(journal);
        }
        result += this.sentence(this.field(entry, 'note').Raw);
        return result;
    }

    public static book(entry: ObjectModel_Entry): string
    {
        let result = this.sentence(this.format_authors(entry)
            || this.format_editors(entry));
        result += this.sentence(this.format_btitle(entry));
        let crossrefPublisher = undefined;
        const crossref = this.field(entry, 'crossref').Raw;
        if (crossref.length !== 0)
        {
            crossrefPublisher = this.format_book_crossref(entry);
        }
        else
        {
            result += this.sentence(this.format_bvolume(entry));
            result += this.sentence(this.format_number_series(entry, false));
            crossrefPublisher = this.clause(
                this.field(entry, 'publisher').Raw,
                this.field(entry, 'address').Raw);
        }
        result += this.sentence(this.clause(
            crossrefPublisher,
            this.clause(
                this.format_edition(entry),
                this.format_date(entry)
            )));
        result += this.sentence(this.field(entry, 'note').Raw);
        return result;
    }

    public static booklet(entry: ObjectModel_Entry): string
    {
        let result = this.sentence(this.format_authors(entry));
        const howpublishedAddress =
            this.sentence(this.field(entry, 'howpublished').Raw) +
            this.sentence(this.field(entry, 'address').Raw);
        if (howpublishedAddress.length !== 0)
        {
            result += this.sentence(this.format_title(entry));
            result += howpublishedAddress;
            result += this.sentence(this.format_date(entry));
        }
        else
        {
            result += this.sentence(this.clause(
                this.format_title(entry),
                this.format_date(entry)));
        }
        result += this.sentence(this.field(entry, 'note').Raw);
        return result;
    }

    public static inbook(entry: ObjectModel_Entry): string
    {
        let result = this.sentence(this.format_authors(entry)
            || this.format_editors(entry));
            let crossrefAddr = undefined;
            const crossref = this.field(entry, 'crossref').Raw;
        if (crossref.length !== 0)
        {
            result += this.sentence(this.clause(
                this.format_btitle(entry),
                this.format_chapter_pages(entry)));
            crossrefAddr = this.format_book_crossref(entry);
        }
        else
        {
            result += this.sentence(this.clause(this.clause(
                this.format_btitle(entry),
                this.format_bvolume(entry)),
                this.format_chapter_pages(entry)));
            result += this.sentence(this.format_number_series(entry, false));
            crossrefAddr = this.clause(
                this.field(entry, 'howpublished').Raw,
                this.field(entry, 'address').Raw);
        }
        result += this.sentence(this.clause(
            crossrefAddr,
            this.clause(
                this.format_edition(entry),
                this.format_date(entry)
            )));
        result += this.sentence(this.field(entry, 'note').Raw);
        return result;
    }

    public static incollection(entry: ObjectModel_Entry): string
    {
        let result = this.sentence(this.format_authors(entry));
        result += this.sentence(this.format_title(entry));
        const crossref = this.field(entry, 'crossref').Raw;
        if (crossref.length !== 0)
        {
            result += this.sentence(this.clause(
                this.format_incoll_inproc_crossref(entry),
                this.format_chapter_pages(entry)
            ));
        }
        else
        {
            const clause1 = this.clause(
                this.format_in_ed_booktitle(entry),
                this.format_bvolume(entry)
            );
            const clause2 = this.clause(
                this.format_number_series(entry, clause1.length === 0),
                this.format_chapter_pages(entry)
            );
            result += this.sentence(this.clause(clause1, clause2));
            result += this.sentence(this.clause(
                this.clause(
                    this.field(entry, 'howpublished').Raw,
                    this.field(entry, 'address').Raw
                ),
                this.clause(
                    this.format_edition(entry),
                    this.format_date(entry)
                )
            ));
        }
        result += this.sentence(this.field(entry, 'note').Raw);
        return result;
    }

    public static inproceedings(entry: ObjectModel_Entry): string
    {
        let result = this.sentence(this.format_authors(entry));
        result += this.sentence(this.format_title(entry));
        const crossref = this.field(entry, 'crossref').Raw;
        if (crossref.length !== 0)
        {
            result += this.sentence(this.clause(
                this.format_incoll_inproc_crossref(entry),
                this.format_pages(entry)
            ));
        }
        else
        {
            const clause1 = this.clause(
                this.format_in_ed_booktitle(entry),
                this.format_bvolume(entry)
            );
            const clause2 = this.clause(
                this.format_number_series(entry, clause1.length === 0),
                this.format_pages(entry)
            );
            const clause12 = this.clause(clause1, clause2);
            const orgpub = this.clause(
                this.field(entry, 'organization').Raw,
                this.field(entry, 'publisher').Raw);
            const date = this.format_date(entry);
            const address = this.field(entry, 'address').Raw;
            if (address.length !== 0)
            {
                result += this.sentence(this.clause(clause12, date));
                result += this.sentence(orgpub);
            }
            else if (orgpub.length !== 0)
            {
                result += this.sentence(clause12);
                result += this.sentence(this.clause(orgpub, date));
            }
            else
            {
                result += this.sentence(this.clause(clause12, date));
            }
        }
        result += this.sentence(this.field(entry, 'note').Raw);
        return result;
    }

    public static conference(entry: ObjectModel_Entry): string
    {
        return this.inproceedings(entry);
    }

    public static manual(entry: ObjectModel_Entry): string
    {
        const authors = this.format_authors(entry);
        const org = this.field(entry, 'organization').Raw;
        const addr = this.field(entry, 'address').Raw;
        let result = this.sentence(authors);
        if (authors.length === 0 && org.length !== 0)
        {
            result = this.sentence(this.clause(org, addr));
        }
        let midsentence = this.format_btitle(entry);
        if (authors.length === 0)
        {
            if (org.length === 0)
            {
                midsentence = this.clause(midsentence, addr);
            }
        }
        else if (org.length !== 0 || addr.length !== 0)
        {
            result += this.sentence(midsentence);
            midsentence = this.clause(org, addr);
        }
        midsentence = this.clause(midsentence, this.format_edition(entry));
        midsentence = this.clause(midsentence, this.format_date(entry));
        result += this.sentence(midsentence);
        result += this.sentence(this.field(entry, 'note').Raw);
        return result;
    }

    private static thesis(entry: ObjectModel_Entry,
        fallback: Strings_Literal): string
    {
        let result = this.sentence(this.format_authors(entry));
        result += this.sentence(this.format_title(entry));
        result += this.sentence(this.clause(
            this.clause(
                this.format_thesis_type(entry, fallback),
                this.field(entry, 'school').Raw
            ),
            this.clause(
                this.field(entry, 'address').Raw,
                this.format_date(entry)
            )
        ));
        result += this.sentence(this.field(entry, 'note').Raw);
        return result;
    }

    public static mastersthesis(entry: ObjectModel_Entry): string
    {
        return this.thesis(entry, this.MastersThesisType);
    }

    public static misc(entry: ObjectModel_Entry): string
    {
        let result = this.sentence(this.format_authors(entry));
        result += this.sentence(this.format_title(entry));
        result += this.sentence(this.clause(
            this.field(entry, 'howpublished').Raw,
            this.format_date(entry)));
        result += this.sentence(this.field(entry, 'note').Raw);
        return result;
    }

    public static phdthesis(entry: ObjectModel_Entry): string
    {
        return this.thesis(entry, this.PhDThesisType);
    }

    public static proceedings(entry: ObjectModel_Entry): string
    {
        const editors = this.format_editors(entry);
        const org = this.field(entry, 'organization').Raw;
        let result = this.sentence(editors || org);
        const btbv = this.clause(
            this.format_btitle(entry),
            this.format_bvolume(entry));
        const ns = this.format_number_series(entry, btbv.length === 0);
        const addr = this.field(entry, 'address').Raw;
        const date = this.format_date(entry);
        const pub = this.field(entry, 'publisher').Raw;
        if (addr.length !== 0)
        {
            result += this.sentence(this.clause(
                this.clause(btbv, ns),
                this.clause(addr, date)));
            result += this.sentence(this.clause(
                editors.length !== 0 ? org : '', pub));
        }
        else
        {
            const orgpub = (editors.length === 0 ? this.clause(org, pub) : pub);
            result += this.sentence(this.clause(
                this.clause(btbv, ns),
                this.clause(orgpub, date)));
        }
        result += this.sentence(this.field(entry, 'note').Raw);
        return result;
    }

    public static techreport(entry: ObjectModel_Entry): string
    {
        let result = this.sentence(this.format_authors(entry));
        result += this.sentence(this.format_title(entry));
        result += this.sentence(this.clause(
            this.clause(
                this.format_tr_number(entry),
                this.field(entry, 'institution').Raw
            ),
            this.clause(
                this.field(entry, 'address').Raw,
                this.format_date(entry)
            )
        ));
        result += this.sentence(this.field(entry, 'note').Raw);
        return result;
    }

    public static unpublished(entry: ObjectModel_Entry): string
    {
        let result = this.sentence(this.format_authors(entry));
        result += this.sentence(this.format_title(entry));
        result += this.sentence(this.format_date(entry));
        result += this.sentence(this.field(entry, 'note').Raw);
        return result;
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
                return key.PrefixRaw(3);
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

    public static GetEntryTeX(entry: Styles_Alpha_SortedEntry): string
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
        if (Styles_AlphaImpl.EntryTypes.indexOf(myEntry.Type) >= 0)
        {
            return ((Styles_AlphaImpl as any)[myEntry.Type] as Function).
                call(Styles_AlphaImpl, myEntry) as string;
        }
        return Styles_AlphaImpl.misc(myEntry);
    }
}
