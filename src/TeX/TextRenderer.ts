type TeX_TextRenderer_CSNameTranslator =
    { [csname: string]: string | undefined };

class TeX_TextRendererPrivates extends TeX_SimpleRenderer
{
    public constructor(text: string)
    {
        super(text);
    }

    private static SmartPuncts(text: string): string
    {
        /* English quotation marks */
        text = text.replace(/``/g, '“').replace(/''/g, '”');
        /* French quotation marks */
        text = text.replace(/<</g, '«').replace(/>>/g, '»');
        /* single quotation marks */
        text = text.replace(/</g, '‹').replace(/>/g, '›');
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

    static readonly CtrlSeqDiacritics: TeX_TextRenderer_CSNameTranslator =
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
        obj['r'] = '̊'; /* 0x030a */
        return Helper.FreezeObject(obj);
    })(Helper.NewEmptyObject()) as TeX_TextRenderer_CSNameTranslator;

    static readonly CtrlSeqTextReplacement: TeX_TextRenderer_CSNameTranslator =
    (function (obj)
    {
        obj['hspace'] = '';
        obj['vspace'] = '';
        obj['hspace*'] = '';
        obj['vspace*'] = '';
        obj['label'] = '';
        obj['ref'] = '?';
        obj['cite'] = '[?]';
        /* space */
        obj[' '] = ' ';
        obj['!'] = '';
        obj[','] = ' ';
        obj[';'] = ' ';
        obj[':'] = ' ';
        obj['/'] = ' ';
        obj['quad'] = '  ';
        obj['qquad'] = '    ';
        obj['hfill'] = '\t';
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

    public CtrlSeqType(csname: string, raw: string,
        target: TeX_SimpleRenderer_StackFrame): number
    {
        const ret = TeX_SimpleRenderer.CtrlSeqType(csname);
        if (ret != ret)
        {
            target.Append('', raw);
        }
        return ret;
    }
    
    public CtrlSeqTypeInMath(csname: string): number
    {
        return TeX_SimpleRenderer.CtrlSeqType(csname);
    }

    public RenderCtrlSeq(csname: string,
        args: TeX_SimpleRenderer_StackFrame,
        target: TeX_SimpleRenderer_StackFrame): void
    {
        if (csname === 'relax')
        {
            return;
        }
        const dcrt = TeX_TextRendererPrivates.CtrlSeqDiacritics[csname];
        if (dcrt !== undefined)
        {
            if (args.Char1.length === 0)
            {
                args.Append('', '');
            }
            args.Char1[0] = args.Char1[0] || '◌';
            args.Char1[0] += dcrt;
            args.StringConcatInto(target);
            return;
        }
        const txt = TeX_TextRendererPrivates.CtrlSeqTextReplacement[csname];
        if (txt !== undefined)
        {
            target.Append('', txt);
            return;
        }
        /* Other commands do nothing to plain text. */
        args.StringConcatInto(target);
    }

    public RenderAll(content: TeX_SimpleRenderer_StackFrame): string
    {
        const result = new TeX_SimpleRenderer_StackFrame();
        content.StringConcatInto(result);
        return result.Char1[0] + result.Char2[0];
    }

    public RenderGroup(args: TeX_SimpleRenderer_StackFrame,
        target: TeX_SimpleRenderer_StackFrame): void
    {
        args.StringConcatInto(target);
    }

    public RenderVirtGroup(args: TeX_SimpleRenderer_StackFrame,
        target: TeX_SimpleRenderer_StackFrame): void
    {
        args.StringConcatInto(target);
    }

    public RenderMathInline(_math: string, raw: string,
        target: TeX_SimpleRenderer_StackFrame): void
    {
        target.Append('', raw);
    }

    public RenderMathDisplay(_math: string, raw: string,
        target: TeX_SimpleRenderer_StackFrame): void
    {
        target.Append('', raw);
    }

    public RenderText(text: string,
        target: TeX_SimpleRenderer_StackFrame): void
    {
        text = TeX_TextRendererPrivates.SmartPuncts(text);
        target.Append(text.substr(0, 1), text.substr(1));
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
        return this._MutablePrivates.Render() as string;
    }
}

/**
 * Converts TeX `string` into plain `string`.
 * 
 * @param text The TeX `string` to convert.
 */
function TeX_ToPlainText(text: string): string
{
    return (new TeX_TextRenderer(text)).Render();
}
