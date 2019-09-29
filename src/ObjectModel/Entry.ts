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
const ObjectModel_RequiredFieldsCNF = (function (cnf: any)
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

class ObjectModel_EntryDataPrivates
{
    /**
     * The controlling `EntryData` instance.
     */
    private readonly Owner: ObjectModel_EntryData;
    private readonly ofKey: ObjectModel_EntryDataDict;
    /**
     * The cache of resolution.
     */
    private Resolved?: ObjectModel_Entry;
    /**
     * Whether the reference is being resolved.
     * This prevents infinite recursion.
     */
    private Resolving: boolean;

    /**
     * Initializes a new `EntryDataPrivates` instance.
     * 
     * @param owner The controlling `EntryData` object.
     * @param ofKey Used for `crossref`.
     */
    public constructor(owner: ObjectModel_EntryData,
        ofKey: ObjectModel_EntryDataDict)
    {
        this.Owner = owner;
        this.ofKey = ofKey;
        this.Resolved = undefined;
        this.Resolving = false;
    }

    /**
     * Implements `EntryData.Unresolve`.
     */
    public Unresolve(): boolean
    {
        if (this.Resolving)
        {
            return false;
        }
        this.Resolved = undefined;
        return true;
    }

    /**
     * Implements `EntryData.Resolve`.
     */
    public Resolve(macros?: ObjectModel_StrLitDict,
        refresh?: boolean): ObjectModel_Entry
    {
        if (this.Resolving)
        {
            return this.Resolved!;
        }
        try
        {
            this.Resolving = true;
            if (refresh || !this.Resolved)
            {
                const owner = this.Owner;
                const result = new ObjectModel_Entry(owner.Type, owner.Id);
                this.Resolved = result;
                const fields = owner.Fields;
                const resultFields = result.Fields;
                for (const field in fields)
                {
                    resultFields[field] =
                        fields[field]!.Resolve(macros, refresh);
                }
                const crossref = resultFields['crossref'];
                if (crossref !== undefined)
                {
                    const parent = this.ofKey[crossref.Raw];
                    if (parent !== undefined)
                    {
                        const parentResolved = parent.Resolve(macros, refresh);
                        const parentFields = parentResolved.Fields;
                        for (const field in parentFields)
                        {
                            if (resultFields[field] === undefined)
                            {
                                resultFields[field] = parentFields[field];
                            }
                        }
                    }
                }
                Helper.FreezeObject(result.Fields);
            }
        }
        finally
        {
            this.Resolving = false;
        }
        return this.Resolved;
    }
}

/**
 * Represents the data of a valid BibTeX entry.
 * Instances are intended to be immutable once returned from the parser.
 */
class ObjectModel_EntryData
{
    public readonly _MutablePrivates: ObjectModel_EntryDataPrivates;

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
     * Maps a field name to its `StringExpr`.
     * Field names are in lowercase.
     */
    public readonly Fields: ObjectModel_StrExprDict;

    /**
     * Initializes a new `EntryData` instance.
     * The instance is immediately frozen. It is still possible
     * to modify `_MutablePrivates` and `Fields`. Once filled, call
     * `Helper.FreezeObject` on `this.Fields` and call
     * `Helper.FreezeDescendants` on `this._MutablePrivates`.
     * 
     * @remarks The constructor type checks the input
     * so that it's safe to be consumed from JavaScript.
     * 
     * @param type The type of this entry.
     * @param id   The identifier (citation key) of this entry.
     *             Use the empty string for keyless entry.
     */
    public constructor(type: string, id: string,
        ofKey: ObjectModel_EntryDataDict)
    {
        if ((typeof ofKey !== 'object' && typeof ofKey !== 'function')
            || ofKey instanceof Number || ofKey instanceof String
            || ofKey instanceof Boolean || !ofKey)
        {
            ofKey = Helper.NewEmptyObject();
        }
        this._MutablePrivates = new ObjectModel_EntryDataPrivates(this, ofKey);
        this.Type = ('' + (type || '')).toLowerCase();
        this.Id = '' + (id || '');
        this.Fields = Helper.NewEmptyObject();
        Helper.FreezeObject(this);
    }

    /**
     * Resolves `EntryData` into `Entry`.
     * 
     * @param macros  The macros.
     * @param refresh Whether the cache should be discarded.
     */
    public Resolve(macros?: ObjectModel_StrLitDict,
        refresh?: boolean): ObjectModel_Entry
    {
        return this._MutablePrivates.Resolve(macros, refresh);
    }

    /**
     * Clears the cached resolution.
     * The cache cannot be cleared if resolution is in progress.
     * 
     * @returns Whether the cache was cleared.
     */
    public Unresolve(): boolean
    {
        return this._MutablePrivates.Unresolve();
    }

    /**
     * Determines whether this entry is standard-compliant.
     * See `EntryRequiredFieldsCNF`.
     */
    public IsStandardCompliant(): boolean
    {
        const conjunction: string[][] = ObjectModel_RequiredFieldsCNF[this.Id];
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
 * Represents a resolved entry in `.bib` database.
 */
class ObjectModel_Entry
{
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
     * Maps a field name to its `Literal`.
     * Field names are in lowercase.
     */
    public readonly Fields: ObjectModel_StrLitDict;

    /**
     * Initializes a new `Entry` instance.
     * The instance is immediately frozen. It is still possible
     * to modify `Fields`. Once filled, call `Helper.FreezeObject`
     * on `this.Fields`.
     * 
     * @remarks The constructor type checks the input
     * so that it's safe to be consumed from JavaScript.
     * 
     * @param type The type of this entry.
     * @param id   The identifier (citation key) of this entry.
     *             Use the empty string for keyless entry.
     */
    public constructor(type: string, id: string)
    {
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
        const conjunction: string[][] = ObjectModel_RequiredFieldsCNF[this.Id];
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
