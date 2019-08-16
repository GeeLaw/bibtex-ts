ExportBibTeX.TeX = (function (ns: any): any
{
ns.SimpleHandler = TeX_SimpleHandler;
ns.SimpleRenderer = TeX_SimpleRenderer;
ns.TextRenderer = TeX_TextRenderer;

ns.ToPlainText = TeX_ToPlainText;

return ns;
})(Helper.NewEmptyObject());

ExportBibTeX._Privates.TeX = (function (ns: any): any
{
ns.SimpleHandler = TeX_SimpleHandler;

ns.SimpleRenderer = TeX_SimpleRenderer;
ns.SimpleRendererPrivates = TeX_SimpleRendererPrivates;

ns.TextRendererPrivates = TeX_TextRendererPrivates;
ns.TextRenderer = TeX_TextRenderer;

ns.ToPlainText = TeX_ToPlainText;

return ns;
})(Helper.NewEmptyObject());
