type ObjectModel_StrExprDict =
    { [id: string]: ObjectModel_StringExpr | undefined };

type ObjectModel_StrLitDict =
    { [id: string]: Strings_Literal | undefined };

type ObjectModel_IStringTerm =
    Strings_Literal | ObjectModel_StringRef;

type ObjectModel_EntryDataDict =
    { [id: string]: ObjectModel_EntryData | undefined };
    
type ObjectModel_EntryDict =
    { [id: string]: ObjectModel_Entry | undefined };

type ObjectModel_ParsingDelegate =
    () => boolean;

ExportBibTeX.ObjectModel = (function (ns: any): any
{
/* Strings */
ns.StringRef = ObjectModel_StringRef;
ns.StringExpr = ObjectModel_StringExpr;

/* Entries and database */
ns.Entry = ObjectModel_Entry;
ns.EntryData = ObjectModel_EntryData;
ns.ParseDatabaseResult = ObjectModel_ParseDatabaseResult;
ns.ParseDatabaseError = ObjectModel_ParseDatabaseError;

/* Names */
ns.PersonName = ObjectModel_PersonName;

/* Name formats */
ns.PersonNameFormatComponent = ObjectModel_PersonNameFormatComponent;
ns.PersonNameFormat = ObjectModel_PersonNameFormat;

return ns;
})(Helper.NewEmptyObject());

ExportBibTeX._Privates.ObjectModel = (function (ns: any): any
{
/* Strings */
ns.StringRefPrivates = ObjectModel_StringRefPrivates;
ns.StringRef = ObjectModel_StringRef;

ns.StringExprPrivates = ObjectModel_StringExprPrivates;
ns.StringExprBuilder = ObjectModel_StringExprBuilder;
ns.LaunderSummands = ObjectModel_LaunderSummands;
ns.StringExpr = ObjectModel_StringExpr;

/* Entries and database */
ns.RequiredFieldsCNF = ObjectModel_RequiredFieldsCNF;
ns.Entry = ObjectModel_Entry;
ns.EntryData = ObjectModel_EntryData;
ns.ParseDatabaseResult = ObjectModel_ParseDatabaseResult;
ns.ParseDatabaseError = ObjectModel_ParseDatabaseError;

ns.DatabaseParser = ObjectModel_DatabaseParser;
ns.ParseDatabase = ObjectModel_ParseDatabase;

/* Names */
ns.LaunderNameWordArray = ObjectModel_LaunderNameWordArray;
ns.LaunderNameLinkArray = ObjectModel_LaunderNameLinkArray;

ns.PersonName = ObjectModel_PersonName;

ns.PersonNameTokenComma = ObjectModel_PersonNameTokenComma;
ns.PersonNameTokenAnd = ObjectModel_PersonNameTokenAnd;
ns.PersonNameTokenLink = ObjectModel_PersonNameTokenLink;
ns.PersonNameTokenWord = ObjectModel_PersonNameTokenWord;
ns.GetPersonNameTokens = ObjectModel_GetPersonNameTokens;

ns.LaunderNameTokens = ObjectModel_LaunderNameTokens;
ns.ResolveName_First_von_Last = ObjectModel_ResolveName_First_von_Last;
ns.ResolveName_von_Last_Jr_First = ObjectModel_ResolveName_von_Last_Jr_First;
ns.ResolveName = ObjectModel_ResolveName;

ns.ParsePersonNames = ObjectModel_ParsePersonNames;

/* Name formats */
ns.FormatPersonNameWords =
    ObjectModel_FormatPersonNameWords;
ns.FormatPersonNameInitials =
    ObjectModel_FormatPersonNameInitials;
ns.FormatPersonNameWordsWithLink =
    ObjectModel_FormatPersonNameWordsWithLink;
ns.FormatPersonNameInitialsWithLink =
    ObjectModel_FormatPersonNameInitialsWithLink;

ns.PersonNameFormatComponent = ObjectModel_PersonNameFormatComponent;
ns.LaunderPersonNameFormatComponentArray =
    ObjectModel_LaunderPersonNameFormatComponentArray;
ns.PersonNameFormatBuilder = ObjectModel_PersonNameFormatBuilder;
ns.PersonNameFormat = ObjectModel_PersonNameFormat;

ns.PersonNameFormatParser = ObjectModel_PersonNameFormatParser;
ns.ParsePersonNameFormat = ObjectModel_ParsePersonNameFormat;

return ns;
})(Helper.NewEmptyObject());

ExportBibTeX.ParseDatabase = ObjectModel_ParseDatabase;
ExportBibTeX.ParsePersonNames = ObjectModel_ParsePersonNames;
ExportBibTeX.ParsePersonNameFormat = ObjectModel_ParsePersonNameFormat;
