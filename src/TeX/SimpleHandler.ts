/**
 * Represents a simple TeX handler.
 */
abstract class TeX_SimpleHandler
{
    public readonly Text: string;

    /**
     * Initializes a `SimpleHandler` instance.
     * 
     * @param text The `TeX`t to handle.
     */
    protected constructor(text: string)
    {
        this.Text = text;
    }

    /**
     * When overriden in derived classes,
     * processes a control sequence.
     * 
     * @param csname The name of the control sequence,
     *               e.g., `LaTeX`.
     * @param raw    The raw string of the control sequence,
     *               e.g., `\LaTeX `.
     */
    protected abstract EatControlSeq(csname: string, raw: string): void;

    /**
     * When overridden in derived classes,
     * processes a group opening delimiter `{`.
     */
    protected abstract EatGroupOpen(): void;

    /**
     * When overridden in derived classes,
     * processes a group closing delimiter `}`.
     */
    protected abstract EatGroupClose(): void;

    /**
     * When overridden in derived classes,
     * processes a display math switcher `$$`.
     */
    protected abstract EatDisplayMathSwitcher(): void;

    /**
     * When overridden in derived classes,
     * processes an inline math switcher `$`.
     */
    protected abstract EatInlineMathSwitcher(): void;

    /**
     * When overridden in derived classes,
     * processes text.
     * 
     * @param text The text, as-is.
     */
    protected abstract EatText(text: string): void;

    /**
     * When overridden in derived classes,
     * returns the processed object.
     */
    protected abstract Finish(): any;

    public Render(): any
    {
/**
 * Case 1: Command with alphabetical names, eat whitespace.
 * Case 2: Command with non-alphabetical names.
 * Case 3: {
 * Case 4: }
 * Case 5: $$
 * Case 6: $
 * Case 7: Comment, eat until end of line.
 * Case 8: Text.
 */
        const rgx =
/\\([a-zA-Z]+)[ \t\v\r\n]*|\\([^a-zA-Z])|([{])|([}])|([$][$])|([$])|%[^\r\n]*(\r\n|\r|\n|$)|[^\\{}$%]+/g;
        let token: string[] | null = null;
        const text = this.Text;
        while (token = rgx.exec(text))
        {
            const csname = token[1] || token[2];
            /* \LaTeX \{ and the like */
            if (csname !== undefined)
            {
                this.EatControlSeq(csname, token[0]);
            }
            /* { */
            else if (token[3] !== undefined)
            {
                this.EatGroupOpen();
            }
            /* } */
            else if (token[4] !== undefined)
            {
                this.EatGroupClose();
            }
            /* $$ */
            else if (token[5] !== undefined)
            {
                this.EatDisplayMathSwitcher();
            }
            /* $ */
            else if (token[6] !== undefined)
            {
                this.EatInlineMathSwitcher();
            }
            /* not a comment */
            else if (token[7] === undefined)
            {
                this.EatText(token[0]);
            }
        }
        return this.Finish();
    }
}
