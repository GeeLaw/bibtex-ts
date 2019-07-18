/**
 * Maps entry types (lowercase) to the standard style's *specs*.
 * Each spec is an array of *clauses*.
 * Each clause is an array of *literals*.
 * An entry is standard-compliant if
 * - either it is not a standard type; or
 * - for each clause `C` in its spec `S`, there is a literal `L` in `C`
 *   that is a supplied field of the entry.
 * 
 * @remarks CNF means conjunctive normal form.
 */
const EntryRequiredFieldsCNF = (function (cnf: any)
{
cnf['article'] = [['author'], ['title'], ['journal'], ['year']];
cnf['book'] = [['author', 'editor'], ['title'], ['publisher'], ['year']];
cnf['booklet'] = [['title']];
cnf['conference'] = [['author'], ['title'], ['booktitle'], ['year']];
cnf['inbook'] = [['author', 'editor'], ['title'], ['chapter', 'pages'], ['publisher'], ['year']];
cnf['incollection'] = [['author'], ['title'], ['booktitle'], ['year']];
cnf['inproceedings'] = [['author'], ['title'], ['booktitle'], ['year']];
cnf['manual'] = [['title']];
cnf['masterthesis'] = [['author'], ['title'], ['school'], ['year']];
cnf['misc'] = [];
cnf['phdthesis'] = [['author'], ['title'], ['school'], ['year']];
cnf['proceedings'] = [['title'], ['year']];
cnf['techreport'] = [['author'], ['title'], ['institution'], ['year']];
cnf['unpublished'] = [['author'], ['title'], ['misc']];

Helper.FreezeDescendants(cnf);
return Helper.FreezeObject(cnf);
})(Helper.NewEmptyObject());

/**
 * Represents a valid BibTeX entry.
 * Instances are intended to be immutable once returned from the parser.
 */
class Entry
{
    public readonly _Privates: any;
    /**
     * The type of this entry in lowercase.
     */
    public readonly Type: string;
    /**
     * The identifier (key) of this entry.
     * This field is case-sensitive.
     */
    public readonly Id: string;
    /**
     * Maps a field name to its `StringConcat`.
     * Field names are in lowercase.
     */
    public readonly Fields: { [id: string]: StringConcat | undefined };

    /**
     * Initializes a new `Entry` instance.
     * The instance is immediately frozen. It is still possible
     * to modify `_Privates` and `Fields`. Once filled, call
     * `Helper.FreezeDescendants`.
     * 
     * @remarks The constructor type checks the input
     * so that it's safe to be consumed from JavaScript.
     * 
     * @param type The type of this entry.
     * @param id   The identifier (citation key) of this entry.
     */
    public constructor(type: string, id: string)
    {
        this._Privates = Helper.NewEmptyObject();
        this.Type = ('' + (type || '')).toLowerCase();
        this.Id = '' + (id || '');
        this.Fields = Helper.NewEmptyObject();
        Helper.FreezeObject(this);
    }

    /**
     * Determines whether this entry is standard-compliant.
     * See `EntryRequiredFieldsCNF`.
     */
    public IsStandardCompliant(): boolean
    {
        const conjunction: string[][] = EntryRequiredFieldsCNF[this.Id];
        if (conjunction === undefined)
        {
            return true;
        }
        for (const clause of conjunction)
        {
            let satisfied: boolean = false;
            for (const literal of clause)
            {
                if (literal in this.Fields)
                {
                    satisfied = true;
                    break;
                }
            }
            if (!satisfied)
            {
                return false;
            }
        }
        return true;
    }
}

/**
 * Represents a parsing result of the BibTeX parser.
 * Instances are intended to be immutable once returned from the parser.
 */
class ParsingResult
{
    public readonly _Privates: any;
    /**
     * Stores the parsing errors.
     */
    public readonly ParsingErrors: ParsingError[];
    /**
     * Stores the concatenated preamble.
     */
    public Preamble: StringConcat;
    /**
     * Stores the entries that are successfully parsed.
     */
    public readonly Entries: Entry[];

    /**
     * Initializes a new `ParsingResult` instance.
     * Once filled, call `Helper.FreezeDescendants` and
     * `Helper.FreezeObject`.
     */
    public constructor()
    {
        this._Privates = Helper.NewEmptyObject();
        this.ParsingErrors = [];
        this.Preamble = StringConcat.Empty;
        this.Entries = [];
    }

    /**
     * Determines whether all the entries are
     * standard-compliant. See `EntryRequiredFieldsCNF`.
     */
    public IsStandardCompliant(): boolean
    {
        for (const entry of this.Entries)
        {
            if (!entry.IsStandardCompliant())
            {
                return false;
            }
        }
        return true;
    }
}

ExportBibTeX.ObjectModel = Helper.NewEmptyObject();
ExportBibTeX.ObjectModel.Entry = Entry;
ExportBibTeX.ObjectModel.ParsingResult = ParsingResult;
