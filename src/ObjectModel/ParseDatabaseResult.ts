type ObjectModel_ParseErrorCode =
    0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 |
    10 | 11 | 12 | 13 | 14 |
    15 | 16 | 17 | 18 | 19 |
    20 | 21 | 22 | 23 | 24 |
    25 | 26 | 27;

/**
 * Represents an error in parsing `.bib` database.
 */
class ObjectModel_ParseDatabaseError
{
    /**
     * Gets the position of the error.
     */
    public readonly ErrorPos: number;
    /**
     * Gets the error code. It is one of the
     * `ParseDatabaseError.ERROR_` constants.
     * Look up `ParseDatabaseError.ErrorMessages`
     * for the error message.
     */
    public readonly ErrorCode: ObjectModel_ParseErrorCode;

    /**
     * Initializes a `ParseDatabaseError` instance.
     * 
     * @param errpos The error position.
     * @param errno  The error code.
     * 
     * @remarks Consumers: Do not use this constructor.
     */
    public constructor(errpos: number,
        errno: ObjectModel_ParseErrorCode)
    {
        this.ErrorPos = errpos;
        this.ErrorCode = errno;
        Helper.FreezeObject(this);
    }

    public static readonly ERROR_SUCCESS                    =  0;
    public static readonly ERROR_TYPE_ID                    =  1;
    public static readonly ERROR_ENTRYCMD_DELIM             =  2;
    public static readonly ERROR_COMMENT_OPEN               =  3;
    public static readonly ERROR_COMMENT_RBRACE             =  4;
    public static readonly ERROR_PREAMBLE_POUND_RBRACE      =  5;
    public static readonly ERROR_PREAMBLE_POUND_RPAREN      =  6;
    public static readonly ERROR_STRING_ID                  =  7;
    public static readonly ERROR_STRING_EQ                  =  8;
    public static readonly ERROR_STRING_POUND_RBRACE        =  9;
    public static readonly ERROR_STRING_POUND_RPAREN        = 10;
    public static readonly ERROR_STRING_ID_DUP              = 11;
    public static readonly ERROR_ENTRY_EID_FID              = 12;
    public static readonly ERROR_ENTRY_COMMA_EQ_RBRACE      = 13;
    public static readonly ERROR_ENTRY_COMMA_EQ_RPAREN      = 14;
    public static readonly ERROR_ENTRY_COMMA_RBRACE         = 15;
    public static readonly ERROR_ENTRY_COMMA_RPAREN         = 16;
    public static readonly ERROR_ENTRY_ID_MISSING           = 17;
    public static readonly ERROR_ENTRY_ID_DUP               = 18;
    public static readonly ERROR_ENTRY_FID_RBRACE           = 19;
    public static readonly ERROR_ENTRY_FID_RPAREN           = 20;
    public static readonly ERROR_ENTRY_POUND_COMMA_RBRACE   = 21;
    public static readonly ERROR_ENTRY_POUND_COMMA_RPAREN   = 22;
    public static readonly ERROR_ENTRY_EQ                   = 23;
    public static readonly ERROR_FIELD_ID_DUP               = 24;
    public static readonly ERROR_STREXPR_OPERAND            = 25;
    public static readonly ERROR_STREXPR_OPEN               = 26;
    public static readonly ERROR_STREXPR_RBRACE             = 27;

    public static readonly ErrorMessages =
[
'BibTeX.ParseDatabase: Operation completed successfullly.',
'BibTeX.ParseDatabase: Expecting type identifier after "@".',
'BibTeX.ParseDatabase: Expecting entry/command opening delimiter "{" or "(".',
'BibTeX.ParseDatabase: Unclosed "@comment" command at end of string (unbalanced braces?).',
'BibTeX.ParseDatabase: Outstanding closing brace "}" in "@comment(...)" command (unbalanced braces?).',
'BibTeX.ParseDatabase: Expecting "#" to concatenate another string or "}" to close "@preamble{...".',
'BibTeX.ParseDatabase: Expecting "#" to concatenate another string or ")" to close "@preamble(...".',
'BibTeX.ParseDatabase: Expecting string identifier after "@string{" or "@string(".',
'BibTeX.ParseDatabase: Expecting "=" after string identifier in "@string" command.',
'BibTeX.ParseDatabase: Expecting "#" to concatenate another string or "}" to close "@string{...".',
'BibTeX.ParseDatabase: Expecting "#" to concatenate another string or ")" to close "@string(...".',
'BibTeX.ParseDatabase: Duplicate string identifier (the last one is kept).',
'BibTeX.ParseDatabase: Expecting entry identifier (citation key) or field identifier after "@entry{" or "@entry(".',
'BibTeX.ParseDatabase: Expecting "," after entry identifier (citation key) or "=" after field identifier or "}" to close "@entry{...".',
'BibTeX.ParseDatabase: Expecting "," after entry identifier (citation key) or "=" after field identifier or ")" to close "@entry(...".',
'BibTeX.ParseDatabase: Expecting "," or "}" to continue/close "@entry{...".',
'BibTeX.ParseDatabase: Expecting "," or ")" to continue/close "@entry(...".',
'BibTeX.ParseDatabase: Warning for missing entry identifier (citation key).',
'BibTeX.ParseDatabase: Duplicate entry identifier (citation key; the first entry is available by key).',
'BibTeX.ParseDatabase: Expecting "}" to close "@entry{..." or a field identifier to continue it.',
'BibTeX.ParseDatabase: Expecting ")" to close "@entry(..." or a field identifier to continue it.',
'BibTeX.ParseDatabase: Expecting "#" to concatenate another string or "," to end the field or "}" to close "@entry{...".',
'BibTeX.ParseDatabase: Expecting "#" to concatenate another string or "," to end the field or ")" to close "@entry(...".',
'BibTeX.ParseDatabase: Expecting "=" after field identifier.',
'BibTeX.ParseDatabase: Duplicate field identifier (the first field value is kept).',
'BibTeX.ParseDatabase: Expecting numerals as a string literal, or a string identifier for a named string, or \'{\' or \'"\' to begin a string literal. ',
'BibTeX.ParseDatabase: Unclosed string literal delimited with {} or "" (unbalanced braces?).',
'BibTeX.ParseDatabase: Oustanding closing brace } in ""-delimited string literal.'
];
}

/**
 * Represents a parsing result of the BibTeX parser.
 * Instances are intended to be immutable once returned from the parser.
 */
class ObjectModel_ParseDatabaseResult
{
    public readonly _Privates: any;

    /**
     * Stores the parsing errors.
     */
    public readonly Errors: ObjectModel_ParseDatabaseError[];

    /**
     * Stores the concatenated preamble.
     */
    public Preamble: ObjectModel_StringExpr;

    /**
     * Stores the named strings.
     */
    public readonly Strings: ObjectModel_StrExprDict;

    /**
     * Stores the entries that are successfully parsed.
     */
    public readonly Entries: ObjectModel_EntryData[];

    /**
     * Stores the entries by their citation key.
     * In case a key is duplicate, the first entry
     * is put here.
     */
    public readonly ofKey: ObjectModel_EntryDataDict;

    /**
     * Macros for jan-dec (as numerals).
     * This set of macros should be used (passed as `macros` argument)
     * if no specific style is to be applied.
     */
    public static readonly MonthMacros: ObjectModel_StrLitDict = (function (obj)
    {
        obj['jan'] = Strings_ParseLiteral('1').Result;
        obj['feb'] = Strings_ParseLiteral('2').Result;
        obj['mar'] = Strings_ParseLiteral('3').Result;
        obj['apr'] = Strings_ParseLiteral('4').Result;
        obj['may'] = Strings_ParseLiteral('5').Result;
        obj['jun'] = Strings_ParseLiteral('6').Result;
        obj['jul'] = Strings_ParseLiteral('7').Result;
        obj['aug'] = Strings_ParseLiteral('8').Result;
        obj['sep'] = Strings_ParseLiteral('9').Result;
        obj['oct'] = Strings_ParseLiteral('10').Result;
        obj['nov'] = Strings_ParseLiteral('11').Result;
        obj['dec'] = Strings_ParseLiteral('12').Result;
        return obj;
    })(Helper.NewEmptyObject()) as ObjectModel_StrLitDict;

    /**
     * Initializes a new `ParseDatabaseResult` instance.
     * Once filled, call `Helper.FreezeDescendants` and
     * `Helper.FreezeObject` on each member and call
     * `Helper.FreezeObject` on `this`.
     * 
     * @remarks Consumers: Do not use this constructor.
     */
    public constructor()
    {
        this._Privates = Helper.NewEmptyObject();
        this.Errors = [];
        this.Preamble = ObjectModel_StringExpr.Empty;
        this.Strings = Helper.NewEmptyObject();
        this.Entries = [];
        this.ofKey = Helper.NewEmptyObject();
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

    /**
     * Unresolves all the strings and entries.
     */
    public UnresolveAll(): void
    {
        const strings = this.Strings;
        for (const strid in strings)
        {
            strings[strid]!.Unresolve();
        }
        for (const entry of this.Entries)
        {
            entry.Unresolve();
        }
    }
}
