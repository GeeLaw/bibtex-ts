const ParsingErrorCodes_Success                             =  0;
const ParsingErrorCodes_ExpectingTypeId                     =  1;
const ParsingErrorCodes_TypeIdMustStartWithLetter           =  2;
const ParsingErrorCodes_ExpectingLeftParenOrLeftBrace       =  3;
const ParsingErrorCodes_ExpectingRightParen                 =  4;
const ParsingErrorCodes_ExpectingConcatOrRightParen         =  5;
const ParsingErrorCodes_ExpectingCommaOrRightParen          =  6;
const ParsingErrorCodes_ExpectingConcatOrCommaOrRightParen  =  7;
const ParsingErrorCodes_ExpectingRightBrace                 =  8;
const ParsingErrorCodes_ExpectingConcatOrRightBrace         =  9;
const ParsingErrorCodes_ExpectingCommaOrRightBrace          = 10;
const ParsingErrorCodes_ExpectingConcatOrCommaOrRightBrace  = 11;
const ParsingErrorCodes_ExpectingStringId                   = 12;
const ParsingErrorCodes_StringIdMustStartWithLetter         = 13;
const ParsingErrorCodes_ExpectingEntryId                    = 14;
const ParsingErrorCodes_EntryIdMustStartWithValidChars      = 15;
const ParsingErrorCodes_ExpectingFieldId                    = 16;
const ParsingErrorCodes_FieldIdMustStartWithLetter          = 17;
const ParsingErrorCodes_ExpectingCommaAfterId               = 18;
const ParsingErrorCodes_ExpectingCommaAfterString           = 19;
const ParsingErrorCodes_ExpectingEqualSign                  = 20;
const ParsingErrorCodes_ExpectingString                     = 21;
const ParsingErrorCodes_NonNumericStringWithoutDelim        = 22;
const ParsingErrorCodes_IncompleteStringInQuotes            = 23;
const ParsingErrorCodes_IncompleteStringInBraces            = 24;
const ParsingErrorCodes_UnbalancedRightBraceInQuotedString  = 25;
const ParsingErrorCodes_StringLiteralTooLong                = 26;
const ParsingErrorCodes_AtSymbolInStringInBraces            = 27;
const ParsingErrorCodes_IncompleteCommentInParen            = 28;
const ParsingErrorCodes_IncompleteCommentInBraces           = 29;
const ParsingErrorCodes_DuplicateEntryId                    = 30;
const ParsingErrorCodes_DuplicateStringId                   = 31;
const ParsingErrorCodes_DuplicateFieldId                    = 32;
const ParsingErrorCodes_NoEntryId                           = 33;

/**
 * An object that maps names of error codes to their numeric values.
 */
const ParsingErrorCodes = (function (pec: any): any
{
pec['Success'] =
    ParsingErrorCodes_Success;
pec['ExpectingTypeId'] =
    ParsingErrorCodes_ExpectingTypeId;
pec['TypeIdMustStartWithLetter'] =
    ParsingErrorCodes_TypeIdMustStartWithLetter;
pec['ExpectingLeftParenOrLeftBrace'] =
    ParsingErrorCodes_ExpectingLeftParenOrLeftBrace;
pec['ExpectingRightParen'] =
    ParsingErrorCodes_ExpectingRightParen;
pec['ExpectingConcatOrRightParen'] =
    ParsingErrorCodes_ExpectingConcatOrRightParen;
pec['ExpectingCommaOrRightParen'] =
    ParsingErrorCodes_ExpectingCommaOrRightParen;
pec['ExpectingConcatOrCommaOrRightParen'] =
    ParsingErrorCodes_ExpectingConcatOrCommaOrRightParen;
pec['ExpectingRightBrace'] =
    ParsingErrorCodes_ExpectingRightBrace;
pec['ExpectingConcatOrRightBrace'] =
    ParsingErrorCodes_ExpectingConcatOrRightBrace;
pec['ExpectingCommaOrRightBrace'] =
    ParsingErrorCodes_ExpectingCommaOrRightBrace;
pec['ExpectingConcatOrCommaOrRightBrace'] =
    ParsingErrorCodes_ExpectingConcatOrCommaOrRightBrace;
pec['ExpectingStringId'] =
    ParsingErrorCodes_ExpectingStringId;
pec['StringIdMustStartWithLetter'] =
    ParsingErrorCodes_StringIdMustStartWithLetter;
pec['ExpectingEntryId'] =
    ParsingErrorCodes_ExpectingEntryId;
pec['EntryIdMustStartWithValidChars'] =
    ParsingErrorCodes_EntryIdMustStartWithValidChars;
pec['ExpectingFieldId'] =
    ParsingErrorCodes_ExpectingFieldId;
pec['FieldIdMustStartWithLetter'] =
    ParsingErrorCodes_FieldIdMustStartWithLetter;
pec['ExpectingCommaAfterId'] =
    ParsingErrorCodes_ExpectingCommaAfterId;
pec['ExpectingCommaAfterString'] =
    ParsingErrorCodes_ExpectingCommaAfterString;
pec['ExpectingEqualSign'] =
    ParsingErrorCodes_ExpectingEqualSign;
pec['ExpectingString'] =
    ParsingErrorCodes_ExpectingString;
pec['NonNumericStringWithoutDelim'] =
    ParsingErrorCodes_NonNumericStringWithoutDelim;
pec['IncompleteStringInQuotes'] =
    ParsingErrorCodes_IncompleteStringInQuotes;
pec['IncompleteStringInBraces'] =
    ParsingErrorCodes_IncompleteStringInBraces;
pec['UnbalancedRightBraceInQuotedString'] =
    ParsingErrorCodes_UnbalancedRightBraceInQuotedString;
pec['StringLiteralTooLong'] =
    ParsingErrorCodes_StringLiteralTooLong;
pec['AtSymbolInStringInBraces'] =
    ParsingErrorCodes_AtSymbolInStringInBraces;
pec['IncompleteCommentInParen'] =
    ParsingErrorCodes_IncompleteCommentInParen;
pec['IncompleteCommentInBraces'] =
    ParsingErrorCodes_IncompleteCommentInBraces;
pec['DuplicateEntryId'] =
    ParsingErrorCodes_DuplicateEntryId;
pec['DuplicateStringId'] =
    ParsingErrorCodes_DuplicateStringId;
pec['DuplicateFieldId'] =
    ParsingErrorCodes_DuplicateFieldId;
pec['NoEntryId'] =
    ParsingErrorCodes_NoEntryId;

return Helper.FreezeObject(pec);
})(Helper.NewEmptyObject());

/**
 * An array that maps numeric error codes to the standard error messages.
 */
const ParsingErrorMessages: string[] =
[
'The operation completed successfully.',
'Expecting a type identifier (@ symbol at the end of stream).',
'A type identifier must start with a letter.',
'Expecting left parenthesis "(" or left brace "{" (disallowed character in the type identifier?).',
'Expecting right parenthesis ")".',
'Expecting concat operator "#" or right parenthesis ")" (string already completed).',
'Expecting comma "," or right parenthesis ")" (disallowed character in the entry identifier?).',
'Expecting concat operator "#", comma ",", or right parenthesis ")" (string already completed).',
'Expecting right brace "}".',
'Expecting concat operator "#" or right brace "}" (string already completed).',
'Expecting comma "," or right brace "}" (disallowed character in the entry identifier?).',
'Expecting concat operator "#", comma ",", or right brace "}" (string already completed).',
'Expecting a string identifier (end of stream; unbalanced enclosing?).',
'A string identifier must start with a letter or an underscore.',
'Expecting an entry identifier (end of stream; unbalanced enclosing?).',
'An entry identifier (citation key) must start with these characters: a-z A-Z 0-9 _ - . : + /.',
'Expecting a field identifier (end of stream; unbalanced enclosing?).',
'A field identifier must start with a letter.',
'Expecting comma "," (disallowed character for the previous identifier?).',
'Expecting comma "," (string already completed).',
'Expecting equal sign "=" (disallowed character in the field/string identifier?).',
'Expecting number, string in quotes, string in braces or string identifier.',
'Non-numeric strings must be delimited with quotes or braces.',
'The string in quotes is incomplete (unbalanced braces could have prevented completion).',
'The string in braces is incomplete (unbalanced braces?).',
'The string in quotes has a closing brace at brace depth 0.',
'The string literal is too long (usually indicating an error in brace balancing; use concatenation (#) if such length is required).',
'An @ symbol appears in a string in braces (could indicate an error in brace balancing; use string in quotes for including @ in the literal).',
'The @comment command is incomplete (missing closing parenthesis, unbalanced braces?).',
'The @comment command is incomplete (missing closing brace).',
'There is a duplicate entry identifier (citation key) (first entry kept).',
'There is a duplicate string identifier (later definition kept).',
'There is a duplicate field name (first value kept).',
'This entry has no identifier (citation key) (entry still kept if otherwise parsed).'
];

Helper.FreezeObject(ParsingErrorMessages);

/**
 * Represents an error in parsing the BibTeX database.
 * Instances are intended to be immutable.
 * 
 * @remarks All parsing errors are recovered by discarding the unfinished
 * entry and skipping until the next `@` symbol from the current position.
 */
class ParsingError
{
    public readonly Code: number;
    public readonly Position: number;
    public readonly Message: string;

    /**
     * Initializes a new `ParsingError` instance.
     * 
     * @remarks The constructor type checks the input
     * so that it's safe to be consumed from JavaScript.
     * 
     * @param code The numeric error code.
     * @param pos  A hint of the position of this error.
     */
    public constructor(code: number, pos: number)
    {
        this.Code = code = Number(code);
        if (!(code > -65536 && code < 65536))
        {
            this.Code = Number.NaN;
        }
        else
        {
            this.Code >>= 0;
        }
        this.Position = pos = Number(pos);
        if (!(pos >= 0))
        {
            this.Position = 0;
        }
        else
        {
            this.Position >>>= 0;
        }
        this.Message = ParsingErrorMessages[code] ||
            ('Unknown error ' + this.Code + '.');
        Helper.FreezeObject(this);
    }
}

ExportBibTeX.Errors = Helper.NewEmptyObject();
ExportBibTeX.Errors.ParsingErrorCodes = ParsingErrorCodes;
ExportBibTeX.Errors.ParsingErrorMessages = ParsingErrorMessages;
ExportBibTeX.Errors.ParsingError = ParsingError;
