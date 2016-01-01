#Central Event Mechanism Specification

# Introduction #

Central Event System provides a mechanism to register and implement hooks across the whole WForms library.

It provides a flexible way to enable multiple hook responders to a same event. Besides, a neutral event registry avoids the interdependency of registering event responders from one module to another, because an unpredictable loading sequence of modules will make it very hard to implement.

# Usage #

The Central Event Mechanism is implemented in Core, so in order to use it, first '**wforms\_core.js**' (or the whole WForms library '**wforms.js**') must be imported into the page.

The hook, which is used to describe a moment when a certain type of event happens, is divided into two levels: the behavior name and the event name.

## Adding a hook event handler ##
To register a hook event handler to certain event, use

```
   wFORMS.hooks.addHook(ｂｅｈａｖｉｏｒ_ｎａｍｅ, ｅｖｅｎｔ_name, event_handler);
```

_`ｂｅｈａｖｉｏｒ_ｎａｍｅ`_ and _`event_name`_ are strings used to specify the behavior and its event. _`event_handler`_ is a function to be as a event handler. You can add as many `event_handlers` as you want to the same behavior and event. For example:

```
   wFORMS.hooks.addHook('behavior2', 'hook_event3', function(){ variable+=1;})
   wFORMS.hooks.addHook('behavior2', 'hook_event3', function(){ variable+=2;})
```

Therefore, when _`behavior2`_ behavior's _`hook_event3`_ is triggered, _`variable`_ will be added with 3.

## Triggering a hook event ##

To trigger a hook event, use,

```
   wFORMS.hooks.addHook(ｂｅｈａｖｉｏｒ_ｎａｍｅ, ｅｖｅｎｔ_name, parameters, ...);
```

_`ｂｅｈａｖｉｏｒ_ｎａｍｅ`_ and _`event_name`_ are strings used to specify the behavior and its event. _`parameters`_ is various in length, it provides parameters list which can be passed to event handlers from left to right. For example:

```
var variable = 1;

wFORMS.hooks.addHook('behavior3', 'hook_event4', function(x, y){ variable+= (x - y);});
wFORMS.hooks.addHook('behavior3', 'hook_event4', function(x, y){ variable+= (2*x - y);});

wFORMS.hooks.triggerHook('behavior3', 'hook_event4', 2 , 1);
```

After execution, variable will be 5.

## Removing a hook event ##

To remove a hook event handler, use,

```
   wFORMS.hooks.addHook(ｂｅｈａｖｉｏｒ_ｎａｍｅ, ｅｖｅｎｔ_name, event_handler);
```

_`ｂｅｈａｖｉｏｒ_ｎａｍｅ`_ and _`event_name`_ are strings used to specify the behavior and its event. _`event_handler`_ is a function to be as a event handler, this must be the same function object as it was registered. A new function object with identical content will not successfully remove the previous registration. For example:

```
var hookHandler1 = function(){ variable+=1;};

wFORMS.hooks.addHook('behavior1', 'hook_event2', hookHandler1)
wFORMS.hooks.removeHook('behavior1', 'hook_event2', hookHandler1)
```

# Current Existed Hooks #
There are several hooks currently existed in the WForms library, they are

|**Behavior**|**Event**|**Description**|Parameters passed (1 represents 1st parameter from left, 2 for 2nd from left, and so forth) |
|:-----------|:--------|:--------------|:-------------------------------------------------------------------------------------------|
|switch      |switch\_on| triggered when a target element is turned on. | 1: the target dom element                                                                  |
|            |switch\_off| triggered when a target element is turned off. | 1: the target dom element                                                                  |
|repeat      |repeat   | triggered when a section has been cloned | 1: the dom element being cloned <br /> 2: the new cloned element which is a counter-part of 1|