# Usage #

To enable switch behavior, we need to specify **trigger** **target** relationship.

There might be many triggers corresponding with one target, which will collectively decide the on/off state of the corresponding target in two types of logical conditions: **AND** and **OR**.

  * **AND** The target will be turned on if and only if all of the corresponding triggers are turned on.

  * **OR** The target will be turned on when any of the triggers is turned on.

## Define a target and its triggers ##
To specify a target, add css class 'target' to any of the html element you prefer to be as the target, then add 'rule' attribute to the element, write a relationship definition in, in the form of:

> _definition_: _logic_"["_css\_selectors_"]"

> _logic_: "and" | "or"

> _css\_selectors_ : css\_selector | css\_selector"|"_css\_selectors_

To decipher this in simple English, the rule starts with either "and" or "or", then a pair of square parentheses[.md](.md), which contains one or many css selectors separated by "|".

The css\_selector are just any kind of legal css selectors to locate a trigger. So some samples are like the following:

> Sample 1
```
<input name="foo" type="radio" id="switcha" />A Switch <br/>
<input name="foo" type="radio" id="switchb" />B Switch <br/>	
<div id="casea" class="target" rule="or[#switcha|#switchb]">This is A state</div>
```
> Sample 2
```
<select>
	<option>D</option>
	<option id="opt2">F</option>
	<option id="opt3">G</option>
</select>
<div id="cased" class="target" rule="and[#selectTest :first-child|#opt2]">This is D & F state</div>

```

After writing the relationship rules you need to import 'wforms.js' or at least the combination of 'wforms\_core.js' and 'wforms\_switch.js' in your page. Then the switch behavior will take effect automatically.

## Define css style for on/off state ##
The ultimate result of switch behavior is to put **onstate** or **offstate** css class onto the target element. Wforms makes no assumptions about how these classes are like, so they need to be defined.

A typical definition for these two css classes is like:
```
.target.offstate{
    display: none !important;
}
.target.onstate{
    display: block !important;
}
```

Add .target to narrow the definition as much as possible, in order to prevent css rule pollution. Because the target element will always have a css class of '.target'

# Trigger On/Off status checking mechanism #
## Default Behavior ##
The switch behavior has a default mechanism for deciding whether a trigger is turned **on** or **off**. The default behavior can be described as the following table

| **Element Type** | **On/Off status condition** |
|:-----------------|:----------------------------|
|input type="radio"| On if and only if the radio is selected|
|input type="checkbox"|On if and only if the checkbox is checked|
|option(in select) |On if and only if the option is selected|
|input type="text" |On if and only if the text field is not empty, all white spaces do not count|
|textarea          |On if and only if the text area is not empty, all white spaces do not count|
|a (link)          |On first time the page is loaded, the link is at off status, when click on it once, it becomes on status, click it again will make it back to off status, so forth alternately.|


## Customized Behavior ##
All triggers can be set with a customized on/off status checking rule. Just put a **triggerrule** attribute to the trigger. Like follows,

```
<input type="text" id="txt2" triggerrule="parseInt(this.value) > 3"/>
```

the content in **triggerrule** attribute is like a function content, in which **this** will point to the trigger element itself.

So the switch behavior will use the content in **triggerrule** attribute with priority. If the execution has error, it will use the default behavior instead.

In practice, this feature is typically only used to text fields and text areas.

# Disable and Enable switch behavior to a portion of document #
## Detach switch behavior ##
The target-triggers binding and switch behavior will take effect immediately after page is loaded. Later, if needed, the switch behavior can be detached selectively from desired targets by using the **destroy()** method.

```
var instance = wFORMS.behaviors['switch'].instance;
var documentArea = document.getElementById('#targetField');
instance.destroy(documentArea);
```

The only parameter is a parent node which is meant to specify a document area. Therefore all elements within the document area and with a **.target** css class will not respond to trigger status changes any more. The target elements' on/off state will be left as same as the moment when **destroy** was called.

In the above sample, all target sections which are descendant of **documentArea**, including **documentArea** itself if it also has **.target** css class, will be prevented from responding to switch behavior.

## Recover switch behavior ##
After disabling the switch behavior, if one wish to recover switch behavior, just use **applyTo()** and pass the document area need to be recovered as the sole parameter.

```
var instance = wFORMS.behaviors['switch'].instance;
var documentArea = document.getElementById('#targetField');
instance.applyTo(documentArea);
```

The only parameter is a parent node which is meant to specify a document area. Therefore all elements within the document area and with a **.target** css class will start to respond to trigger status changes again. The target elements' on/off state will be synchronized with the updated triggers' status.

In the above sample, all target sections which are descendant of **documentArea**, including **documentArea** itself if it also has **.target** css class, will be resumed responding to the switch behavior.

# Use Switch Behavior in conjunction with Repeat Behavior #
The Switch Behavior can be used together with Repeat Behavior. So when a portion of document gets cloned by the Repeat Behavior, the new cloned document fragment will automatically produce target-triggers bindings and take effect immediately, on the condition that the document fragment's counterpart had also established target-triggers bindings. But with following notes,

  * If only target elements get cloned, but the triggers not, which means the triggers are outside of the section being cloned, then the new cloned target will be automatically bound to the old triggers, so the same set of triggers will control both the old target and new cloned target.

  * If the target element and a portion of trigger elements get cloned, but another portion of triggers are outside of the section being cloned, then the new cloned triggers will work collectively with the triggers which are not cloned to decide the state of the cloned target.

  * If only trigger elements get cloned, but the target not, which means the target is outside of the section being cloned, then the triggers in new cloned section will become isolated, which will not have any actual effect.

  * If both trigger and target elements get cloned, then the new cloned section will contain a completely new target-triggers bindings, which will work independently from the ones in the old section which is being cloned.