console.log('BibTeX basic test cases.\n' +
'Many cases are due to Tame the BeaST by Nicolas Markey.\n' +
'At the end of the test, you should see "All tests completed."\n');

const BibTeX = require('../lib/bibtex');

function ArrayEquals(arr1, arr2)
{
    if (arr1.length !== arr2.length)
    {
        return false;
    }
    for (let i = 0, j = arr1.length; i !== j; ++i)
    {
        if (arr1[i] !== arr2[i])
        {
            return false;
        }
    }
    return true;
}

const TitleEncodings =
[
    {
        text: 'The \\LaTeX Companion',
        purified: 'The LaTeX Companion',
        titlecase: 'The \\latex companion'
    },
    {
        text: 'The {\\LaTeX} {C}ompanion',
        purified: 'The  Companion',
        titlecase: 'The {\\LaTeX} {C}ompanion'
    },
    {
        text: 'The {\\csname LaTeX\\endcsname} {C}ompanion',
        purified: 'The LaTeX Companion',
        titlecase: 'The {\\csname latex\\endcsname} {C}ompanion'
    },
    {
        text: 'The { \\LaTeX} {C}ompanion',
        purified: 'The  LaTeX Companion',
        titlecase: 'The { \\LaTeX} {C}ompanion'
    },
    {
        text: 'The{ \\LaTeX} {C}ompanion',
        purified: 'The LaTeX Companion',
        titlecase: 'The{ \\LaTeX} {C}ompanion'
    },
    {
        text: 'The {{\\LaTeX}} {C}ompanion',
        purified: 'The LaTeX Companion',
        titlecase: 'The {{\\LaTeX}} {C}ompanion'
    }
];

const Ecoles =
[
    {
        text: '{\\\'E}cole',
        purified: 'Ecole',
        lowercase: '{\\\'e}cole',
        prefix1: '{\\\'E}'
    },
    {
        text: '{\\\'{E}}cole',
        purified: 'Ecole',
        lowercase: '{\\\'{e}}cole',
        prefix1: '{\\\'{E}}'
    },
    {
        text: '{{\\\'E}}cole',
        purified: 'Ecole',
        lowercase: '{{\\\'E}}cole',
        prefix1: '{{\\}}'
    }
];
const Names1 =
[
    {
        text: 'jean de la fontaine',
        first: [],
        von: ['jean', 'de', 'la'],
        last: ['fontaine']
    },
    {
        text: 'Jean de la fontaine',
        first: ['Jean'],
        von: ['de', 'la'],
        last: ['fontaine']
    },
    {
        text: 'Jean {de} la fontaine',
        first: ['Jean', 'de'],
        von: ['la'],
        last: ['fontaine']
    },
    {
        text: 'jean {de} {la} fontaine',
        first: [],
        von: ['jean'],
        last: ['de', 'la', 'fontaine']
    },
    {
        text: 'Jean {de} {la} fontaine',
        first: ['Jean', 'de', 'la'],
        von: [],
        last: ['fontaine']
    },
    {
        text: 'Jean De La Fontaine',
        first: ['Jean', 'De', 'La'],
        von: [],
        last: ['Fontaine']
    },
    {
        text: 'jean De la Fontaine',
        first: [],
        von: ['jean', 'De', 'la'],
        last: ['Fontaine']
    },
    {
        text: 'Jean de La Fontaine',
        first: ['Jean'],
        von: ['de'],
        last: ['La', 'Fontaine']
    },
    {
        text: 'jean de la fontaine,',
        first: [],
        von: ['jean', 'de', 'la'],
        last: ['fontaine']
    },
    {
        text: 'de la fontaine, Jean',
        first: ['Jean'],
        von: ['de', 'la'],
        last: ['fontaine']
    },
    {
        text: 'De La Fontaine, Jean',
        first: ['Jean'],
        von: [],
        last: ['De', 'La', 'Fontaine']
    },
    {
        text: 'De la Fontaine, Jean',
        first: ['Jean'],
        von: ['De', 'la'],
        last: ['Fontaine']
    },
    {
        text: 'de La Fontaine, Jean',
        first: ['Jean'],
        von: ['de'],
        last: ['La', 'Fontaine']
    }
];

const Names2 =
[
    {
        text: 'Jean-Fran\\c{c}ois Quelqu\'un',
        vlf: '|Quelqu\'un|J.-F.',
        label: 'Q'
    },
    {
        text: 'Jean-baptiste Pouquelin',
        vlf: 'baptiste|Pouquelin|J.',
        label: 'bP'
    },
    {
        text: '{\\relax Ch}ristopher Someone',
        vlf: '|Someone|{\\relax Ch}.',
        label: 'S'
    },
    {
        text: '{\\uppercase{d}e La} Cruz, Maria',
        vlf: '{\\uppercase{d}e La}|Cruz|M.',
        label: '{\\uppercase{d}e La}C'
    },
    {
        text: '{\\uppercase{d}}e {\\uppercase{l}}a Cruz, Maria',
        vlf: '{\\uppercase{d}}e~{\\uppercase{l}}a|Cruz|M.',
        label: '{\\uppercase{d}}{\\uppercase{l}}C'
    },
    {
        text: '{D}e {L}a Cruz, Maria',
        vlf: '{D}e~{L}a|Cruz|M.',
        label: '{D}{L}C'
    }
];

const Names3 =
[
    {
        text: 'de la Cierva {\\lowercase{Y}} Codorn{\\\'\\i}u, Juan',
        vlf: 'de~la|Cierva~{\\lowercase{Y}}~Codorn{\\\'\\i}u|J.',
        label: 'C{\\lowercase{Y}}C'
    },
    {
        text: 'de la Cierva {y} Codorn{\\\'\\i}u, Juan',
        vlf: 'de~la|Cierva~{y}~Codorn{\\\'\\i}u|J.',
        label: 'C{y}C'
    },
    {
        text: 'de la Cierva{ }y Codorn{\\\'\\i}u, Juan',
        vlf: 'de~la|Cierva{ }y~Codorn{\\\'\\i}u|J.',
        label: 'CC'
    },
    {
        text: 'de la {Cierva y} Codorn{\\\'\\i}u, Juan',
        vlf: 'de~la|{Cierva y}~Codorn{\\\'\\i}u|J.',
        label: '{C}C'
    },
    {
        text: 'Jean d\'\\relax Ormesson',
        vlf: 'd\'\\relax|Ormesson|J.',
        label: 'O'
    },
    {   text: 'others',
        vlf: '|others|',
        label: 'o'
    }
];

const NameFormats =
[
    {
        text: 'Goossens, Michel and Mittelbach, Franck and Samarin, Alexande',
        which: 2,
        format: '{f. }{vv }{ll}{, jj}',
        expected: 'F. Mittelbach'
    },
    {
        text: 'Charles Jean Gustave Nicolas de La Vall{\\\'e}e Poussin',
        which: 1,
        format: '{vv }{ll}{, f}',
        expected: 'de La~Vall{\\\'e}e~Poussin, C.~J.~G.~N'
    },
    {
        text: 'Doppler, {\\relax Ch}ristian Andreas',
        which: 1,
        format: '{f. }{vv }{ll}',
        expected: '{\\relax Ch}.~A. Doppler'
    },
    {
        text: 'Jean-Baptiste Poquelin',
        which: 1,
        format: '{f. }{vv }{ll}',
        expected: 'J.-B. Poquelin'
    },
    {
        text: 'Charles Jean Gustave Nicolas de La Vall{\\\'e}e Poussin',
        which: 1,
        format: '{l}',
        expected: 'L.~V.~P'
    },
    {
        text: 'Charles Jean Gustave Nicolas de La Vall{\\\'e}e Poussin',
        which: 1,
        format: '{l{}}',
        expected: 'LVP'
    },
    {
        text: 'Charles Jean Gustave Nicolas de La Vall{\\\'e}e Poussin',
        which: 1,
        format: '{{\\scshape\\bgroup}ff{ }{\\egroup}}',
        expected: '{\\scshape\\bgroup}Charles Jean Gustave Nicolas{\\egroup}'
    },
    {
        text: 'de la Cierva y Codorn{\\\'\\i}u, Juan',
        which: 1,
        format: '{ff - }{vv - }{ll}',
        expected: 'Juan - de~la~Cierva~y - Codorn{\\\'\\i}u'
    },
    {
        /* Special handling for \relax~. */
        text: 'Jean d\'\\relax Ormesson',
        which: 1,
        format: '{vv~}{ll}{, f.}',
        expected: 'd\'\\relax Ormesson, J.'
    },
    {
        /* Special handling for ~~ (forced tie). */
        text: 'Jean d\'\\relax Ormesson',
        which: 1,
        format: '{vv~~}{ll}{, f.}',
        expected: 'd\'\\relax~Ormesson, J.'
    }
];

const TeXRendering =
[
    {
        tex: '\\noopsort{1984}2014\\noopsort{2016}',
        text: '2014'
    },
    {
        tex: '1\\switchargs{23}{45}6',
        text: '145236'
    },
    {
        tex: '1\\printfirst{23}{45}6',
        text: '1236'
    },
    {
        tex: 'My name is \\singleletter{Ch}ris.',
        text: 'My name is Chris.'
    }
];

for (const test of TitleEncodings)
{
    const title = BibTeX.ParseLiteral(test.text).Result;
    console.assert(title.Purified === test.purified,
        'purify$', test);
    console.assert(title.ToTitleCase().Raw === test.titlecase,
        'change.case$', test);
}

for (const test of Ecoles)
{
    const ecole = BibTeX.ParseLiteral(test.text).Result;
    console.assert(ecole.Purified === test.purified,
        'purify$', test);
    console.assert(ecole.ToLowerCase().Raw === test.lowercase,
        'change.case$', test);
    console.assert(ecole.Prefix(1).Raw === test.prefix1,
        'tex.prefix$', test);
}

for (const test of Names1)
{
    const name = BibTeX.ParsePersonNames(
        BibTeX.ParseLiteral(test.text).Result)[0];
    console.assert(ArrayEquals(name.First.map(x => x.Purified), test.first),
        'format.name$ (First)', test);
    console.assert(ArrayEquals(name.von.map(x => x.Purified), test.von),
        'format.name$ (von)', test);
    console.assert(ArrayEquals(name.Last.map(x => x.Purified), test.last),
        'format.name$ (Last)', test);
}

for (const test of Names2)
{
    const name = BibTeX.ParsePersonNames(
        BibTeX.ParseLiteral(test.text).Result)[0];
    console.assert(name.Format('{vv}|{ll}|{f.}') === test.vlf,
        'format.name$ {vv}|{ll}|{f.}', test);
    console.assert(name.Format('{v{}}{l{}}') === test.label,
        'format.name$ {v{}}{l{}}', test);
}

for (const test of Names3)
{
    const name = BibTeX.ParsePersonNames(
        BibTeX.ParseLiteral(test.text).Result)[0];
    console.assert(name.Format('{vv}|{ll}|{f.}') === test.vlf,
        'format.name$ {vv}|{ll}|{f.}', test);
    console.assert(name.Format('{l{}}') === test.label,
        'format.name$ {l{}}', test);
}

for (const test of NameFormats)
{
    console.assert(BibTeX.ParsePersonNames(
        BibTeX.ParseLiteral(test.text).Result
        )[test.which - 1].Format(test.format) === test.expected,
        'format.name$', test);
}

for (const test of TeXRendering)
{
    console.assert(BibTeX.TeX.ToPlainText(test.tex) === test.text,
        'ToPlainText', test);
}

console.log('All tests completed.');
