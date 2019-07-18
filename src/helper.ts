/**
 * A helper object that contains convenient procedures, constants and
 * poly-fills of certain functions.
 */
const Helper: any = (function (): any
{

/* Bootstrap (start with the best empty object). */
const helper: any = (function (): any
{
    function NewEmptyObject(): any { return {}; }
    if (typeof Object.create !== 'function')
    {
        return { NewEmptyObject: NewEmptyObject, EmptyObject: {} };
    }
    const helper: any = Object.create(null);
    helper['NewEmptyObject'] = Object.create.bind(Object, null);
    helper['EmptyObject'] = Object.create(null);
    return helper;
})();

function FakeFreeze<T>(obj: T): Readonly<T> { return obj; }
function FreezeDescendants<T>(obj: T): T
{
    for (const key in obj)
    {
        if (key !== '_Mutable' && key !== '_MutablePrivates')
        {
            const child = obj[key];
            const childType = typeof child;
            if (childType === 'object' || childType === 'function')
            {
                Object.freeze(FreezeDescendants(child));
            }
        }
    }
    return obj;
}

if (typeof Object.freeze !== 'function')
{
    helper['FreezeObject'] = FakeFreeze;
    helper['FreezeDescendants'] = FakeFreeze;
}
else
{
    helper['FreezeObject'] = Object.freeze.bind(Object);
    helper['FreezeDescendants'] = FreezeDescendants;
}

helper.FreezeDescendants(helper);
helper.FreezeObject(helper);

return helper;

})();

/**
 * This object stores the module's exports.
 */
const ExportBibTeX: any = (function (bibtex: any): any
{
    bibtex._Privates = Helper.NewEmptyObject();
    return bibtex;
})(Helper.NewEmptyObject());
