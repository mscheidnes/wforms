/**
 *
 * Usage:
 *
 *  This functionality allows one multiple-choice field (called the control field) to control
 *  what choices should be displayed in a second multiple-choice field (called the dependent field).
 *
 *  For instance, in this example, selecting Ford in the first field should filter the list in the second
 *  field down to only "Focus" and "Mustang". "Accord" and "Civic" should not be visible.
 *
 *  <select id="Car_Makers">             <select id="Car_Models">
 *      <option>Ford</option>               <optgroup label="Ford">
 *      <option>Honda</option>                  <option>Focus</option>
 *  </select>                                   <option>Mustang</option>
 *                                          </optgroup>
 *                                          <optgroup label="Honda">
 *                                              <option>Accord</option>
 *                                              <option>Civic</option>
 *                                          </optgroup>
 *                                      </select>
 *
 *
 *  A field may control multiple dependent fields, and a dependent field may be controlled by multiple fields.
 *  A particular choice in the control field may control whether one or more choices in the dependent field are included or excluded.
 *
 *  In its most simple implementation, the choice label in the control field matches a optgroup label in the dependent field, and the behavior is to
 *  include the content of optgroup if the control choice is selected, and exclude it if it's not selected.
 *
 *  More complex situation can be hanlded by providing a selector instead of matching by label (for instance if the dependent field is a checkbox list, with no optgroup element)
 *
 * Custom HTML5 data attributes:
 *
 *  ATTRIBUTE NAME      | DESCRIPTION
 *  data-filter-dependent : A css selector. Set on the control field, indicates field(s) filtered by this control.
 *  data-filter-control   : A css selector. Set on a dependent field, indicates field(s) that control this field's choices.
 *  data-filter-exclude   : A css selector. Optional. Set on a choice of a control field, indicates which choices
 *                          are to be excluded from the filtered field when this choice is selected. If not set, defaults to none/empty.
 *  data-filter-include   : A css selector. Optional. Set on a choice of a control field, indicates which choices
 *                          are to be included from the filtered field when this choice is selected. If not set, will attempt
 *                          to match the choice label with a category lable (optgroup) in the dependent field.
 *
 */

if (typeof(wFORMS) == "undefined") {
    throw new Error("wFORMS core not found. This behavior depends on the wFORMS core.");
}
/**
 * wForms dependent_list behavior. Filter multiple-choice fields, depending on the selection in a different field */

wFORMS.behaviors.dependent_list  = {

    /**
     * Creates new instance of the behavior
     * @constructor
     */
    instance : function(f) {
        this.behavior = wFORMS.behaviors.dependent_list;
        this.target = f;
    }
}

/**
 * Factory Method.
 * Applies the behavior to the given HTML element by setting the appropriate event handlers.
 * @param {domElement} f An HTML element, either nested inside a FORM element or (preferably) the FORM element itself.
 * @return {object} an instance of the behavior
 */
wFORMS.behaviors.dependent_list.applyTo = function(f) {
    var b = new wFORMS.behaviors.dependent_list.instance(f);
    if(!f.querySelectorAll) base2.DOM.bind(f);

    // Selects elements and attach event listeners.
    var elems = f.querySelectorAll("option[data-filter-dependent], select[data-filter-dependent], input[data-filter-dependent]");
    elems.forEach(function(elem) {
        if(!elem.addEventListener) {
            base2.DOM.bind(elem);
        }
        elem.addEventListener('change', function(event) { b.run(event, this)}, false);
        b.run(null, elem);
    });
    b.onApply();
    return b;
}

/**
 * Executed once the behavior has been applied to the document.
 * Can be overwritten.
 */
wFORMS.behaviors.dependent_list.instance.prototype.onApply = function() {}

/**
 * Executes the behavior
 * @param {event} event
 * @param {domElement} elem
 */
wFORMS.behaviors.dependent_list.instance.prototype.run = function(event, element) {
    var b = this;
    var selector = element.getAttribute('data-filter-dependent');
    var dependents = document.querySelectorAll(selector);
    dependents.forEach(function(dependent) {
        b.applyFiltersTo(dependent);
    });
}


/**
 *
 */
wFORMS.behaviors.dependent_list.instance.prototype.applyFiltersTo = function(dependent){
    var b = this;

    var selector = dependent.getAttribute('data-filter-control');
    var controls = document.querySelectorAll(selector);

    for(var i=0;i<controls.length;i++) {
        b.filter(controls[i], dependent);
    }
}

/**
 *
 */
wFORMS.behaviors.dependent_list.instance.prototype.filter = function(control, dependent) {

    var b       = this;
    var _filter = function(choice, mode) {

        var isSelected = (choice.checked || choice.selected) && !choice.disabled;

        var inc = choice.getAttribute('data-filter-include');
        var exc = choice.getAttribute('data-filter-exclude');

        if(!inc && !exc) {
            // simple match by label, make up the selector.
            var label = b.getChoiceLabel(choice);
            inc = "optgroup[label='"+label+"']";
        }

        if(inc) {
            if(isSelected) {
                if(mode=='selected') {
                    b.include(dependent, inc);
                }
            } else {
                if(mode=='deselected') {
                    b.exclude(dependent, inc);
                }
            }
        }
        if(exc) {
            if(isSelected) {
                if(mode=='selected') {
                    b.exclude(dependent, exc);
                }
            } else {
                if(mode=='deselected') {
                    b.include(dependent, exc);
                }
            }
        }
    };

    if(control.tagName=='INPUT') {
        _filter(control,'deselected');
        _filter(control,'selected');
    } else {
        var choices = control.querySelectorAll('input[type=checkbox],input[type=radio],option');
        choices.forEach(function(n){_filter(n,'deselected')});
        choices.forEach(function(n){_filter(n,'selected')});
    }

    // update any dependent recursively.
    if(dependent.getAttribute('data-filter-dependent')) {
        this.run(null, dependent);
    }
}

wFORMS.behaviors.dependent_list.instance.prototype.include = function(dependent, selector) {
    var filtered = dependent.querySelectorAll(selector);
    filtered.forEach(function(filtered) {
        filtered.disabled = false;
        filtered.style.display = '';

        if(filtered.tagName=='OPTGROUP' || filtered.tagName == 'OPTION') {
            // hack to handle visibility.
            if(filtered.parentNode.tagName=='SPAN') {
                var span = filtered.parentNode;
                span.parentNode.insertBefore(filtered,span);
                span.parentNode.removeChild(span);
            }
        }

        // re-enable any child fields.
        fields = filtered.querySelectorAll('input,select,textarea,option');
        fields.forEach(function(field) {
            field.disabled = false;
        });
    });
}

wFORMS.behaviors.dependent_list.instance.prototype.exclude = function(dependent, selector) {
    var filtered = dependent.querySelectorAll(selector);

    filtered.forEach(function(filtered) {
        filtered.disabled = 'disabled';
        filtered.style.display = 'none';

        if(filtered.selected) {
            filtered.selected = false;
        }
        if(filtered.checked) {
            filtered.checked = false;
        }

        if(filtered.tagName=='OPTGROUP' || filtered.tagName == 'OPTION') {
            // can't hide them. Use a hack to ensure they're not displayed.
            if(filtered.parentNode.tagName!='SPAN') {
                filtered.parentNode.insertBefore(document.createElement('span'), filtered).appendChild(filtered);
            }
        }

        // disable any child fields.
        fields = filtered.querySelectorAll('input,select,textarea,option');
        fields.forEach(function(field) {
            field.disabled = 'disabled';
        });
    });
}

wFORMS.behaviors.dependent_list.instance.prototype.getChoiceLabel = function(choice) {

    if(choice.tagName != 'OPTION') {
        choice = document.querySelector("label[for='"+choice.getAttribute('id')+"']");
    }
    var label = choice.textContent || choice.innerText;  // Note: doesn't support HTML markup.
    return label;
};
