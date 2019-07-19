/**
 * A state machine for parsing `.bib` databases.
 * 
 * Roughly speaking, this is an object-oriented way
 * of implementating automata, by storing the state
 * transition function as a delegate.
 * - `Text` is the full text to be parsed.
 * - `LastIndex` indicates the next index to look at.
 *   Initially this field is zero.
 * - `Result` and `Preamble` are what they are.
 * - `pfnNext` stores the next handler to use.
 *   Concretely, at any time, it stores a *prototypical*
 *   function of this class named as `EatXyz` (this
 *   is sufficient because `pfnNext` is always
 *   invoked on *the* `this` object).
 * 
 * The paradigm easily supports epsilon-transition
 * by inserting intermediate handlers that does
 * something (e.g., preparing member fields) and
 * transitions to another state without incrementing
 * `LastIndex`. Examples are `EatCommentCmd` and
 * `EatEntryCleanup`.
 * 
 * The `EatXyzCleanup` series are used in conjunction
 * with `EatStringExpr`. Since parsing a `StringExpr`
 * occurs *within* several states, it would be good
 * to reuse a single `EatStringExpr` instead of
 * copying the code around to get
 * `EatStringExprAndCleanupPreambleCmd` and others.
 * The natural idea is to employ a depth-1 stack
 * for this abstraction (cf. Push-Down Automata).
 * This is implemented as `pfnEatStringExprCleanup`
 * member, which stores the handler that should be
 * assigned to `pfnNext` when `EatStringExpr` returns.
 * 
 * Members named `myXyz` store the "return values"
 * of several procedures that can be used in the
 * handlers that come later. For example, `myTypeId`
 * is assigned by `EatTypeId` if it eats a type
 * identifier, and will be later used by
 * `EatEntryCmdDelimiter` to determine which handler,
 * among `EatCommentCmd`, `EatPreambleCmd`, `EatStringCmd`
 * and `EatEntry`, is to be used. It is also read
 * by `EatEntry` to create an `EntryData` with the
 * correct entry type.
 * 
 * The `TryEatXyz` are splitted into two cases:
 * - Those derived from `TryEatTemplate`.
 *   See the documentation for that method.
 * - `TryEatIStringTerm` and `TryEatDelimitedLiteral`
 *   are two dedicated method for parsing `Literal`s
 *   inside this parser.
 * 
 * Finally, the `rgxXyz` members are the reusable
 * regular expressions. Note that there is a difference
 * between ES3 and ES5+:
 * - In ES3, a regex literal represents the **same**
 *   object each time it is encountered in the code.
 * - In ES5, a regex literal is equivalent to a new
 *   object each time the expression is executed.
 * - In ES3, care must be taken to make sure fooling
 *   around with the same object doesn't create
 *   unexpected side-effects.
 * - In ES5, there could be a performance downgrade
 *   due to object creation each time the line gets
 *   executed.
 * 
 * Fortunately, the usage pattern of this project ensures
 * no observable side-effect is produced, as long as:
 * - Encapsulation, as TypeScript defines, is intact.
 * - JavaScript remains the "cooperative" threading
 *   model. Put more precisely, the fact that no
 *   other code (in JavaScript model) can execute
 *   as long as the current code path in control
 *   doesn't give up its control.
 * Moreover, storing the literal regex in fields
 * and reusing them shaves off the worry about
 * object creation performance loss.
 * 
 * Consumers of this class create an instance with
 * text to be parsed, repeatedly call `Operate`
 * until it returns `false` and call `Finish` to
 * get the parsing result.
 */
class ObjectModel_DatabaseParser
{
    private Text: string;
    private LastIndex: number;
    private readonly Result: ObjectModel_ParseDatabaseResult;
    private readonly Preamble: ObjectModel_StringExpr[];
    private pfnNext: ObjectModel_ParsingDelegate;

    public constructor(text: string)
    {
        this.Text = text;
        this.LastIndex = 0;
        this.Result = new ObjectModel_ParseDatabaseResult();
        this.Preamble = [];
        this.pfnNext = this.EatJunk;
    }

    /**
     * For debugging purposes.
     */
    public GetStateSummary(len?: number): string
    {
        len = (len || 0) >>> 0;
        len = (len < 16 ? 16 : len > 1024 ? 1024 : len);
        const clsParser: any = ObjectModel_DatabaseParser.prototype;
        let fnName = '[unknown]';
        /* TypeScript will strip the names of member functions,
         * so look at the prototype. */
        for (const key in clsParser)
        {
            if (clsParser[key] === this.pfnNext)
            {
                fnName = key;
                break;
            }
        }
        let pos = this.LastIndex.toString();
        pos = Helper.RepeatString(' ',
            this.Text.length.toString().length - pos.length) + pos;
        let excerpt = JSON.stringify(this.Text.substr(this.LastIndex, len));
        excerpt = excerpt.substr(1, excerpt.length - 2);
        return Helper.RepeatString(' ', 21 - fnName.length) +
            fnName + ' | ' + pos + ' | ' + excerpt;
    }

    public Operate(): boolean
    {
        return this.pfnNext();
    }

    public Finish(): ObjectModel_ParseDatabaseResult
    {
        const result = this.Result;
        result.Preamble = ObjectModel_StringExpr.Concat(this.Preamble);
        /* Avoid infinite recursion if there's a cyclic reference. */
        Helper.FreezeDescendants(result, result.Strings);
        return Helper.FreezeObject(result);
    }

    private EatNothing(): boolean
    {
        return false;
    }

    private readonly rgxEatJunk = /[^@]*@/g;
    /**
     * Alternatively named `EatUntilAtSymbol`.
     */
    private EatJunk(): boolean
    {
        const rgx = this.rgxEatJunk;
        rgx.lastIndex = this.LastIndex;
        const match = rgx.exec(this.Text);
        /* The rest of the content are just comments. */
        if (!match)
        {
            this.LastIndex = this.Text.length;
            this.pfnNext = this.EatNothing;
            return false;
        }
        this.LastIndex = rgx.lastIndex;
        this.pfnNext = this.EatTypeId;
        return true;
    }

    private myTypeId?: string = undefined;
    private EatTypeId(): boolean
    {
        const tid = this.TryEatTypeId();
        /* Not a type identifier after "@" */
        if (tid === undefined || tid === '')
        {
            this.Result.Errors.push(
            new ObjectModel_ParseDatabaseError(
                this.LastIndex,
                ObjectModel_ParseDatabaseError.ERROR_TYPE_ID
            ));
            this.pfnNext = this.EatJunk;
            return true;
        }
        /* "@type" */
        this.myTypeId = tid.toLowerCase();
        this.pfnNext = this.EatEntryCmdDelimiter;
        return true;
    }

    /**
     * 0 = braces; 1 = parentheses.
     */
    private myEntryCmdDelim?: 0 | 1 = undefined;
    private EatEntryCmdDelimiter(): boolean
    {
        const lblp = this.TryEatLBraceLParen();
        /* not "{" or "(" after "@type" */
        if (lblp === undefined || lblp === '')
        {
            this.Result.Errors.push(
            new ObjectModel_ParseDatabaseError(
                this.LastIndex,
                ObjectModel_ParseDatabaseError.ERROR_ENTRYCMD_DELIM
            ));
            this.pfnNext = this.EatJunk;
            return true;
        }
        /* "@type{" or "@type("
         * Choose transition by "type". */
        this.myEntryCmdDelim = (lblp === '{' ? 0 : 1);
        const tid = this.myTypeId!;
        this.pfnNext = (tid === 'comment'
            ? this.EatCommentCmd
            : tid === 'preamble'
            ? this.EatPreambleCmd
            : tid === 'string'
            ? this.EatStringCmd
            : this.EatEntry);
        return true;
    }

    private myCommentDepth?: number = undefined;
    private EatCommentCmd(): boolean
    {
        /* This is an epsilon-transition,
         * convenient for initialization. */
        this.myCommentDepth = 0;
        this.pfnNext = this.EatCommentContent;
        return true;
    }

    private readonly rgxEatCommentDepth0 =
        /* until "{" or "}" or EOS; until "{" or "}" or ")" or EOS. */
        [/[^{}]*([{}])|[^{}]*$/g, /[^{})]*([{})])|[^{})]*$/g];
    /* until "{" or "}" or EOS. */
    private readonly rgxEatCommentDepth1 = /[^{}]*([{}])|[^{}]*$/g;
    private EatCommentContent(): boolean
    {
        const rgx = (this.myCommentDepth === 0
            ? this.rgxEatCommentDepth0[this.myEntryCmdDelim!]
            : this.rgxEatCommentDepth1);
        rgx.lastIndex = this.LastIndex;
        const match = rgx.exec(this.Text);
        /* vaccum after "@comment{..." or "@comment(..." */
        if (!match || match[1] === undefined)
        {
            this.Result.Errors.push(
            new ObjectModel_ParseDatabaseError(
                this.LastIndex = this.Text.length,
                ObjectModel_ParseDatabaseError.ERROR_COMMENT_OPEN
            ));
            this.pfnNext = this.EatNothing;
            return false;
        }
        /* Increase depth. */
        if (match[1] === '{')
        {
            ++this.myCommentDepth!;
            this.LastIndex = rgx.lastIndex;
            return true;
        }
        /* Decrease depth. Note match[1] can only be "}". */
        if (this.myCommentDepth !== 0)
        {
            --this.myCommentDepth!;
            this.LastIndex = rgx.lastIndex;
            return true;
        }
        /* "@comment{...}" or "@comment(...)" */
        if (match[1] === '})'[this.myEntryCmdDelim!])
        {
            this.LastIndex = rgx.lastIndex;
            this.pfnNext = this.EatJunk;
            return true;
        }
        /* "@comment(...}" */
        this.Result.Errors.push(
        new ObjectModel_ParseDatabaseError(
            this.LastIndex = rgx.lastIndex - 1,
            ObjectModel_ParseDatabaseError.ERROR_COMMENT_RBRACE
        ));
        this.pfnNext = this.EatJunk;
        return true;
    }

    private EatPreambleCmd(): boolean
    {
        /* Call EatStringExpr and transition to
         * EatPreambleCmdCleanup to store it. */
        this.pfnEatStringExprCleanup = this.EatPreambleCmdCleanup;
        this.pfnNext = this.EatStringExpr;
        return true;
    }

    private EatPreambleCmdCleanup(): boolean
    {
        /* Be permissive. Always store the preamble fragment. */
        this.Preamble.push(this.myStringExpr!);
        this.pfnNext = this.EatJunk;
        /* If an error has occurred in EatStringExpr,
         * do not jam the user with more errors.
         * Instead, silently recover from here. */
        if (!this.myStringExprGood)
        {
            return true;
        }
        /* Clean up the closing part. */
        const closing = (this.myEntryCmdDelim === 0
            ? this.TryEatRBrace() : this.TryEatRParen());
        /* Not "}"/")" after "@preamble{..."/"@preamble(...".
         * Also not "#" because ParseStringExpr has returned. */
        if (closing === undefined || closing === '')
        {
            this.Result.Errors.push(
            new ObjectModel_ParseDatabaseError(
                this.LastIndex,
                this.myEntryCmdDelim === 0
                ? ObjectModel_ParseDatabaseError.ERROR_PREAMBLE_POUND_RBRACE
                : ObjectModel_ParseDatabaseError.ERROR_PREAMBLE_POUND_RPAREN
            ));
        }
        /* "@preamble{...}" or "@preamble(...)" */
        return true;
    }

    private myStringId?: string = undefined;
    private EatStringCmd(): boolean
    {
        const strid = this.TryEatStringId();
        /* not a string identifier after "@string{" or "@string(" */
        if (strid === undefined || strid === '')
        {
            this.Result.Errors.push(
            new ObjectModel_ParseDatabaseError(
                this.LastIndex,
                ObjectModel_ParseDatabaseError.ERROR_STRING_ID
            ));
            this.pfnNext = this.EatJunk;
            return true;
        }
        /* "@string{ id" */
        const eqsign = this.TryEatEquals();
        /* not "=" after "@string{ id" */
        if (eqsign === undefined || eqsign === '')
        {
            this.Result.Errors.push(
            new ObjectModel_ParseDatabaseError(
                this.LastIndex,
                ObjectModel_ParseDatabaseError.ERROR_STRING_EQ
            ));
            this.pfnNext = this.EatJunk;
            return false;
        }
        /* "@string{ id =" */
        this.myStringId = strid.toLowerCase();
        /* Call EatStringExpr and transition to
         * EatStringCmdCleanup to store it. */
        this.pfnEatStringExprCleanup = this.EatStringCmdCleanup;
        this.pfnNext = this.EatStringExpr;
        return true;
    }

    private EatStringCmdCleanup(): boolean
    {
        /* Be permissive. Always store the string definition. */
        const strid = this.myStringId!;
        const strtable = this.Result.Strings;
        if (strid in strtable)
        {
            this.Result.Errors.push(
            new ObjectModel_ParseDatabaseError(
                this.LastIndex,
                ObjectModel_ParseDatabaseError.ERROR_STRING_ID_DUP
            ));
        }
        strtable[strid] = this.myStringExpr!;
        this.pfnNext = this.EatJunk;
        /* If an error has occurred in EatStringExpr,
         * do not jam the user with more errors.
         * Instead, silently recover from here. */
        if (!this.myStringExprGood)
        {
            return true;
        }
        /* Clean up the closing part. */
        const closing = (this.myEntryCmdDelim === 0
            ? this.TryEatRBrace() : this.TryEatRParen());
        /* No "}"/")" after "@string{..."/"@string(...".
         * Also "#" is not there because EatStringExpr
         * has returned. */
        if (closing === undefined || closing === '')
        {
            this.Result.Errors.push(
            new ObjectModel_ParseDatabaseError(
                this.LastIndex,
                this.myEntryCmdDelim === 0
                ? ObjectModel_ParseDatabaseError.ERROR_STRING_POUND_RBRACE
                : ObjectModel_ParseDatabaseError.ERROR_STRING_POUND_RPAREN
            ));
        }
        /* "@string{...}" or "@string(...)" */
        return true;
    }

    private myEntry?: ObjectModel_EntryData = undefined;
    private EatEntry(): boolean
    {
        const efid = this.TryEatEntryId();
        /* not identifier after "@article{" or "@article(" */
        if (efid === undefined || efid === '')
        {
            this.Result.Errors.push(
            new ObjectModel_ParseDatabaseError(
                this.LastIndex,
                ObjectModel_ParseDatabaseError.ERROR_ENTRY_EID_FID
            ));
            this.pfnNext = this.EatJunk;
            return true;
        }
        /* eid is either a citation key or a field name */
        const possibleField = /^[a-zA-Z]+$/.test(efid);
        const afterEid = (this.myEntryCmdDelim === 0
            ? possibleField
            /* @entry{eid, or @entry{fid= or @entry{eid} */
                ? this.TryEatCommaEqualsRBrace()
            /* @entry{eid, or @entry{eid} */
                : this.TryEatCommaRBrace()
            : possibleField
                ? this.TryEatCommaEqualsRParen()
                : this.TryEatCommaRParen());
        /* not valid choice among ",=})" */
        if (afterEid === undefined || afterEid === '')
        {
            this.Result.Errors.push(
            new ObjectModel_ParseDatabaseError(
                this.LastIndex,
                this.myEntryCmdDelim === 0
                ? possibleField
                ? ObjectModel_ParseDatabaseError.ERROR_ENTRY_COMMA_EQ_RBRACE
                : ObjectModel_ParseDatabaseError.ERROR_ENTRY_COMMA_RBRACE
                : possibleField
                ? ObjectModel_ParseDatabaseError.ERROR_ENTRY_COMMA_EQ_RPAREN
                : ObjectModel_ParseDatabaseError.ERROR_ENTRY_COMMA_RPAREN
            ));
            this.pfnNext = this.EatJunk;
            return true;
        }
        /* @entry{eid, */
        if (afterEid === ',')
        {
            this.myEntry = new ObjectModel_EntryData(this.myTypeId!, efid);
            this.pfnNext = this.EatField;
            return true;
        }
        /* @entry{fid= */
        if (afterEid === '=')
        {
            this.Result.Errors.push(
            new ObjectModel_ParseDatabaseError(
                this.LastIndex,
                ObjectModel_ParseDatabaseError.ERROR_ENTRY_ID_MISSING
            ));
            this.myEntry = new ObjectModel_EntryData(this.myTypeId!, '');
            this.myFieldId = efid.toLowerCase();
            /* Call EatStringExpr and transition to
             * EatFieldCleanup to store it. */
            this.pfnEatStringExprCleanup = this.EatFieldCleanup;
            this.pfnNext = this.EatStringExpr;
            return true;
        }
        /* @entry{eid} */
        this.myEntry = new ObjectModel_EntryData(this.myTypeId!, efid);
        this.pfnNext = this.EatEntryCleanup;
        return true;
    }

    private EatEntryCleanup(): boolean
    {
        const entry = this.myEntry!;
        const eid = entry.Id;
        this.Result.Entries.push(entry);
        this.pfnNext = this.EatJunk;
        if (eid === '')
        {
            return true;
        }
        const entries = this.Result.ofKey;
        if (eid in entries)
        {
            this.Result.Errors.push(
            new ObjectModel_ParseDatabaseError(
                this.LastIndex,
                ObjectModel_ParseDatabaseError.ERROR_ENTRY_ID_DUP
            ));
        }
        else
        {
            entries[eid] = entry;
        }
        return true;
    }

    private myFieldId?: string = undefined;
    private EatField(): boolean
    {
        const fid = this.TryEatFieldId();
        /* If no field identifier, look for "}" or ")".
         * Otherwise, look for "=". */
        const eqrbrp = (fid === undefined || fid === ''
            ? this.myEntryCmdDelim === 0
                ? this.TryEatRBrace() : this.TryEatRParen()
            : this.TryEatEquals());
        /* We've eaten a field identifier and a "=". */
        if (eqrbrp === '=')
        {
            /* Call EatStringExpr and transition to
             * EatFieldCleanup to store it. */
            this.myFieldId = fid!.toLowerCase();
            this.pfnEatStringExprCleanup = this.EatFieldCleanup;
            this.pfnNext = this.EatStringExpr;
            return true;
        }
        /* At this point, the entry is definitely done. */
        this.pfnNext = this.EatEntryCleanup;
        /* We've eaten a field identifier but no "=" follows. */
        if (fid !== undefined && fid !== '')
        {
            this.Result.Errors.push(
            new ObjectModel_ParseDatabaseError(
                this.LastIndex,
                ObjectModel_ParseDatabaseError.ERROR_ENTRY_EQ
            ));
        }
        /* There isn't a field identifier, nor "}" or ")". */
        else if (eqrbrp === undefined || eqrbrp === '')
        {
            this.Result.Errors.push(
            new ObjectModel_ParseDatabaseError(
                this.LastIndex,
                this.myEntryCmdDelim === 0
            ? ObjectModel_ParseDatabaseError.ERROR_ENTRY_FID_RBRACE
            : ObjectModel_ParseDatabaseError.ERROR_ENTRY_FID_RPAREN
                ));
        }
        /* else: Entry is properly closed. */
        return true;
    }

    private EatFieldCleanup(): boolean
    {
        /* Be permissive. Always try to store the field. */
        const fid = this.myFieldId!;
        const fields = this.myEntry!.Fields;
        if (fid in fields)
        {
            this.Result.Errors.push(
            new ObjectModel_ParseDatabaseError(
                this.LastIndex,
                ObjectModel_ParseDatabaseError.ERROR_FIELD_ID_DUP
            ));
        }
        else
        {
            fields[fid] = this.myStringExpr!;
        }
        /* If an error occurred in EatStringExpr,
         * stop for this entry, store it and recover.
         */
        if (!this.myStringExprGood)
        {
            this.pfnNext = this.EatEntryCleanup;
            return true;
        }
        /* Otherwise, see if "," or "}"/")" follows. */
        const commaclosing = (this.myEntryCmdDelim === 0
            ? this.TryEatCommaRBrace(): this.TryEatCommaRParen());
        /* "," means possibility for another field. */
        if (commaclosing === ',')
        {
            this.pfnNext = this.EatField;
            return true;
        }
        /* Either "}"/")" or invalid char. */
        this.pfnNext = this.EatEntryCleanup;
        if (commaclosing === undefined || commaclosing === '')
        {
            this.Result.Errors.push(
            new ObjectModel_ParseDatabaseError(
                this.LastIndex,
                this.myEntryCmdDelim === 0
        ? ObjectModel_ParseDatabaseError.ERROR_ENTRY_POUND_COMMA_RBRACE
        : ObjectModel_ParseDatabaseError.ERROR_ENTRY_POUND_COMMA_RPAREN
            ));
        }
        return true;
    }

    private pfnEatStringExprCleanup?: ObjectModel_ParsingDelegate = undefined;
    private myStringExprGood: boolean = false;
    private myStringExpr?: ObjectModel_StringExpr = undefined;
    private EatStringExpr(): boolean
    {
        this.myStringExprGood = false;
        const builder = new ObjectModel_StringExprBuilder();
        /* Any error in TryEatIStringTerm is already reported. */
        for (builder.AddSummand(this.TryEatIStringTerm());
            this.myIStringTermGood;
            builder.AddSummand(this.TryEatIStringTerm()))
        {
            if (this.TryEatPound() !== '#')
            {
                this.myStringExprGood = true;
                break;
            }
        }
        this.myStringExpr = new ObjectModel_StringExpr(builder);
        this.pfnNext = this.pfnEatStringExprCleanup!;
        return true;
    }

    private myIStringTermGood: boolean = false;
    private TryEatIStringTerm(): ObjectModel_IStringTerm
    {
        this.myIStringTermGood = false;
        const numeral = this.TryEatNumeral();
        if (numeral !== undefined && numeral !== '')
        {
            const builder = new Strings_LiteralBuilder();
            builder.AddBasicPiece(
            new Strings_BasicPiece(
            new Strings_BasicPieceBuilder(
                numeral
            )));
            this.myIStringTermGood = true;
            return new Strings_Literal(builder);
        }
        const strid = this.TryEatStringId();
        if (strid !== undefined && strid !== '')
        {
            this.myIStringTermGood = true;
            return new ObjectModel_StringRef(strid,
                this.Result.Strings);
        }
        const bracequote = this.TryEatLBraceQuote();
        if (bracequote === undefined || bracequote === '')
        {
            this.Result.Errors.push(
            new ObjectModel_ParseDatabaseError(
                this.LastIndex,
                ObjectModel_ParseDatabaseError.ERROR_STREXPR_OPERAND
            ));
            return Strings_Literal.Empty;
        }
        return this.TryEatDelimitedLiteral(bracequote === '{' ? '}' : '"');
    }

    private readonly rgxTryEatDelimitedLiteral = /[^{}"]*([{}"])/g;
    private TryEatDelimitedLiteral(delim: '"' | '}'): Strings_Literal
    {
        const text = this.Text;
        const builder = new Strings_LiteralBuilder();
        let depth = 0, beginpos = this.LastIndex;
        let token: string[] | null = null;
        const rgx = this.rgxTryEatDelimitedLiteral;
        rgx.lastIndex = this.LastIndex;
        while (token = rgx.exec(text))
        {
            const delimchr = token[1];
            const partlen = rgx.lastIndex - 1 - beginpos;
            /* The string literal is properly closed. */
            if (delimchr === delim && depth === 0)
            {
                if (partlen !== 0)
                {
                    builder.AddBasicPiece(
                    new Strings_BasicPiece(
                    new Strings_BasicPieceBuilder(
                        text.substr(beginpos, partlen)
                    )));
                }
                this.myIStringTermGood = true;
                this.LastIndex = rgx.lastIndex;
                depth = -1;
                break;
            }
            /* Quotation marks are allowed
             * inside braces in a ""-delimited string or
             * anywhere in a {}-delimited string. */
            if (delimchr === '"')
            {
                continue;
            }
            /* Depth increases. */
            if (delimchr === '{')
            {
                /* A possible BasicPiece ends.
                 * SpCharPiece or BracedPiece begins. */
                if (depth++ === 0)
                {
                    if (partlen !== 0)
                    {
                        builder.AddBasicPiece(
                        new Strings_BasicPiece(
                        new Strings_BasicPieceBuilder(
                            text.substr(beginpos, partlen)
                        )));
                    }
                    beginpos = rgx.lastIndex;
                }
                continue;
            }
            /* At this point, delimchr === '}'. */
            /* Unpaired '}' in a string delimited by '"'. */
            if (depth === 0)
            {
                /* Pretend the '}' were '"' and finish the string. */
                if (partlen !== 0)
                {
                    builder.AddBasicPiece(
                    new Strings_BasicPiece(
                    new Strings_BasicPieceBuilder(
                        text.substr(beginpos, partlen)
                    )));
                }
                /* Report error and recover AFTER '}'. */
                this.Result.Errors.push(
                new ObjectModel_ParseDatabaseError(
                    rgx.lastIndex - 1,
                    ObjectModel_ParseDatabaseError.ERROR_STREXPR_RBRACE
                ));
                this.LastIndex = rgx.lastIndex;
                depth = -1;
                break;
            }
            /* Depth decreases without closing the
             * current SpCharPiece or BracedPiece. */
            if (--depth !== 0)
            {
                continue;
            }
            /* SpCharPiece or BracedPiece ends. */
            const content = text.substr(beginpos, partlen);
            beginpos = rgx.lastIndex;
            if (content[0] === '\\')
            {
                builder.AddSpCharPiece(
                new Strings_SpCharPiece(
                new Strings_SpCharPieceBuilder(
                    content
                )));
            }
            else
            {
                builder.AddBracedPiece(
                new Strings_BracedPiece(
                new Strings_BracedPieceBuilder(
                    content
                )));
            }
        }
        /* If depth === -1, we broke from the loop (instead of failing
         * a match) and have already reported errors and set LastIndex
         * properly.
         * Otherwise, we reached the end of string. Report an error and
         * permissively complete the string by inserting appropriate
         * number of '}'. */
        if (depth === -1)
        {
            return new Strings_Literal(builder);
        }
        this.Result.Errors.push(
        new ObjectModel_ParseDatabaseError(
            this.LastIndex = text.length,
            ObjectModel_ParseDatabaseError.ERROR_STREXPR_OPEN
        ));
        const trailingPiece = text.substr(beginpos);
        /* Decrease depth so that '}' * depth is appropriate. */
        if (depth-- === 0)
        {
            if (trailingPiece.length !== 0)
            {
                builder.AddBasicPiece(
                new Strings_BasicPiece(
                new Strings_BasicPieceBuilder(
                    trailingPiece
                )));
            }
        }
        else if (trailingPiece[0] === '\\')
        {
            builder.AddSpCharPiece(
            new Strings_SpCharPiece(
            new Strings_SpCharPieceBuilder(
                trailingPiece + Helper.RepeatString('}', depth)
            )));
        }
        else
        {
            builder.AddBracedPiece(
            new Strings_BracedPiece(
            new Strings_BracedPieceBuilder(
                trailingPiece + Helper.RepeatString('}', depth)
            )));
        }
        return new Strings_Literal(builder);
    }

    private readonly rgxTryEatLBraceLParen =
        /[ \t\v\r\n]*(([{(])|[^{( \t\v\r\n])/g;
    private TryEatLBraceLParen(): string | undefined
    { return this.TryEatTemplate(this.rgxTryEatLBraceLParen); }

    private readonly rgxTryEatTypeId =
        /[ \t\v\r\n]*(([a-zA-Z]+)|[^a-zA-Z \t\v\r\n])/g;
    private TryEatTypeId(): string | undefined
    { return this.TryEatTemplate(this.rgxTryEatTypeId); }

    private readonly rgxTryEatStringId =
        /[ \t\v\r\n]*(([a-zA-Z_][a-zA-Z0-9_.:+/-]*)|[^a-zA-Z_ \t\v\r\n])/g;
    private TryEatStringId(): string | undefined
    { return this.TryEatTemplate(this.rgxTryEatStringId); }

    private readonly rgxTryEatEquals =
        /[ \t\v\r\n]*(([=])|[^= \t\v\r\n])/g;
    private TryEatEquals(): string | undefined
    { return this.TryEatTemplate(this.rgxTryEatEquals); }

    private readonly rgxTryEatEntryId =
        /[ \t\v\r\n]*(([a-zA-Z0-9_.:+/-]+)|[^a-zA-Z0-9_.:+/ \t\v\r\n-])/g;
    private TryEatEntryId(): string | undefined
    { return this.TryEatTemplate(this.rgxTryEatEntryId); }

    private readonly rgxTryEatCommaEqualsRBrace =
        /[ \t\v\r\n]*(([,=}])|[^,=} \t\v\r\n])/g;
    private TryEatCommaEqualsRBrace(): string | undefined
    { return this.TryEatTemplate(this.rgxTryEatCommaEqualsRBrace); }

    private readonly rgxTryEatCommaRBrace =
        /[ \t\v\r\n]*(([,}])|[^,} \t\v\r\n])/g;
    private TryEatCommaRBrace(): string | undefined
    { return this.TryEatTemplate(this.rgxTryEatCommaRBrace); }

    private readonly rgxTryEatCommaEqualsRParen =
        /[ \t\v\r\n]*(([,=)])|[^,=) \t\v\r\n])/g;
    private TryEatCommaEqualsRParen(): string | undefined
    { return this.TryEatTemplate(this.rgxTryEatCommaEqualsRParen); }

    private readonly rgxTryEatCommaRParen =
        /[ \t\v\r\n]*(([,)])|[^,) \t\v\r\n])/g;
    private TryEatCommaRParen(): string | undefined
    { return this.TryEatTemplate(this.rgxTryEatCommaRParen); }

    private readonly rgxTryEatFieldId =
        /[ \t\v\r\n]*(([a-zA-Z]+)|[^a-zA-Z \t\v\r\n])/g;
    private TryEatFieldId(): string | undefined
    { return this.TryEatTemplate(this.rgxTryEatFieldId); }

    private readonly rgxTryEatNumeral =
        /[ \t\v\r\n]*(([0-9]+)|[^0-9 \t\v\r\n])/g;
    private TryEatNumeral(): string | undefined
    { return this.TryEatTemplate(this.rgxTryEatNumeral); }

    private readonly rgxTryEatLBraceQuote =
        /[ \t\v\r\n]*(([{"])|[^{" \t\v\r\n])/g;
    private TryEatLBraceQuote(): string | undefined
    { return this.TryEatTemplate(this.rgxTryEatLBraceQuote); }

    private readonly rgxTryEatPound =
        /[ \t\v\r\n]*(([#])|[^# \t\v\r\n])/g;
    private TryEatPound(): string | undefined
    { return this.TryEatTemplate(this.rgxTryEatPound); }

    private readonly rgxTryEatRBrace =
        /[ \t\v\r\n]*(([}])|[^} \t\v\r\n])/g;
    private TryEatRBrace(): string | undefined
    { return this.TryEatTemplate(this.rgxTryEatRBrace); }

    private readonly rgxTryEatRParen =
        /[ \t\v\r\n]*(([)])|[^) \t\v\r\n])/g;
    private TryEatRParen(): string | undefined
    { return this.TryEatTemplate(this.rgxTryEatRParen); }

    /**
     * Try eating a template.
     * - If the method returns a non-empty `string`, a valid string is
     *   matched and returned, and `this.LastIndex` points to the
     *   character after the matched string.
     * - If the method returns `""`, the first non-whitespace
     *   character in the remaining part doesn't match the required
     *   pattern, and `this.LastIndex` points to the first non-white-
     *   space character in the remaining part.
     * - If the method returns `undefined`, the remaining part contains
     *   only whitespace characters, and `this.LastIndex` is set to
     *   `this.Text.length`.
     * 
     * @remarks If something is expected but there aren't 2 error
     *          codes for reporting end-of-string and unexpected
     *          character, you can merge error recovery (in case
     *          it's the first charactet being invalid) and
     *          termination (in case there's only whitespace left)
     *          by transitioning to `EatJunk` and continuting
     *          execution.
     *          If there's only whitespace left, `this.LastIndex`
     *          points to end-of-string, and the next time
     *          `EatJunk` runs, it figures out it's
     *          at the end of string and terminates.
     * 
     * @param rgx The regular expression that eats the leading
     *            whitespace and either a non-empty valid string
     *            (in capture group 2) or **one** non-empty
     *            invalid character.
     */
    private TryEatTemplate(rgx: RegExp): string | undefined
    {
        rgx.lastIndex = this.LastIndex;
        const match = rgx.exec(this.Text);
        /* The remaining is just whitespace. */
        if (!match)
        {
            this.LastIndex = this.Text.length;
            return undefined;
        }
        const match2 = match[2] || '';
        /* If failed, point to the first non-whitespace character.
         * If succeeded, point to the position after the matched string.
         * Note that rgx must match exactly 1 invalid character.
         */
        this.LastIndex = (match2 === ''
            ? rgx.lastIndex - 1
            : rgx.lastIndex);
        return match2;
    }

}

/**
 * Parses a `.bib` database.
 * 
 * @param text The content of the `.bib` file.
 * 
 * @returns The parsing result as a `ParseDatabaseResult` object.
 */
function ObjectModel_ParseDatabase(
    text: string): ObjectModel_ParseDatabaseResult
{
    text = '' + (text || '');
    const parser = new ObjectModel_DatabaseParser(text);
    while (parser.Operate())
        ;
    return parser.Finish();
}
