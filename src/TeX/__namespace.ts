ExportBibTeX.TeX = (function (ns: any): any
{
ns.SimpleHandler = TeX_SimpleHandler;
ns.TextRenderer = TeX_TextRenderer;

return ns;
})(Helper.NewEmptyObject());

ExportBibTeX._Privates.TeX = (function (ns: any): any
{
ns.SimpleHandler = TeX_SimpleHandler;

ns.TextRendererPrivates = TeX_TextRendererPrivates;
ns.TextRenderer = TeX_TextRenderer;

return ns;
})(Helper.NewEmptyObject());
