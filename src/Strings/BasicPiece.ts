/**
 * An object for efficient construction of `BasicPiece`.
 */
class Strings_BasicPieceBuilder
{
    public readonly Value: string;
    public readonly Case: Case;
    public readonly Purified: string;

    public constructor(value: string)
    {
        this.Value = value;
        const probe = /[a-zA-Z]/.exec(value);
        this.Case = (probe
            ? /[A-Z]/.test(probe[0]) ? 'U' : 'l'
            : '?');
        this.Purified = value.replace(/[~\t\v\f\r\n-]/g, ' ').replace(
/[\u0000-\u001f\u0021-\u002f\u003a-\u0040\u005b-\u0060\u007b-\u007f]+/g,
            '');
        Helper.FreezeObject(this);
    }
}

/**
 * Represents a piece of string outside braces.
 */
class Strings_BasicPiece implements Strings_IStringPiece
{
    /**
     * Equals `Value`.
     */
    public readonly Raw: string;

    /**
     * Guaranteed to not have braces.
     */
    public readonly Value: string;

    /**
     * Equals `Value.length`.
     */
    public readonly Length: number;

    /**
     * The case of the first alphabetical character in `Value`.
     */
    public readonly Case: Case;

    /**
     * 1. Replace tab, tilde, hyphen with space.
     * 2. Remove non-alphanumerical non-space ASCII characters.
     */
    public readonly Purified: string;

    /**
     * `Purified` with non-ASCII characters also removed.
     */
    public readonly PurifiedPedantic: string;

    /**
     * Initializes a `BasicPiece` instance.
     * The instance is immediately frozen.
     * If `value` is not a `BasicPieceBuilder`,
     * the value is sanitized to not have braces.
     * 
     * @param value A `string` or `BasicPieceBuilder`.
     */
    public constructor(value?: string | Strings_BasicPieceBuilder)
    {
        if (!(value instanceof Strings_BasicPieceBuilder))
        {
            value = new Strings_BasicPieceBuilder(
                ('' + (value || '')).replace(/[{}]/g, ''));
        }
        this.Raw = value.Value;
        this.Value = value.Value;
        this.Length = value.Value.length;
        this.Case = value.Case;
        this.Purified = value.Purified;
        this.PurifiedPedantic =
            value.Purified.replace(/[^0-9A-Za-z ]+/g, '');
        Helper.FreezeObject(this);
    }

    /**
     * A canonical instance for the empty `BasicPiece`.
     */
    public static readonly Empty = new Strings_BasicPiece();
}
