class ObjectModel_PersonNameFormatParser
{
    private Text: string;
    private LastIndex: number;
    private ErrorPos: number;
    private ErrorCode: ObjectModel_PersonNameFormatErrorCode;
    private readonly Result: ObjectModel_PersonNameFormatBuilder;
    private pfnNext: ObjectModel_ParsingDelegate;

    public constructor(text: string)
    {
        this.Text = text;
        this.LastIndex = 0;
        this.ErrorPos = text.length;
        this.ErrorCode = ObjectModel_PersonNameFormat.ERROR_SUCCESS;
        this.Result = new ObjectModel_PersonNameFormatBuilder();
        this.pfnNext = this.EatVbtmOutside;
    }
    /**
     * For debugging purposes.
     */
    public GetStateSummary(len?: number): string
    {
        len = (len || 0) >>> 0;
        len = (len < 16 ? 16 : len > 1024 ? 1024 : len);
        const clsParser: any = ObjectModel_PersonNameFormatParser.prototype;
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

    public Finish(): ObjectModel_PersonNameFormat
    {
        return new ObjectModel_PersonNameFormat(
            this.ErrorPos, this.ErrorCode,
            this.Result);
    }

    private EatNothing(): boolean
    {
        return false;
    }

    private readonly rgxEatVbtmOutside = /([^{}]*)([{}])/g;
    private EatVbtmOutside(): boolean
    {
        const rgx = this.rgxEatVbtmOutside;
        rgx.lastIndex = this.LastIndex;
        const token = rgx.exec(this.Text);
        if (token === null)
        {
            this.Result.AddVerbatimContent(
                this.Text.substr(this.LastIndex));
            this.LastIndex = this.Text.length;
            this.pfnNext = this.EatNothing;
            return false;
        }
        if (token[2] === '{')
        {
            this.Result.AddVerbatimContent(token[1]);
            this.LastIndex = rgx.lastIndex;
            this.pfnNext = this.EatComponent;
            return true;
        }
        /* unpaired "}" */
        this.Result.AddVerbatimContent(token[1] + '{}');
        if (!this.ErrorCode)
        {
            this.ErrorPos = rgx.lastIndex - 1;
            this.ErrorCode = ObjectModel_PersonNameFormat.ERROR_RBRACE;
        }
        this.LastIndex = rgx.lastIndex;
        return true;
    }

    /* This is an epsilon-transition. */
    private EatComponent(): boolean
    {
        /* Initialize. */
        this.myVbtmBefore = '';
        this.myTarget = undefined;
        this.myInitials = undefined;
        this.myVbtmLink = undefined;
        this.myVbtmAfter = '';
        this.myComponentBad = false;
        /* Start eating VerbatimBefore. */
        this.myVbtmBeforeBegins = this.LastIndex;
        this.pfnNext = this.EatVbtmBefore;
        return true;
    }

    private myVbtmBefore: string = '';
    private myTarget?: ObjectModel_PersonNameFormatComponentTarget = undefined;
    private myInitials?: boolean = undefined;
    private myVbtmLink?: string = undefined;
    private myVbtmAfter: string = '';
    private myComponentBad: boolean = true;
    private EatComponentCleanup(): boolean
    {
        this.pfnNext = this.EatVbtmOutside;
        if (this.myComponentBad)
        {
            return true;
        }
        if (this.myTarget === undefined)
        {
            this.Result.AddVerbatimContent(this.myVbtmBefore!);
            return true;
        }
        this.Result.AddComponent(new ObjectModel_PersonNameFormatComponent(
            this.myVbtmBefore!,
            this.myTarget!,
            this.myInitials!,
            this.myVbtmLink,
            this.myVbtmAfter
        ));
        return true;
    }

    private myVbtmBeforeBegins?: number = undefined;
    private readonly rgxEatVbtmBefore =
/([^{}a-zA-Z]*)([{}]|[Ff][Ff]?[{]?|[Vv][Vv]?[{]?|[Ll][Ll]?[{]?|[Jj][Jj]?[{]?|[a-zA-Z])/g;
    private EatVbtmBefore(): boolean
    {
        const rgx = this.rgxEatVbtmBefore;
        rgx.lastIndex = this.LastIndex;
        const token = rgx.exec(this.Text);
        /* end of string without closing brace */
        if (token === null)
        {
            if (!this.ErrorCode)
            {
                this.ErrorPos = this.Text.length;
                this.ErrorCode =
                    ObjectModel_PersonNameFormat.ERROR_UNCLOSED_BRACE;
            }
            this.myComponentBad = true;
            this.LastIndex = this.Text.length;
            this.pfnNext = this.EatComponentCleanup;
            return true;
        }
        const stopper = token[2];
        /* part of VerbatimBefore */
        if (stopper === '{')
        {
            /* Eat until a balancing "}" and
             * continue eating VerbatimBefore.
             */
            this.LastIndex = rgx.lastIndex;
            this.pfnEatRBraceCleanup = this.EatVbtmBefore;
            this.pfnNext = this.EatRBrace;
            return true;
        }
        /* the component is closed */
        if (stopper === '}')
        {
            this.myVbtmBefore = this.Text.substr(
                this.myVbtmBeforeBegins!,
                rgx.lastIndex - 1 - this.myVbtmBeforeBegins!);
            this.LastIndex = rgx.lastIndex;
            this.pfnNext = this.EatComponentCleanup;
            return true;
        }
        /* invalid character */
        if (!/[FfVvLlJj]/.test(stopper[0]))
        {
            if (!this.ErrorCode)
            {
                this.ErrorPos = rgx.lastIndex - 1;
                this.ErrorCode =
                    ObjectModel_PersonNameFormat.ERROR_INVALID_CHAR;
            }
            this.myComponentBad = true;
            this.LastIndex = rgx.lastIndex;
            this.pfnEatRBraceCleanup = this.EatComponentCleanup;
            this.pfnNext = this.EatRBrace;
            return true;
        }
        /* A component has been specified,
         * so VerbatimBefore ends. */
        this.myVbtmBefore = this.Text.substr(
            this.myVbtmBeforeBegins!,
            rgx.lastIndex - stopper.length - this.myVbtmBeforeBegins!);
        /* stopper is "ff" or "f" or "ff{" or "f{" and the friends. */
        const tgt = stopper[0].toLowerCase();
        this.myTarget = (tgt === 'f' ? 'First'
            : tgt === 'v' ? 'von'
            : tgt === 'l' ? 'Last' : 'Jr');
        /* stopper is "ff" or "ff{" */
        this.myInitials = ((stopper[1] || '').toLowerCase() !== tgt);
        /* stopper is "ff{" or "f{" */
        if (stopper[stopper.length - 1] === '{')
        {
            this.myVbtmLinkBegins = rgx.lastIndex;
            /* Eat until a balancing "}" and
             * let EatVbtmLinkCleanup record the VerbatimLink.
             */
            this.LastIndex = rgx.lastIndex;
            this.pfnEatRBraceCleanup = this.EatVbtmLinkCleanup;
            this.pfnNext = this.EatRBrace;
        }
        else
        {
            this.myVbtmAfterBegins = rgx.lastIndex;
            this.LastIndex = rgx.lastIndex;
            this.pfnNext = this.EatVbtmAfter;
        }
        return true;
    }

    private myVbtmLinkBegins?: number = undefined;
    private EatVbtmLinkCleanup(): boolean
    {
        this.myVbtmLink = this.Text.substr(
            this.myVbtmLinkBegins!,
            this.LastIndex - 1 - this.myVbtmLinkBegins!);
        this.myVbtmAfterBegins = this.LastIndex;
        this.pfnNext = this.EatVbtmAfter;
        return true;
    }

    private myVbtmAfterBegins?: number = undefined;
    private readonly rgxEatVbtmAfter =
/[^a-zA-Z{}]*([a-zA-Z{}])/g;
    private EatVbtmAfter(): boolean
    {
        const rgx = this.rgxEatVbtmAfter;
        rgx.lastIndex = this.LastIndex;
        const token = rgx.exec(this.Text);
        /* end-of-string with unclosed brace */
        if (token === null)
        {
            if (!this.ErrorCode)
            {
                this.ErrorPos = this.Text.length;
                this.ErrorCode =
                    ObjectModel_PersonNameFormat.ERROR_UNCLOSED_BRACE;
            }
            this.myComponentBad = true;
            this.LastIndex = this.Text.length;
            this.pfnNext = this.EatComponentCleanup;
            return true;
        }
        const brace = token[1];
        /* the component is closed */
        if (brace === '}')
        {
            this.myVbtmAfter = this.Text.substr(
                this.myVbtmAfterBegins!,
                rgx.lastIndex - 1 - this.myVbtmAfterBegins!);
            this.LastIndex = rgx.lastIndex;
            this.pfnNext = this.EatComponentCleanup;
            return true;
        }
        /* part of VerbatimAFter */
        if (brace === '{')
        {
            this.pfnEatRBraceCleanup = this.EatVbtmAfter;
            this.LastIndex = rgx.lastIndex;
            this.pfnNext = this.EatRBrace;
            return true;
        }
        /* invalid character */
        if (!this.ErrorCode)
        {
            this.ErrorPos = rgx.lastIndex - 1;
            this.ErrorCode =
                ObjectModel_PersonNameFormat.ERROR_INVALID_CHAR;
        }
        this.myComponentBad = true;
        this.LastIndex = rgx.lastIndex;
        this.pfnEatRBraceCleanup = this.EatComponentCleanup;
        this.pfnNext = this.EatRBrace;
        return true;
    }

    private pfnEatRBraceCleanup?: ObjectModel_ParsingDelegate = undefined;
    private readonly rgxEatRBrace = /[^{}]*([{}])/g;
    private EatRBrace(): boolean
    {
        const rgx = this.rgxEatRBrace;
        rgx.lastIndex = this.LastIndex;
        const text = this.Text;
        let depth = 1;
        let token: string[] | null = null;
        while (depth !== 0)
        {
            token = rgx.exec(text);
            if (token === null)
            {
                if (!this.ErrorCode)
                {
                    this.ErrorPos = this.Text.length;
                    this.ErrorCode =
                        ObjectModel_PersonNameFormat.ERROR_UNCLOSED_BRACE;
                }
                this.LastIndex = this.Text.length;
                this.pfnNext = this.pfnEatRBraceCleanup!;
                return true;
            }
            depth += (token[1] === '{' ? 1 : -1);
        }
        this.LastIndex = rgx.lastIndex;
        this.pfnNext = this.pfnEatRBraceCleanup!;
        return true;
    }
}


/**
 * Parses a name format string into `PersonNameFormat`
 * object for reuse.
 * 
 * @param fmt The format string.
 * 
 * @returns `PersonNameFormat` object.
 */
function ObjectModel_ParsePersonNameFormat(
    fmt: string): ObjectModel_PersonNameFormat
{
    const parser = new ObjectModel_PersonNameFormatParser(
        '' + (fmt || ''));
    while (parser.Operate())
        ;
    return parser.Finish();
}
