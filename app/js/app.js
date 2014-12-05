var app = angular.module('Validator', ['ui.codemirror']);

app.factory('XML_Autocomplete', function() {
    var dummy = {
        attrs:    {
            color:       ["red", "green", "blue", "purple", "white", "black", "yellow"],
            size:        ["large", "medium", "small"],
            description: null
        },
        children: []
    };

    var tags = {
        "!top": ["top"],
        top:    {
            attrs:    {
                lang:     ["en", "de", "fr", "nl"],
                freeform: null
            },
            children: ["animal", "plant"]
        },
        animal: {
            attrs:    {
                name:   null,
                isduck: ["yes", "no"]
            },
            children: ["wings", "feet", "body", "head", "tail"]
        },
        plant:  {
            attrs:    {name: null},
            children: ["leaves", "stem", "flowers"]
        },
        wings:  dummy, feet: dummy, body: dummy, head: dummy, tail: dummy,
        leaves: dummy, stem: dummy, flowers: dummy
    };

    function completeAfter(cm, pred) {
        var cur = cm.getCursor();
        if(!pred || pred()) {
            setTimeout(function() {
                if(!cm.state.completionActive) {
                    CodeMirror.showHint(cm, CodeMirror.hint.xml, {schemaInfo: tags, completeSingle: false});
                }
            }, 100);
        }
        return CodeMirror.Pass;
    }

    function completeIfAfterLt(cm) {
        return completeAfter(cm, function() {
            var cur = cm.getCursor();
            return cm.getRange(CodeMirror.Pos(cur.line, cur.ch - 1), cur) == "<";
        });
    }

    function completeIfInTag(cm) {
        return completeAfter(cm, function() {
            var tok = cm.getTokenAt(cm.getCursor());
            if(tok.type == "string" && (!/['"]/.test(tok.string.charAt(tok.string.length - 1)) || tok.string.length == 1)) return false;
            var inner = CodeMirror.innerMode(cm.getMode(), tok.state).state;
            return inner.tagName;
        });
    }

    return {
        mode:      "xml",
        extraKeys: {
            "'<'":        completeAfter,
            "'/'":        completeIfAfterLt,
            "' '":        completeIfInTag,
            "'='":        completeIfInTag,
            "Ctrl-Space": function(cm) {
                CodeMirror.showHint(cm, CodeMirror.hint.xml, {schemaInfo: tags});
            }
        }
    };
});

app.controller('EditorCtrl', ['XML_Autocomplete', function(xmlAC) {
    var editor = this;

    // The modes
    editor.modes = ['Scheme', 'XML', 'Javascript'];
    editor.mode = editor.modes[0];


    // The ui-codemirror option
    editor.cmOption = angular.extend(xmlAC, {
        lineNumbers:    true,
        indentWithTabs: true,
        mode:           "miamu",
        foldGutter:     true,
        gutters:        ["CodeMirror-linenumbers", "CodeMirror-foldgutter"],
        onLoad:         function(_cm) {

            // HACK to have the codemirror instance in the scope...
            editor.modeChanged = function() {
                _cm.setOption("mode", editor.mode.toLowerCase());
            };
        },
        extraKeys:      {
            "Ctrl-Q": function(cm) {
                cm.foldCode(cm.getCursor());
            }
        }
    });


    // Initial code content...
    editor.cmModel = ';; Scheme code in here.\n' +
    '(define (double x)\n\t(* x x))\n\n\n' +
    '<!-- XML code in here. -->\n' +
    '<root>\n\t<foo>\n\t</foo>\n\t<bar/>\n</root>\n\n\n' +
    '// Javascript code in here.\n' +
    'function foo(msg) {\n\tvar r = Math.random();\n\treturn "" + r + " : " + msg;\n}';

}]);
