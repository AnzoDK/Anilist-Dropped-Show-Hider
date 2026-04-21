// ==UserScript==
// @name        Dropped Show Hider
// @namespace   Violentmonkey Scripts
// @match       https://anilist.co/search/anime*
// @icon        data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAACHklEQVQ4T5VTX0hTcRT+zu7drsp0i9hsYxVmD6WbEEVFD0I9BL4HEfUUhEUZlRquPxhBBUUGaUTLoJZSQgRCxBLKKEYUGwaZD4EaMfAlYkLpuN57T/f3g81mf7YO3IfL73zf+c4536FQfaTFZLoM5kYAZH/lBIPoo0J8kgJrmj7Y4HA5qN9yiMYpUBexllRmTdPIQQ7oCzoMckocGbk/1WBBwPkXy7IQCa9HtOMoaqrdeJr+hPMzfnBlDTyJXmjTaVt5cZdFBIZpovPYIXQePyI5x7/p2J5U8XWe4B46herUMKCoRUoKBMyMZV4P4v292LRxg0zKmYy9b4HHGZQmENWbt21F/E6fBGdnZxEMrEBsCmhNcWkC0f/Z6Akcbt2PVHoMo6+SspWp74wto4zc3dN/byEvf+h+zB5iAwYePEJi5Dn6rl2C2+PF7jeMkav/mIGQv3NHM2I3elBVVYlsNosfc/Oo9fugqioGP1s42F5CwZWL3di3ZxcMw4CuLxQmLQhFGy3xMUx+yYAcCtgy4U0OwpmZANWubuRQMICHtvy19XV48fI1eq7fkgRN4XU409UuVR14D/RPL27QPRCVMyHfqgbebK+tq6MNFZoLN2/fw/CTZzLT71uOC+eiWBkKIjHD6J4oeE4aq2LyHaSVFUUhl9MlQcK+pj2TfNi2hrC1iDljkcC2tvwp65jElpZaWDKKY/rlnP/vIm2wOOefuwrlqMNkePsAAAAASUVORK5CYII=
// @grant       none
// @version     1.2.2
// @author      AnzoDK
// @downloadURL https://github.com/AnzoDK/Anilist-Dropped-Show-Hider/releases/latest/download/hide_dropped_shows.js
// @description 14.3.2026, 11.51.46
// @require https://code.jquery.com/jquery-3.6.0.min.js
// ==/UserScript==

var elementsToProcess = [];
var g_isAwaitingRetry = false;
var g_buttonElement = null;
var g_settingsBtnElement = null;
var g_styleElement = null;
var g_toggled = false;
var g_modalElement = null;
var g_modalVisible = false;
var g_validStatuses = ["Watching","Rewatching","Completed","Paused","Planning","Dropped"];
var g_statusesToHide = ["Dropped"];
var g_disabledColor = "#182a34";
var g_activeColor = "#3db4f2";

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
          var status = tmpArr[i].children[1].children[1].children[1].children[0].attributes.getNamedItem("status");
          if(!status)
            {
              continue;
            }
          if(g_statusesToHide.includes(status.value))
          {
            tmpArr[i].classList.add(status.value.toLowerCase() + "-show");
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
var targetNode = document.getElementsByClassName("results chart")[0];

// Options for the observer (which mutations to observe)
const config = { attributes: false, childList: true, subtree: false };
// Create an observer instance linked to the callback function
const observer = new MutationObserver(callback_result);

function ReloadHiddenStatuses(caller)
{
  var status = caller.srcElement.id.replace("status-","");
      if(caller.srcElement.checked)
        {
          if(!g_statusesToHide.includes(status))
            {
              g_statusesToHide.push(status);
            }
        }
      else
        {
          var index = g_statusesToHide.indexOf(status);
          if(index > -1)
            {
              g_statusesToHide.splice(index,1);
            }
        }
}

function ToggleHiddenShows()
{
  g_toggled = !g_toggled;
  g_buttonElement.style.backgroundColor = g_toggled ? g_activeColor : g_disabledColor;
  ToggleStyle(g_toggled);


}

function ToggleSettingsModal()
{
  g_modalVisible = !g_modalVisible;
  g_modalElement.style.display = g_modalVisible ? "block" : "none";
  ToggleStyle(g_toggled);
}

function ToggleStyle(state)
{
  var head = document.head || document.getElementsByTagName('head')[0];
  if(g_styleElement != null)
      {
        head.removeChild(g_styleElement);
        g_styleElement = null;
      }
  if(!state)
  {
    return;
  }

  var style = document.createElement("style");
  style.type = 'text/css';
  var css = "";
  for(var i = 0; i < g_statusesToHide.length; i++)
  {
    css += `.media-card.${g_statusesToHide[i].toLowerCase()}-show { display:none!important; }\n`;
  }

  if (style.styleSheet)
  {
    // This is required for IE8 and below.
    style.styleSheet.cssText = css;
  }
  else
  {
    var e = style.appendChild(document.createTextNode(css));
  }


  head.appendChild(style);
  g_styleElement = style;
  TagUntaggedShows();
}

function TagUntaggedShows()
{
  var elements = document.getElementsByClassName("media-card");
  elements = Array.from(elements).filter(x => !x.classList.contains("loading") && !x.classList.contains("completed-show") && !x.classList.contains("watching-show") && !x.classList.contains("rewatching-show") && !x.classList.contains("paused-show") && !x.classList.contains("planning-show") && !x.classList.contains("dropped-show"));
  for(var i = 0; i < elements.length; i++)
  {
    var status = elements[i].children[1].children[1].children[1].children[0].attributes.getNamedItem("status");
    if(!status)
      {
        continue;
      }
    if(g_statusesToHide.includes(status.value))
      {
        elements[i].classList.add(status.value.toLowerCase() + "-show");
      }
  }
}

function SetUp_CreateHideButton() //This function keeps running itself infinitely??????
{
  var btnDiv = document.createElement("div");
  btnDiv.id = "toggleHiddenWrapper";
  var btn = document.createElement("button");
  btn.id = "toggleHiddenBtn";
  btn.appendChild(document.createTextNode("Toggle Hidden Shows!!"));
  btn.onclick = ToggleHiddenShows;
  btn.style.backgroundColor = g_toggled ? g_activeColor : g_disabledColor; ;
  btn.style.color = "white";
  btn.style.borderRadius = "6px";
  var filters = document.getElementsByClassName("filters")[0];
  if(!filters)
  {
    console.warn("Failed to locate filters.. - Are they not loaded yet? - Trying again in 2s...");
    setTimeout(SetUp_CreateHideButton,2000);
    return;
  }
  btnDiv.appendChild(btn);
  filters.appendChild(btnDiv);
  g_buttonElement = btn;
  console.log("DroppedHider - Button initilized");
}

function SetUp_CreateHideButtonSettingsModal()
{
  var modal = document.createElement("div");
  modal.id = "hiddenSettingsModal";
  modal.style.position = "fixed";
  modal.style.top = "50%";
  modal.style.left = "50%";
  modal.style.transform = "translate(-50%, -50%)";
  modal.style.backgroundColor = "#182a34";
  modal.style.padding = "20px";
  modal.style.borderRadius = "10px";
  modal.style.display = "none";
  modal.style.zIndex = "1000";
  var title = document.createElement("h2");
  title.appendChild(document.createTextNode("Hidden Shows Settings"));
  title.style.color = "white";
  modal.appendChild(title);

  var label = document.createElement("label");
  label.appendChild(document.createTextNode("Statuses to hide:"));
  label.style.color = "white";
  label.innerHTML += "<br><br>";
  modal.appendChild(label);

  var typeList = document.createElement("div");
  typeList.style.display = "grid";
  typeList.style.gridTemplateColumns = "auto auto auto auto auto auto";
  typeList.style.alignItems = "center";
  typeList.style.justifyContent = "center";
  typeList.style.textAlign = "center";
  label.style.width = "100px";

  var arrOptions = [];
  var arrLabels = [];

  for(var i = 0; i < g_validStatuses.length; i++)
  {

    var option = document.createElement("input");
    option.type = "checkbox";
    option.checked = g_statusesToHide.includes(g_validStatuses[i]) ? true : false;
    option.id = "status-" + g_validStatuses[i];
    option.onchange = ReloadHiddenStatuses;
    var label_option = document.createElement("label");
    label_option.style.padding = "10px";
    label_option.style.width = "100px";
    option.style.margin = "auto";
    

    option.style.width = "20px";
    option.style.height = "20px";
    
    label_option.appendChild(document.createTextNode(g_validStatuses[i]));
    arrLabels.push(label_option);
    arrOptions.push(option);
  }
  for(var i = 0; i < arrLabels.length; i++)
  {
    typeList.appendChild(arrLabels[i]);
  }
  for(var i = 0; i < arrOptions.length; i++)
  {
    typeList.appendChild(arrOptions[i]);
  }
  modal.appendChild(typeList);
  var closeBtn = document.createElement("button");
  closeBtn.appendChild(document.createTextNode("Close"));
  closeBtn.onclick = ToggleSettingsModal;
  modal.appendChild(closeBtn);
    
  document.body.appendChild(modal);
  g_modalElement = document.getElementById("hiddenSettingsModal");
  console.log("DroppedHider - Modal initilized")
}

function SetUp_CreateHideButtonSettings()
{
  var hideBtn = document.getElementById("toggleHiddenBtn");
  if(!hideBtn)
    {
      console.warn("Failed to locate button.. - Are they not loaded yet? - Trying again in 2s...");
      setTimeout(SetUp_CreateHideButtonSettings,2000);
      return;
    }
  var settingsBtn = document.createElement("a");
  settingsBtn.style.position = "relative";
  settingsBtn.style.top = "-32px";
  settingsBtn.style.left = "5px";
  settingsBtn.classList.add("filter");
  settingsBtn.classList.add("select");
  var svg = '<svg aria-hidden="true" focusable="false" data-prefix="fas" data-icon="cog" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" class="icon svg-inline--fa fa-cog fa-w-16 fa-fw"><path data-v-04b245e6="" fill="currentColor" d="M487.4 315.7l-42.6-24.6c4.3-23.2 4.3-47 0-70.2l42.6-24.6c4.9-2.8 7.1-8.6 5.5-14-11.1-35.6-30-67.8-54.7-94.6-3.8-4.1-10-5.1-14.8-2.3L380.8 110c-17.9-15.4-38.5-27.3-60.8-35.1V25.8c0-5.6-3.9-10.5-9.4-11.7-36.7-8.2-74.3-7.8-109.2 0-5.5 1.2-9.4 6.1-9.4 11.7V75c-22.2 7.9-42.8 19.8-60.8 35.1L88.7 85.5c-4.9-2.8-11-1.9-14.8 2.3-24.7 26.7-43.6 58.9-54.7 94.6-1.7 5.4.6 11.2 5.5 14L67.3 221c-4.3 23.2-4.3 47 0 70.2l-42.6 24.6c-4.9 2.8-7.1 8.6-5.5 14 11.1 35.6 30 67.8 54.7 94.6 3.8 4.1 10 5.1 14.8 2.3l42.6-24.6c17.9 15.4 38.5 27.3 60.8 35.1v49.2c0 5.6 3.9 10.5 9.4 11.7 36.7 8.2 74.3 7.8 109.2 0 5.5-1.2 9.4-6.1 9.4-11.7v-49.2c22.2-7.9 42.8-19.8 60.8-35.1l42.6 24.6c4.9 2.8 11 1.9 14.8-2.3 24.7-26.7 43.6-58.9 54.7-94.6 1.5-5.5-.7-11.3-5.6-14.1zM256 336c-44.1 0-80-35.9-80-80s35.9-80 80-80 80 35.9 80 80-35.9 80-80 80z" class=""></path></svg>';
  settingsBtn.innerHTML = svg;
  settingsBtn.id = "toggleSettingsBtn";
  //settingsBtn.appendChild(document.createTextNode(svg));
  settingsBtn.href = "#";
  settingsBtn.onclick = ToggleSettingsModal;
  //hideBtn.parentNode.insertBefore(settingsBtn, hideBtn);
  hideBtn.parentNode.appendChild(settingsBtn);
  g_settingsBtnElement = settingsBtn;
}

function SetUp_DroppedHider_Styles()
{

  ToggleStyle(g_toggled);

  console.log("DroppedHider - Styles initilized");

}

function SetUp_DroppedHider()
{

// Start observing the target node for configured mutations
  observer.observe(targetNode, config);
  console.log("DroppedHider - Observer initilized");

}

function SetUp_Remaining(mutationList, observer)
{
  for (const mutation of mutationList)
    {
      if(document.getElementsByClassName("results chart")[0])
        {
          targetNode = document.getElementsByClassName("results chart")[0];
          SetUp_CreateHideButton();
          SetUp_CreateHideButtonSettings();
          SetUp_CreateHideButtonSettingsModal();
          SetUp_DroppedHider();
          observer.disconnect();
          return;
        }
    }

}
const mo = new MutationObserver(SetUp_Remaining);
if(!targetNode)
  {
    mo.observe(document.body, { attributes: false, childList: true, subtree: true });
  }
else
  {
    SetUp_CreateHideButton();
    SetUp_CreateHideButtonSettings();
    SetUp_CreateHideButtonSettingsModal();
    SetUp_DroppedHider();
  }

SetUp_DroppedHider_Styles();
