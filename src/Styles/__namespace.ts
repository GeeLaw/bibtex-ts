/**
 * Gets the year of an entry.
 * 
 * @param entry The `Entry` or `EntryData` object.
 * @returns The year as an integer if `year` is present and can be
 *          parsed as an integer between -999999 and 999999;
 *          `NaN` otherwise.
 */
function Styles_ResolveYear(entry: Styles_EntryOrEntryData): number
{
    if (entry instanceof ObjectModel_EntryData)
    {
        entry = entry.Resolve();
    }
    if (!(entry instanceof ObjectModel_Entry))
    {
        return Number.NaN;
    }
    const yearField = entry.Fields['year'];
    if (yearField === undefined)
    {
        return Number.NaN;
    }
    const yearString =
        yearField.PurifiedPedantic.
        replace(/ /g, '').
        replace(/[A-Z]+/g, function (x) { return x.toLowerCase(); });
    /* Case 1: Number with/without sign. */
    {
        const rgx = /^[+-]?[0-9]{1,6}$/;
        const match = rgx.exec(yearString);
        if (match)
        {
            return parseInt(yearString);
        }
    }
    /* Case 2: BC/AD, nnn */
    {
        const rgx =
            /^((b\.?c\.?(e\.?)?)|(c\.?e\.?|a\.?d\.?)),?([0-9]{1,6})$/;
        const match = rgx.exec(yearString);
        if (match)
        {
            return (match[2] ? -1 : 1) * parseInt(match[5]);
        }
    }
    /* Case 2: nnn, BC/AD */
    {
        const rgx =
            /^([0-9]{1,6}),?((b\.?c\.?(e\.?)?)|(c\.?e\.?|a\.?d\.?))$/;
        const match = rgx.exec(yearString);
        if (match)
        {
            return (match[3] ? -1 : 1) * parseInt(match[1]);
        }
    }
    return Number.NaN;
}

const Styles_MonthTranslator =
[
    [],
    ['01', 'jan', '1', 'january'],
    ['02', 'feb', '2', 'february'],
    ['03', 'mar', '3', 'march'],
    ['04', 'apr', '4', 'april'],
    ['05', 'may', '5'],
    ['06', 'jun', '6', 'june'],
    ['07', 'jul', '7', 'july'],
    ['08', 'aug', '8', 'august'],
    ['09', 'sep', '9', 'sept', 'september'],
    ['10', 'oct', 'october'],
    ['11', 'nov', 'november'],
    ['12', 'dec', 'december'],
];

/**
 * Gets the month of an entry.
 * 
 * @param entry The `Entry` or `EntryData` object.
 * @returns The month as an integer (1 to 12) if `month` is present
 *          and can be parsed; `NaN` otherwise.
 */
function Styles_ResolveMonth(entry: Styles_EntryOrEntryData): number
{
    if (entry instanceof ObjectModel_EntryData)
    {
        entry = entry.Resolve();
    }
    if (!(entry instanceof ObjectModel_Entry))
    {
        return Number.NaN;
    }
    const monthField = entry.Fields['month'];
    if (monthField === undefined)
    {
        return Number.NaN;
    }
    const monthString =
        monthField.PurifiedPedantic.replace(/ /g, '').toLowerCase();
    for (let i = 1; i !== 13; ++i)
    {
        if (Styles_MonthTranslator[i].indexOf(monthString) >= 0)
        {
            return i;
        }
    }
    return Number.NaN;
}

ExportBibTeX.Styles = (function (ns: any): any
{
ns.ResolveYear = Styles_ResolveYear;
ns.ResolveMonth = Styles_ResolveMonth;

ns.Alpha = Styles_Alpha;
ns.Plain = Styles_Plain;
ns.Abbrv = Styles_Abbrv;

return ns;
})(Helper.NewEmptyObject());

ExportBibTeX._Privates.Styles = (function (ns: any): any
{
ns.ResolveYear = Styles_ResolveYear;
ns.ResolveMonth = Styles_ResolveMonth;

ns.Helper = Styles_Helper;
ns.StandardStyleHelper = Styles_StandardStyleHelper;
ns.StandardStyle = Styles_StandardStyle;

ns.AlphaImpl = Styles_AlphaImpl;
ns.Alpha = Styles_Alpha;

ns.PlainImpl = Styles_PlainImpl;
ns.Plain = Styles_Plain;

ns.AbbrvImpl = Styles_AbbrvImpl;
ns.Abbrv = Styles_Abbrv;

return ns;
})(Helper.NewEmptyObject());
