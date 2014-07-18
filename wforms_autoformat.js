if (typeof(wFORMS) == "undefined") {
    throw new Error("wFORMS core not found. This behavior depends on the wFORMS core.");
}

wFORMS.behaviors.autoformat = {

    ATTRIBUTE_SELECTOR: 'input[autoformat]',
    ALLOWED_ELEMENT_TYPE: ['input[type="text"]'],

    /**
     * Regular expression object for numerical input (can be overridden in
     * for localization).
     */
    NUMERIC_REGEX: new RegExp("[0-9]"),

    /**
     * Regular expression object for alphabetic input (can be overridden in
     * for localization).
     */
    ALPHABETIC_REGEX: new RegExp("[A-Za-z]"),

    _globalCache: {},

    instance: function(f) {
        this.actorsInDomain = [];
    },

    /**
     * Handles all of the caret positioning.
     * @param {Mask} mask to be associated with
     */
    Caret: function(mask) {
        this.mask = mask;

        // save a copy of isRtl to cut down on verbose conditions for
        // right-to-left positioning
        this.isRtl = this.mask.isRtl;

        /**
         * caretPos is an object with the following keys:
         *     isRange:  boolean, whether current position is a range
         *     position: int, only set if isRange is false
         *     start:    caret start position
         *     end:      caret end position
         *
         * If isRange is false, position, start, and end will all be the same
         * value.
         */
        var pos = this.isRtl ? this.mask.format.length : 0;

        this.caretPos = {
            isRange: false,
            position: pos,
            start: pos,
            end: pos
        };

        // Copy of caretPos used to hold last state. This is used primarily
        // for cut/paste events, where the caret position can change without
        // being recorded by this object.
        this.prevCaretPos = {
            isRange: false,
            position: pos,
            start: pos,
            end: pos
        };
    },


    /**
     * The bit that does all of the work.
     * @param {domElement} elem : input element to be masked
     */
    Mask: function(elem) {
        var that = this;

        this.element = elem;
        wFORMS.standardizeElement(this.element);

        // Form the element belongs to, needed for submit handler
        this.parentForm = this.element.form;
        wFORMS.standardizeElement(this.parentForm);

        // Autoformat string, from data-autoformat attribute on Elem.
        this.formatString = this.element.getAttribute('autoformat');

        // Array of characters holding the actual content of the element.
        this.contents = this.formatString.split('');

        // Array of characters in the format string.
        this.format = this.contents.slice();

        // Boolean, whether this element is right-to-left or not.
        this.isRtl = this.getRtl(this.element);

        // Array holding valid data input by user
        this.Vals = [];

        // @const Number of mask characters in the format string
        this.VAL_LENGTH = this.getValLength();

        // Current index into Vals array. Has start/end keys to account for
        // when cursor is a selection.
        this.valIndex = { start: 0, end: 0 };

        // Event handlers
        this.handlers = this.getEventHandlers();

        // Index of first mask character in format, to check caret bounds.
        this.firstInputChar = (function() {
            for (var i = 0; i < that.format.length; i++) {
                if (that.isMaskChar(that.format[i])) {
                    break;
                }
            }
            return i;
        }());

        // Index of last mask character in format, to check caret bounds.
        this.lastInputChar = (function() {
            for (var i = that.format.length - 1; i >= 0; i--) {
                if (that.isMaskChar(that.format[i])) {
                    break;
                }
            }
            return i;
        }());

        // Caret instance for this mask
        this.caret = new wFORMS.behaviors.autoformat.Caret(this);

        // Initialize Vals, for cases where element already has value
        if (this.element.value !== '') {
            var chars = this.element.value.split('');
            for (var i = 0; i < chars.length; i++) {
                this.inputChar(chars[i]);
            }
        }

        // Add user interaction listeners. This has to be done in a setTimeout
        // so that the input value has a chance to update in the case of an
        // element which already has a value (if there is a default value, for
        // instance).
        window.setTimeout(function() { that.addListeners(); }, 1);

        // Inputs set to RTL behave strangely, so we'll set it to act like an LTR
        // box here (characters always fill in from left to right), and fake the CSS
        // to text-align right so it looks like nothing changes.
        if (this.isRtl) {
            this.element.style.direction = "ltr";
            this.element.style.textAlign = "right";
        }

    },

    applyTo: function(formElem) {
        var elements = base2.DOM.Element.querySelectorAll(formElem, wFORMS.behaviors.autoformat.ATTRIBUTE_SELECTOR);
        var IDGroups = [];

        elements.forEach(function(element){
            if(!base2.DOM.Element.matchesSelector(element, wFORMS.behaviors.autoformat.ALLOWED_ELEMENT_TYPE[0])){
                return;
            }

            // Create array of all autoformat elements
            var id = wFORMS.behaviors.autoformat._getIDForActorElement(element);
            IDGroups.push(id);
        });

        var instance = new wFORMS.behaviors.autoformat.instance(formElem);
        instance.actorsInDomain = IDGroups;

        // Make autoformat feature play nice with paging.
        wFORMS.behaviors.autoformat.applyToVisibleElements(instance);

        if (wFORMS.behaviors.paging) {
            var pagingInstance = wFORMS.getBehaviorInstance(formElem, 'paging'),
                _oldPageChange = pagingInstance.onPageChange,
                _instance = instance;

            pagingInstance.onPageChange = function (e) {
                wFORMS.behaviors.autoformat.applyToVisibleElements(_instance);
                _oldPageChange.apply(pagingInstance, arguments);
            };
        }

        return instance;
    },

    _getIDForActorElement: function(element){
        var id = element.id;

        if (id === '') {
            while (true) {
                var tempId = wFORMS.helpers.randomId();
                if (document.getElementById(tempId) !== null) {
                    continue;
                }
                element.id = tempId;
                break;
            }
        }

        return element.id;
    },
};

wFORMS.behaviors.autoformat.instance.prototype.onApply = function() { };

wFORMS.behaviors.autoformat.instance.prototype.run = function() { };

wFORMS.behaviors.autoformat.applyToVisibleElements = function(instance) {
    // Loop through all of the autoformat element IDs.
    var createMask = function (id, element) {
        // Create a mask, but only if it doesn't exist yet.
        if (!wFORMS.behaviors.autoformat._globalCache[id]) {
            var mask = new wFORMS.behaviors.autoformat.Mask(element);
            wFORMS.behaviors.autoformat._globalCache[id] = mask;
        }
    };

    // Remove the mask from the global cache, which should make it able to be
    // garbage collected.
    var removeMask = function(id) {
        var mask = wFORMS.behaviors.autoformat._globalCache[id];
        if (mask) {
            mask.removeListeners();
        }

        wFORMS.behaviors.autoformat._globalCache[id] = false;
    }

    instance.actorsInDomain.forEach(function (id) {
        var elem = document.getElementById(id);

        if (wFORMS.behaviors.paging) {
            // If the element is visible, we want to apply a mask; if not, we
            // want to remove it.
            if (wFORMS.behaviors.paging.isElementVisible(elem)) {
                createMask(id, elem);
            } else {
                removeMask(id);
            }
        } else {
            // no paging: apply to all
            createMask(id, elem);
        }
    });
};


/* Mask behaviors
 * ---------------------------------------------- */

/** Returns whether or not element is right-to-left or not */
wFORMS.behaviors.autoformat.Mask.prototype.getRtl = function() {
    var dir;

    if (this.element) {
        if (window.getComputedStyle) {
            dir = window.getComputedStyle(this.element).direction;
        } else if (this.element.currentStyle) {   // IE8
            dir = this.element.currentStyle.direction;
        }
    }
    return dir === "rtl";
};

/**
 * Counts number of mask characters in the format string, which is the
 * maximum length of the valid input.
 * @returns {number} Length of valid input.
 */
wFORMS.behaviors.autoformat.Mask.prototype.getValLength = function() {
    var i, numInputChars = 0;
    for (i = 0; i < this.format.length; i++) {
      if (this.isMaskChar(this.format[i])) {
        numInputChars += 1;
      }
    }
    return numInputChars;
};

/**
 * Returns whether or not this is an overwriteable mask character.
 *
 * @param    {char}    c Character to check
 * @returns  {boolean} Whether this character is a mask character.
 */
wFORMS.behaviors.autoformat.Mask.prototype.isMaskChar = function(c) {
    return c === '#' || c === '$';
};

/**
 * User interaction handlers. Mostly these just delegate to the proper event
 * in the mask itself.
 */
wFORMS.behaviors.autoformat.Mask.prototype.getEventHandlers = function() {
    var lastKey = null,
        that = this,
        keycodes = {
            BACKSPACE:  8,
            TAB:        9,
            RETURN:     13,
            ESCAPE:     27,
            LEFT_ARR:   37,
            UP_ARR:     38,
            RIGHT_ARR:  39,
            DOWN_ARR:   40,
            DELETE:     46
        };

    return {
        keyDown: function (evt) {
            lastKey = evt.which || evt.keyCode;

            switch (lastKey) {
                // we don't want to do anything for movements (get them during keyup)
                case keycodes.RETURN:         // fall through
                case keycodes.LEFT_ARR:       // fall through
                case keycodes.UP_ARR:         // fall through
                case keycodes.RIGHT_ARR:      // fall through
                case keycodes.DOWN_ARR:       // fall through
                case keycodes.TAB:
                    that.caret.preventOverflow();
                    lastKey = null;
                    break;

                case keycodes.BACKSPACE:
                    evt.preventDefault();
                    that.backspace();
                    lastKey = null;
                    break;
                case keycodes.DELETE:
                    evt.preventDefault();
                    that.forwardDel();
                    lastKey = null;
                    break;

                default:
                    // do nothing
            }
            return;
        },

        keyPress: function (evt) {
            var c, which;

            // lastKey is set to null if we've already handled this character
            if (lastKey === null) {
                return;
            }

            // check for a modifier key; if there is one, we don't want to do anything
            if (evt.metaKey || evt.ctrlKey || evt.altKey) {
                lastKey = null;
                return;
            }

            // process printable chars
            which = evt.which || evt.keyCode;
            if (which) {
                c = String.fromCharCode(which);
                that.inputChar(c);
            }
            evt.preventDefault();
            return;
        },

        keyUp: function (evt) {
            // zero out to prepare for next key event
            switch (evt.which) {
                case keycodes.RETURN:         // fall through
                case keycodes.LEFT_ARR:       // fall through
                case keycodes.UP_ARR:         // fall through
                case keycodes.RIGHT_ARR:      // fall through
                case keycodes.DOWN_ARR:       // fall through
                case keycodes.TAB:
                    that.caret.preventOverflow();
                    that.caret.savePosition();
                    break;
                default:
                    // nothing
            }
            lastKey = null;
            return;
        },

        cut: function () {
            // wait for cut to complete
            window.setTimeout(function() { that.cut() }, 1);
        },

        paste: function () {
            // wait for paste to complete
            window.setTimeout(function() { that.paste() }, 1);
        },


        click: function () {
            that.caret.preventOverflow();
        },

        submit: function () {
            that.submit();
        }
    };
};

/**
 * Add listeners for user interaction.
 */
wFORMS.behaviors.autoformat.Mask.prototype.addListeners = function() {
    var that = this;

    this.element.addEventListener('focus', function() {
        that.updateValue();
        that.caret.nudge(0);    // bump to first mask char
    });
    this.element.addEventListener('blur', function() { that.blur() });
    this.element.addEventListener('keydown', this.handlers.keyDown);
    this.element.addEventListener('keypress', this.handlers.keyPress);
    this.element.addEventListener('keyup', this.handlers.keyUp);
    this.element.addEventListener('click', this.handlers.click);
    this.element.addEventListener('cut', this.handlers.cut);
    this.element.addEventListener('paste', this.handlers.paste);
    this.parentForm.addEventListener('submit', this.handlers.submit);
    this.element.blur();
};

/**
 * Remove event listeners in preparation for deletion of a mask element.
 */
wFORMS.behaviors.autoformat.Mask.prototype.removeListeners = function() {
    // TODO These two listeners need to be refactored into non-anonymous
    // functions so they can be removed properly.

    // this.element.removeEventListener('focus');
    // this.element.removeEventListener('blur', that.blur);
    this.element.removeEventListener('keydown', this.handlers.keyDown);
    this.element.removeEventListener('keypress', this.handlers.keyPress);
    this.element.removeEventListener('keyup', this.handlers.keyUp);
    this.element.removeEventListener('click', this.handlers.click);
    this.element.removeEventListener('cut', this.handlers.cut);
    this.element.removeEventListener('paste', this.handlers.paste);
    this.parentForm.removeEventListener('submit', this.handlers.submit);
};

/**
 * Remove extra characters on blur to prevent interference with validation
 * plugin.
 */
wFORMS.behaviors.autoformat.Mask.prototype.blur = function() {
    this.element.value = this.stripExtraInput();
};

/**
 * Updates the value in the input box with contents of variable 'contents'.
 */
wFORMS.behaviors.autoformat.Mask.prototype.updateValue = function() {
    var that = this;
    this.element.value = this.contents.join('');
    // wait a bit so that elem gets its value before we set the caret position
    window.setTimeout(function() { that.caret.update() }, 1);
};

/**
 * Add a digit to the element. This checks for validity based on the next
 * input character, replacing it as appropriate.
 *
 * @param {char} newChar Character to input.
 */
wFORMS.behaviors.autoformat.Mask.prototype.inputChar = function(newChar) {
    var inputPos,
        caretPos = this.caret.getPosition();

    // bump until we get to an input char
    if (this.isRtl) {
        while (!this.isMaskChar(this.format[caretPos.start - 1]) &&
                caretPos.start > 0) {
            caretPos = this.caret.nudge();
        }
    } else {
        while (!this.isMaskChar(this.format[caretPos.start]) &&
                caretPos.start < this.format.length) {
            caretPos = this.caret.nudge();
        }
    }

    // caret in RTL text is always 1 past what we want
    inputPos = this.isRtl ? caretPos.start - 1 : caretPos.start;

    if (!this.isCharAllowed(newChar, this.format[inputPos])) {
        return;
    }

    this.caret.savePosition();

    if (caretPos.isRange) {
        // splice out the selection and replace
        this.Vals.splice(this.valIndex.start, this.valIndex.end - this.valIndex.start, newChar);
    } else {
        // no selection, just insert the char at the caret position
        this.Vals.splice(this.valIndex.start, 0, newChar);
    }

    this.Vals.length = this.VAL_LENGTH;    // throw away extra chars
    this.reformat();
    this.caret.nudge();
};

/**
 * Delete characters backward, replacing with input characters as needed.
 */
wFORMS.behaviors.autoformat.Mask.prototype.backspace = function() {
    var caretPos = this.caret.getPosition();
    this.caret.savePosition();

    if (caretPos.isRange) {
        this.Vals.splice(this.valIndex.start, this.valIndex.end - this.valIndex.start);
        this.caret.setPosition(this.isRtl ? caretPos.end : caretPos.start);
    } else {
        this.Vals.splice(this.valIndex.start - 1, 1);

        if (!this.isRtl && caretPos.position > this.firstInputChar ) {
            this.caret.nudge(-1);
        } else if (this.isRtl && caretPos.position <= this.lastInputChar) {
            this.caret.nudge(-1);
        }
    }
    this.reformat();
};

/**
 * Remove character to right of cursor, shift everything left, and replace
 * with input characters as necessary.
 */
wFORMS.behaviors.autoformat.Mask.prototype.forwardDel = function() {
    var caretPos = this.caret.getPosition();

    this.caret.savePosition();

    if (caretPos.isRange) {
        // no difference between backspacing/deleting multiple characters
        this.backspace();
    } else {
        this.Vals.splice(this.valIndex.start, 1);
        this.caret.nudge(0);                 // caret doesn't move on delete
        this.reformat();
    }
};

/**
 * Handle cut events by removing cut characters from Vals array.
 */
wFORMS.behaviors.autoformat.Mask.prototype.cut = function() {
    var fromEnd = 0,
        caretPos = this.caret.getPosition();

    this.Vals.splice(this.valIndex.start, this.valIndex.end - this.valIndex.start);

    // If we're dealing with RTL text, we have to do a bit of work to set the
    // caret position correctly on cut.
    if (this.isRtl) {
        fromEnd = this.element.value.length - caretPos.position;
        this.reformat();
        this.caret.setPosition(this.format.length - fromEnd);
    } else {
        this.reformat();
    }
};

/**
 * Deal with paste events. This takes a bit of work since older browsers
 * can't access clipboard data directly.
 */
wFORMS.behaviors.autoformat.Mask.prototype.paste = function() {
    // Here we have to deal manually with the caret
    var i, numCharsPasted, numCharsSelected, pasted, newPos,
        pos = this.caret.previousPosition();

    numCharsSelected = pos.isRange ? pos.end - pos.start : 0;

    numCharsPasted = this.element.value.length -    // new length
                     this.contents.length +         // old length
                     numCharsSelected;


    // if a range was selected, first we have to remove those characters
    if (pos.isRange) {
        this.Vals.splice(this.valIndex.start, this.valIndex.end - this.valIndex.start);
    }

    this.caret.setPosition(pos.start);
    pasted = this.element.value.substr(pos.start, numCharsPasted).split('');

    if (this.isRtl) {
        // Adjust for characters selected on paste event. This has to be done so
        // that valIndex is updated properly and new characters are inserted in
        // the correct positions.
        newPos = this.caret.getPosition().position + numCharsSelected;
        this.caret.setPosition(newPos);
    }

    for (i = 0; i < pasted.length; i++) {
        this.inputChar(pasted[i]);
    }
};

/**
 * On form submission, we only want to submit the user-input values, not the
 * mask characters.
 */
wFORMS.behaviors.autoformat.Mask.prototype.submit = function () {
    this.element.value = this.stripExtraInput();
};

/**
 * Determines whether a character is allowed at a particular index in the
 * format array. Mask character '#' allows digits only, and mask character '$'
 * allows alphabetic characters only. c is checked against the regular
 * expressions defined as wFORMS.autoformat.ALPHABETIC_REGEX and
 * wFORMS.autoformat.NUMERIC_REGEX
 *
 * @param   {char}    c           Character to check
 * @param   {char}    formatChar  maskChar for this character ('$' or '#')
 * @returns {boolean} Whether this character is allowed.
 */
wFORMS.behaviors.autoformat.Mask.prototype.isCharAllowed = function(c, maskChar) {
    if (maskChar === '#') {
        return Boolean(c.match(wFORMS.behaviors.autoformat.NUMERIC_REGEX));
    }

    if (maskChar === '$') {
        return Boolean(c.match(wFORMS.behaviors.autoformat.ALPHABETIC_REGEX));
    }

    return false;
};

/**
 * Updates the 'contents' array with values from the Vals array, then
 * updates the element value itself.
 */
wFORMS.behaviors.autoformat.Mask.prototype.reformat = function() {
    var i, v, newVals = [],
        tmp = this.Vals.slice(),   // working copy of values

        // Process a position in the format/contents array. Pass this an index
        // into that array. This exists to avoid duplicating logic for both
        // LTR and RTL inputs.
        processChar = function (i) {
            if (!tmp) {
                // no more user-submitted values, use format character
                this.contents[i] = this.format[i];
            } else if (this.isMaskChar(this.format[i])) {
                v = tmp.shift();
                if (v && this.isCharAllowed(v, this.format[i])) {
                    this.contents[i] = v;
                    newVals.push(v);
                } else {
                    // If the character isn't allowed, we'll just discard the
                    // rest of the input. This prevents having to deal with
                    // edge cases with mixed numbers/letters where removing
                    // some characters can invalidate the mask.
                    tmp = null;
                    this.contents[i] = this.format[i];
                }
            }
        };

    if (this.isRtl) {
        for (i = this.format.length - 1; i >= 0; i--) {
            processChar.call(this, i);
        }
    } else {
        for (i = 0; i < this.format.length; i++) {
            processChar.call(this, i);
        }
    }

    this.Vals = newVals.slice();
    this.caret.savePosition();      // to set this.valIndex properly
    this.updateValue();
};

/**
 * Strip extra characters from contents (for blur/submit).
 *
 * On form blur (or before submit), we don't want the extra mask characters to
 * appear in the field. This removes everything after the last user-submitted
 * character, returning it as a string. If the user has filled in the entire
 * mask, this function just joins the value of this.contents into a string.
 * (This means that any characters in the format past the last mask character
 * are preserved.)
 *
 * @returns {string} Actual user input values.
 */
wFORMS.behaviors.autoformat.Mask.prototype.stripExtraInput = function() {
    var i,
        inputIndex = 0,
        newValue = '',
        userInput = [];

    // Get only the values from the Vals array (removing undefined and
    // whatnot)
    for (i = 0; i < this.Vals.length; i++) {
        if (this.Vals[i]) {
            userInput.push(this.Vals[i]);
        }
    }

    // If user has finished the input, we can leave it as is.
    if (userInput.length === this.VAL_LENGTH) {
        newValue = this.contents.join('');
        return newValue;
    }

    if (this.isRtl) {
        for (i = this.contents.length - 1; i >= 0; i--) {
            // stop when there are no more user-input values
            if (inputIndex === userInput.length) {
                break;
            }

            // have to fill in new value from right to left
            newValue = this.contents[i] + newValue;

            if (this.isMaskChar(this.format[i])) {
                inputIndex += 1;
            }
        }
    } else {
        for (i = 0; i < this.contents.length; i++) {
            // stop when there are no more user-input values
            if (inputIndex === userInput.length) {
                break;
            }

            newValue += this.contents[i];

            if (this.isMaskChar(this.format[i])) {
                inputIndex += 1;
            }
        }
    }

    return newValue;
};

/* Caret behaviors
 * ---------------------------------------------- */

/**
 * Get current caret position, cross-browser
 * @return {object} with keys 'start' and 'end'
 */
wFORMS.behaviors.autoformat.Caret.prototype.getSelection = function() {
    var range, workingRange, len, endRange,
        elem = this.mask.element,
        start = 0,
        end = 0;

    if (typeof elem.selectionStart === "number") {
        start = elem.selectionStart;
        end = elem.selectionEnd;
    } else {        // IE 8
        range = document.selection.createRange();

        if (range && range.parentElement() === elem) {
            len = elem.value.length;
            workingRange = elem.createTextRange();
            workingRange.moveToBookmark(range.getBookmark());

            // moveStart/moveEnd don't return useful values if caret is at the end
            // of the text box, so create a range to check for that
            endRange = elem.createTextRange();
            endRange.collapse(false);

            if (workingRange.compareEndPoints("StartToEnd", endRange) > -1) {
                start = end = len;
            } else {
                start = -workingRange.moveStart("character", -len);
                end = (workingRange.compareEndPoints("EndToEnd", endRange) > -1)
                    ? len
                    : -workingRange.moveEnd("character", -len);
            }
        }
    }

    return { start: start, end: end };
};

/**
 * Set caret position inside the form, cross-browser.
 * @param {int} start
 * @param {int} end
 */
wFORMS.behaviors.autoformat.Caret.prototype.setSelection = function(start, end) {
    var elem = this.mask.element;

    if (elem.setSelectionRange) {
        elem.setSelectionRange(start, end);
    } else {        // IE 8
        var range = elem.createTextRange();
        range.collapse(true);
        if (start === end) {
            range.move("character", start);
        } else {
            range.moveEnd("character", end);
            range.moveStart("character", start);
        }
        range.select();
    }
};

/**
 *  Changes caret position based on currentValue of caretPos.
 *
 *  @returns {object} current value of caretPos
 */
wFORMS.behaviors.autoformat.Caret.prototype.update = function() {
    this.setSelection(this.caretPos.start, this.caretPos.start);
    this.savePosition();
    return this.caretPos;
};

/**
 * Returns current caret position
 * @return {object} current value of member caretPos
 */
wFORMS.behaviors.autoformat.Caret.prototype.getPosition = function() {
    var pos = this.getSelection(),
        start = pos.start,
        end = pos.end,
        ret = {
            isRange: null,
            position: null,
            start: start,
            end: end
        };

    if (end - start === 0) {
        ret.isRange = false;
        ret.position = start;
    } else {
        ret.isRange = true;
    }

    return ret;
};

/**
 * Saves previous/current caret positions, and sets valIndex appropriately.
 * @returns {object} current value of member caretPos
 */
wFORMS.behaviors.autoformat.Caret.prototype.savePosition = function() {
    this.prevCaretPos = this.cloneCaretPos();
    this.caretPos = this.getPosition();
    this._setValIndex();
    return this.caretPos;
};

/**
 * Manually set the caret position. This is necessary for paste events, but
 * probably shouldn't be used otherwise. Only accepts single numbers (you
 * cannot set the caret position to a range).
 *
 * @param   {number} pos Desired index of caret position.
 * @returns {object} current value of member caretPos
 */
wFORMS.behaviors.autoformat.Caret.prototype.setPosition = function(pos) {
    this.caretPos.isRange = false;
    this.caretPos.start = this.caretPos.end = this.caretPos.position = pos;
    return this.update();
};

/** Helper function to copy current position. */
wFORMS.behaviors.autoformat.Caret.prototype.cloneCaretPos = function() {
    return {
        isRange:  this.caretPos.isRange,
        position: this.caretPos.position,
        start:    this.caretPos.start,
        end:      this.caretPos.end
    };
};


/**
 * Nudge the caret, skipping non-input characters as necessary.
 *
 * @param   {number=} delta Number of characters to move, defaults to 1.
 * @returns {object}  current value of member caretPos
 */
wFORMS.behaviors.autoformat.Caret.prototype.nudge = function(delta) {
    delta = (delta !== undefined) ? delta : 1;

    if (this.isRtl) {
        delta = -delta;
    }

    if (this.caretPos.isRange) {
        if (this.isRtl) {
            this.caretPos.position = this.caretPos.start = this.caretPos.end;
        } else {
            this.caretPos.position = this.caretPos.end = this.caretPos.start;
        }
    }

    this.caretPos.position += delta;

    if (this.isRtl) {
        while (this.caretPos.position >= 0 &&
                this.caretPos.position <= this.mask.format.length &&
                !this.mask.isMaskChar(this.mask.format[this.caretPos.position - 1])) {

                    if (delta === 0) {
                        this.caretPos.position -= 1;
                    } else {
                        this.caretPos.position += (delta > 0) ? 1 : -1;
                    }
                }

    } else {      // left-to-right
        while (this.caretPos.position >= 0 &&
                this.caretPos.position <= this.mask.format.length &&
                !this.mask.isMaskChar(this.mask.format[this.caretPos.position])) {

                    if (delta === 0) {
                        this.caretPos.position += 1;
                    } else {
                        this.caretPos.position += (delta > 0) ? 1 : -1;
                    }
                }
    }

    this.caretPos.start = this.caretPos.end = this.caretPos.position;
    return this.update();
};

/**
 * Prevent caret positions beyond the last visible input character or
 * before the first input character of the format string.
 *
 * @returns {object}  current value of member caretPos
 */
wFORMS.behaviors.autoformat.Caret.prototype.preventOverflow = function () {
    var index, i;
    this.savePosition();

    // let them select whatever they want
    if (this.caretPos.isRange) { return; }

    if (this.isRtl) {
        // determine position of last input character (reading LTR)
        for (i = this.mask.contents.length - 1; i >= 0; i--) {
            if (this.mask.isMaskChar(this.mask.contents[i])) {
                index = i;
                break;
            }
        }

        // These positions are offset by one because in RTL scripts we want
        // the caret to be just to the right of the next input character
        if (this.caretPos.position > this.mask.lastInputChar) {
            // caret is too far right
            this.caretPos.position = this.mask.lastInputChar + 1;
        } else if (this.caretPos.position <= index) {
            // caret is too far left
            this.caretPos.position = index + 1;
        }

    } else {
        // left-to-right
        for (i = 0; i < this.mask.contents.length; i++) {
            if (this.mask.isMaskChar(this.mask.contents[i])) {
                index = i;
                break;
            }
        }

        if (this.caretPos.position < this.mask.firstInputChar) {
            // caret is too far left
            this.caretPos.position = this.mask.firstInputChar;
        } else if (this.caretPos.position > index) {
            // caret is too far right
            this.caretPos.position = index;
        }
    }

    this.caretPos.start = this.caretPos.end = this.caretPos.position;
    return this.update();
};

/**
 * Return the last saved caret position. Useful for paste event.
 * @returns {object} last saved value of caretPos
 */
wFORMS.behaviors.autoformat.Caret.prototype.previousPosition = function () {
    return this.prevCaretPos;
};

/**
 * Helper function to set mask.valIndex. It should always be the number of
 * input characters represented by the current caret position (ignoring
 * mask characters). Does not return anything.
 */
wFORMS.behaviors.autoformat.Caret.prototype._setValIndex = function() {
    var i,
        start = 0,
        end = 0;

    if (this.mask.isRtl) {
        for (i = this.mask.format.length; i > this.caretPos.end; i--) {
            if (this.mask.isMaskChar(this.mask.format[i - 1])) {
                start += 1;
            }
        }

        end = start;

        for (i = this.caretPos.end; i > this.caretPos.start; i--) {
            if (this.mask.isMaskChar(this.mask.format[i - 1])) {
                end += 1;
            }
        }
    } else {
        // left-to-right text
        for (i = 0; i < this.caretPos.start; i++) {
            if (this.mask.isMaskChar(this.mask.format[i])) {
                start += 1;
            }
        }

        end = start;

        for (i = this.caretPos.start; i < this.caretPos.end; i++) {
            if (this.mask.isMaskChar(this.mask.format[i])) {
                end += 1;
            }
        }

    }
    this.mask.valIndex = {start: start, end: end};
};
