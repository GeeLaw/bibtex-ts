type TeX_TextRenderer_CSNameTranslator =
    { [csname: string]: string | undefined };

/**
 * This serves as an example of how `SimpleHandler` can be used.
 */
class TeX_TextRendererPrivates extends TeX_SimpleHandler
{
    /* graphemeStack[i] is string[2], where
     * graphemeStack[i][0] is the first grapheme and
     * graphemeStack[i][1] is the second grapheme.
     * "Grapheme" is a term borrowed from typography,
     * which simply means "where to put the next
     * diacritical symbol" here.
     */
    private readonly graphemeStack: string[][];
    /* Stores where groups start. */
    private readonly groupStack: number[];
    /* Stores control sequences to be handled. */
    private readonly csnameStack: (string | undefined)[];
    /* Counts down the number of remaining arguments. */
    private readonly argcountStack: number[];
    /* Counts how many levels of math are nested. */
    private inlineMathLevel: number;
    private displayMathLevel: number;
    /* Stores the math content. */
    private mathContent: string | undefined;

    static CtrlSeq1Arg: string[] = [
        'text',
        /* diacritics */
        '`', "'", '^', '"', '~', '=', '.', 'u',
        'v', 'H', 't', 'c', 'd', 'b',
        /* font selection */
        'textrm', 'textsf', 'texttt',
        'textmd', 'textbf',
        'textup', 'textsl', 'textit', 'textsc',
        /* superscript, subscript */
        'textsuperscript', 'textsubscript',
        /* styling */
        'emph', 'fbox', 'frame', 'framebox',
        /* spaces */
        'hspace', 'vspace', 'hspace*', 'vspace*',
        /* label, ref */
        'label', 'ref'
    ];

    static CtrlSeq0Args: TeX_TextRenderer_CSNameTranslator =
    (function (obj)
    {
        obj['noindent'] = '';
        obj['@'] = '';
        /* spaces */
        obj[' '] = ' ';
        obj['!'] = '';
        obj[','] = ' ';
        obj[';'] = ' ';
        obj[':'] = ' ';
        obj['/'] = ' ';
        obj['quad'] = '  ';
        obj['qquad'] = '    ';
        obj['hfill'] = ' ';
        obj['vfill'] = '';
        /* font selection commands */
        obj['rmfamily'] = '';
        obj['sffamily'] = '';
        obj['ttfamily'] = '';
        obj['mdseries'] = '';
        obj['bfseries'] = '';
        obj['upshape'] = '';
        obj['slshape'] = '';
        obj['itshape'] = '';
        obj['scshape'] = '';
        /* obselete font selection commands */
        obj['rm'] = '';
        obj['sf'] = '';
        obj['tt'] = '';
        obj['md'] = '';
        obj['bf'] = '';
        obj['up'] = '';
        obj['sl'] = '';
        obj['it'] = '';
        obj['em'] = '';
        obj['sc'] = '';
        /* size selection */
        obj['tiny'] = '';
        obj['scriptsize'] = '';
        obj['footnotesize'] = '';
        obj['small'] = '';
        obj['normalsize'] = '';
        obj['large'] = '';
        obj['Large'] = '';
        obj['LARGE'] = '';
        obj['huge'] = '';
        obj['Huge'] = '';
        /* alignment etc. */
        obj['sloppy'] = '';
        obj['fussy'] = '';
        /* stylized names */
        obj['TeX'] = 'TeX';
        obj['LaTeX'] = 'LaTeX';
        obj['LaTeXe'] = 'LaTeX 2ε';
        obj['XeTeX'] = 'XeTeX';
        obj['BibTeX'] = 'BibTeX';
        obj['KaTeX'] = 'KaTeX';
        /* escaped symbols */
        obj['{'] = '{';
        obj['}'] = '}';
        obj['#'] = '#';
        obj['$'] = '$';
        obj['%'] = '%';
        obj['&'] = '&';
        /* misc symbols */
        obj['copyright'] = '©';
        obj['dag'] = '†';
        obj['ddag'] = '‡';
        obj['pounds'] = '£';
        obj['S'] = '§';
        obj['P'] = '¶';
        /* other miscs */
        obj['\\'] = '\n';
        obj['-'] = '­'; /* soft hyphen */
        obj['slash'] = '/';
        /* named delimiters and slash */
        obj['lbrace'] = '{';
        obj['rbrace'] = '}';
        obj['lbrack'] = '[';
        obj['rbrack'] = ']';
        /* "text" series */
        obj['textasciitilde'] = '~';
        obj['textunderline'] = '_';
        obj['textbackslash'] = '\\';
        obj['textless'] = '<';
        obj['textgreater'] = '>';
        obj['textlangle'] = '〈';
        obj['textrangle'] = '〉';
        obj['textbar'] = '|';
        /* punctuation */
        obj['ldots'] = '…';
        obj['textellipsis'] = '…';
        obj['textemdash'] = '—';
        obj['textendash'] = '–';
        /* special letters */
        obj['aa'] = 'å';
        obj['ae'] = 'æ';
        obj['i'] = 'ı';
        obj['j'] = 'ȷ';
        obj['l'] = 'ł';
        obj['o'] = 'ø';
        obj['oe'] = 'œ';
        obj['ss'] = 'ß';
        obj['AA'] = 'Å';
        obj['AE'] = 'Æ';
        obj['L'] = 'Ł';
        obj['O'] = 'Ø';
        obj['OE'] = 'Œ';
        return Helper.FreezeObject(obj);
    })(Helper.NewEmptyObject()) as TeX_TextRenderer_CSNameTranslator;

    static Diacritics: TeX_TextRenderer_CSNameTranslator =
    (function (obj)
    {
        obj['`'] = '̀'; /* 0x0300 */
        obj["'"] = '́'; /* 0x0301 */
        obj['^'] = '̂'; /* 0x0302 */
        obj['"'] = '̈'; /* 0x0308 */
        obj['~'] = '̃'; /* 0x0303 */
        obj['='] = '̄'; /* 0x0304 */
        obj['.'] = '̇'; /* 0x0307 */
        obj['u'] = '̆'; /* 0x0306 */
        obj['v'] = '̌'; /* 0x030c */
        obj['H'] = '̋'; /* 0x030b */
        obj['t'] = '͡'; /* 0x0361 */
        obj['c'] = '̧'; /* 0x0327 */
        obj['d'] = '̣'; /* 0x0323 */
        obj['b'] = '̱'; /* 0x0331 */
        return Helper.FreezeObject(obj);
    })(Helper.NewEmptyObject()) as TeX_TextRenderer_CSNameTranslator;

    /**
     * Pushes a new control sequence with specified
     * number of arguments into the stack.
     * 
     * @param csname   The name of the control sequence.
     * @param argcount The number of arguments.
     */
    private PushCtrlSeq(csname: string, argcount: number): void
    {
        this.csnameStack.push(csname);
        this.argcountStack.push(argcount);
    }

    /**
     * Considers the latest grapheme as a possible argument
     * to the innermost control sequence.
     */
    private ConsumeArgument(): void
    {
        const acs = this.argcountStack;
        if (acs.length === 0 || --acs[acs.length - 1] !== 0)
        {
            return;
        }
        const csname = this.csnameStack.pop()!;
        acs.pop();
        /* 0-argument commands */
        const txt = TeX_TextRendererPrivates.CtrlSeq0Args[csname];
        if (txt !== undefined)
        {
            this.ConsumeText(txt);
            return;
        }
        /* diacritics */
        const gphs = this.graphemeStack;
        const dcrt = TeX_TextRendererPrivates.Diacritics[csname];
        if (dcrt !== undefined)
        {
            const letter = gphs[gphs.length - 1][0] || '◌';
            gphs[gphs.length - 1][0] = letter + dcrt;
            if (csname === 't' &&
                gphs[gphs.length - 1][1].length === 0)
            {
                gphs[gphs.length - 1][1] = '◌';
            }
            /* Put the diacritical mark and promote it into
             * an argument of the outer control sequence. */
            this.ConsumeArgument();
            return;
        }
        /* Horizontal spaces are replaced with a single space.
         * (\hfill is handled as 0-argument commands.) */
        if (csname === 'hspace' || csname === 'hspace*')
        {
            gphs.pop();
            /* Virtually replace this sequence with { },
             * including the eligibility as an argument
             * of the outer control sequence. */
            this.ConsumeText(' ');
            return;
        }
        /* Vertical spaces are ignored.
         * (\vfill is handled as 0-argument commands.) */
        if (csname === 'vspace' || csname === 'vspace*')
        {
            gphs.pop();
            /* Virtually replace this sequence with {},
             * including the eligibility as an argument
             * of the outer control sequence. */
            this.ConsumeText('');
            return;
        }
        /* 1-argument commands. Keep the output as-is but promote
         * it into an argument of the outer control sequence. */
        this.ConsumeArgument();
        return;
    }

    /**
     * Opens/Closes a group, an inline math or a display math
     * using a control sequence.
     * 
     * @param csname The name of the control sequence.
     * @param raw    The raw content of the control sequence.
     * 
     * @returns The name of the control sequence if it was
     *          used to open/close a group, an inline math
     *          or a display math.
     *          Otherwise, `undefined`.
     */
    private GroupMathCtrlSeq(csname: string, raw: string): string | undefined
    {
        if (csname === 'bgroup')
        {
            if (this.mathContent !== undefined)
            {
                this.mathContent += raw;
            }
            this.OpenGroup();
            return csname;
        }
        if (csname === 'egroup')
        {
            if (this.mathContent !== undefined)
            {
                this.mathContent += raw;
            }
            this.CloseGroup();
            return csname;
        }
        if (csname === '(')
        {
            this.OpenMathInline();
            this.mathContent += raw;
            return csname;
        }
        if (csname === ')')
        {
            this.mathContent += raw;
            this.CloseMathInline();
            return csname;
        }
        if (csname === '[')
        {
            this.OpenMathDisplay();
            this.mathContent += raw;
            return csname;
        }
        if (csname === ']')
        {
            this.mathContent += raw;
            this.CloseMathDisplay();
            return csname;
        }
        return undefined;
    }

    /**
     * Cleans up the groups/maths until the expected
     * group/math, or just everything.
     * 
     * @param csname The pseudo control sequence name.
     *               If `@group`, it complete all the
     *               control sequences with empty
     *               arguments and closes all maths
     *               until the nearest group.
     *               Similar for `@math@inline` and
     *               `@math@display`.
     *               If `@all`, since this pseudo
     *               control sequence name is reserved,
     *               it will complete any outstanding
     *               control sequences and close any
     *               open groups/maths.
     */
    private CleanupGroupMathAll(csname: '@group' | '@all' |
        '@math@inline' | '@math@display'): void
    {
        const csns = this.csnameStack;
        while (csns.length !== 0)
        {
            const lastcs = csns[csns.length - 1];
            if (lastcs === csname)
            {
                break;
            }
            if (lastcs === '@group')
            {
                this.CloseGroup();
                continue;
            }
            if (lastcs === '@math@inline')
            {
                this.CloseMathInline();
                continue;
            }
            if (lastcs === '@math@display')
            {
                this.CloseMathDisplay();
                continue;
            }
            this.ConsumeText('');
        }
    }

    private OpenGroup(): void
    {
        this.groupStack.push(this.graphemeStack.length);
        this.PushCtrlSeq('@group', Number.POSITIVE_INFINITY);
    }

    private CloseGroup(): void
    {
        const grps = this.groupStack;
        if (grps.length === 0)
        {
            return;
        }
        this.CleanupGroupMathAll('@group');
        this.csnameStack.pop();
        this.argcountStack.pop();
        const expectedSz = grps.pop()! + 1;
        if (this.mathContent !== undefined)
        {
            return;
        }
        const gphs = this.graphemeStack;
        while (gphs.length > expectedSz)
        {
            const grapheme = gphs.pop()!;
            gphs[gphs.length - 1][1] += grapheme[0] + grapheme[1];
        }
        /* It's possible that gphs.length === expectedSz - 1
         * if the group is empty at all. */
        while (gphs.length < expectedSz)
        {
            gphs.push(['', '']);
        }
        /* Promote this into a possible argument. */
        this.ConsumeArgument();
    }

    private OpenMathInline(): void
    {
        ++this.inlineMathLevel;
        this.mathContent = this.mathContent || '';
        this.PushCtrlSeq('@math@inline', Number.POSITIVE_INFINITY);
    }

    private CloseMathInline(): void
    {
        if (this.inlineMathLevel === 0)
        {
            return;
        }
        --this.inlineMathLevel;
        this.CleanupGroupMathAll('@math@inline');
        this.csnameStack.pop();
        this.argcountStack.pop();
        if (this.inlineMathLevel || this.displayMathLevel)
        {
            return;
        }
        const mc = this.mathContent!;
        this.mathContent = undefined;
        /* The math content can never have a diacritical mark on it. */
        this.graphemeStack.push(['', mc]);
        this.ConsumeArgument();
    }

    private OpenMathDisplay(): void
    {
        ++this.displayMathLevel;
        this.mathContent = this.mathContent || '';
        this.PushCtrlSeq('@math@display', Number.POSITIVE_INFINITY);
    }

    private CloseMathDisplay(): void
    {
        if (this.displayMathLevel === 0)
        {
            return;
        }
        --this.displayMathLevel;
        this.CleanupGroupMathAll('@math@display');
        this.csnameStack.pop();
        this.argcountStack.pop();
        if (this.inlineMathLevel || this.displayMathLevel)
        {
            return;
        }
        const mc = this.mathContent!;
        this.mathContent = undefined;
        /* The math content can never have a diacritical mark on it. */
        this.graphemeStack.push(['', mc]);
        this.ConsumeArgument();
    }

    /**
     * Handles the punctuations.
     * Specifically, this method replaces:
     * -  `` => “
     * -  '' => ”
     * -  << => «
     * -  >> => »
     * -  `  => ‘
     * -  '  => ’
     * -  ,, => „
     * - ... => …
     * - --- => em-dash
     * -  -- => en-dash
     * -  ~  => NBSP
     * And it cascades whitespace characters.
     * 
     * @param text The text to handle.
     */
    private static SmartPuncts(text: string): string
    {
        /* English quotation marks */
        text = text.replace(/``/g, '“').replace(/''/g, '”');
        /* French quotation marks */
        text = text.replace(/<</g, '«').replace(/>>/g, '»');
        /* single quotation marks */
        text = text.replace(/`/g, '‘').replace(/'/g, '’');
        /* German opening quotation mark and ellipsis */
        text = text.replace(/,,/g, '„').replace(/\.\.\./g, '…');
        /* dashes */
        text = text.replace(/---/g, '—').replace(/--/g, '–');
        /* non-breaking space */
        text = text.replace(/~/g, ' '); /* 0x00a0 */
        /* cascading spaces */
        text = text.replace(/[ \t\v\f\r\n]+/g, ' ');
        return text;
    }

    /**
     * Pushes a text and considers it as a possible argument.
     * 
     * @param text The text (verbatim) to handle.
     */
    private ConsumeText(text: string): void
    {
        this.graphemeStack.push(text.length === 0
            ? ['', '']
            : [text.substr(0, 1), text.substr(1)]);
        this.ConsumeArgument();
    }

    protected EatControlSeq(csname: string, raw: string): void
    {
        /* group, math */
        if (this.GroupMathCtrlSeq(csname, raw) !== undefined)
        {
            return;
        }
        /* Only handle group/math in math. */
        if (this.mathContent !== undefined)
        {
            this.mathContent += raw;
            return;
        }
        /* This must do nothing except for delimiting the tokens.
         * Specifically, we must not handle this as a 0-argument
         * command like below. Otherwise, it would be equivalent
         * to an empty group {}, most notably it would be promoted
         * into an argument for the outer control sequence. */
        if (csname === 'relax')
        {
            return;
        }
        /* 0-argument commands */
        if (TeX_TextRendererPrivates.CtrlSeq0Args[csname] !== undefined)
        {
            /* ConsumeArgument will decrease the number of arguments. */
            this.PushCtrlSeq(csname, 1);
            this.ConsumeArgument();
            return;
        }
        /* 1-argument commands, incl. diacritics */
        if (TeX_TextRendererPrivates.CtrlSeq1Arg.indexOf(csname) >= 0)
        {
            this.PushCtrlSeq(csname, 1);
            return;
        }
        /* not a supported command */
        this.ConsumeText(raw);
    }

    protected EatGroupOpen(): void
    {
        if (this.mathContent !== undefined)
        {
            this.mathContent += '{';
        }
        this.OpenGroup();
    }

    protected EatGroupClose(): void
    {
        if (this.mathContent !== undefined)
        {
            this.mathContent += '}';
        }
        this.CloseGroup();
    }

    protected EatDisplayMathSwitcher(): void
    {
        const csns = this.csnameStack;
        if (csns.length === 0 || csns[csns.length - 1] !== '@math@display')
        {
            this.OpenMathDisplay();
            this.mathContent += '$$';
            return;
        }
        this.mathContent += '$$';
        this.CloseMathDisplay();
    }

    protected EatInlineMathSwitcher(): void
    {
        const csns = this.csnameStack;
        if (csns.length === 0 || csns[csns.length - 1] !== '@math@inline')
        {
            this.OpenMathInline();
            this.mathContent += '$';
            return;
        }
        this.mathContent += '$';
        this.CloseMathInline();
    }

    protected EatText(text: string): void
    {
        if (this.mathContent !== undefined)
        {
            this.mathContent += text;
            return;
        }
        const csns = this.csnameStack;
        while (text.length !== 0)
        {
            /* Example: \cmd ab
             * If \cmd takes 2 arguments,
             * the arguments will be "a" and "b".
             * If \cmd takes 1 argument,
             * the argument will be "a", and "b" is just text.
             * Eat one character at a time until we're not
             * filling arguments for a control sequence.
             */
            if (csns.length === 0 || csns[csns.length - 1] === '@group' ||
                csns[csns.length - 1] === '@math@inline' ||
                csns[csns.length - 1] === '@math@display')
            {
                this.ConsumeText(
                    TeX_TextRendererPrivates.SmartPuncts(text));
                return;
            }
            this.ConsumeText(
                TeX_TextRendererPrivates.SmartPuncts(
                    text.substr(0, 1)));
            text = text.substr(1);
        }
    }

    protected Finish(): string
    {
        this.CleanupGroupMathAll('@all');
        const result = [];
        for (const item of this.graphemeStack)
        {
            result.push(item[0], item[1]);
        }
        return result.join('');
    }

    /**
     * Initializes a `TextRenderer` instance.
     * 
     * @param text The `TeX`t to handle.
     */
    public constructor(text: string)
    {
        super(text);
        this.graphemeStack = [];
        this.groupStack = [];
        this.csnameStack = [];
        this.argcountStack = [];
        this.inlineMathLevel = 0;
        this.displayMathLevel = 0;
        this.mathContent = undefined;
    }

}

/**
 * Represents a basic TeX text renderer.
 */
class TeX_TextRenderer
{
    private _MutablePrivates: TeX_TextRendererPrivates;

    public constructor(text: string)
    {
        text = '' + (text || '');
        this._MutablePrivates = new TeX_TextRendererPrivates(text);
    }

    public Render(): string
    {
        return this._MutablePrivates.Render();
    }
}
