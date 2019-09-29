/**
 * Represents the private members of a `StringRef` instance.
 * This class is intended to be private inside `StringRef`.
 */
class ObjectModel_StringRefPrivates
{
    /**
     * The controlling `StringRef` instance.
     */
    private readonly Owner: ObjectModel_StringRef;
    /**
     * The cache of resolution.
     */
    private Resolved?: Strings_Literal;
    /**
     * Whether the reference is being resolved.
     * This prevents infinite recursion.
     */
    private Resolving: boolean;

    /**
     * Initializes a new `StringRefPrivates` instance.
     * 
     * @param owner The controlling `StringRef` object.
     */
    public constructor(owner: ObjectModel_StringRef)
    {
        this.Owner = owner;
        this.Resolved = undefined;
        this.Resolving = false;
    }

    /**
     * Implements `StringRef.Unresolve`.
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
     * Implements `StringRef.Resolve`.
     */
    public Resolve(macros?: ObjectModel_StrLitDict,
        refresh?: boolean): Strings_Literal
    {
        if (this.Resolving)
        {
            return Strings_Literal.Empty;
        }
        if (refresh || !this.Resolved)
        {
            try
            {
                this.Resolving = true;
                this.Resolved = Strings_Literal.Empty;
                const referee = this.Owner.Referee;
                const stringReferee = this.Owner.Dictionary[referee];
                if (stringReferee instanceof ObjectModel_StringExpr)
                {
                    this.Resolved = stringReferee.Resolve(macros, refresh);
                }
                if (macros)
                {
                    const macroReferee = macros[referee];
                    if (macroReferee instanceof Strings_Literal)
                    {
                        this.Resolved = macroReferee;
                    }
                }
            }
            finally
            {
                this.Resolving = false;
            }
        }
        return this.Resolved;
    }
}

/**
 * Represents a reference to a named string (defined using
 * `@ string { <name> = <expression> }`).
 */
class ObjectModel_StringRef
{
    private readonly _MutablePrivates: ObjectModel_StringRefPrivates;
    /**
     * The dictionary to resolve the reference.
     */
    public readonly Dictionary: ObjectModel_StrExprDict;
    /**
     * The identifier of the referenced string in lowercase.
     */
    public readonly Referee: string;

    /**
     * Initializes a new `StringRef` instance.
     * 
     * @remarks The constructor type checks the input
     * so that it's safe to be consumed from JavaScript.
     * 
     * @param id   The identifier of the referenced string.
     * @param dict The dictionary to resolve the reference.
     *             The referenced string need to exist at the
     *             time of constructing this instance.
     */
    public constructor(id: string, dict: ObjectModel_StrExprDict)
    {
        this._MutablePrivates = new ObjectModel_StringRefPrivates(this);
        this.Referee = ('' + (id || '')).toLowerCase();
        this.Dictionary = dict || Helper.EmptyObject;
        Helper.FreezeObject(this);
    }

    /**
     * Clears the cached resolution.
     * However, the cache is not cleared if resolution is in progress.
     * 
     * @returns Whether the cache was cleared.
     */
    public Unresolve(): boolean
    {
        return this._MutablePrivates.Unresolve();
    }

    /**
     * Resolves the referenced string.
     * An empty result is returned if resolution is in progress.
     * This avoids infinite recursion in case of cyclic dependency.
     * 
     * @param macros  The macros.
     * @param refresh Whether the cache should be invalidated.
     * 
     * @returns The `Literal` that would have been parsed
     *          had the referenced string been equivalently written
     *          as a literal string.
     */
    public Resolve(macros?: ObjectModel_StrLitDict,
        refresh?: boolean): Strings_Literal
    {
        return this._MutablePrivates.Resolve(macros, refresh);
    }
}
