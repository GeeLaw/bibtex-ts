/**
 * A helper object that contains convenient procedures, constants and
 * poly-fills of certain functions.
 */
const Helper: any = (function (): any
{

function BindFunction1(pfn: Function, thisArg: any, firstArgs: any[]): Function
{
    const applyArgs: [any, ...any[]] = [thisArg];
    if (firstArgs instanceof Array)
    {
        for (const arg of firstArgs)
        {
            applyArgs.push(arg);
        }
    }
    return Function.prototype.bind.apply(pfn, applyArgs);
}
function BindFunction2(pfn: Function, thisArg: any, firstArgs: any[]): Function
{
    const fixedArgs: any[] = [];
    if (firstArgs instanceof Array)
    {
        for (const arg of firstArgs)
        {
            fixedArgs.push(arg);
        }
    }
    function pfnBound()
    {
        const applyArgs: any[] = [];
        for (const arg of fixedArgs)
        {
            applyArgs.push(arg);
        }
        for (let i = 0, j = arguments.length; i !== j; ++i)
        {
            applyArgs.push(arguments[i]);
        }
        pfn.apply(thisArg, applyArgs);
    }
    return pfnBound;
}

const binder = (typeof Function.prototype.bind === 'function'
    ? BindFunction1 : BindFunction2);

/* Bootstrap (start with the best empty object). */
const helper: any = (function (): any
{
    function NewEmptyObject(): any { return {}; }
    if (typeof Object.create !== 'function')
    {
        return { EmptyObject: {},
            NewEmptyObject: NewEmptyObject,
            BindFunction: binder };
    }
    const helper: any = Object.create(null);
    helper['EmptyObject'] = Object.create(null);
    helper['NewEmptyObject'] = binder(Object.create, Object, [null]);
    helper['BindFunction'] = binder;
    return helper;
})();

function FakeFreeze<T>(obj: T): Readonly<T> { return obj; }
function FreezeDescendants<T>(obj: T, noRecurseInto?: any): T
{
    if (obj === noRecurseInto)
    {
        return obj;
    }
    for (const key in obj)
    {
        if (key !== '_Mutable' && key !== '_MutablePrivates')
        {
            const child = obj[key];
            const childType = typeof child;
            if (childType === 'object' || childType === 'function')
            {
                Object.freeze(FreezeDescendants(child, noRecurseInto));
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
    helper['FreezeObject'] = binder(Object.freeze, Object, []);
    helper['FreezeDescendants'] = FreezeDescendants;
}

function RepeatString1(str: string, n: number): string
{
    n = (n >= 0 ? n >>> 0 : 0);
    return (n !== 0
        ? (str as any).repeat(n) as string
        : '');
}
function RepeatString2(str: string, n: number): string
{
    n = (n >= 0 ? n >>> 0 : 0);
    let result = '';
    while (n !== 0)
    {
        if ((n & 1) === 1)
        {
            result += str;
        }
        str += str;
        n >>>= 1;
    }
    return result;
}

helper.RepeatString = (
    typeof (String.prototype as any).repeat === 'function'
    ? RepeatString1 : RepeatString2);

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
