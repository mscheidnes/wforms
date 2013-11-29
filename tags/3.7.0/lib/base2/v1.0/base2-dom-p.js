/*
  base2 - copyright 2007-2008, Dean Edwards
  http://code.google.com/p/base2/
  http://www.opensource.org/licenses/mit-license.php

  Contributors:
    Doeke Zanstra
*/
new function(_M){var DOM=new base2.Package(this,{name:"DOM",version:"1.0",imports:"Function2",exports:"Interface,Binding,Node,Document,Element,AbstractView,HTMLDocument,HTMLElement,Selector,Traversal,CSSParser,XPathParser,NodeSelector,DocumentSelector,ElementSelector,StaticNodeList,Event,EventTarget,DocumentEvent,ViewCSS,CSSStyleDeclaration,ClassList",bind:function(a){if(a&&a.nodeType){var b=assignID(a);if(!DOM.bind[b]){switch(a.nodeType){case 1:if(typeof a.className=="string"){(HTMLElement.bindings[a.tagName]||HTMLElement).bind(a)}else{Element.bind(a)}break;case 9:if(a.writeln){HTMLDocument.bind(a)}else{Document.bind(a)}break;default:Node.bind(a)}DOM.bind[b]=true}}return a},"@MSIE5.+win":{bind:function(a){if(a&&a.writeln){a.nodeType=9}return this.base(a)}}});eval(this.imports);var _5=detect("MSIE");var _c=detect("MSIE5");var Interface=Module.extend(null,{forEach:function(c,d){forEach(this,function(a,b){if(typeOf(a)=="function"&&(this.prototype[b]||a._d)){c.call(d,a,b,this)}},this,Module)},implement:function(a){if(typeof a=="object"){_u(this,a)}else if(Interface.ancestorOf(a)){for(var b in a){if(a[b]&&a[b]._d){this[b]=bind(b,a);this[b]._d=b}}}return this.base(a)}});function _u(a,b){var c=a.toString().slice(1,-1);for(var d in b){var g=b[d];if(d.charAt(0)=="@"){_u(a,g)}else if(!a[d]&&typeof g=="function"&&g.call){var f="abcdefghij".slice(0,g.length).split("");var h=new Function(f.join(","),format("%2.base=%2.%1.ancestor;var m=%2.base?'base':'%1';return %2[m](%3)",d,f[0],f.slice(1)));h._d=d;a[d]=h;a.namespace+="var "+d+"=base2.lang.bind('"+d+"',"+c+");";}}};var Binding=Interface.extend(null,{bind:function(a){return extend(a,this.prototype);}});var Node=Binding.extend({"@!(element.compareDocumentPosition)":{compareDocumentPosition:function(a,b){if(Traversal.contains(a,b)){return 4|16;}else if(Traversal.contains(b,a)){return 2|8;}var c=_v(a);var d=_v(b);if(c<d){return 4;}else if(c>d){return 2;}return 0;}}},{"@Gecko":{bind:function(b){return extend(this.base(b),"removeEventListener",function(){var a=Array2.slice(arguments);a.unshift(this);EventTarget.removeEventListener.apply(EventTarget,a);});}}});var _v=document.documentElement.sourceIndex?function(a){return a.sourceIndex;}:function(a){var b=0;while(a){b=Traversal.getNodeIndex(a)+"."+b;a=a.parentNode;}return b;};var Document=Node.extend(null,{bind:function(b){extend(b,"createElement",function(a){return DOM.bind(this.base(a));});AbstractView.bind(b.defaultView);if(b!=window.document)new DOMContentLoadedEvent(b);return this.base(b);},"@!(document.defaultView)":{bind:function(a){a.defaultView=Traversal.getDefaultView(a);return this.base(a);}}});var _e={"class":"className","for":"htmlFor"};var Element=Node.extend({"@MSIE.+win":{getAttribute:function(a,b){if(a.className===undefined){return this.base(a,b);}var c=_w(a,b);if(c&&(c.specified||b=="value")){if(b=="href"||b=="src"){a.base=a.getAttribute.ancestor;return a[a.base?"base":"getAttribute"](b,2);}else if(b=="style"){return a.style.cssText.toLowerCase();}else{return c.nodeValue;}}else if(b=="type"&&a.nodeName=="INPUT"){var d=a.outerHTML;with(d)d=slice(0,indexOf(">")+1);return match(d,/type="?([^\s">]*)"?/i)[1]||null}return null},removeAttribute:function(a,b){if(a.className!==undefined){b=_e[b.toLowerCase()]||b}this.base(a,b)},setAttribute:function(a,b,c){if(a.className===undefined){this.base(a,b,c)}else if(b=="style"){a.style.cssText=c}else{c=String(c);var d=_w(a,b);if(d){d.nodeValue=c}else{this.base(a,_e[b.toLowerCase()]||b,c)}}}},"@!(element.hasAttribute)":{hasAttribute:function(a,b){if(a.className===undefined){return this.base(a,b)}return this.getAttribute(a,b)!=null}}});if(detect("MSIE.+win"))extend(Element.prototype,"cloneNode",function(deep){var clone=this.base(deep||false);clone.base2ID=undefined;return clone});var _x="colSpan,rowSpan,vAlign,dateTime,accessKey,tabIndex,encType,maxLength,readOnly,longDesc";extend(_e,Array2.combine(_x.toLowerCase().split(","),_x.split(",")));var _w=document.documentElement.getAttributeNode?function(a,b){return a.getAttributeNode(b)}:function(a,b){return a.attributes[b]||a.attributes[_e[b.toLowerCase()]]};var TEXT=detect("(element.textContent===undefined)")?"innerText":"textContent";var Traversal=Module.extend({getDefaultView:function(a){return this.getDocument(a).defaultView},getNextElementSibling:function(a){while(a&&(a=a.nextSibling)&&!this.isElement(a))continue;return a},getNodeIndex:function(a){var b=0;while(a&&(a=a.previousSibling))b++;return b},getOwnerDocument:function(a){return a.ownerDocument},getPreviousElementSibling:function(a){while(a&&(a=a.previousSibling)&&!this.isElement(a))continue;return a},getTextContent:function(a,b){return a[b?"innerHTML":TEXT]},isEmpty:function(a){a=a.firstChild;while(a){if(a.nodeType==3||this.isElement(a))return false;a=a.nextSibling}return true},setTextContent:function(a,b,c){return a[c?"innerHTML":TEXT]=b},"@!MSIE":{setTextContent:function(a,b,c){with(a)while(lastChild)parentNode.removeChild(lastChild);return this.base(a,b,c)}},"@MSIE":{getDefaultView:function(a){return(a.document||a).parentWindow},"@MSIE5":{getOwnerDocument:function(a){return a.ownerDocument||a.document}}}},{contains:function(a,b){a.nodeType;while(b&&(b=b.parentNode)&&a!=b)continue;return!!b},getDocument:function(a){return this.isDocument(a)?a:a.ownerDocument||a.document},isDocument:function(a){return!!(a&&a.documentElement)},isElement:function(a){return!!(a&&a.nodeType==1)},"@(element.contains)":{contains:function(a,b){return a!=b&&(this.isDocument(a)?a==this.getOwnerDocument(b):a.contains(b))}},"@MSIE5":{isElement:function(a){return!!(a&&a.nodeType==1&&a.nodeName!="!")}}});var AbstractView=Binding.extend();var _y={},_z={"2":2,"4":1};var _8=1,_A=2,_f=3;var _B=/^mouse(up|down)|click$/,_N=/click$/,_k="abort|error|select|change|resize|scroll|",_g="(dbl)?click|mouse(down|up|over|move|out|wheel)|key(down|up)|submit|reset";_k=new RegExp("^("+_k+_g+")$");_g=new RegExp("^("+_g+")$");if(_5){var _O={focusin:"focus",focusout:"blur"};_y={focus:"focusin",blur:"focusout"}}var _C=/^(blur|submit|reset|change|select)$|^(mouse|key|focus)|click$/;var Event=Binding.extend({"@!(document.createEvent)":{initEvent:function(a,b,c,d){a.type=String(b);a.bubbles=!!c;a.cancelable=!!d},preventDefault:function(a){if(a.cancelable!==false){a.returnValue=false}},stopPropagation:function(a){a.cancelBubble=true},"@MSIE":{preventDefault:function(b){this.base(b);if(b.type=="mousedown"){var c="onbeforedeactivate";var d=Traversal.getDocument(b.target);d.attachEvent(c,function(a){a.returnValue=false;d.detachEvent(c,arguments.callee)})}}}}},{CAPTURING_PHASE:_8,AT_TARGET:_A,BUBBLING_PHASE:_f,"@!(document.createEvent)":{"@MSIE":{bind:function(a){var b=a.type;if(!a.timeStamp){a.bubbles=_k.test(b);a.cancelable=_g.test(b);a.timeStamp=new Date().valueOf()}a.relatedTarget=a[(a.target==a.fromElement?"to":"from")+"Element"];return this.base(a)}}},cloneEvent:function(a){var b=copy(a);b.stopPropagation=function(){a.stopPropagation()};b.preventDefault=function(){a.preventDefault()};return b},"@MSIE":{cloneEvent:copy}});var EventDispatcher=Base.extend({constructor:function(a){this.state=a;this.events=a.events},dispatch:function(a,b,c){b.eventPhase=c;var d=this.events[b.type][c];if(d){var g=a.length;while(g--&&!b.cancelBubble){var f=a[g];var h=d[f.base2ID];if(h){h=copy(h);b.currentTarget=f;b.eventPhase=f==b.target?_A:c;for(var i in h){var j=h[i];if(typeof j=="function"){j.call(f,b)}else{j.handleEvent(b)}}}}}},handleEvent:function(a,b){Event.bind(a);var c=a.type;var d=_O[c];if(d){a=copy(a);c=a.type=d}if(this.events[c]){if(_B.test(c)){var g=_N.test(c)?this.state._l:a.button;g=_z[g]||0;if(a.button!=g){a=copy(a);a.button=g}}var f=a.target;var h=[],i=0;while(f){h[i++]=f;f=f.parentNode}this.dispatch(h,a,_8);if(!a.cancelBubble){if(!a.bubbles)h.length=1;h.reverse();this.dispatch(h,a,_f)}}return a.returnValue!==false},"@MSIE.+win":{handleEvent:function(a){if(a.type=="scroll"){setTimeout(bind(this.base,this,copy(a),true),0);return true}else{return this.base(a)}},"@MSIE5":{dispatch:function(a,b,c){if(c==_8&&!Array2.item(a,-1).documentElement){a.push(a[0].document)}this.base(a,b,c)}}}});var _9={};var EventTarget=Interface.extend({"@!(element.addEventListener)":{addEventListener:function(a,b,c,d){var g=DocumentState.getInstance(a);var f=assignID(a);var h=assignID(c);var i=d?_8:_f;var j=g.registerEvent(b,a);var l=j[i];if(!l)l=j[i]={};if(d)b=_y[b]||b;var k=l[f];if(!k)k=l[f]={};k[h]=c},dispatchEvent:function(a,b){b.target=a;return DocumentState.getInstance(a).handleEvent(b)},removeEventListener:function(a,b,c,d){var g=DocumentState.getInstance(a).events;var f=g[b];if(f){var h=f[d?_8:_f];if(h){var i=h[a.base2ID];if(i)delete i[c.base2ID]}}}},"@(element.addEventListener)":{"@Gecko":{addEventListener:function(b,c,d,g){if(c=="mousewheel"){c="DOMMouseScroll";var f=d;d=_9[assignID(d)]=function(a){a=Event.cloneEvent(a);a.type="mousewheel";a.wheelDelta=(-a.detail*40)||0;_m(b,f,a)}}this.base(b,c,d,g)}},"@webkit[1-4]|KHTML[34]":{addEventListener:function(c,d,g,f){if(_B.test(d)){var h=g;g=_9[assignID(g)]=function(a){var b=_z[a.button]||0;if(a.button!=b){a=Event.cloneEvent(a);a.button=b}_m(c,h,a)}}else if(typeof g=="object"){g=_9[assignID(g)]=bind("handleEvent",g)}this.base(c,d,g,f)}},"@Linux|Mac|opera":{addEventListener:function(f,h,i,j){if(h=="keydown"){var l=i;i=_9[assignID(i)]=function(b){var c=0,d=false;extend(b,"preventDefault",function(){this.base();d=true});function g(a){if(d)a.preventDefault();if(a==b||c>1){_m(f,l,b)}c++};g(b);f.addEventListener("keyup",function(){f.removeEventListener("keypress",g,true);f.removeEventListener("keyup",arguments.callee,true)},true);f.addEventListener("keypress",g,true)}}this.base(f,h,i,j)}},removeEventListener:function(a,b,c,d){this.base(a,b,_9[c.base2ID]||c,d)}}});if(detect("Gecko")){EventTarget.removeEventListener._d="removeEventListener";delete EventTarget.prototype.removeEventListener}function _m(a,b,c){if(typeof b=="function"){b.call(a,c)}else{b.handleEvent(c)}};var DocumentEvent=Interface.extend({"@!(document.createEvent)":{createEvent:function(a,b){var c=a.createEventObject?a.createEventObject():{};c.bubbles=false;c.cancelable=false;c.eventPhase=0;c.target=a;c.currentTarget=null;c.relatedTarget=null;c.timeStamp=new Date().valueOf();return Event(c)}},"@(document.createEvent)":{"@!(document.createEvent('Events'))":{createEvent:function(a,b){return this.base(a,b=="Events"?"UIEvents":b)}}}});var DOMContentLoadedEvent=Base.extend({constructor:function(b){var c=false;this.fire=function(){if(!c){c=true;setTimeout(function(){var a=DocumentEvent.createEvent(b,"Events");Event.initEvent(a,"DOMContentLoaded",true,false);EventTarget.dispatchEvent(b,a)},1)}};EventTarget.addEventListener(b,"DOMContentLoaded",function(){c=true},false);this.listen(b)},listen:Undefined,"@!Gecko20([^0]|0[3-9])|Webkit[5-9]|Opera[19]|MSIE.+mac":{listen:function(a){EventTarget.addEventListener(Traversal.getDefaultView(a),"load",this.fire,false)},"@MSIE.+win":{listen:function(a){try{a.body.doScroll("left");if(!this.__constructing)this.fire()}catch(e){setTimeout(bind(this.listen,this,a),10)}}},"@KHTML":{listen:function(a){if(/loaded|complete/.test(a.readyState)){if(!this.__constructing)this.fire()}else{setTimeout(bind(this.listen,this,a),10)}}}}});Document.implement(DocumentEvent);Document.implement(EventTarget);Element.implement(EventTarget);var _P=/^\d+(px)?$/i,_D=/(width|height|top|bottom|left|right|fontSize)$/,_E=/^(color|backgroundColor)$/,_Q="rgb(0, 0, 0)",_R={black:1,"#000":1,"#000000":1};var ViewCSS=Interface.extend({"@!(document.defaultView.getComputedStyle)":{"@MSIE":{getComputedStyle:function(a,b,c){var d=b.currentStyle;var g={};for(var f in d){if(_D.test(f)||_E.test(f)){g[f]=this.getComputedPropertyValue(a,b,f)}else if(f.indexOf("ruby")!=0){g[f]=d[f]}}return g}}},getComputedStyle:function(a,b,c){return _F.bind(this.base(a,b,c))}},{getComputedPropertyValue:function(a,b,c){return CSSStyleDeclaration.getPropertyValue(this.getComputedStyle(a,b,null),c)},"@MSIE":{getComputedPropertyValue:function(a,b,c){c=this.toCamelCase(c);var d=b.currentStyle[c];if(_D.test(c))return _S(b,d)+"px";if(!_c&&_E.test(c)){var g=_T(b,c=="color"?"ForeColor":"BackColor");return(g==_Q&&!_R[d])?d:g}return d}},toCamelCase:function(a){return a.replace(/\-([a-z])/g,flip(String2.toUpperCase))}});function _S(a,b){if(_P.test(b))return parseInt(b);var c=a.style.left;var d=a.runtimeStyle.left;a.runtimeStyle.left=a.currentStyle.left;a.style.left=b||0;b=a.style.pixelLeft;a.style.left=c;a.runtimeStyle.left=d;return b};function _T(a,b){if(a.createTextRange){var c=a.createTextRange()}else{c=a.document.body.createTextRange();c.moveToElementText(a)}var d=c.queryCommandValue(b);return format("rgb(%1, %2, %3)",d&0xff,(d&0xff00)>>8,(d&0xff0000)>>16)};var _F=Binding.extend({getPropertyValue:function(a,b){return this.base(a,_G[b]||b)},"@MSIE.+win":{getPropertyValue:function(a,b){return b=="float"?a.styleFloat:a[ViewCSS.toCamelCase(b)]}}});var CSSStyleDeclaration=_F.extend({setProperty:function(a,b,c,d){return this.base(a,_G[b]||b,c,d)},"@MSIE.+win":{setProperty:function(a,b,c,d){if(b=="opacity"){c*=100;a.opacity=c;a.zoom=1;a.filter="Alpha(opacity="+c+")"}else{if(d=="important"){a.cssText+=format(";%1:%2!important;",b,c)}else{a.setAttribute(ViewCSS.toCamelCase(b),c)}}}}},{"@MSIE":{bind:function(a){a.getPropertyValue=this.prototype.getPropertyValue;a.setProperty=this.prototype.setProperty;return a}}});var _G=new Base({"@Gecko":{opacity:"-moz-opacity"},"@KHTML":{opacity:"-khtml-opacity"}});with(CSSStyleDeclaration.prototype)getPropertyValue.toString=setProperty.toString=K("[base2]");AbstractView.implement(ViewCSS);var NodeSelector=Interface.extend({"@(element.querySelector)":{querySelector:function(a,b){try{var c=this.base(a,trim(b));if(c)return c}catch(x){}return new Selector(b).exec(a,1)},querySelectorAll:function(a,b){try{var c=this.base(a,trim(b));if(c)return new StaticNodeList(c)}catch(x){}return new Selector(b).exec(a)}},"@!(element.querySelector)":{querySelector:function(a,b){return new Selector(b).exec(a,1)},querySelectorAll:function(a,b){return new Selector(b).exec(a)}}});extend(NodeSelector.prototype,{querySelector:function(a){return DOM.bind(this.base(a))},querySelectorAll:function(b){return extend(this.base(b),"item",function(a){return DOM.bind(this.base(a))})}});var DocumentSelector=NodeSelector.extend();var ElementSelector=NodeSelector.extend({"@!(element.matchesSelector)":{matchesSelector:function(a,b){return new Selector(b).test(a)}}});var _U=/'(\\.|[^'\\])*'|"(\\.|[^"\\])*"/g,_V=/([\s>+~,]|[^(]\+|^)([#.:\[])/g,_W=/(^|,)([^\s>+~])/g,_X=/\s*([\s>+~,]|^|$)\s*/g,_Y=/\s\*\s/g,_Z=/\x01(\d+)/g,_10=/'/g;var CSSParser=RegGrp.extend({constructor:function(a){this.base(a);this.cache={};this.sorter=new RegGrp;this.sorter.add(/:not\([^)]*\)/,RegGrp.IGNORE);this.sorter.add(/([ >](\*|[\w-]+))([^: >+~]*)(:\w+-child(\([^)]+\))?)([^: >+~]*)/,"$1$3$6$4")},cache:null,ignoreCase:true,escape:function(b,c){var d=this._11=[];b=this.optimise(this.format(String(b).replace(_U,function(a){return"\x01"+d.push(a.slice(1,-1).replace(_10,"\\'"))})));if(c)b=b.replace(/^ \*?/,"");return b},format:function(a){return a.replace(_X,"$1").replace(_W,"$1 $2").replace(_V,"$1*$2")},optimise:function(a){return this.sorter.exec(a.replace(_Y,">* "))},parse:function(a,b){return this.cache[a]||(this.cache[a]=this.unescape(this.exec(this.escape(a,b))))},unescape:function(c){var d=this._11;return c.replace(_Z,function(a,b){return d[b-1]})}});function _H(a,b,c,d,g,f,h,i){d=/last/i.test(a)?d+"+1-":"";if(!isNaN(b))b="0n+"+b;else if(b=="even")b="2n";else if(b=="odd")b="2n+1";b=b.split("n");var j=b[0]?(b[0]=="-")?-1:parseInt(b[0]):1;var l=parseInt(b[1])||0;var k=j<0;if(k){j=-j;if(j==1)l++}var m=format(j==0?"%3%7"+(d+l):"(%4%3-%2)%6%1%70%5%4%3>=%2",j,l,c,d,f,h,i);if(k)m=g+"("+m+")";return m};var XPathParser=CSSParser.extend({constructor:function(){this.base(XPathParser.build());this.sorter.putAt(1,"$1$4$3$6")},escape:function(a,b){return this.base(a,b).replace(/,/g,"\x02")},unescape:function(b){return this.base(b.replace(/\[self::\*\]/g,"").replace(/(^|\x02)\//g,"$1./").replace(/\x02/g," | ")).replace(/'[^'\\]*\\'(\\.|[^'\\])*'/g,function(a){return"concat("+a.split("\\'").join("',\"'\",'")+")"})},"@opera(7|8|9\\.[1-4])":{unescape:function(a){return this.base(a.replace(/last\(\)/g,"count(preceding-sibling::*)+count(following-sibling::*)+1"))}}},{build:function(){this.values.attributes[""]="[@$1]";forEach(this.types,function(a,b){forEach(this.values[b],a,this.rules)},this);this.build=K(this.rules);return this.rules},optimised:{pseudoClasses:{"first-child":"[1]","last-child":"[last()]","only-child":"[last()=1]"}},rules:extend({},{"@!KHTML|opera":{"(^|\\x02) (\\*|[\\w-]+)#([\\w-]+)":"$1id('$3')[self::$2]"},"@!KHTML":{"([ >])(\\*|[\\w-]+):([\\w-]+-child(\\(([^)]+)\\))?)":function(a,b,c,d,g,f){var h=(b==" ")?"//*":"/*";if(/^nth/i.test(d)){h+=_n(d,f,"position()")}else{h+=XPathParser.optimised.pseudoClasses[d]}return h+"[self::"+c+"]"}}}),types:{identifiers:function(a,b){this[rescape(b)+"([\\w-]+)"]=a},combinators:function(a,b){this[rescape(b)+"(\\*|[\\w-]+)"]=a},attributes:function(a,b){this["\\[\\s*([\\w-]+)\\s*"+rescape(b)+"\\s*([^\\]\\s]*)\\s*\\]"]=a},pseudoClasses:function(a,b){this[":"+b.replace(/\(\)$/,"\\(([^)]+)\\)")]=a}},values:{identifiers:{"#":"[@id='$1'][1]",".":"[contains(concat(' ',@class,' '),' $1 ')]"},combinators:{" ":"/descendant::$1",">":"/child::$1","+":"/following-sibling::*[1][self::$1]","~":"/following-sibling::$1"},attributes:{"*=":"[contains(@$1,'$2')]","^=":"[starts-with(@$1,'$2')]","$=":"[substring(@$1,string-length(@$1)-string-length('$2')+1)='$2']","~=":"[contains(concat(' ',@$1,' '),' $2 ')]","|=":"[contains(concat('-',@$1,'-'),'-$2-')]","!=":"[not(@$1='$2')]","=":"[@$1='$2']"},pseudoClasses:{"link":"[false]","visited":"[false]","empty":"[not(child::*) and not(text())]","first-child":"[not(preceding-sibling::*)]","last-child":"[not(following-sibling::*)]","not()":_12,"nth-child()":_n,"nth-last-child()":_n,"only-child":"[not(preceding-sibling::*) and not(following-sibling::*)]","root":"[not(parent::*)]"}},"@opera(7|8|9\\.[1-4])":{build:function(){this.optimised.pseudoClasses["last-child"]=this.values.pseudoClasses["last-child"];this.optimised.pseudoClasses["only-child"]=this.values.pseudoClasses["only-child"];return this.base()}}});var _o;function _12(a,b){if(!_o)_o=new XPathParser;return"[not("+_o.exec(trim(b)).replace(/\[1\]/g,"").replace(/^(\*|[\w-]+)/,"[self::$1]").replace(/\]\[/g," and ").slice(1,-1)+")]"};function _n(a,b,c){return"["+_H(a,b,c||"count(preceding-sibling::*)+1","last()","not"," and "," mod ","=")+"]"};var Selector=Base.extend({constructor:function(a){this.toString=K(trim(a))},exec:function(a,b,c){return Selector.parse(this,c)(a,b)},isSimple:function(){if(!_3.exec)_3=new CSSParser(_3);return!_13.test(trim(_3.escape(this)))},test:function(a){if(this.isSimple()){return!!Selector.parse(this,true)(a,1)}else{a.setAttribute("b2-test",true);var b=new Selector(this+"[b2-test]").exec(Traversal.getOwnerDocument(a),1);a.removeAttribute("b2-test");return b==a}},toXPath:function(a){return Selector.toXPath(this,a)},"@(XPathResult)":{exec:function(a,b,c){if(_6.test(this)){return this.base(a,b,c)}var d=Traversal.getDocument(a);var g=b==1?9:7;var f=d.evaluate(this.toXPath(c),a,null,g,null);return b==1?f.singleNodeValue:f}},"@MSIE":{exec:function(a,b,c){if(typeof a.selectNodes!="undefined"&&!_6.test(this)){var d=single?"selectSingleNode":"selectNodes";return a[d](this.toXPath(c))}return this.base(a,b,c)}},"@(true)":{exec:function(a,b,c){try{var d=this.base(a||document,b,c)}catch(error){throw new SyntaxError(format("'%1' is not a valid CSS selector.",this));}return b==1?d:new StaticNodeList(d)}}},{toXPath:function(a,b){if(!_p)_p=new XPathParser;return _p.parse(a,b)}});var _13=/[^,]\s|[+>~]/;var _6=":(checked|disabled|enabled|contains|hover|active|focus)|^(#[\\w-]+\\s*)?\\w+$";if(detect("KHTML")){if(detect("WebKit5")){_6+="|nth\\-|,"}else{_6="."}}_6=new RegExp(_6);Selector.operators={"=":"%1=='%2'","~=":/(^| )%1( |$)/,"|=":/^%1(-|$)/,"^=":/^%1/,"$=":/%1$/,"*=":/%1/};Selector.operators[""]="%1!=null";Selector.pseudoClasses={"checked":"e%1.checked","contains":"e%1[TEXT].indexOf('%2')!=-1","disabled":"e%1.disabled","empty":"Traversal.isEmpty(e%1)","enabled":"e%1.disabled===false","first-child":"!Traversal.getPreviousElementSibling(e%1)","last-child":"!Traversal.getNextElementSibling(e%1)","only-child":"!Traversal.getPreviousElementSibling(e%1)&&!Traversal.getNextElementSibling(e%1)","root":"e%1==Traversal.getDocument(e%1).documentElement","target":"e%1.id&&e%1.id==location.hash.slice(1)","hover":"DocumentState.getInstance(d).isHover(e%1)","active":"DocumentState.getInstance(d).isActive(e%1)","focus":"DocumentState.getInstance(d).hasFocus(e%1)","link":"false","visited":"false"};var _I=document.documentElement.sourceIndex!==undefined,_J="var p%2=0,i%2,e%3,n%2=e%1.",_14=_I?"e%1.sourceIndex":"assignID(e%1)",_15="var g="+_14+";if(!p[g]){p[g]=1;",_16="r[k++]=e%1;if(s==1)return e%1;if(k===s){_a.state=[%2];_a.complete=%3;return r;",_17="var _a=function(e0,s%1){_b++;var r=[],p={},p0=0,reg=[%4],d=Traversal.getDocument(e0),c=d.writeln?'toUpperCase':'toString',k=0;";var _p;var _7,_0,_1,_2,_4,_1d,_h,_18={},_19={};function sum(a){var b=0;for(var c=0;c<a.length;c++){b+=a[c]}return b};var _3={"^(\\*|[\\w-]+)":function(a,b){return b=="*"?"":format("if(e0.nodeName=='%1'[c]()){",b)},"^ \\*:root":function(a){_1=false;var b="e%2=d.documentElement;if(Traversal.contains(e%1,e%2)){";return format(b,_0++,_0)}," (\\*|[\\w-]+)#([\\w-]+)":function(a,b,c){_1=false;var d="var e%2=_1a(d,'%4');if(e%2&&";if(b!="*")d+="e%2.nodeName=='%3'[c]()&&";d+="Traversal.contains(e%1,e%2)){";if(_2[_4])d+=format("i%1=n%1.length;",sum(_2));return format(d,_0++,_0,b,c)}," (\\*|[\\w-]+)":function(a,b){_h++;_1=b=="*";var c=format(_J,_0++,"%2",_0);c+=(_1&&_c)?"all":"getElementsByTagName('%3')";c+=";for(i%2=a%2||0;(e%1=n%2[i%2]);i%2++){";_2[_4]++;return format(c,_0,sum(_2),b)},">(\\*|[\\w-]+)":function(a,b){var c=_5&&_0;_1=b=="*";var d=_J+(c?"children":"childNodes");d=format(d,_0++,"%2",_0);if(!_1&&_5&&c)d+=".tags('%3')";d+=";for(i%2=a%2||0;(e%1=n%2[i%2]);i%2++){";if(_1){d+="if(e%1.nodeType==1){";_1=_c}else{if(!_5||!c)d+="if(e%1.nodeName=='%3'[c]()){"}_2[_4]++;return format(d,_0,sum(_2),b)},"\\+(\\*|[\\w-]+)":function(a,b){var c="";if(_1&&_5)c+="if(e%1.nodeName!='!'){";_1=false;c+="e%1=Traversal.getNextElementSibling(e%1);if(e%1";if(b!="*")c+="&&e%1.nodeName=='%2'[c]()";c+="){";return format(c,_0,b)},"~(\\*|[\\w-]+)":function(a,b){var c="";if(_1&&_5)c+="if(e%1.nodeName!='!'){";_1=false;_h=2;c+="while(e%1=e%1.nextSibling){if(e%1.b2_adjacent==_b)break;if(";if(b=="*"){c+="e%1.nodeType==1";if(_c)c+="&&e%1.nodeName!='!'"}else c+="e%1.nodeName=='%2'[c]()";c+="){e%1.b2_adjacent=_b;";return format(c,_0,b)},"#([\\w-]+)":function(a,b){_1=false;var c="if(e%1.id=='%2'){";if(_2[_4])c+=format("i%1=n%1.length;",sum(_2));return format(c,_0,b)},"\\.([\\w-]+)":function(a,b){_1=false;_7.push(new RegExp("(^|\\s)"+rescape(b)+"(\\s|$)"));return format("if(e%1.className&&reg[%2].test(e%1.className)){",_0,_7.length-1)},":not\\((\\*|[\\w-]+)?([^)]*)\\)":function(a,b,c){var d=(b&&b!="*")?format("if(e%1.nodeName=='%2'[c]()){",_0,b):"";d+=_3.exec(c);return"if(!"+d.slice(2,-1).replace(/\)\{if\(/g,"&&")+"){"},":nth(-last)?-child\\(([^)]+)\\)":function(a,b,c){_1=false;b=format("e%1.parentNode.b2_length",_0);var d="if(p%1!==e%1.parentNode)p%1=_1b(e%1.parentNode);";d+="var i=e%1[p%1.b2_lookup];if(p%1.b2_lookup!='b2_index')i++;if(";return format(d,_0)+_H(a,c,"i",b,"!","&&","% ","==")+"){"},":([\\w-]+)(\\(([^)]+)\\))?":function(a,b,c,d){return"if("+format(Selector.pseudoClasses[b]||"throw",_0,d||"")+"){"},"\\[\\s*([\\w-]+)\\s*([^=]?=)?\\s*([^\\]\\s]*)\\s*\\]":function(a,b,c,d){d=trim(d);if(_5){var g="Element.getAttribute(e%1,'%2')"}else{g="e%1.getAttribute('%2')"}g=format(g,_0,b);var f=Selector.operators[c||""];if(instanceOf(f,RegExp)){_7.push(new RegExp(format(f.source,rescape(_3.unescape(d)))));f="reg[%2].test(%1)";d=_7.length-1}return"if("+format(f,g,d)+"){"}};(function(_M){var _1a=detect("MSIE[5-7]")?function(a,b){var c=a.all[b]||null;if(!c||c.id==b)return c;for(var d=0;d<c.length;d++){if(c[d].id==b)return c[d]}return null}:function(a,b){return a.getElementById(b)};var _b=1;function _1b(a){if(a.rows){a.b2_length=a.rows.length;a.b2_lookup="rowIndex"}else if(a.cells){a.b2_length=a.cells.length;a.b2_lookup="cellIndex"}else if(a.b2_indexed!=_b){var b=0;var c=a.firstChild;while(c){if(c.nodeType==1&&c.nodeName!="!"){c.b2_index=++b}c=c.nextSibling}a.b2_length=b;a.b2_lookup="b2_index"}a.b2_indexed=_b;return a};Selector.parse=function(a,b){var c=b?_19:_18;if(!c[a]){if(!_3.exec)_3=new CSSParser(_3);_7=[];_2=[];var d="";var g=_3.escape(a,b).split(",");for(_4=0;_4<g.length;_4++){_1=_0=_2[_4]=0;_h=g.length>1?2:0;var f=_3.exec(g[_4])||"throw;";if(_1&&_5){f+=format("if(e%1.tagName!='!'){",_0)}var h=(_h>1)?_15:"";f+=format(h+_16,_0,"%2");f+=Array(match(f,/\{/g).length+1).join("}");d+=f}d=_3.unescape(d);if(g.length>1)d+="r.unsorted=1;";var i="";var j=[];var l=sum(_2);for(var k=1;k<=l;k++){i+=",a"+k;j.push("i"+k+"?(i"+k+"-1):0")}if(l){var m=[],n=0;for(var k=0;k<_4;k++){n+=_2[k];if(_2[k])m.push(format("n%1&&i%1==n%1.length",n))}}d+="_a.state=[%2];_a.complete=%3;return s==1?null:r}";eval(format(_17+d,i,j.join(","),l?m.join("&&"):true,_7));c[a]=_a}return c[a]}})();var StaticNodeList=Base.extend({constructor:function(b){b=b||[];this.length=b.length;this.item=function(a){if(a<0)a+=this.length;return b[a]};if(b.unsorted)b.sort(_1c)},length:0,forEach:function(a,b){for(var c=0;c<this.length;c++){a.call(b,this.item(c),c,this)}},item:Undefined,not:function(a,b){return this.filter(not(a),b)},slice:function(a,b){return new StaticNodeList(this.map(I).slice(a,b))},"@(XPathResult)":{constructor:function(b){if(b&&b.snapshotItem){this.length=b.snapshotLength;this.item=function(a){if(a<0)a+=this.length;return b.snapshotItem(a)}}else this.base(b)}}});StaticNodeList.implement(Enumerable);var _i=function(a,b){if(typeof a!="function"){a=bind("test",new Selector(a))}return this.base(a,b)};StaticNodeList.implement({every:_i,filter:_i,not:_i,some:_i});StaticNodeList.implement({filter:function(a,b){return new StaticNodeList(this.base(a,b))}});var _1c=_I?function(a,b){return a.sourceIndex-b.sourceIndex}:function(a,b){return(Node.compareDocumentPosition(a,b)&2)-1};Document.implement(DocumentSelector);Element.implement(ElementSelector);var HTMLDocument=Document.extend(null,{bind:function(a){DocumentState.createState(a);return this.base(a)}});var HTMLElement=Element.extend(null,{bindings:{},tags:"*",bind:function(a){if(!a.classList){a.classList=new _K(a)}if(!a.ownerDocument){a.ownerDocument=Traversal.getOwnerDocument(a)}return this.base(a)},extend:function(){var b=base(this,arguments);forEach.csv(b.tags,function(a){HTMLElement.bindings[a]=b});return b}});HTMLElement.extend(null,{tags:"APPLET,EMBED",bind:I});var ClassList=Module.extend({add:function(a,b){if(!this.has(a,b)){a.className+=(a.className?" ":"")+b}},has:function(a,b){var c=new RegExp("(^|\\s)"+b+"(\\s|$)");return c.test(a.className)},remove:function(a,b){var c=new RegExp("(^|\\s)"+b+"(\\s|$)","g");a.className=trim(a.className.replace(c,"$2"))},toggle:function(a,b){this[this.has(a,b)?"remove":"add"](a,b)}});function _K(b){this.add=function(a){ClassList.add(b,a)};this.has=function(a){return ClassList.has(b,a)};this.remove=function(a){ClassList.remove(b,a)}};_K.prototype.toggle=function(a){this[this.has(a)?"remove":"add"](a)};var DocumentState=Base.extend({constructor:function(d){this.document=d;this.events={};this._q=d.documentElement;this.isBound=function(){return!!DOM.bind[d.base2ID]};forEach(this,function(a,b,c){if(/^on((DOM)?\w+|[a-z]+)$/.test(b)){c.registerEvent(b.slice(2))}})},includes:function(a,b){return b&&(a==b||Traversal.contains(a,b))},hasFocus:function(a){return a==this._r},isActive:function(a){return this.includes(a,this._s)},isHover:function(a){return this.includes(a,this._q)},handleEvent:function(a){return this["on"+a.type](a)},onblur:function(a){delete this._r},onmouseover:function(a){this._q=a.target},onmouseout:function(a){delete this._q},onmousedown:function(a){this._s=a.target},onfocus:function(a){this._r=a.target},onmouseup:function(a){delete this._s},registerEvent:function(a){this.document.addEventListener(a,this,true);this.events[a]=true},"@(document.activeElement===undefined)":{constructor:function(a){this.base(a);if(this.isBound()){a.activeElement=a.body}},onfocus:function(a){this.base(a);if(this.isBound()){this.document.activeElement=this._r}},onblur:function(a){this.base(a);if(this.isBound()){this.document.activeElement=this.document.body}}},"@!(element.addEventListener)":{constructor:function(b){this.base(b);var c=new EventDispatcher(this);this._j=function(a){a.target=a.target||a.srcElement||b;c.handleEvent(a)};this.handleEvent=function(a){if(this["on"+a.type]){this["on"+a.type](a)}return c.handleEvent(a)}},registerEvent:function(b,c){var d=this.events[b];var g=_C.test(b);if(!d||!g){if(!d)d=this.events[b]={};if(g||!c)c=this.document;var f=this;c["on"+b]=function(a){if(!a){a=Traversal.getDefaultView(this).event}if(a)f.handleEvent(a)}}return d},"@MSIE.+win":{constructor:function(c){this.base(c);var d={};this._L=function(a){var b=assignID(a);if(!d[b]){d[b]=true;a.attachEvent("onsubmit",this._j);a.attachEvent("onreset",this._j)}}},fireEvent:function(a,b){b=copy(b);b.type=a;this.handleEvent(b)},registerEvent:function(b,c){var d=this.events[b];var g=_C.test(b);if(!d||!g){if(!d)d=this.events[b]={};if(g||!c)c=this.document;var f=this;c.attachEvent("on"+b,function(a){a.target=a.srcElement||f.document;f.handleEvent(a);if(f["after"+b]){f["after"+b](a)}})}return d},onDOMContentLoaded:function(a){forEach(a.target.forms,this._L,this);this.setFocus(this.document.activeElement)},onmousedown:function(a){this.base(a);this._l=a.button},onmouseup:function(a){this.base(a);if(this._l==null){this.fireEvent("mousedown",a)}delete this._l},aftermouseup:function(){if(this._t){this._j(this._t);delete this._t}},onfocusin:function(a){this.setFocus(a.target);this.onfocus(a)},setFocus:function(b){var c=this.events.change,d=this.events.select;if(c||d){var g=this._j;if(c)b.attachEvent("onchange",g);if(d){var f=this;var h=function(a){if(f._s==b){f._t=copy(a)}else{g(a)}};b.attachEvent("onselect",h)}b.attachEvent("onblur",function(){b.detachEvent("onblur",arguments.callee);if(c)b.detachEvent("onchange",g);if(d)b.detachEvent("onselect",h)})}},onfocusout:function(a){this.onblur(a)},onclick:function(a){var b=a.target;if(b.form)this._L(b.form)},ondblclick:function(a){this.fireEvent("click",a)}}}},{init:function(){assignID(document);DocumentState=this;this.createState(document);new DOMContentLoadedEvent(document)},createState:function(a){var b=a.base2ID;if(!this[b]){this[b]=new this(a)}return this[b]},getInstance:function(a){return this[Traversal.getDocument(a).base2ID]}});eval(this.exports)};