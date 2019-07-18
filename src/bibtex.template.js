;(function ()
{
'use strict';

/* @@ helper.js */
;
/* helper.js @@ */

/* @@ errors.js */
;
/* errors.js @@ */

/* @@ objectmodel.js */
;
/* objectmodel.js @@ */

/* @@ strings.js */
;
/* strings.js @@ */

/* @@ parse-basics.js */
;
/* parse-basics.js @@ */

/* @@ parse-id.js */
;
/* parse-id.js @@ */

/* @@ parse-string.js */
;
/* parse-string.js @@ */

/* @@ parse-comment.js */
;
/* parse-comment.js @@ */

/* @@ parse-preamble.js */
;
/* parse-preamble.js @@ */

/* @@ parse-strdef.js */
;
/* parse-strdef.js @@ */

/* @@ parse-entry.js */
;
/* parse-entry.js @@ */

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
