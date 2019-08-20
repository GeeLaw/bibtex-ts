class Styles_StandardStyleHelper
{
    private readonly NameFormat: ObjectModel_PersonNameFormat;
    private readonly MonthNames: string[];

    public constructor(abbrv: boolean)
    {
        this.NameFormat = (abbrv
            ? Styles_Helper.NameFormat_ffvvlljj
            : Styles_Helper.NameFormat_ffvvlljj);
        this.MonthNames = (abbrv
            ? Styles_Helper.MonthNamesLong
            : Styles_Helper.MonthNamesLong);
    }

    public format_names(
        people: ObjectModel_PersonName[]): Styles_FormattedNames
    {
        return Styles_Helper.format_names(
            this.NameFormat,
            people);
    }

    public format_authors(entry: ObjectModel_Entry): string
    {
        return this.format_names(
            ObjectModel_ParsePersonNames(
            Styles_Helper.field(entry, 'author'))).Value;
    }

    public format_editors(entry: ObjectModel_Entry): string
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

    public format_title(entry: ObjectModel_Entry): string
    {
        return Styles_Helper.field(entry, 'title').Raw;
    }

    public format_date(entry: ObjectModel_Entry): string
    {
        const year = Styles_Helper.field(entry, 'year').Raw;
        const month = Styles_Helper.field(entry, 'month').Raw;
        const monthNum = Styles_ResolveMonth(entry);
        if (monthNum != monthNum)
        {
            return month.length === 0 ? year : month + ' ' + year;
        }
        return (year.length !== 0
            ? this.MonthNames[monthNum] + ' ' + year
            : this.MonthNames[monthNum]);
    }

    public format_btitle(entry: ObjectModel_Entry): string
    {
        return Styles_Helper.emph(
            Styles_Helper.field(entry, 'title').Raw);
    }

    public format_bvolume(entry: ObjectModel_Entry): string
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

    public format_number_series(entry: ObjectModel_Entry,
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

    public format_edition(entry: ObjectModel_Entry)
    {
        const edition = Styles_Helper.field(entry, 'edition').Raw;
        return edition.length !== 0 ? edition + ' edition' : '';
    }

    public format_pages(entry: ObjectModel_Entry): string
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

    public format_vol_num_pages(entry: ObjectModel_Entry): string
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

    public format_chapter_pages(entry: ObjectModel_Entry)
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

    public format_in_ed_booktitle(entry: ObjectModel_Entry): string
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

    public static readonly MastersThesisType =
        Strings_ParseLiteral("{M}aster's thesis").Result;
    public static readonly PhDThesisType =
        Strings_ParseLiteral('{P}h{D} thesis').Result;
    public format_thesis_type(entry: ObjectModel_Entry,
        fallback: Strings_Literal): string
    {
        const type = Styles_Helper.field(entry, 'type');
        const myType = (type.Raw.length === 0 ? fallback : type);
        return myType.ToTitleCase().Raw;
    }

    private static readonly TRType =
        Strings_ParseLiteral('Technical Report').Result;
    public format_tr_number(entry: ObjectModel_Entry)
    {
        const type = Styles_Helper.field(entry, 'type');
        const myType = (type.Raw.length === 0
            ? Styles_StandardStyleHelper.TRType
            : type);
        const number = Styles_Helper.field(entry, 'number').Raw;
        if (number.length === 0)
        {
            return myType.ToTitleCase().Raw;
        }
        return myType.Raw + '~' + number;
    }

    public readonly CrossRefEditorFormat =
        ObjectModel_ParsePersonNameFormat('{vv~}{ll}');
    public format_crossref_editor(entry: ObjectModel_Entry): string
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

    public format_book_crossref(entry: ObjectModel_Entry): string
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

    public format_incoll_inproc_crossref(
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

    public thesis(entry: ObjectModel_Entry,
        fallback: Strings_Literal): string
    {
        let result = Styles_Helper.sentence(
            this.format_authors(entry));
        result += Styles_Helper.sentence(
            this.format_title(entry));
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

}

class Styles_StandardStyle
{
    public static readonly Plain = new Styles_StandardStyle(false);
    public static readonly Alpha = new Styles_StandardStyle(false);
    public static readonly Abbrv = new Styles_StandardStyle(true);

    private readonly that: Styles_StandardStyleHelper;

    private constructor(abbrv: boolean)
    {
        this.that = new Styles_StandardStyleHelper(abbrv);
    }

    public static readonly EntryTypes = ['article', 'book',
        'booklet', 'inbook', 'incollection', 'inproceedings',
        'conference', 'manual', 'mastersthesis', 'misc',
        'phdthesis', 'proceedings', 'techreport', 'unpublished'];

    public article(entry: ObjectModel_Entry): string
    {
        let result = '';
        result += Styles_Helper.sentence(
            this.that.format_authors(entry));
        result += Styles_Helper.sentence(
            this.that.format_title(entry));
        const crossref = Styles_Helper.field(entry, 'crossref').Raw;
        if (crossref.length === 0)
        {
            let journal = Styles_Helper.emph(
                Styles_Helper.field(entry, 'journal').Raw);
            journal = Styles_Helper.clause(journal,
                this.that.format_vol_num_pages(entry));
            journal = Styles_Helper.clause(journal,
                this.that.format_date(entry));
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
                this.that.format_pages(entry));
            result += Styles_Helper.sentence(journal);
        }
        result += Styles_Helper.sentence(
            Styles_Helper.field(entry, 'note').Raw);
        return result;
    }

    public book(entry: ObjectModel_Entry): string
    {
        let result = Styles_Helper.sentence(
            this.that.format_authors(entry) ||
            this.that.format_editors(entry));
        result += Styles_Helper.sentence(
            this.that.format_btitle(entry));
        let crossrefPublisher = undefined;
        const crossref = Styles_Helper.field(entry, 'crossref').Raw;
        if (crossref.length !== 0)
        {
            crossrefPublisher = this.that.format_book_crossref(entry);
        }
        else
        {
            result += Styles_Helper.sentence(
                this.that.format_bvolume(entry));
            result += Styles_Helper.sentence(
                this.that.format_number_series(entry, false));
            crossrefPublisher = Styles_Helper.clause(
                Styles_Helper.field(entry, 'publisher').Raw,
                Styles_Helper.field(entry, 'address').Raw);
        }
        result += Styles_Helper.sentence(Styles_Helper.clause(
            crossrefPublisher,
            Styles_Helper.clause(
                this.that.format_edition(entry),
                this.that.format_date(entry)
            )));
        result += Styles_Helper.sentence(
            Styles_Helper.field(entry, 'note').Raw);
        return result;
    }

    public booklet(entry: ObjectModel_Entry): string
    {
        let result = Styles_Helper.sentence(
            this.that.format_authors(entry));
        const howpublishedAddress =
            Styles_Helper.sentence(
                Styles_Helper.field(entry, 'howpublished').Raw) +
            Styles_Helper.sentence(
                Styles_Helper.field(entry, 'address').Raw);
        if (howpublishedAddress.length !== 0)
        {
            result += Styles_Helper.sentence(
                this.that.format_title(entry));
            result += howpublishedAddress;
            result += Styles_Helper.sentence(
                this.that.format_date(entry));
        }
        else
        {
            result += Styles_Helper.sentence(Styles_Helper.clause(
                this.that.format_title(entry),
                this.that.format_date(entry)));
        }
        result += Styles_Helper.sentence(
            Styles_Helper.field(entry, 'note').Raw);
        return result;
    }

    public inbook(entry: ObjectModel_Entry): string
    {
        let result = Styles_Helper.sentence(
            this.that.format_authors(entry) ||
            this.that.format_editors(entry));
        let crossrefAddr = undefined;
        const crossref = Styles_Helper.field(entry, 'crossref').Raw;
        if (crossref.length !== 0)
        {
            result += Styles_Helper.sentence(Styles_Helper.clause(
                this.that.format_btitle(entry),
                this.that.format_chapter_pages(entry)));
            crossrefAddr = this.that.format_book_crossref(entry);
        }
        else
        {
            result += Styles_Helper.sentence(
                Styles_Helper.clause(Styles_Helper.clause(
                this.that.format_btitle(entry),
                this.that.format_bvolume(entry)),
                this.that.format_chapter_pages(entry)));
            result += Styles_Helper.sentence(
                this.that.format_number_series(entry, false));
            crossrefAddr = Styles_Helper.clause(
                Styles_Helper.field(entry, 'howpublished').Raw,
                Styles_Helper.field(entry, 'address').Raw);
        }
        result += Styles_Helper.sentence(Styles_Helper.clause(
            crossrefAddr,
            Styles_Helper.clause(
                this.that.format_edition(entry),
                this.that.format_date(entry)
            )));
        result += Styles_Helper.sentence(
            Styles_Helper.field(entry, 'note').Raw);
        return result;
    }

    public incollection(entry: ObjectModel_Entry): string
    {
        let result = Styles_Helper.sentence(
            this.that.format_authors(entry));
        result += Styles_Helper.sentence(
            this.that.format_title(entry));
        const crossref = Styles_Helper.field(entry, 'crossref').Raw;
        if (crossref.length !== 0)
        {
            result += Styles_Helper.sentence(Styles_Helper.clause(
                this.that.format_incoll_inproc_crossref(entry),
                this.that.format_chapter_pages(entry)
            ));
        }
        else
        {
            const clause1 = Styles_Helper.clause(
                this.that.format_in_ed_booktitle(entry),
                this.that.format_bvolume(entry)
            );
            const clause2 = Styles_Helper.clause(
                this.that.format_number_series(entry,
                    clause1.length === 0),
                this.that.format_chapter_pages(entry)
            );
            result += Styles_Helper.sentence(
                Styles_Helper.clause(clause1, clause2));
            result += Styles_Helper.sentence(Styles_Helper.clause(
                Styles_Helper.clause(
                    Styles_Helper.field(entry, 'howpublished').Raw,
                    Styles_Helper.field(entry, 'address').Raw
                ),
                Styles_Helper.clause(
                    this.that.format_edition(entry),
                    this.that.format_date(entry)
                )
            ));
        }
        result += Styles_Helper.sentence(
            Styles_Helper.field(entry, 'note').Raw);
        return result;
    }

    public inproceedings(entry: ObjectModel_Entry): string
    {
        let result = Styles_Helper.sentence(
            this.that.format_authors(entry));
        result += Styles_Helper.sentence(
            this.that.format_title(entry));
        const crossref = Styles_Helper.field(entry, 'crossref').Raw;
        if (crossref.length !== 0)
        {
            result += Styles_Helper.sentence(Styles_Helper.clause(
                this.that.format_incoll_inproc_crossref(entry),
                this.that.format_pages(entry)
            ));
        }
        else
        {
            const clause1 = Styles_Helper.clause(
                this.that.format_in_ed_booktitle(entry),
                this.that.format_bvolume(entry)
            );
            const clause2 = Styles_Helper.clause(
                this.that.format_number_series(entry,
                    clause1.length === 0),
                this.that.format_pages(entry)
            );
            const clause12 = Styles_Helper.clause(clause1, clause2);
            const orgpub = Styles_Helper.clause(
                Styles_Helper.field(entry, 'organization').Raw,
                Styles_Helper.field(entry, 'publisher').Raw);
            const date = this.that.format_date(entry);
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

    public conference(entry: ObjectModel_Entry): string
    {
        return this.inproceedings(entry);
    }

    public manual(entry: ObjectModel_Entry): string
    {
        const authors = this.that.format_authors(entry);
        const org = Styles_Helper.field(entry, 'organization').Raw;
        const addr = Styles_Helper.field(entry, 'address').Raw;
        let result = Styles_Helper.sentence(authors);
        if (authors.length === 0 && org.length !== 0)
        {
            result = Styles_Helper.sentence(
                Styles_Helper.clause(org, addr));
        }
        let midsentence = this.that.format_btitle(entry);
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
            this.that.format_edition(entry));
        midsentence = Styles_Helper.clause(midsentence,
            this.that.format_date(entry));
        result += Styles_Helper.sentence(midsentence);
        result += Styles_Helper.sentence(
            Styles_Helper.field(entry, 'note').Raw);
        return result;
    }

    public mastersthesis(entry: ObjectModel_Entry): string
    {
        return this.that.thesis(entry,
            Styles_StandardStyleHelper.MastersThesisType);
    }

    public misc(entry: ObjectModel_Entry): string
    {
        let result = Styles_Helper.sentence(
            this.that.format_authors(entry));
        result += Styles_Helper.sentence(
            this.that.format_title(entry));
        result += Styles_Helper.sentence(Styles_Helper.clause(
            Styles_Helper.field(entry, 'howpublished').Raw,
            this.that.format_date(entry)));
        result += Styles_Helper.sentence(
            Styles_Helper.field(entry, 'note').Raw);
        return result;
    }

    public phdthesis(entry: ObjectModel_Entry): string
    {
        return this.that.thesis(entry,
            Styles_StandardStyleHelper.MastersThesisType);
    }

    public proceedings(entry: ObjectModel_Entry): string
    {
        const editors = this.that.format_editors(entry);
        const org = Styles_Helper.field(entry, 'organization').Raw;
        let result = Styles_Helper.sentence(editors || org);
        const btbv = Styles_Helper.clause(
            this.that.format_btitle(entry),
            this.that.format_bvolume(entry));
        const ns = this.that.format_number_series(
            entry, btbv.length === 0);
        const addr = Styles_Helper.field(entry, 'address').Raw;
        const date = this.that.format_date(entry);
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

    public techreport(entry: ObjectModel_Entry): string
    {
        let result = Styles_Helper.sentence(
            this.that.format_authors(entry));
        result += Styles_Helper.sentence(
            this.that.format_title(entry));
        result += Styles_Helper.sentence(Styles_Helper.clause(
            Styles_Helper.clause(
                this.that.format_tr_number(entry),
                Styles_Helper.field(entry, 'institution').Raw
            ),
            Styles_Helper.clause(
                Styles_Helper.field(entry, 'address').Raw,
                this.that.format_date(entry)
            )
        ));
        result += Styles_Helper.sentence(
            Styles_Helper.field(entry, 'note').Raw);
        return result;
    }

    public unpublished(entry: ObjectModel_Entry): string
    {
        let result = Styles_Helper.sentence(
            this.that.format_authors(entry));
        result += Styles_Helper.sentence(
            this.that.format_title(entry));
        result += Styles_Helper.sentence(
            this.that.format_date(entry));
        result += Styles_Helper.sentence(
            Styles_Helper.field(entry, 'note').Raw);
        return result;
    }

}
