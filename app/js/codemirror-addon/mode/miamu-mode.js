/*
 * Defines miamu's language parser
 *
 * Allows the highlighting of the starers/mains/desserts in different colors
 */

CodeMirror.defineMode("miamu", function() {
    return {
        startState: function() {
            return {starter: true, main: false, dessert: false, error: false};
        },
        blankLine:  function(state) {
            if(state.starter) {
                state.starter = false;
                state.main = true;
            }
            else if(state.main) {
                state.main = false;
                state.dessert = true;
            }
            else if(state.dessert) {
                state.dessert = false;
                state.error = true;
            }
        },
        token:      function(stream, state) {
            stream.skipToEnd();
            if(state.error) {
                return 'error';
            }
            if(state.starter) {
                return 'variable-2';
            }
            if(state.main) {
                return 'number';
            }
            if(state.dessert) {
                return 'keyword';
            }
        }
    };
});