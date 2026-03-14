// ==UserScript==
// @name        Dropped Show Hider
// @namespace   Violentmonkey Scripts
// @match       https://anilist.co/search/anime*
// @icon        data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAACHklEQVQ4T5VTX0hTcRT+zu7drsp0i9hsYxVmD6WbEEVFD0I9BL4HEfUUhEUZlRquPxhBBUUGaUTLoJZSQgRCxBLKKEYUGwaZD4EaMfAlYkLpuN57T/f3g81mf7YO3IfL73zf+c4536FQfaTFZLoM5kYAZH/lBIPoo0J8kgJrmj7Y4HA5qN9yiMYpUBexllRmTdPIQQ7oCzoMckocGbk/1WBBwPkXy7IQCa9HtOMoaqrdeJr+hPMzfnBlDTyJXmjTaVt5cZdFBIZpovPYIXQePyI5x7/p2J5U8XWe4B46herUMKCoRUoKBMyMZV4P4v292LRxg0zKmYy9b4HHGZQmENWbt21F/E6fBGdnZxEMrEBsCmhNcWkC0f/Z6Akcbt2PVHoMo6+SspWp74wto4zc3dN/byEvf+h+zB5iAwYePEJi5Dn6rl2C2+PF7jeMkav/mIGQv3NHM2I3elBVVYlsNosfc/Oo9fugqioGP1s42F5CwZWL3di3ZxcMw4CuLxQmLQhFGy3xMUx+yYAcCtgy4U0OwpmZANWubuRQMICHtvy19XV48fI1eq7fkgRN4XU409UuVR14D/RPL27QPRCVMyHfqgbebK+tq6MNFZoLN2/fw/CTZzLT71uOC+eiWBkKIjHD6J4oeE4aq2LyHaSVFUUhl9MlQcK+pj2TfNi2hrC1iDljkcC2tvwp65jElpZaWDKKY/rlnP/vIm2wOOefuwrlqMNkePsAAAAASUVORK5CYII=
// @grant       none
// @version     1.0.0
// @author      AnzoDK
// @downloadURL https://github.com/AnzoDK/Anilist-Toggle-Scores/releases/latest/download/toggle_anilist_scores.js
// @description 14.3.2026, 11.51.46
// ==/UserScript==

var elementsToProcess = [];
var g_isAwaitingRetry = false;

function checker_callback(elements)
{
  g_isAwaitingRetry = false;
  var tmpArr = elementsToProcess.splice(0,elementsToProcess.length);
  for(var i = 0; i < tmpArr.length; i++)
  {
      try{
          if((!tmpArr[i].classList.contains("media-card")) || !document.body.contains(tmpArr[i]))
            {
              continue; //We lost an element :((
            }
      }
      catch(e)
        {
          console.log("Object doesn't have classList - Ignoring...");
          continue;
        }
          if(tmpArr[i].firstChild.classList.contains("loading"))
          {

            /*const observer = new MutationObserver( (mutationList, observer) =>
                                                  {
                                                      for(const mutation of mutationList)
                                                        {
                                                          elementsToProcess.push(...mutation.addedNodes)
                                                        }
                                                  } );
            observer.observe(tmpArr[i], {attributes:false,childList:true,subtree:true});*/
            elementsToProcess.push(tmpArr[i]);
            if(!g_isAwaitingRetry)
            {
              setTimeout(checker_callback,1000);
              g_isAwaitingRetry = true;
            }
            //reDo.push(tmpArr[i]);
            continue;
          }
          if(tmpArr[i].children.length > 2)
          {
            //This means we're not in the normal media-card view mode - and then we abort
            return;
          }
          if(tmpArr[i].children[1].children[1].children[1].children[0].attributes.getNamedItem("status").value == "Dropped")
          {
            tmpArr[i].classList.add("dropped-show");
            console.log(tmpArr[i]);
          }
  }
}

// Callback function to execute when mutations are observed
const callback_result = (mutationList, observer) => {
  for (const mutation of mutationList) {
    if (mutation.type === "childList") {
      //console.log("A child node has been added or removed.");
      elementsToProcess.push(...mutation.addedNodes);
      continue;
    }
    else if (mutation.type === "attributes")
    {
      console.log(`The ${mutation.attributeName} attribute was modified.`);
    }
  }
  setTimeout(checker_callback(null),3000); //Await the loading of the elements :)
};
// Select the node that will be observed for mutations
const targetNode = document.getElementsByClassName("results chart")[0];

// Options for the observer (which mutations to observe)
const config = { attributes: false, childList: true, subtree: false };
// Create an observer instance linked to the callback function
const observer = new MutationObserver(callback_result);

function SetUp_DroppedHider_Styles()
{

  var style = document.createElement("style");
  style.type = 'text/css';

  var css = '.media-card.dropped-show { display:none!important; }';

  if (style.styleSheet)
  {
    // This is required for IE8 and below.
    style.styleSheet.cssText = css;
  }
  else
  {
    style.appendChild(document.createTextNode(css));
  }

  var head = document.head || document.getElementsByTagName('head')[0];
  head.appendChild(style);

  console.log("DroppedHider - Styles initilized");

}

function SetUp_DroppedHider()
{

// Start observing the target node for configured mutations
  observer.observe(targetNode, config);
  console.log("DroppedHider - Observer initilized");
}

SetUp_DroppedHider_Styles();

SetUp_DroppedHider();
