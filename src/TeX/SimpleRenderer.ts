/**
 * Represents a stack frame in a `SimpleRenderer`.
 */
class TeX_SimpleRenderer_StackFrame
{
    public readonly Char1: any[];
    public readonly Char2: any[];

    public constructor()
    {
        this.Char1 = [];
        this.Char2 = [];
        Helper.FreezeObject(this);
    }

    public Append(char1: any, char2: any): void
    {
        this.Char1.push(char1);
        this.Char2.push(char2);
    }

    public StringConcatInto(target: TeX_SimpleRenderer_StackFrame): void
    {
        const char1 = this.Char1;
        const char2 = this.Char2;
        while (char1.length < char2.length)
        {
            char1.push('');
        }
        while (char1.length > char2.length)
        {
            char2.push('');
        }
        const len = char1.length;
        if (len === 0)
        {
            target.Append('', '');
            return;
        }
        const result: any[] = [char2[0]];
        for (let i = 1; i !== len; ++i)
        {
            result.push(char1[i] || '');
            result.push(char2[i] || '');
        }
        target.Append(char1[0], result.join(''));
    }
}

/**
 * This serves as an example of how `SimpleHandler` can be used.
 */
class TeX_SimpleRendererPrivates extends TeX_SimpleHandler
{
    private readonly owner: TeX_SimpleRenderer;
    private readonly csnames: string[];
    private readonly argcounts: number[];
    private readonly groups: TeX_SimpleRenderer_StackFrame[];
    private readonly maths: ('@group' | '@inline' | '@display')[];
    private mathContent: string | undefined;
    private rawMath: string | undefined;

    /**
     * Pushes a new control sequence with specified
     * number of arguments into the stack.
     * 
     * @param csname   The name of the control sequence.
     * @param argcount The number of arguments.
     */
    private PushCtrlSeq(csname: string, argcount: number): void
    {
        this.csnames.push(csname);
        this.argcounts.push(argcount);
        this.groups.push(new TeX_SimpleRenderer_StackFrame());
    }

    /**
     * Complete as many control sequences as possible.
     */
    private CompleteCtrlSeqs(): void
    {
        while (this.TryComplete1CtrlSeq())
            ;
    }

    /**
     * Considers the latest grapheme as a possible argument
     * to the innermost control sequence.
     */
    private TryComplete1CtrlSeq(): boolean
    {
        const acs = this.argcounts;
        if (acs.length === 0)
        {
            return false;
        }
        const top = acs.length - 1;
        const grps = this.groups;
        if (acs[top] === grps[top].Char1.length)
        {
            const csns = this.csnames;
            this.owner.RenderCtrlSeq(csns[top], grps[top], grps[top - 1]);
            csns.pop();
            acs.pop();
            grps.pop();
            return true;
        }
        return false;
    }

    /**
     * Opens a group with raw string `raw`.
     * 
     * @param raw The raw string of the group opening delimiter.
     */
    private OpenGroup(raw: string): void
    {
        if (this.mathContent !== undefined)
        {
            this.maths.push('@group');
            this.mathContent += raw;
            this.rawMath += raw;
            return;
        }
        this.PushCtrlSeq('@group', -1);
    }

    private CloseOutsideMathUntil(target: string): number
    {
        const csns = this.csnames;
        const acs = this.argcounts;
        const grps = this.groups;
        for (let top = csns.length - 1;
            top !== 0 && csns[top] !== target;
            top = csns.length - 1)
        {
            const grp = grps[top];
            const ac = acs[top];
            if (ac !== -1)
            {
                while (grp.Char1.length < ac)
                {
                    grp.Append(null, null);
                }
                while (grp.Char1.length > ac)
                {
                    grp.Char1.pop();
                    grp.Char2.pop();
                }
            }
            else
            {
                switch (csns[top])
                {
                    case '@group':
                        this.owner.RenderGroup(grps[top], grps[top - 1]);
                        break;
                    case '@virtual':
                        this.owner.RenderVirtGroup(grps[top], grps[top - 1]);
                        break;
                }
                csns.pop();
                acs.pop();
                grps.pop();
            }
            this.CompleteCtrlSeqs();
        }
        return csns.length - 1;
    }

    /**
     * Closes a group with raw string `raw`.
     * 
     * @param raw The raw string of the group closing delimiter.
     */
    private CloseGroup(raw: string): void
    {
        if (this.mathContent !== undefined)
        {
            const ms = this.maths;
            if (ms[ms.length - 1] === '@group')
            {
                ms.pop();
            }
            this.mathContent += raw;
            this.rawMath += raw;
            return;
        }
        const csns = this.csnames;
        const acs = this.argcounts;
        const grps = this.groups;
        const top = this.CloseOutsideMathUntil('@group');
        if (csns[top] === '@group')
        {
            this.owner.RenderGroup(grps[top], grps[top - 1]);
            csns.pop();
            acs.pop();
            grps.pop();
            this.CompleteCtrlSeqs();
        }
    }

    /**
     * Opens an inline equation with raw string `raw`.
     * 
     * @param raw The raw string of the opening delimiter.
     */
    private OpenMathInline(raw: string): void
    {
        if (this.mathContent !== undefined)
        {
            this.mathContent += raw;
            this.rawMath += raw;
        }
        else
        {
            this.mathContent = '';
            this.rawMath = raw;
        }
        this.maths.push('@inline');
    }

    /**
     * Closes an inline equation with raw string `raw`.
     * 
     * @param raw The raw string of the closing delimiter.
     */
    private CloseMathInline(raw: string): void
    {
        this.mathContent = this.mathContent || '';
        this.rawMath = (this.rawMath || '') + raw;
        const ms = this.maths;
        while (ms.length !== 0)
        {
            const popped = ms.pop();
            if (popped === '@inline')
            {
                break;
            }
        }
        if (ms.length !== 0)
        {
            this.mathContent += raw;
            return;
        }
        const grps = this.groups;
        this.owner.RenderMathInline(this.mathContent,
            this.rawMath, grps[grps.length - 1]);
        this.mathContent = undefined;
        this.rawMath = undefined;
        this.CompleteCtrlSeqs();
    }

    /**
     * Switches an inline equation with raw string `raw`.
     * 
     * @param raw The raw string of the switching delimiter.
     */
    private SwitchMathInline(raw: string): void
    {
        if (this.maths[this.maths.length - 1] === '@inline')
        {
            this.CloseMathInline(raw);
        }
        else
        {
            this.OpenMathInline(raw);
        }
    }

    /**
     * Opens a display equation with raw string `raw`.
     * 
     * @param raw The raw string of the opening delimiter.
     */
    private OpenMathDisplay(raw: string): void
    {
        if (this.mathContent !== undefined)
        {
            this.mathContent += raw;
            this.rawMath += raw;
        }
        else
        {
            this.mathContent = '';
            this.rawMath = raw;
        }
        this.maths.push('@display');
    }

    /**
     * Closes a display equation with raw string `raw`.
     * 
     * @param raw The raw string of the closing delimiter.
     */
    private CloseMathDisplay(raw: string): void
    {
        this.mathContent = this.mathContent || '';
        this.rawMath = (this.rawMath || '') + raw;
        const ms = this.maths;
        while (ms.length !== 0)
        {
            const popped = ms.pop();
            if (popped === '@display')
            {
                break;
            }
        }
        if (ms.length !== 0)
        {
            this.mathContent += raw;
            return;
        }
        const grps = this.groups;
        this.owner.RenderMathDisplay(this.mathContent,
            this.rawMath, grps[grps.length - 1]);
        this.mathContent = undefined;
        this.rawMath = undefined;
        this.CompleteCtrlSeqs();
    }

    /**
     * Switches a display equation with raw string `raw`.
     * 
     * @param raw The raw string of the switching delimiter.
     */
    private SwitchMathDisplay(raw: string): void
    {
        if (this.maths[this.maths.length - 1] === '@display')
        {
            this.CloseMathDisplay(raw);
        }
        else
        {
            this.OpenMathDisplay(raw);
        }
    }

    protected EatControlSeq(csname: string, raw: string): void
    {
        if (this.mathContent !== undefined)
        {
            switch (this.owner.CtrlSeqTypeInMath(csname))
            {
                case -2:
                    this.OpenGroup(raw);
                    return;
                case -3:
                    this.CloseGroup(raw);
                    return;
                case -4:
                    this.OpenMathInline(raw);
                    return;
                case -5:
                    this.CloseMathInline(raw);
                    return;
                case -6:
                    this.SwitchMathInline(raw);
                    return;
                case -7:
                    this.OpenMathDisplay(raw);
                    return;
                case -8:
                    this.CloseMathDisplay(raw);
                    return;
                case -9:
                    this.SwitchMathDisplay(raw);
                    return;
                default:
                    this.mathContent += raw;
                    this.rawMath += raw;
                    return;
            }
        }
        const cst = this.owner.CtrlSeqType(csname, raw,
            this.groups[this.groups.length - 1]);
        if (cst >= 0)
        {
            this.PushCtrlSeq(csname, cst >>> 0);
            this.CompleteCtrlSeqs();
            return;
        }
        switch (cst)
        {
            case -1:
                this.PushCtrlSeq(csname, 1);
                this.PushCtrlSeq('@virtual', -1);
                return;
            case -2:
                this.OpenGroup(raw);
                return;
            case -3:
                this.CloseGroup(raw);
                return;
            case -4:
                this.OpenMathInline(raw);
                return;
            case -5:
                this.CloseMathInline(raw);
                return;
            case -6:
                this.SwitchMathInline(raw);
                return;
            case -7:
                this.OpenMathDisplay(raw);
                return;
            case -8:
                this.CloseMathDisplay(raw);
                return;
            case -9:
                this.SwitchMathDisplay(raw);
                return;
            default:
                this.CompleteCtrlSeqs();
                return;
        }
    }

    protected EatGroupOpen(): void
    {
        this.OpenGroup('{');
    }

    protected EatGroupClose(): void
    {
        this.CloseGroup('}');
    }

    protected EatDisplayMathSwitcher(): void
    {
        this.SwitchMathDisplay('$$');
    }

    protected EatInlineMathSwitcher(): void
    {
        this.SwitchMathInline('$');
    }

    protected EatText(text: string): void
    {
        if (this.mathContent !== undefined)
        {
            this.mathContent += text;
            this.rawMath += text;
            return;
        }
        while (text.length !== 0)
        {
            const top = this.csnames.length - 1;
            const ac = this.argcounts[top];
            const grp = this.groups[top];
            if (grp.Char1.length < ac)
            {
                this.owner.RenderText(text.substr(0, 1), grp);
                this.CompleteCtrlSeqs();
                text = text.substr(1);
            }
            else
            {
                this.owner.RenderText(text, grp);
                this.CompleteCtrlSeqs();
                text = '';
            }
        }
    }

    protected Finish(): any
    {
        if (this.mathContent !== undefined)
        {
            const ms = this.maths;
            if (ms[0] === '@display')
            {
                this.owner.RenderMathDisplay(
                    this.mathContent,
                    this.rawMath!,
                    this.groups[this.groups.length - 1]);
            }
            else
            {
                this.owner.RenderMathInline(
                    this.mathContent,
                    this.rawMath!,
                    this.groups[this.groups.length - 1]);
            }
            while (ms.length !== 0)
            {
                ms.pop();
            }
            this.mathContent = undefined;
            this.rawMath = undefined;
        }
        return this.owner.RenderAll(
            this.groups[this.CloseOutsideMathUntil('@all')]);
    }

    /**
     * Initializes a `SimpleRenderer` instance.
     * 
     * @param owner The controlling `SimpleRenderer` instance.
     * @param text  The `TeX`t to handle.
     */
    public constructor(owner: TeX_SimpleRenderer, text: string)
    {
        super(text);
        this.owner = owner;
        this.csnames = [];
        this.argcounts = [];
        this.groups = [];
        this.maths = [];
        this.mathContent = undefined;
        this.rawMath = undefined;
        this.PushCtrlSeq('@all', -1);
    }

}

/**
 * Represents a basic TeX renderer.
 */
abstract class TeX_SimpleRenderer
{
    public static readonly StackFrame = TeX_SimpleRenderer_StackFrame;

    private _MutablePrivates: TeX_SimpleRendererPrivates;

    protected constructor(text: string)
    {
        text = '' + (text || '');
        this._MutablePrivates = new TeX_SimpleRendererPrivates(this, text);
    }

    public Render(): any
    {
        return this._MutablePrivates.Render();
    }

    /* 1-argument control sequences */
    public static readonly CtrlSeq1Arg: string[] =
    [
        /* diacritics */
        '`', "'", '^', '"', '~', '=', '.',
        'u', 'v', 'H', 't', 'c', 'd', 'b',
        /* text format */
        'text', 'emph',
        'textrm', 'textsf', 'texttt',
        'textmd', 'textbf',
        'textup', 'textsl', 'textit', 'textsc',
        /* scripts */
        'textsuperscript', 'textsubscript',
        /* frame boxes */
        'fbox', 'frame', 'framebox',
        /* spaces */
        'hspace', 'vspace', 'hspace*', 'vspace*',
        /* label, ref, cite */
        'label', 'ref', 'cite',
        /* punctuation spacing */
        '@',
        /* case alternation */
        'uppercase', 'lowercase',
        /* "and others" character */
        'etalchar'
    ];

    /* 0-argument control sequences */
    public static readonly CtrlSeq0Args: string[] =
    [
        'relax',
        /* space */
        ' ', '!', ',', ';', ':', '/',
        'quad', 'qquad', 'hfill', 'vfill',
        /* stylized names */
        'TeX', 'LaTeX', 'LaTeXe', 'XeTeX', 'BibTeX', 'KaTeX',
        /* symbols */
        '{', '}', '#', '$', '%', '&',
        'copyright', 'dag', 'ddag', 'pounds', 'S', 'P',
        '\\', '-', 'slash',
        'lbrace', 'rbrace', 'lbrack', 'rbrack',
        'textasciitilde', 'textunderline', 'textbackslash',
        'textless', 'textgreater', 'textlangle', 'textrangle',
        'textbar', 'ldots', 'textellipsis', 'textemdash', 'textendash',
        'aa', 'ae', 'i', 'j', 'l', 'o', 'oe', 'ss',
        'AA', 'AE', 'L', 'O', 'OE'
    ];

    public static readonly CtrlSeqVirtGroup: string[] =
    [
        /* typeface selection */
        'rmfamily', 'sffamily', 'ttfamily',
        'mdseries', 'bfseries',
        'upshape', 'slshape', 'itshape', 'scshape',
        /* obselete formatting */
        'rm', 'sf', 'tt', 'md', 'bf',
        'up', 'sl', 'it', 'em', 'sc',
        /* size selection */
        'tiny', 'scriptsize', 'footnotesize', 'small',
        'normalsize',
        'large', 'Large', 'LARGE', 'huge', 'Huge',
        /* inter-word spacing */
        'sloppy', 'fussy',
        /* indentation */
        'noindent'
    ];

    public static readonly CtrlSeqOpenGroup: string[] = ['bgroup'];
    public static readonly CtrlSeqCloseGroup: string[] = ['egroup'];
    public static readonly CtrlSeqOpenMathInline: string[] = ['('];
    public static readonly CtrlSeqCloseMathInline: string[] = [')'];
    public static readonly CtrlSeqSwitchMathInline: string[] = [];
    public static readonly CtrlSeqOpenMathDisplay: string[] = ['['];
    public static readonly CtrlSeqCloseMathDisplay: string[] = [']'];
    public static readonly CtrlSeqSwitchMathDisplay: string[] = [];

    /**
     * When overridden in derived classes, decides
     * the number of arguments of a control sequence.
     * 
     * If the returned value is -1, the control sequence
     * is an in-group alternation (like `\it`, `\bf`, etc.).
     * In this case, a virtual group is created, which
     * will be closed when the enclosing group is closed.
     * The control sequence itself will be handled as if
     * it has 1 argument, which is the virtual group
     * after it.
     * 
     * If the returned value is -2 to -9,
     * the control sequence is:
     * - -2 => group opening delimiter
     * - -3 => group closing delimiter
     * - -4 => inline math opening delimiter
     * - -5 => inline math closing delimiter
     * - -6 => inline math switcher
     * - -7 => display math opening delimiter
     * - -8 => display math closing delimiter
     * - -9 => display math switcher
     * 
     * If the returned value is 0 or positive, the control
     * sequence is considered to have that number of
     * arguments.
     * 
     * Otherwise, the derived class should handle
     * the control sequence within the target stack
     * frame, and the control sequence is discarded
     * by `SimpleRenderer`.
     * 
     * @param csname The name of the control sequence.
     * @param raw    The raw string of the control sequence,
     *               e.g., `\CtrlSeq ` (note that the trailing
     *               whitespace is also included).
     * @param target The target stack frame.
     */
    public abstract CtrlSeqType(csname: string, raw: string,
        target: TeX_SimpleRenderer_StackFrame): number;

    /**
     * Same as `CtrlSeqType`, but should be side-effect free.
     * 
     * @param csname The name of the control sequence.
     */
    public abstract CtrlSeqTypeInMath(csname: string): number;

    /**
     * The standard implementation of `CtrlSeqType`
     * and `CtrlSeqTypeInMath` instance/prototypical method.
     * 
     * @param csname The name of the control sequence.
     */
    public static CtrlSeqType(csname: string): number
    {
        if (TeX_SimpleRenderer.CtrlSeq1Arg.indexOf(csname) >= 0)
        {
            return 1;
        }
        if (TeX_SimpleRenderer.CtrlSeq0Args.indexOf(csname) >= 0)
        {
            return 0;
        }
        if (TeX_SimpleRenderer.CtrlSeqVirtGroup.indexOf(csname) >= 0)
        {
            return -1;
        }
        if (TeX_SimpleRenderer.CtrlSeqOpenGroup.indexOf(csname) >= 0)
        {
            return -2;
        }
        if (TeX_SimpleRenderer.CtrlSeqCloseGroup.indexOf(csname) >= 0)
        {
            return -3;
        }
        if (TeX_SimpleRenderer.CtrlSeqOpenMathInline.indexOf(csname) >= 0)
        {
            return -4;
        }
        if (TeX_SimpleRenderer.CtrlSeqCloseMathInline.indexOf(csname) >= 0)
        {
            return -5;
        }
        if (TeX_SimpleRenderer.CtrlSeqSwitchMathInline.indexOf(csname) >= 0)
        {
            return -6;
        }
        if (TeX_SimpleRenderer.CtrlSeqOpenMathDisplay.indexOf(csname) >= 0)
        {
            return -7;
        }
        if (TeX_SimpleRenderer.CtrlSeqCloseMathDisplay.indexOf(csname) >= 0)
        {
            return -8;
        }
        if (TeX_SimpleRenderer.CtrlSeqSwitchMathDisplay.indexOf(csname) >= 0)
        {
            return -9;
        }
        return Number.NaN;
    }

    /**
     * When overridden in derived classes, renders
     * a control sequence with all its arguments
     * collected, into the target stack frame.
     * 
     * @param csname The name of the control sequence.
     * @param args   The stack frame of the arguments.
     * @param target The target stack frame.
     */
    public abstract RenderCtrlSeq(csname: string,
        args: TeX_SimpleRenderer_StackFrame,
        target: TeX_SimpleRenderer_StackFrame): void;

    /**
     * When overridden in derived classes, renders
     * everything into the target stack frame.
     * 
     * @param content The content.
     */
    public abstract RenderAll(
        content: TeX_SimpleRenderer_StackFrame): any;

    /**
     * When overridden in derived classes, renders
     * a group into the target stack frame.
     * 
     * @param args   The group.
     * @param target The target stack frame.
     */
    public abstract RenderGroup(
        args: TeX_SimpleRenderer_StackFrame,
        target: TeX_SimpleRenderer_StackFrame): void;

    /**
     * When overridden in derived classes, renders
     * a virtual group into the target stack frame.
     * 
     * @param args   The virtual group.
     * @param target The target stack frame.
     */
    public abstract RenderVirtGroup(
        args: TeX_SimpleRenderer_StackFrame,
        target: TeX_SimpleRenderer_StackFrame): void;

    /**
     * When overridden in derived classes, renders
     * an inline equation into the target stack frame.
     * 
     * @remarks It's suggested that the derived class
     *          always render the content into `Char2`
     *          and put an empty string in `Char1`.
     *          For example, `\"{$a$}` should give you
     *          `◌̈a` instead of `ä`.
     * 
     * @param math   The content of the equation, without
     *               the surrounding delimiters.
     * @param raw    The content of the equation, with
     *               the surrounding delimiters.
     * @param target The target stack frame.
     */
    public abstract RenderMathInline(math: string,
        raw: string,
        target: TeX_SimpleRenderer_StackFrame): void;

    /**
     * When overridden in derived classes, renders
     * a display equation into the target stack frame.
     * 
     * @remarks It's suggested that the derived class
     *          always render the content into `Char2`
     *          and put an empty string in `Char1`.
     *          For example, `\"{$$a$$}` should give you
     *          `◌̈` with `a` in its own line, instead of
     *          `a` in its own line with a following ` ̈`.
     * 
     * @param math   The content of the equation, without
     *               the surrounding delimiters.
     * @param raw    The content of the equation, with
     *               the surrounding delimiters.
     * @param target The target stack frame.
     */
    public abstract RenderMathDisplay(math: string,
        raw: string,
        target: TeX_SimpleRenderer_StackFrame): void;

    /**
     * When overridden in derived classes, renders
     * text into the target stack frame.
     * 
     * @remarks You should handle punctuation transformations,
     *          e.g., `''` becomes `”` among many others.
     *          You should append exactly 1 pair of characters
     *          in the target stack frame (this rule is the same
     *          with other `RenderXyz` methods).
     * 
     * @param text   The text.
     * @param target The target stack frame.
     */
    public abstract RenderText(text: string,
        target: TeX_SimpleRenderer_StackFrame): void;
}
