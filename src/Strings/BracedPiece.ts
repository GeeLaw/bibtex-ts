/**
 * An object for efficient construction of `BracedPiece`.
 */
class Strings_BracedPieceBuilder
{
    public readonly Value: string;
    public readonly Length: number;
    public readonly Purified: string;
    public readonly Raw: string;

    public constructor(value: string)
    {
        this.Value = value;
        this.Length = value.replace(/[{}]/g, '').length;
        this.Purified = value.replace(/[~\t\v\f\r\n-]/g, ' ').replace(
/* Same rule as BasicPiece. */
/[\u0000-\u001f\u0021-\u002f\u003a-\u0040\u005b-\u0060\u007b-\u007f]+/g,
            '');
        this.Raw = '{' + value + '}';
        Helper.FreezeObject(this);
    }
}

/**
 * Represents a braced expression that is not
 * a special character.
 */
class Strings_BracedPiece implements Strings_IStringPiece
{
    /**
     * Equals `{Value}`.
     */
    public readonly Raw: string;

    /**
     * Guarnateed to have balanced braces and not start with `\`.
     */
    public readonly Value: string;

    /**
     * The number of non-brace characters in `Value`.
     */
    public readonly Length: number;

    /**
     * Equals `?`.
     */
    public readonly Case: Case;

    /**
     * 1. Replace tab, hyphen, tilde with space.
     * 2. Remove non-alphanumerical non-space ASCII characters.
     */
    public readonly Purified: string;

    /**
     * `Purified` with non-ASCII characters also removed.
     */
    public readonly PurifiedPedantic: string;

    /**
     * Initializes a `BracedPiece` instance.
     * The instance is immediately frozen.
     * If `value` is not a `BracedPieceBuilder`,
     * it is sanitized to have balanced braces
     * and not start with `\` (a pair of braces
     * is added when necessary).
     * 
     * @param value A `string` or `BracedPieceBuilder`.
     */
    public constructor(value?: string | Strings_BracedPieceBuilder)
    {
        if (!(value instanceof Strings_BracedPieceBuilder))
        {
            value = Strings_BalanceBraces(value);
            if (value[0] === '\\')
            {
                value = '{' + value + '}';
            }
            value = new Strings_BracedPieceBuilder(value);
        }
        this.Raw = value.Raw;
        this.Value = value.Value;
        this.Length = value.Length;
        this.Case = '?';
        this.Purified = value.Purified;
        this.PurifiedPedantic =
            value.Purified.replace(/[^0-9A-Za-z ]+/g, '');
        Helper.FreezeObject(this);
    }

    /**
     * A canonical empty `BracedPiece`.
     */
    public static readonly Empty = new Strings_BracedPiece();
}
