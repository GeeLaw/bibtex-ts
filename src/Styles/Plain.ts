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

/* This is different from the actual plain.bst.
 * In many places, cases are kept instead of being changed to "t" case.
 */
class Styles_PlainImpl
{
    private static format_names(
        people: ObjectModel_PersonName[]): Styles_FormattedNames
    {
        return Styles_Helper.format_names(
            Styles_Helper.NameFormat_ffvvlljj,
            people);
    }

    private static format_authors(entry: ObjectModel_Entry): string
    {
        return this.format_names(
            ObjectModel_ParsePersonNames(
            Styles_Helper.field(entry, 'author'))).Value;
    }

    private static format_editors(entry: ObjectModel_Entry): string
    {
        const formatted = this.format_names(
            ObjectModel_ParsePersonNames(
            Styles_Helper.field(entry, 'editor')));
        return (formatted.Count > 1
            ? formatted.Value + ', editors'
            : formatted.Count === 1
            ? formatted.Value + ', editor'
            : '');
    }

    private static format_title(entry: ObjectModel_Entry): string
    {
        return Styles_Helper.field(entry, 'title').Raw;
    }

    private static format_date(entry: ObjectModel_Entry): string
    {
        const year = Styles_Helper.field(entry, 'year').Raw;
        const month = Styles_Helper.field(entry, 'month').Raw;
        const monthNum = Styles_ResolveMonth(entry);
        if (monthNum != monthNum)
        {
            return month.length === 0 ? year : month + ' ' + year;
        }
        return (year.length !== 0
            ? Styles_Helper.MonthNamesLong[monthNum] + ' ' + year
            : Styles_Helper.MonthNamesLong[monthNum]);
    }

    private static format_btitle(entry: ObjectModel_Entry): string
    {
        return Styles_Helper.emph(
            Styles_Helper.field(entry, 'title').Raw);
    }

    private static format_bvolume(entry: ObjectModel_Entry): string
    {
        const volume = Styles_Helper.field(entry, 'volume').Raw;
        if (volume.length === 0)
        {
            return '';
        }
        const series = Styles_Helper.field(entry, 'series').Raw;
        return 'volume~' + volume + (series.length === 0
            ? ''
            : ' of ' + series);
    }

    private static format_number_series(entry: ObjectModel_Entry,
        insentence: boolean): string
    {
        const volume = Styles_Helper.field(entry, 'volume').Raw;
        if (volume.length !== 0)
        {
            return '';
        }
        const number = Styles_Helper.field(entry, 'number').Raw;
        const series = Styles_Helper.field(entry, 'series').Raw;
        if (number.length === 0)
        {
            return series;
        }
        return (insentence ? 'number~' : 'Number~') + number +
            (series.length !== 0 ? ' in ' + series : '');
    }

    private static format_edition(entry: ObjectModel_Entry)
    {
        const edition = Styles_Helper.field(entry, 'edition').Raw;
        return edition.length !== 0 ? edition + ' edition' : '';
    }

    private static format_pages(entry: ObjectModel_Entry): string
    {
        const pages = Styles_Helper.field(entry, 'pages').Raw;
        if (pages.length === 0)
        {
            return '';
        }
        return (/[-,]/.test(pages)
            ? 'pages ' + Styles_Helper.n_dashify(pages)
            : 'page ' + pages);
    }

    private static format_vol_num_pages(entry: ObjectModel_Entry): string
    {
        let result = Styles_Helper.field(entry, 'volume').Raw;
        const number = Styles_Helper.field(entry, 'number').Raw;
        if (number.length !== 0)
        {
            result += '(' + number + ')';
        }
        const pages = Styles_Helper.field(entry, 'pages').Raw;
        if (pages.length !== 0)
        {
            result += ':';
            result += (/[-,]/.test(pages)
                ? Styles_Helper.n_dashify(pages)
                : pages);
        }
        return result;
    }

    private static format_chapter_pages(entry: ObjectModel_Entry)
    {
        const chapter = Styles_Helper.field(entry, 'chapter').Raw;
        const pages = this.format_pages(entry);
        if (chapter.length === 0)
        {
            return pages;
        }
        const type = Styles_Helper.field(entry, 'type');
        const myType = (type.Raw.length === 0
            ? 'chapter' : type.ToLowerCase().Raw);
        return myType + ' ' + chapter +
            (pages.length !== 0 ? ', ' + pages : '');
    }

    private static format_in_ed_booktitle(entry: ObjectModel_Entry): string
    {
        const booktitle = Styles_Helper.field(entry, 'booktitle').Raw;
        if (booktitle.length === 0)
        {
            return '';
        }
        const editors = this.format_editors(entry);
        return 'In ' +
            (editors.length !== 0 ? editors + ', ' : '') +
            Styles_Helper.emph(booktitle);
    }

    private static readonly MastersThesisType =
        Strings_ParseLiteral("{M}aster's thesis").Result;
    private static readonly PhDThesisType =
        Strings_ParseLiteral('{P}h{D} thesis').Result;
    private static format_thesis_type(entry: ObjectModel_Entry,
        fallback: Strings_Literal): string
    {
        const type = Styles_Helper.field(entry, 'type');
        const myType = (type.Raw.length === 0 ? fallback : type);
        return myType.ToTitleCase().Raw;
    }

    private static readonly TRType =
        Strings_ParseLiteral('Technical Report').Result;
    private static format_tr_number(entry: ObjectModel_Entry)
    {
        const type = Styles_Helper.field(entry, 'type');
        const myType = (type.Raw.length === 0 ? this.TRType : type);
        const number = Styles_Helper.field(entry, 'number').Raw;
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
            Styles_Helper.field(entry, 'editor'));
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
        const crossref = Styles_Helper.field(entry, 'crossref').Raw;
        const volume = Styles_Helper.field(entry, 'volume').Raw;
        let result = (volume.length !== 0
            ? 'Volume~' + volume + ' of' : 'In');
        const series = Styles_Helper.field(entry, 'series').Raw;
        if (series.length !== 0)
        {
            result += ' ' + Styles_Helper.emph(series);
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
        const crossref = Styles_Helper.field(entry, 'crossref').Raw;
        const booktitle = Styles_Helper.field(entry, 'booktitle').Raw;
        let result = 'In';
        if (booktitle.length !== 0)
        {
            result += ' ' + Styles_Helper.emph(booktitle);
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
        result += Styles_Helper.sentence(this.format_authors(entry));
        result += Styles_Helper.sentence(this.format_title(entry));
        const crossref = Styles_Helper.field(entry, 'crossref').Raw;
        if (crossref.length === 0)
        {
            let journal = Styles_Helper.emph(
                Styles_Helper.field(entry, 'journal').Raw);
            journal = Styles_Helper.clause(journal,
                this.format_vol_num_pages(entry));
            journal = Styles_Helper.clause(journal,
                this.format_date(entry));
            result += Styles_Helper.sentence(journal);
        }
        else
        {
            let journal = 'In';
            const jrnl = Styles_Helper.emph(
                Styles_Helper.field(entry, 'journal').Raw);
            if (jrnl.length !== 0)
            {
                journal += ' ' + jrnl;
            }
            journal += '~\\cite{' + crossref + '}';
            journal = Styles_Helper.clause(journal,
                this.format_pages(entry));
            result += Styles_Helper.sentence(journal);
        }
        result += Styles_Helper.sentence(
            Styles_Helper.field(entry, 'note').Raw);
        return result;
    }

    public static book(entry: ObjectModel_Entry): string
    {
        let result = Styles_Helper.sentence(this.format_authors(entry)
            || this.format_editors(entry));
        result += Styles_Helper.sentence(this.format_btitle(entry));
        let crossrefPublisher = undefined;
        const crossref = Styles_Helper.field(entry, 'crossref').Raw;
        if (crossref.length !== 0)
        {
            crossrefPublisher = this.format_book_crossref(entry);
        }
        else
        {
            result += Styles_Helper.sentence(this.format_bvolume(entry));
            result += Styles_Helper.sentence(
                this.format_number_series(entry, false));
            crossrefPublisher = Styles_Helper.clause(
                Styles_Helper.field(entry, 'publisher').Raw,
                Styles_Helper.field(entry, 'address').Raw);
        }
        result += Styles_Helper.sentence(Styles_Helper.clause(
            crossrefPublisher,
            Styles_Helper.clause(
                this.format_edition(entry),
                this.format_date(entry)
            )));
        result += Styles_Helper.sentence(
            Styles_Helper.field(entry, 'note').Raw);
        return result;
    }

    public static booklet(entry: ObjectModel_Entry): string
    {
        let result = Styles_Helper.sentence(
            this.format_authors(entry));
        const howpublishedAddress =
            Styles_Helper.sentence(
                Styles_Helper.field(entry, 'howpublished').Raw) +
            Styles_Helper.sentence(
                Styles_Helper.field(entry, 'address').Raw);
        if (howpublishedAddress.length !== 0)
        {
            result += Styles_Helper.sentence(this.format_title(entry));
            result += howpublishedAddress;
            result += Styles_Helper.sentence(this.format_date(entry));
        }
        else
        {
            result += Styles_Helper.sentence(Styles_Helper.clause(
                this.format_title(entry),
                this.format_date(entry)));
        }
        result += Styles_Helper.sentence(
            Styles_Helper.field(entry, 'note').Raw);
        return result;
    }

    public static inbook(entry: ObjectModel_Entry): string
    {
        let result = Styles_Helper.sentence(this.format_authors(entry)
            || this.format_editors(entry));
            let crossrefAddr = undefined;
            const crossref = Styles_Helper.field(entry, 'crossref').Raw;
        if (crossref.length !== 0)
        {
            result += Styles_Helper.sentence(Styles_Helper.clause(
                this.format_btitle(entry),
                this.format_chapter_pages(entry)));
            crossrefAddr = this.format_book_crossref(entry);
        }
        else
        {
            result += Styles_Helper.sentence(
                Styles_Helper.clause(Styles_Helper.clause(
                this.format_btitle(entry),
                this.format_bvolume(entry)),
                this.format_chapter_pages(entry)));
            result += Styles_Helper.sentence(
                this.format_number_series(entry, false));
            crossrefAddr = Styles_Helper.clause(
                Styles_Helper.field(entry, 'howpublished').Raw,
                Styles_Helper.field(entry, 'address').Raw);
        }
        result += Styles_Helper.sentence(Styles_Helper.clause(
            crossrefAddr,
            Styles_Helper.clause(
                this.format_edition(entry),
                this.format_date(entry)
            )));
        result += Styles_Helper.sentence(
            Styles_Helper.field(entry, 'note').Raw);
        return result;
    }

    public static incollection(entry: ObjectModel_Entry): string
    {
        let result = Styles_Helper.sentence(this.format_authors(entry));
        result += Styles_Helper.sentence(this.format_title(entry));
        const crossref = Styles_Helper.field(entry, 'crossref').Raw;
        if (crossref.length !== 0)
        {
            result += Styles_Helper.sentence(Styles_Helper.clause(
                this.format_incoll_inproc_crossref(entry),
                this.format_chapter_pages(entry)
            ));
        }
        else
        {
            const clause1 = Styles_Helper.clause(
                this.format_in_ed_booktitle(entry),
                this.format_bvolume(entry)
            );
            const clause2 = Styles_Helper.clause(
                this.format_number_series(entry, clause1.length === 0),
                this.format_chapter_pages(entry)
            );
            result += Styles_Helper.sentence(
                Styles_Helper.clause(clause1, clause2));
            result += Styles_Helper.sentence(Styles_Helper.clause(
                Styles_Helper.clause(
                    Styles_Helper.field(entry, 'howpublished').Raw,
                    Styles_Helper.field(entry, 'address').Raw
                ),
                Styles_Helper.clause(
                    this.format_edition(entry),
                    this.format_date(entry)
                )
            ));
        }
        result += Styles_Helper.sentence(
            Styles_Helper.field(entry, 'note').Raw);
        return result;
    }

    public static inproceedings(entry: ObjectModel_Entry): string
    {
        let result = Styles_Helper.sentence(this.format_authors(entry));
        result += Styles_Helper.sentence(this.format_title(entry));
        const crossref = Styles_Helper.field(entry, 'crossref').Raw;
        if (crossref.length !== 0)
        {
            result += Styles_Helper.sentence(Styles_Helper.clause(
                this.format_incoll_inproc_crossref(entry),
                this.format_pages(entry)
            ));
        }
        else
        {
            const clause1 = Styles_Helper.clause(
                this.format_in_ed_booktitle(entry),
                this.format_bvolume(entry)
            );
            const clause2 = Styles_Helper.clause(
                this.format_number_series(entry, clause1.length === 0),
                this.format_pages(entry)
            );
            const clause12 = Styles_Helper.clause(clause1, clause2);
            const orgpub = Styles_Helper.clause(
                Styles_Helper.field(entry, 'organization').Raw,
                Styles_Helper.field(entry, 'publisher').Raw);
            const date = this.format_date(entry);
            const address = Styles_Helper.field(entry, 'address').Raw;
            if (address.length !== 0)
            {
                result += Styles_Helper.sentence(Styles_Helper.clause(
                    clause12,
                    Styles_Helper.clause(address, date)));
                result += Styles_Helper.sentence(orgpub);
            }
            else if (orgpub.length !== 0)
            {
                result += Styles_Helper.sentence(clause12);
                result += Styles_Helper.sentence(
                    Styles_Helper.clause(orgpub, date));
            }
            else
            {
                result += Styles_Helper.sentence(
                    Styles_Helper.clause(clause12, date));
            }
        }
        result += Styles_Helper.sentence(
            Styles_Helper.field(entry, 'note').Raw);
        return result;
    }

    public static conference(entry: ObjectModel_Entry): string
    {
        return this.inproceedings(entry);
    }

    public static manual(entry: ObjectModel_Entry): string
    {
        const authors = this.format_authors(entry);
        const org = Styles_Helper.field(entry, 'organization').Raw;
        const addr = Styles_Helper.field(entry, 'address').Raw;
        let result = Styles_Helper.sentence(authors);
        if (authors.length === 0 && org.length !== 0)
        {
            result = Styles_Helper.sentence(
                Styles_Helper.clause(org, addr));
        }
        let midsentence = this.format_btitle(entry);
        if (authors.length === 0)
        {
            if (org.length === 0)
            {
                midsentence = Styles_Helper.clause(midsentence, addr);
            }
        }
        else if (org.length !== 0 || addr.length !== 0)
        {
            result += Styles_Helper.sentence(midsentence);
            midsentence = Styles_Helper.clause(org, addr);
        }
        midsentence = Styles_Helper.clause(midsentence,
            this.format_edition(entry));
        midsentence = Styles_Helper.clause(midsentence,
            this.format_date(entry));
        result += Styles_Helper.sentence(midsentence);
        result += Styles_Helper.sentence(
            Styles_Helper.field(entry, 'note').Raw);
        return result;
    }

    private static thesis(entry: ObjectModel_Entry,
        fallback: Strings_Literal): string
    {
        let result = Styles_Helper.sentence(this.format_authors(entry));
        result += Styles_Helper.sentence(this.format_title(entry));
        result += Styles_Helper.sentence(Styles_Helper.clause(
            Styles_Helper.clause(
                this.format_thesis_type(entry, fallback),
                Styles_Helper.field(entry, 'school').Raw
            ),
            Styles_Helper.clause(
                Styles_Helper.field(entry, 'address').Raw,
                this.format_date(entry)
            )
        ));
        result += Styles_Helper.sentence(
            Styles_Helper.field(entry, 'note').Raw);
        return result;
    }

    public static mastersthesis(entry: ObjectModel_Entry): string
    {
        return this.thesis(entry, this.MastersThesisType);
    }

    public static misc(entry: ObjectModel_Entry): string
    {
        let result = Styles_Helper.sentence(this.format_authors(entry));
        result += Styles_Helper.sentence(this.format_title(entry));
        result += Styles_Helper.sentence(Styles_Helper.clause(
            Styles_Helper.field(entry, 'howpublished').Raw,
            this.format_date(entry)));
        result += Styles_Helper.sentence(
            Styles_Helper.field(entry, 'note').Raw);
        return result;
    }

    public static phdthesis(entry: ObjectModel_Entry): string
    {
        return this.thesis(entry, this.PhDThesisType);
    }

    public static proceedings(entry: ObjectModel_Entry): string
    {
        const editors = this.format_editors(entry);
        const org = Styles_Helper.field(entry, 'organization').Raw;
        let result = Styles_Helper.sentence(editors || org);
        const btbv = Styles_Helper.clause(
            this.format_btitle(entry),
            this.format_bvolume(entry));
        const ns = this.format_number_series(entry, btbv.length === 0);
        const addr = Styles_Helper.field(entry, 'address').Raw;
        const date = this.format_date(entry);
        const pub = Styles_Helper.field(entry, 'publisher').Raw;
        if (addr.length !== 0)
        {
            result += Styles_Helper.sentence(Styles_Helper.clause(
                Styles_Helper.clause(btbv, ns),
                Styles_Helper.clause(addr, date)));
            result += Styles_Helper.sentence(Styles_Helper.clause(
                editors.length !== 0 ? org : '', pub));
        }
        else
        {
            const orgpub = (editors.length === 0
                ? Styles_Helper.clause(org, pub)
                : pub);
            result += Styles_Helper.sentence(Styles_Helper.clause(
                Styles_Helper.clause(btbv, ns),
                Styles_Helper.clause(orgpub, date)));
        }
        result += Styles_Helper.sentence(
            Styles_Helper.field(entry, 'note').Raw);
        return result;
    }

    public static techreport(entry: ObjectModel_Entry): string
    {
        let result = Styles_Helper.sentence(this.format_authors(entry));
        result += Styles_Helper.sentence(this.format_title(entry));
        result += Styles_Helper.sentence(Styles_Helper.clause(
            Styles_Helper.clause(
                this.format_tr_number(entry),
                Styles_Helper.field(entry, 'institution').Raw
            ),
            Styles_Helper.clause(
                Styles_Helper.field(entry, 'address').Raw,
                this.format_date(entry)
            )
        ));
        result += Styles_Helper.sentence(
            Styles_Helper.field(entry, 'note').Raw);
        return result;
    }

    public static unpublished(entry: ObjectModel_Entry): string
    {
        let result = Styles_Helper.sentence(this.format_authors(entry));
        result += Styles_Helper.sentence(this.format_title(entry));
        result += Styles_Helper.sentence(this.format_date(entry));
        result += Styles_Helper.sentence(
            Styles_Helper.field(entry, 'note').Raw);
        return result;
    }

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
        if (Styles_PlainImpl.EntryTypes.indexOf(myEntry.Type) >= 0)
        {
            return ((Styles_PlainImpl as any)[myEntry.Type] as Function).
                call(Styles_PlainImpl, myEntry) as string;
        }
        return Styles_PlainImpl.misc(myEntry);
    }

}
