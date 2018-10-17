// ==UserScript==
// @name Automatic URL Decoder
// @namespace https://github.com/T1mL3arn
// @author T1mL3arn
// @description:ru Декодирует все найденные на странице ссылки, похожие на "%D0%BF%D1%80%D0%B8%D0%B2%D0%B5%D1%82%20%D0%BC%D0%B8%D1%80", в удобочитаемое "привет мир"
// @description:en It decodes all percent-decoded links on current page.
// @match *://*/*
// @version 2.0
// @run-at document-end
// @license GPLv3
// @supportURL https://github.com/T1mL3arn/Automatic-URL-Decoder/issues
// @homepageURL https://github.com/T1mL3arn/Automatic-URL-Decoder
// ==/UserScript==

(() => {
  function isElementAllowed(elt) {
    return blockedTagsList.indexOf(elt.tagName) == -1 && !elt.matches(blockedClassesSelector);
  }

  function addStyle(css) {
    const id = 'auto-url-decoder-style-elt'; 
    const style = document.getElementById(id) || document.head.appendChild(document.createElement('style'));
    style.id = id;
    style.textContent = css;
  }

  const DECODED_ELT_CLASS = 'auto-url-decoder-s739';
  let linkEreg = /(?:[a-z][a-z0-9-+.]+:\/\/|www\.).+?(?=\s|$)/gi;
  let linkEregLocal = /(?:[a-z][a-z0-9-+.]+:\/\/|www\.).+?(?=\s|$)/i;
  let percentEncodingEreg = /%[a-f0-9]{2}/i;
  let obsOptions = { childList: true, subtree: true };
  let blockedTagsList = 'NOSCRIPT OPTION SCRIPT STYLE TEXTAREA SVG CANVAS BUTTON SELECT TEMPLATE METER PROGRESS MATH TIME HEAD CODE PRE'.split(' ');
  ///NOTE Use 'foo' (or any other dummy class) in this selector
  // if you need to make this variable "empty"
  // It allows to avoid  SyntaxError: '' is not a valid selector
  let blockedClassesSelector = `${DECODED_ELT_CLASS}`.split(' ').map(class_ => `.${class_}`).join(', ');
  let counter = 0;
  let storeOriginalURL = false;

  // ----------------------------
  // CSS
  function getDefaultBackgroundCSS(color) {
    return `
    .${DECODED_ELT_CLASS} {
      background-color: ${color} !important;
      padding: 2px 2px !important;
      margin: 0 -2px !important;
    }`;
  }

  const underlineCss = `
  .${DECODED_ELT_CLASS} {
    border-bottom: 2px solid currentColor !important;
    margin-bottom: -2px !important;
  }`;
  const greenBackgroundCSS = getDefaultBackgroundCSS('#deffc3');
  const redBackgroundCSS = getDefaultBackgroundCSS('#fcd7d7');
  const blueBackgroundCSS = getDefaultBackgroundCSS('#d7ebfc');
  // set one of style from above to enable 
  // custom style for fixed links
  let decodedNodeCSS = greenBackgroundCSS;
  // CSS
  // ----------------------------
  
  let obs = new MutationObserver((changes, obs) => {
    counter = 0;
    obs.disconnect();
    changes.forEach((change) => change.addedNodes.forEach((node) => fixLinks(node)) );
    obs.observe(document.body, obsOptions);
    //console.log('[ URL  Decoder ] Decoded: ', counter);
  });
  
  function fixLinks(node) {
    if (node.nodeType === 3) {
      let content = node.textContent;
      if (content != '') {
        if (linkEregLocal.test(content) && percentEncodingEreg.test(content)) {
          if (decodedNodeCSS != null) replaceAndStyleLink(node);
          else {
            try {
              let decoded = content.replace(linkEreg, decodeURIComponent);
              if (decoded.length != content.length) node.textContent = decoded;
            } catch (e) {
              // URI mailformed, hust skip it
            }
          }
        }
      }
    } else if (node.nodeType === 1 && node.childNodes.length > 0 && isElementAllowed(node)) {
      node.childNodes.forEach(fixLinks);
    }
  }
  
  function replaceAndStyleLink(node) {
    let match;
    let sibling = node;
    let content = node.textContent;
    while ((match = linkEreg.exec(content)) != null) {
      let fullMatch = match[0];
      let decoded;

      try {
        decoded = decodeURIComponent(fullMatch);
      } catch (e) {
        content = content.substring(linkEreg.lastIndex);
        linkEreg.lastIndex = 0;
        continue;
      }

      if (decoded.length != fullMatch.length) {
        let span = document.createElement('span');
        span.classList.add(DECODED_ELT_CLASS);

        if (storeOriginalURL) span.dataset.urlDecOriginalUrl = fullMatch;
  
        let range = document.createRange();
        range.setStart(sibling, linkEreg.lastIndex - match[0].length);
        range.setEnd(sibling, linkEreg.lastIndex);
        range.surroundContents(span);
        
        content = content.substring(linkEreg.lastIndex);
        span.textContent = decoded;
        linkEreg.lastIndex = 0;
        counter++;

        sibling = getNextTextSibling(span);
        if (sibling == null)  break;
      }
    }
  }
  
  function getNextTextSibling(node) {
    let next = node.nextSibling;
    while (next != null) {
      if (next.nodeType == 3) return next;
      else                    next = node.nextSibling;
    }
    return null;
  }
  
  if (decodedNodeCSS != null) addStyle(decodedNodeCSS);
  
  counter = 0;
  fixLinks(document.body);
  //console.log('[ URL  Decoder ] Decoded: ', counter);
  obs.observe(document.body, obsOptions);
})();