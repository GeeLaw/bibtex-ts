/**
 * An object dedicated to efficient building of `StringExpr`.
 * This class is intended to be internal.
 */
class ObjectModel_StringExprBuilder
{
    /**
     * The summands. This is intended to be promoted into `Summands`
     * of a `StringExpr`.
     */
    public readonly Summands: ObjectModel_IStringTerm[];

    /**
     * Initializes a new `StringExprBuilder` instance.
     * The instance is immediately frozen, but it is still possible
     * to modify `Summands`.
     */
    public constructor()
    {
        this.Summands = [];
        Helper.FreezeObject(this);
    }

    /**
     * Appends a summand.
     * 
     * @remarks The method type checks the input so that
     * it's safe to be consumed (indirectly) from JavaScript.
     * This is called by the constructor of `StringExpr`
     * as well as `StringExpr.Concat`, which use this method
     * in a for-each loop. Since the library wants to support
     * arrays passed into those methods from JavaScript, here
     * seems to be the most elegant chance to type-check the
     * actual instances inside those arrays.
     * 
     * @param summand The summand to add, either a `Literal`
     *                or a `StringRef`.
     */
    public AddSummand(summand: ObjectModel_IStringTerm): boolean
    {
        if (summand instanceof Strings_Literal
            || summand instanceof ObjectModel_StringRef)
        {
            this.Summands.push(summand);
            return true;
        }
        return false;
    }
}

/**
 * Represents the private members of a `StringExpr` instance.
 * This class is intended to be private inside `StringExpr`.
 */
class ObjectModel_StringExprPrivates
{
    /**
     * The controlling `StringExpr` instance.
     */
    private readonly Owner: ObjectModel_StringExpr;
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
     * Initializes a new `StringExprPrivates` instance.
     * 
     * @param owner The controlling `StringExpr` instance.
     */
    public constructor(owner: ObjectModel_StringExpr)
    {
        this.Owner = owner;
        this.Resolved = undefined;
        this.Resolving = false;
    }

    /**
     * Implements `StringExpr.Unresolve`.
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
     * Implements `StringExpr.Resolve`.
     */
    public Resolve(refresh?: boolean): Strings_Literal
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
                const pieces: Strings_Literal[] = [];
                for (const summand of this.Owner.Summands)
                {
                    pieces.push(summand instanceof Strings_Literal
                        ? summand
                        : summand.Resolve(refresh));
                }
                this.Resolved = Strings_Literal.Concat(pieces);
            }
            finally
            {
                this.Resolving = false;
            }
        }
        return this.Resolved;
    }
}

function ObjectModel_LaunderSummands(
    summands?: ObjectModel_IStringTerm[]): ObjectModel_StringExprBuilder
{
    const result = new ObjectModel_StringExprBuilder();
    if (!(summands instanceof Array)
        || summands.length === 0)
    {
        return result;
    }
    for (const summand of summands)
    {
        result.AddSummand(summand);
    }
    return result;
}

/**
 * Represent a concatenation of literal strings and string references.
 */
class ObjectModel_StringExpr
{
    private readonly _MutablePrivates: ObjectModel_StringExprPrivates;
    /**
     * The summands consisting of `Literal`s and `StringRef`s.
     */
    public readonly Summands: ObjectModel_IStringTerm[];

    /**
     * Initializes a new `StringExpr` instance.
     * 
     * @remarks The constructor type checks the input
     * so that it's safe to be consumed from JavaScript.
     * 
     * @param summands The summands, one of the following:
     * - `undefined`, which results in an empty `StringExpr`.
     * - `StringExprBuilder`, which results in promotion of the builder.
     *   It's the caller's responsibility to ensure the same builder
     *   is not used for constructing another `StringExpr`.
     * - An array of `Literal`s (representing literal strings)
     *   and `StringRef`s (representing string references).
     *   The constructor will create a copy of this array.
     */
    public constructor(summands?:
        ObjectModel_StringExprBuilder | ObjectModel_IStringTerm[])
    {
        if (!(summands instanceof ObjectModel_StringExprBuilder))
        {
            summands = ObjectModel_LaunderSummands(summands);
        }
        this._MutablePrivates = new ObjectModel_StringExprPrivates(this);
        summands = summands.Summands;
        this.Summands = summands;
        Helper.FreezeObject(summands);
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
     * Resolves the concatenated string. It does so by recursively
     * resolves all the `StringRef`s inside it and concatenate
     * the results with `Literal`s inside it.
     * 
     * An empty result is returned if resolution is in progress.
     * This avoids infinite recursion in case of cyclic dependency.
     * 
     * @param refresh Whether the cache should be invalidated.
     * 
     * @returns The `Literal` that would have been parsed
     *          had the concatenated string been equivalently written
     *          as a literal string.
     */
    public Resolve(refresh?: boolean): Strings_Literal
    {
        return this._MutablePrivates.Resolve(refresh);
    }

    /**
     * An empty `StringExpr`.
     */
    public static readonly Empty = new ObjectModel_StringExpr();

    /**
     * Concatenates several `StringExpr`s.
     * The resulting `StringExpr` has the concatenated summands.
     * 
     * @remarks The method type checks the input so that
     * it's safe to be consumed from JavaScript.
     * 
     * @param strexprs The `StringExpr`s.
     */
    public static Concat(
        strexprs: ObjectModel_StringExpr[]): ObjectModel_StringExpr
    {
        if (!(strexprs instanceof Array)
            || strexprs.length === 0)
        {
            return ObjectModel_StringExpr.Empty;
        }
        if (strexprs.length === 1)
        {
            const theResult = strexprs[0];
            return (theResult instanceof ObjectModel_StringExpr
                ? theResult
                : ObjectModel_StringExpr.Empty);
        }
        const builder = new ObjectModel_StringExprBuilder();
        for (const strexpr of strexprs)
        {
            if (strexpr instanceof ObjectModel_StringExpr)
            {
                for (const summand of strexpr.Summands)
                {
                    builder.AddSummand(summand);
                }
            }
        }
        return new ObjectModel_StringExpr(builder);
    }
}
