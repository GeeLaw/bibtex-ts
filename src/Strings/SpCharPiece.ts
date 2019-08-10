/**
 * An object for efficient construction of `SpChar`.
 */
class Strings_SpCharPieceBuilder
{
    public readonly Value: string;
    public readonly Case: Case;
    public readonly Purified: string;
    public readonly Raw: string;

    public constructor(value: string)
    {
        this.Value = value;
        const purified = value.replace(
/* This regular expression virtually splits the string into
 * tokens and perform purification on each token.
 * Note that LaTeX commands with alphabetical names
 * will have their trailing whitespace removed by case 6.
 * 
 * Case 1: Convert \AE\OE\ae\oe\ss\L\O\i\j\l\o.
 * Case 2: Convert \aa into a.
 * Case 3: Convert \AA into A.
 * Case 4: Remove other LaTeX commands with alphabetical names.
 * Case 5: Remove LaTeX commands with non-alphabetical names.
 * Case 6: Remove ASCII characters that are not alphanumeric
 *         nor backslash, including space, tabulation, hyphen
 *         and tilde.
 * Case 7: Remove a possible trailing backslash.
 * Others: Keep them as-is.
 */
/\\(AE|OE|ae|oe|ss|[LOijlo])(?![a-zA-Z])|\\(a)a(?![a-zA-Z])|\\(A)A(?![a-zA-Z])|\\[a-zA-Z]+\*?|\\[^a-zA-Z]|[\u0000-\u002f\u003a-\u0040\u005b\u005d-\u0060\u007b-\u007f]+|\\$/g,
            '$1$2$3');
        const probe = /[a-zA-Z]/.exec(purified);
        this.Case = (probe
            ? /[A-Z]/.test(probe[0]) ? 'U' : 'l'
            : '?');
        this.Purified = purified;
        this.Raw = '{' + value + '}';
        Helper.FreezeObject(this);
    }
}

/**
 * Represents a special character (braced expression
 * at brace-depth 0 that starts with `\`).
 */
class Strings_SpCharPiece implements Strings_IStringPiece
{
    /**
     * Equals `{Value}`.
     */
    public readonly Raw: string;

    /**
     * Guaranteed to have balanced braces and start with `\`.
     */
    public readonly Value: string;

    /**
     * Equals `1`.
     */
    public readonly Length: number;

    /**
     * The case of the first of the following kinds of characters:
     * - LaTeX command name that matches `[ijoOlL]|oe|OE|ae|AE|aa|AA|ss`.
     * - Alphabetical character that is not part of a LaTeX command name.
     */
    public readonly Case: Case;

    /**
     * Replace according to this rule:
     * - Replace LaTeX commands `\i\j\o\O\l\L\oe\OE\ae\AE\ss`
     *   with thier names.
     * - Replace LaTeX command `\aa\AA` with `a`, `A`.
     * - Remove all other LaTeX commands.
     * - Remove all non-alphanumerical ASCII characters.
     */
    public readonly Purified: string;

    /**
     * `Purified` with non-ASCII characters also removed.
     */
    public readonly PurifiedPedantic: string;

    /**
     * Initializes a `SpCharPiece` instance.
     * The instance is immediately frozen.
     * If `value` is not `SpCharPieceBuilder`,
     * it is sanitized to have balanced braces
     * and start with `\` (a `\relax` command
     * is added when necessary).
     * 
     * @param value A `string` or `SpCharPieceBuilder`.
     */
    public constructor(value?: string | Strings_SpCharPieceBuilder)
    {
        if (!(value instanceof Strings_SpCharPieceBuilder))
        {
            value = Strings_BalanceBraces(value);
            if (value.length === 0)
            {
                value = '\\relax';
            }
            else if (/[ \t\v\f\r\n]/.test(value[0]))
            {
                value = '\\relax{}' + value;
            }
            else if (value[0] !== '\\')
            {
                value = '\\relax ' + value;
            }
            value = new Strings_SpCharPieceBuilder(value);
        }
        this.Raw = value.Raw;
        this.Value = value.Value;
        this.Length = 1;
        this.Case = value.Case;
        this.Purified = value.Purified;
        this.PurifiedPedantic =
            value.Purified.replace(/[^0-9A-Za-z ]+/g, '');
        Helper.FreezeObject(this);
    }

    /**
     * A canonical empty `SpCharPiece`.
     */
    public static readonly Empty = new Strings_SpCharPiece();
}
