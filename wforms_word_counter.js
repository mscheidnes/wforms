wFORMS.behaviors.word_counter = {
    CLASSNAME: 'count-words',
    ATTRIBUTE: 'data-maxwords',
    applyTo: function(f) {
        var instances = [];
        var inputs = f.querySelectorAll('.' + this.CLASSNAME);
        for (var i = 0; i < inputs.length; i++) {
            var input = inputs.item(i);
            var instance = new wFORMS.behaviors.word_counter.instance(input);
            instances.push(instance);
        }
        return instances;
    },
    instance: function(input) {
        this.target = input;
        this.counter = null;
        this.wordCount = 0;
        this.maxWords = parseInt(input.getAttribute(wFORMS.behaviors.word_counter.ATTRIBUTE));
        this.addHandlers(input);
        this.addCounter(input);
    }
}

wFORMS.behaviors.word_counter.instance.prototype = {
    addHandlers: function(element) {
        var self = this;
        element.addEventListener('keyup', function() {
            self.updateCounter(element);
        }, false);
        element.addEventListener('focus', function() {
            self.counter.style.visibility = 'visible';
        }, false);
        element.addEventListener('blur', function() {
            self.counter.style.visibility = 'hidden';
        }, false);
    },
    addCounter: function(element) {
        var p = element.parentNode;
        this.counter = document.createElement('span');
        this.counter.className = wFORMS.behaviors.word_counter.CLASSNAME;
        this.counter.message = '  words remaining';
        this.counter.style.marginLeft = '10px';
        this.counter.style.visibility = 'hidden';
        element.count = 0;
        p.insertBefore(this.counter, element.nextSibling);
        this.updateCounter(element);
    },
    getWordCount: function() {
        return this.wordCount;
    },
    updateCounter: function(element) {
        try {
            this.wordCount = this.target.value.match(/\S+/g).length;
        } catch (err) {
            this.wordCount = 0;
        }
        if (this.maxWords - this.wordCount >= 0) {
            this.counter.style.color = 'black';
        } else {
            this.counter.style.color = 'red';
        }
        this.counter.innerHTML = this.maxWords - this.wordCount + this.counter.message; // displays the number of words left (max-current)
        element.count = this.wordCount;
    }
}

wFORMS.behaviors.validation.rules.wordCount = {selector: '.' + wFORMS.behaviors.word_counter.CLASSNAME, check: 'validateWordCount'}
wFORMS.behaviors.validation.messages.wordCount = "There are too many words in this field.";
wFORMS.behaviors.validation.instance.prototype.validateWordCount = function(element, value) {
    // need to check the type attribute... if that checks out then use the size to dertmin.
    if (element.count > element.getAttribute(wFORMS.behaviors.word_counter.ATTRIBUTE)) {
        return false;
    } else {
        return true;
    }
};