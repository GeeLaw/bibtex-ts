;(function ()
{
'use strict';

/* @@ helper.js */
;
/* helper.js @@ */

/* @@ Strings */
;
/* Strings @@ */

/* @@ ObjectModel */
;
/* ObjectModel @@ */

/* @@ TeX */
;
/* TeX @@ */

/* @@ Styles */
;
/* Styles @@ */

Helper.FreezeDescendants(ExportBibTeX);
Helper.FreezeObject(ExportBibTeX);

if (typeof module !== 'undefined' && typeof exports === 'object')
{
    module.exports = ExportBibTeX;
}
else if (typeof define === 'function' && define.amd)
{
    define(function() { return ExportBibTeX; });
}
else
{
    this.BibTeX = ExportBibTeX;
}
      
}).call((function ()
{
    return this || (typeof window !== 'undefined' ? window : global);
})());
