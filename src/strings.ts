/**
 * Represents a piece of string (i.e., substring) without braces.
 */
class BasicString
{
    /**
     * Stores the value of the piece.
     */
    public readonly Value: string;

    /**
     * Initializes a new `BasicString` instance.
     * The instance is immediately frozen.
     * 
     * @remarks The constructor type checks the input
     * so that it's safe to be consumed from JavaScript.
     * 
     * @param value The value of the piece.
     */
    public constructor(value: string)
    {
        this.Value = '' + (value || '');
        Helper.FreezeObject(this);
    }

    /**
     * Creates a `GroupedString` out of this `BasicString`.
     */
    public Promote(): GroupedString
    {
        const builder = new GroupedStringBuilder();
        builder.AddPiece(this);
        builder.PushLeftover();
        return new GroupedString(builder);
    }

    /**
     * An empty `BasicString`.
     */
    public static readonly Empty = new BasicString('');
}

/* Protect the static members Empty. */
Helper.FreezeObject(BasicString);

/**
 * An object dedicated to efficient building of `GroupedString`.
 * This class is intended to be internal.
 */
class GroupedStringBuilder
{
    /**
     * The pieces. This is intended to be promoted into `Pieces`
     * of a `GroupedString`. Note that the it's the caller's
     * responsibility to call `PushLeftover` before using it
     * to construct a `GroupedString`.
     */
    public readonly Pieces: (GroupedString | BasicString)[];
    /**
     * Stores the leftover strings in consecutive `BasicString`s.
     */
    private Leftover: string[];
    /**
     * Stores the last leftover `BasicString` instance ever seen.
     */
    private LastLeftover?: BasicString;

    /**
     * Initializes a new `GroupedStringBuilder` instance.
     */
    public constructor()
    {
        this.Pieces = [];
        this.Leftover = [];
    }

    /**
     * Pushes the leftover string into the pieces.
     * Callers external to this class should and should only call this
     * method immediately before using it to construct a `GroupedString`.
     * 
     * @returns Whether a `BasicString` was pushed.
     */
    public PushLeftover(): boolean
    {
        if (this.Leftover.length === 0)
        {
            return false;
        }
        this.Pieces.push(this.Leftover.length === 1
            ? this.LastLeftover!
           : new BasicString(this.Leftover.join('')));
        this.Leftover = [];
        return true;
    }

    /**
     * Adds a piece.
     * 
     * @remarks The method type checks the input so that
     * it's safe to be consumed (indirectly) from JavaScript.
     * This is called by the constructor of `GroupedString`
     * as well as `GroupedString.Concat`, which use this method
     * in a for-each loop. Since the library wants to support
     * arrays passed into those methods from JavaScript, here
     * seems to be the most elegant chance to type-check the
     * actual instances inside those arrays.
     * 
     * @param piece The next piece to add.
     */
    public AddPiece(piece: BasicString | GroupedString): boolean
    {
        if (piece instanceof BasicString)
        {
            if (piece.Value.length !== 0)
            {
                this.Leftover.push(piece.Value);
                this.LastLeftover = piece;
            }
            return true;
        }
        if (piece instanceof GroupedString)
        {
            this.PushLeftover();
            this.Pieces.push(piece);
            return true;
        }
        return false;
    }
}

/**
 * Represents a piece of string inside a pair of braces,
 * or a string as an operand to the string concatenation operation.
 * The enclosing braces are **not** stored.
 * The substring inside is supposed to have balanced braces.
 * The instances are intended to be immutable.
 * 
 * @remarks The substring {he{l}lo} can be represented as a
 * `GroupedString` with 3 pieces:
 * 1. A `BasicString` with value `he`.
 * 2. A `GroupedString` with 1 piece, whose only piece is
 *    a `BasicString` with value `l`.
 * 3. A `BasicString` with value `lo`.
 * However, if an operand itself is "{he{l}lo}", it is wrapped
 * inside another `GroupedString`.
 */
class GroupedString
{
    /**
     * The pieces, consisting of `BasicString`s and `GroupedString`s.
     */
    public readonly Pieces: (BasicString | GroupedString)[];

    /**
     * Initializes a new `GroupedString` instance.
     * The instance is immediately frozen.
     * 
     * @remarks The constructor type checks the input
     * so that it's safe to be consumed from JavaScript.
     * 
     * @param pieces The pieces. It is one of the followings:
     * - `undefined`, which results in an empty instance.
     * - `GroupedStringBuilder`, which results in promotion of
     *   the builder instance and after which the builder instance
     *   should be discarded.
     * - An array of `BasicString`s and `GroupedString`s, which
     *   results in an instance with those pieces. The constructor
     *   does not assume the ownership of the array, and it will
     *   remove empty `BasicString`s and consolidate consecutive
     *   `BasicString`s.
     */
    public constructor(pieces?:
        GroupedStringBuilder | (BasicString | GroupedString)[])
    {
        if (pieces instanceof GroupedStringBuilder)
        {
            pieces = pieces.Pieces;
        }
        else if (!(pieces instanceof Array))
        {
            pieces = [];
        }
        else
        {
            const builder = new GroupedStringBuilder();
            for (const piece of pieces)
            {
                builder.AddPiece(piece);
            }
            builder.PushLeftover();
            pieces = builder.Pieces;
        }
        this.Pieces = pieces;
        Helper.FreezeObject(pieces);
        Helper.FreezeObject(this);
    }

    /**
     * Creates a `StringConcat` whose only summand is this `GroupedString`.
     */
    public Promote(): StringConcat
    {
        const builder = new StringConcatBuilder();
        builder.AddSummand(this);
        return new StringConcat(builder);
    }

    /**
     * An empty `GroupedString`.
     */
    public static readonly Empty = new GroupedString();

    /**
     * Concatenates several `GroupedString`s.
     * Note that this is different from creating a `GroupedString`
     * whose pieces are the summands passed in. For example,
     * let's concatenate the following 4 `GroupedString`s:
     * - Only piece is an empty `BasicString`.
     * - Only piece is an empty `GroupedString`.
     * - Only piece is a `BasicString` with value `a`.
     * - Only piece is a `BasicString` with value `b`.
     * The result will be a `GroupedString` with 2 pieces:
     * 1. An empty `GroupedString`.
     * 2. A `BasicString` with value `ab`.
     * 
     * @remarks The method type checks the input so that
     * it's safe to be consumed from JavaScript.
     * 
     * @param groupedStrings The summands.
     */
    public static Concat(groupedStrings: GroupedString[]): GroupedString
    {
        if (!(groupedStrings instanceof Array)
            || groupedStrings.length === 0)
        {
            return this.Empty;
        }
        if (groupedStrings.length === 1)
        {
            const theResult = groupedStrings[0];
            return (theResult instanceof GroupedString
                ? theResult: this.Empty);
        }
        const builder = new GroupedStringBuilder();
        for (const groupedString of groupedStrings)
        {
            if (groupedString instanceof GroupedString)
            {
                for (const piece of groupedString.Pieces)
                {
                    builder.AddPiece(piece);
                }
            }
        }
        builder.PushLeftover();
        return new GroupedString(builder);
    }
}

/* Protect the static members Empty/Concat. */
Helper.FreezeObject(GroupedString);

/**
 * Represents the private members of a `StringReference` instance.
 * This class is intended to be private inside `StringReference`.
 */
class StringReferencePrivates
{
    /**
     * The controlling `StringReference` instance.
     */
    private readonly Owner: StringReference;
    /**
     * The cache of resolution.
     */
    private Resolved?: GroupedString;
    /**
     * Whether the reference is being resolved.
     * This prevents infinite recursion.
     */
    private Resolving: boolean;

    /**
     * Initializes a new `StringReferencePrivates` instance.
     * 
     * @param owner The controlling `StringReference` object.
     */
    public constructor(owner: StringReference)
    {
        this.Owner = owner;
        this.Resolving = false;
    }

    /**
     * Implements `StringReference.Unresolve`.
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
     * Implements `StringReference.Resolve`.
     */
    public Resolve(refresh?: boolean): GroupedString
    {
        if (this.Resolving)
        {
            return GroupedString.Empty;
        }
        if (refresh || !this.Resolved)
        {
            try
            {
                this.Resolving = true;
                this.Resolved = GroupedString.Empty;
                const referee = this.Owner.Dictionary[this.Owner.Referee];
                if (referee instanceof StringConcat)
                {
                    this.Resolved = referee.Resolve(refresh);
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
 * `@string{ name = expression }`).
 */
class StringReference
{
    private readonly _MutablePrivates: StringReferencePrivates;
    /**
     * The dictionary to resolve the reference.
     */
    public readonly Dictionary: { [id: string]: StringConcat | undefined };
    /**
     * The identifier of the referenced string in lowercase.
     */
    public readonly Referee: string;

    /**
     * Initializes a new `StringReference` instance.
     * 
     * @remarks The constructor type checks the input
     * so that it's safe to be consumed from JavaScript.
     * 
     * @param id   The identifier of the referenced string.
     * @param dict The dictionary to resolve the reference.
     *             The referenced string need to exist at the
     *             time of constructing this instance.
     */
    public constructor(id: string,
        dict: { [id: string]: StringConcat | undefined })
    {
        this._MutablePrivates = new StringReferencePrivates(this);
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
     * @param refresh Whether the cache should be invalidated.
     * 
     * @returns The `GroupedString` that would have been parsed
     *          had the referenced string been equivalently written
     *          as a literal string.
     */
    public Resolve(refresh?: boolean): GroupedString
    {
        return this._MutablePrivates.Resolve(refresh);
    }
}

/**
 * An object dedicated to efficient building of `StringConcat`.
 * This class is intended to be internal.
 */
class StringConcatBuilder
{
    /**
     * The summands. This is intended to be promoted into `Summands`
     * of a `StringConcate`.
     */
    public readonly Summands: (GroupedString | StringReference)[];

    /**
     * Initializes a new `StringConcatBuilder` instance.
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
     * This is called by the constructor of `StringConcat`
     * as well as `StringConcat.Concat`, which use this method
     * in a for-each loop. Since the library wants to support
     * arrays passed into those methods from JavaScript, here
     * seems to be the most elegant chance to type-check the
     * actual instances inside those arrays.
     * 
     * @param summand The summand to add, either a `GroupedString`
     *                or a `StringReference`.
     */
    public AddSummand(summand: GroupedString | StringReference): boolean
    {
        if (summand instanceof GroupedString
            || summand instanceof StringReference)
        {
            this.Summands.push(summand);
            return true;
        }
        return false;
    }
}

/**
 * Represents the private members of a `StringConcat` instance.
 * This class is intended to be private inside `StringConcat`.
 */
class StringConcatPrivates
{
    /**
     * The controlling `StringConcat` instance.
     */
    private readonly Owner: StringConcat;
    /**
     * The cache of resolution.
     */
    private Resolved?: GroupedString;
    /**
     * Whether the reference is being resolved.
     * This prevents infinite recursion.
     */
    private Resolving: boolean;

    /**
     * Initializes a new `StringConcatPrivates` instance.
     * 
     * @param owner The controlling `StringConcat` instance.
     */
    public constructor(owner: StringConcat)
    {
        this.Owner = owner;
        this.Resolving = false;
    }

    /**
     * Implements `StringConcat.Unresolve`.
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
     * Implements `StringConcat.Resolve`.
     */
    public Resolve(refresh?: boolean): GroupedString
    {
        if (this.Resolving)
        {
            return GroupedString.Empty;
        }
        if (refresh || !this.Resolved)
        {
            try
            {
                this.Resolving = true;
                this.Resolved = GroupedString.Empty;
                const pieces: GroupedString[] = [];
                for (const summand of this.Owner.Summands)
                {
                    pieces.push(summand instanceof GroupedString
                        ? summand
                        : summand.Resolve(refresh));
                }
                this.Resolved = GroupedString.Concat(pieces);
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
 * Represent a concatenation of literal strings and string references.
 */
class StringConcat
{
    private readonly _MutablePrivates: StringConcatPrivates;
    /**
     * The summands consisting of `GroupedString`s and `StringReference`s.
     */
    public readonly Summands: (GroupedString | StringReference)[];

    /**
     * Initializes a new `StringConcat` instance.
     * 
     * @remarks The constructor type checks the input
     * so that it's safe to be consumed from JavaScript.
     * 
     * @param summands The summands, one of the following:
     * - `undefined`, which results in an empty `StringConcat`.
     * - `StringConcatBuilder`, which results in promotion of the builder.
     *   It's the caller's responsibility to ensure the same builder
     *   is not used for constructing another `StringConcat`.
     * - An array of `GroupedString`s (representing literal strings)
     *   and `StringReference`s (representing string references).
     *   The constructor will create a copy of this array.
     */
    public constructor(summands?:
        StringConcatBuilder | (GroupedString | StringReference)[])
    {
        if (summands instanceof StringConcatBuilder)
        {
            summands = summands.Summands;
        }
        else if (!(summands instanceof Array))
        {
            summands = [];
        }
        else
        {
            const builder = new StringConcatBuilder();
            for (const summand of summands)
            {
                builder.AddSummand(summand);
            }
            summands = builder.Summands;
        }
        this._MutablePrivates = new StringConcatPrivates(this);
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
     * resolves all the `StringReference`s inside it and concatenate
     * the results with `GroupedString`s inside it.
     * 
     * An empty result is returned if resolution is in progress.
     * This avoids infinite recursion in case of cyclic dependency.
     * 
     * @param refresh Whether the cache should be invalidated.
     * 
     * @returns The `GroupedString` that would have been parsed
     *          had the concatenated string been equivalently written
     *          as a literal string.
     */
    public Resolve(refresh?: boolean): GroupedString
    {
        return this._MutablePrivates.Resolve(refresh);
    }

    /**
     * An empty `StringConcat`.
     */
    public static readonly Empty = new StringConcat();

    /**
     * Concatenates several `StringConcat`s.
     * The resulting `StringConcat` has the concatenated summands.
     * 
     * @remarks The method type checks the input so that
     * it's safe to be consumed from JavaScript.
     * 
     * @param stringConcats The summands.
     */
    public static Concat(stringConcats: StringConcat[]): StringConcat
    {
        if (!(stringConcats instanceof Array)
            || stringConcats.length === 0)
        {
            return this.Empty;
        }
        if (stringConcats.length === 1)
        {
            const theResult = stringConcats[0];
            return (theResult instanceof StringConcat
                ? theResult: this.Empty);
        }
        const builder = new StringConcatBuilder();
        for (const stringConcat of stringConcats)
        {
            if (stringConcat instanceof StringConcat)
            {
                for (const summand of stringConcat.Summands)
                {
                    builder.AddSummand(summand);
                }
            }
        }
        return new StringConcat(builder);
    }
}

/* Protect static members Empty/Concat. */
Helper.FreezeObject(StringConcat);

ExportBibTeX.Strings = Helper.NewEmptyObject();
ExportBibTeX.Strings.BasicString = BasicString;
ExportBibTeX.Strings.GroupedString = GroupedString;
ExportBibTeX.Strings.StringReference = StringReference;
ExportBibTeX.Strings.StringConcat = StringConcat;
ExportBibTeX.Strings._Privates = Helper.NewEmptyObject();
ExportBibTeX.Strings._Privates.GroupedStringBuilder = GroupedStringBuilder;
ExportBibTeX.Strings._Privates.StringConcatBuilder = StringConcatBuilder;
