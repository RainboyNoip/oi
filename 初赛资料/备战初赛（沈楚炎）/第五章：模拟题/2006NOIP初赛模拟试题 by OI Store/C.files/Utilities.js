////Copyright 2005, Upstartle LLC
////All rights reserved.

var docID = "";						//current docID we're editing

//This is mildly crufty - we need to be doing object detection instead of all of this
//browser detection stuff.
var userAgentStr = navigator.userAgent.toLowerCase();

//This check, in particular, needs to be better, since Opera likes to lie
var isIE = ((userAgentStr.indexOf("msie") != -1) && (userAgentStr.indexOf("opera") == -1) && (userAgentStr.indexOf("webtv") == -1))? true:false;
var oldIE = (userAgentStr.indexOf("msie 5.0") != -1) || (userAgentStr.indexOf("msie 4") != -1) || (userAgentStr.indexOf("msie 3") != -1);
var	isGecko = (userAgentStr.indexOf("gecko") != -1)? true:false;
var	isSafari = (userAgentStr.indexOf("safari") != -1)? true:false;

var allowSafari = false;
var allowCamino = true;
var	isCamino = (userAgentStr.indexOf("camino") != -1)? true:false;
if (isCamino && userAgentStr.indexOf("1.0") == -1)
	allowCamino = false;

var	isKonqueror = (userAgentStr.indexOf("konqueror") != -1)? true:false;

var listData;


var isOldSafari = isSafari;
if (isSafari)
{
	//Parse out the user string, look for the build number - anything above 412 is cool.
	var splits = userAgentStr.split('/');
	try {
	isOldSafari = parseInt(splits[splits.length-1]) < 412;
	}
	catch (e) { isOldSafari = true; } //Can't parse, assume the worst.
}


var dialogInfo = null;

var isUPWindow = true; //If this is present and true, the window is one of ours.

var inEditor = false;

var POST_TOKEN = "";
function getPostToken() {
  return POST_TOKEN;
}

function setPostToken(token) {
  POST_TOKEN = token;
}

function getPostTokenParam() {
  return "POST_TOKEN=" + getPostToken();
}

function rce(location, opt_message, opt_extra)
{
  var msg = "Unknown error";
  if (opt_message != null)
  {
	  msg = (typeof opt_message.opt_message != "undefined") ? (": msg=\"" + opt_message.opt_message + "\"") : opt_message;
	  msg = (typeof opt_message.number != "undefined") ? (msg + ", number=\"" + opt_message.number + "\"") : msg;
	}
	if (opt_extra != null)
	{
	  if (typeof opt_extra.document != "undefined" && typeof opt_extra.document.title != "undefined")
      msg += ", caller: \"" + opt_extra.document.title + "\""	;
    else if (typeof opt_extra.length != "undefined")
    {
      if (opt_extra.length > 0)
    	  msg += ", extra: " + opt_extra;
    }
  }

	if (RunningOnLocalServer())
	{
		alert("rce Called: " + location + " " + msg);
		return false;
	}

	location = location + "\nStack: " + Stack();
	asyncPOST("command=reportclienterror&function=" + encodeURIComponent(location) +
										"&message=" + encodeURIComponent(msg) +
										"&url=" + encodeURIComponent(window.location), "MiscCommands", null);
  return false;
}

function GetMashedURL(page, params)
{
	var paramString = "";
	if (params != "")
		paramString = "?" + params;

  if (location.host.indexOf("localhost") > -1)
  {
		if (location.host.indexOf("Prefactor") > -1)
			return "http://localhost:8180/Prefactor/" + page + paramString;
		else
			return "http://localhost:8180/Docster/" + page + paramString;
	}
	else
		return "http://" + location.host + "/" + page + paramString;
}

function getHomeURL()
{
	return GetMashedURL("/", "");
}

function NullOrMissing(thing)
{
	if (typeof thing == "undefined" ||
		thing == null ||
		thing == "")
		return true;

	return false;
}

function Prompt(msg, opt_def)
{
	var val = prompt(msg, (opt_def == null) ? "" : opt_def);
	if (val != null && val.length > 0)
		return val;
	return null;
}

function IsDefined(obj, field)
{
	return typeof (obj[field]) != "undefined";
}

// **************** Generic Messaging ************************
function ShowMessage(msg)
{
  SetNotice(msg);
	setTimeout(HideNotice, 1000);
}

function SetNotice(s)
{
	var div = document.getElementById("noticeDiv");
	div.innerHTML = "<nobr>" + s + "</nobr>";
}

function HideNotice()
{
}

function NewDocDlg()
{
	ShowDialog('Dialogs/NewDoc',
	  function(docTitle, docCoauthors)
	  {
	    if (docTitle != null)
		    createNewDoc(docTitle, docCoauthors, false, "");
	  }
	);
	return false;
}

function createNewDoc(docTitle, docAuthors, inThisWindow, prefix)
{
  asyncPOST("command=newDoc&title=" + encodeURIComponent(docTitle) +
            "&authors=" + encodeURIComponent(docAuthors), prefix + "/MiscCommands",
			      function (req, timedOut)
					{
  						if (ReqErrorAlert(req, timedOut)) return false;
						if (req.responseText.indexOf("errorNoLogin") != -1) { /*window.opener.location.reload(true);*/ return; }
						if (req.responseText != "")
						{
							if (inThisWindow)
							{
								window.location = getEditWindowURL(req.responseText, null, null, prefix);
								SizeWindow(640, 580);
							}
							else
								openEditWindow(req.responseText, null, null, prefix);
						}

					}, "openNewEditWindow");
	return false;
}

function PrintDocument(id) {
	url = "/View?revision=_latest&spi=1&hgd=1&docID=" + id;
	popupWindow(url, "Print_" + id, false);
}

function SizeWindow(width, height)
{
	if (isIE)
	{
    window.resizeTo(width, height);
    var dx = width - window.document.body.offsetWidth;
    var dy = height - window.document.body.offsetHeight;
    window.resizeBy(dx, dy);
    window.dialogHeight = (parseInt(window.dialogHeight) + dy) + "px";
    window.dialogWidth = (parseInt(window.dialogWidth) + dx) + "px";
	}
	else
	{
  	window.innerWidth = width;
    window.innerHeight = height;
	}

}

function getEditWindowURL(newDocID, revision, invitation, prefix)
{
if (newDocID == 0)
	{
	   rce("getEditWindowURL", "newDocID == 0");

		// asyncPOST("command=allocID", //flip the state
		// 	prefix + "UserMiscCommands",
		// 	 function (req, timedOut) { if (req == null || timedOut) return;  if (req.responseText != "") openEditWindow(req.responseText, revision, "", ''); }, "openNewEditWindow");
		//
		// return false; //Let the async deal with it.
	}

	var url = "";
	var revisionStr = "";

	if (revision != "" && revision != null)
		revisionStr = "&revision='" + revision + "'";

	if (newDocID == '0')
		url = prefix + '/?action=newdoc';
	else if (revisionStr != null && revisionStr != "")
		url = prefix + 'View?docid=' + newDocID + revisionStr;
	else
		url = prefix + 'Doc?id=' + newDocID;

	return url;
}

function openEditWindow(docID, revision, invitation, prefix)
{
	if (docID == 0)
	{
	   rce("openEditWindow", "docID == 0");

		// asyncPOST("command=allocID", //flip the state
		// 	prefix + "UserMiscCommands",
		// 	 function (req, timedOut) { if (req == null || timedOut) return;  if (req.responseText != "") openEditWindow(req.responseText, revision, invitation, ''); }, "openNewEditWindow");
		//
		// return false; //Let the async deal with it.
	}

	var url = getEditWindowURL(docID, revision, invitation, prefix);
	return popupWindow(url, "Editor_" + docID, false);
}

function ShowHelp()
{
  return popupWindow("/?action=faq", "HelpCenter", false);
}

//Return the folder part of the URL - everything before the last slash, with or without the last slash.
function folderOfURL(URLString, no_slash)
{
	return URLString.slice(0,URLString.lastIndexOf('/',URLString.length-(/\/$/.test(URLString)?2:0))+(no_slash?0:1));
}

var haveWarned = false;

function popupWindow(url, tag, simple) {
  try
  {
    var options = "";
    if (simple)
      options = 'toolbar=no,scrollbars=yes,directories=no,width=900,location=no,status=no,menubar=no,resizable=yes';

    // IE complains if the name contains spaces or periods
    tag = tag.replace(/\./g, "");
    tag = tag.replace(/ /g, "");
    var result = window.open(url,
        tag,
        options);
    if (result != null)
    {
      result.focus(); //Bring the window to the front
      return false;
    }

    //Can't popup, just reset the window location
    NavWindowToURL(url);
    return false;
  }
  catch (e)
  {
    try {

      //Mozilla will sometimes blow up opening a new window, because the URL is bad. So,
      //rebuild it here.
      var newURL = folderOfURL(location.href, false) + url;

      var result2 = window.open(newURL,
          tag,
          options);
    }
    catch (e)
    {
      //return true, hope the link works
      return true;
    }

    return false;
  }
}

// Called as:
// calculateOffsetLeft(_inputField)
// was ob
function calculateNodeLeftOffset(e){
  return GetNodeOffset(e,"offsetLeft");
}

// Called as:
// calculateOffsetTop(_inputField)
// Was Qb...
function calculateNodeTopOffset(e){
  return GetNodeOffset(e,"offsetTop");
}

function GetNodeOffset(node,attr)
{
	var totalOffset=0;
	while(node)
	{
		totalOffset += node[attr];
		node = node.offsetParent;
	}
	return totalOffset;
}

function calculateWidth(_inputField)
{
	if(navigator&&navigator.userAgent.toLowerCase().indexOf("msie")==-1)
		return _inputField.offsetWidth;
	else
		return _inputField.offsetWidth;
}

function setSearchCompleteDivSize(obj, anchorField, extraWidth)
{
	//var _inputField = document.getElementById("searchInput");

    obj.style.left = calculateNodeLeftOffset(anchorField)+"px";
    obj.style.top = calculateNodeTopOffset(anchorField)+anchorField.offsetHeight-1+"px";

    if (!isIE)
      obj.style.width = (calculateWidth(anchorField) + extraWidth) +"px";
}

function InitLoadedDiv(id, anchorField, extraWidth)
{
	var obj = document.getElementById(id);
	if (obj == null)
		{
		obj=document.createElement("DIV");
		obj.id = id;
		obj.style.border="#ACA899 1px solid";
		obj.style.zIndex="1000";
		obj.style.padding="0";

		setSearchCompleteDivSize(obj, anchorField, extraWidth);
		//obj.style.visibility="hidden";
		obj.style.position="absolute";
		obj.style.backgroundColor="white";
		obj.className = 'hiddenStyle';

		document.body.appendChild(obj);

		//Blug...this is for IE...SELECT tags and some other things are "windowed" controls and, thus,
		//don't respect z order, so the menu divs appear behind them. The solution is to use an 'iframe shim'
		//to cover up the select elements - this code creates the shim, and then code below sizes it to
		//the exact size of the DIV, right under it, and finally HideShownMenus hides it. Note that
		//we only make one of these, and we only make it when needed.
		if (isIE && document.getElementById("DivShim") == null)
		{
			var obj2 =document.createElement("iframe");
			obj2.id = "DivShim";
			obj2.src="javascript:false;";

			obj2.scrolling="no";
			obj2.frameborder="0";
			obj2.style.position = "absolute";
			obj2.style.top = "0px";
			obj2.style.left = "0px";
			obj2.style.display = "none";
			obj.style.zIndex="900";

			document.body.appendChild(obj2);
		}

	}
	return obj;
}

function HideMenuAndShim(menu)
{
  if (menu != null)
    SetLocation(menu, -1000, -1000, "px");

	if (isIE)
	{
		var shim = document.getElementById("DivShim");


		if (shim != null)
		{
		shim.style.display = "none";
		shim.style.height = "0px";
		}
	}


 lastMenuParent = null;
}


function ShowLoadedDiv(id, command, anchorField, extraWidth, callback, offsets)
{
	if (anchorField.value == "")
	{
		HideMenus();
		return;
	}
	var callbackWrapper;

	if (callback != null)
		callbackWrapper = function (req, timedOut) { if (req == null || timedOut) return;  callback(req, id, anchorField, extraWidth, offsets); };
	else
	{
	  ShowSearchStatus(anchorField, "searchStatusDiv");
		callbackWrapper = function (req, timedOut) { if (req == null || timedOut) return;  SearchResultsCallback(req, id, anchorField, extraWidth, offsets); };
	}

	asyncPOST(command, "UserMiscCommands", callbackWrapper, "showLoadedDiv" );
}

function ShowSearchStatus(opt_searchAnchorField, opt_div, opt_sty)
{
  var divEl = document.getElementById("searchStatusDiv");
  if (divEl == null) return;

  divEl.className = 'hiddenStyle';
  divEl = document.getElementById("searchStatusNoneDiv");
  divEl.className = 'hiddenStyle';

  if (opt_div != null)
  {
 	  divEl = document.getElementById(div);
		var sr = document.getElementById("searchInput");
    var offsets = getMenuOffsets(sr, false);
	  divEl.style.left = offsets.x;
    divEl.style.top = offsets.y + sr.offsetHeight;
		divEl.style.position = "absolute";
	  divEl.className = (opt_sty != null) ? opt_sty : 'app';
	}
}

//SearchAnchorField is the field object to align to (Dom node). SearchCompleteID is the
//string ID of the menu div to show. req is a request object that this is the completion proc for,
//and searchDivExtraWidth is extraWidth to give the div so it looks nice.
function SearchResultsCallback(req, searchCompleteID, searchAnchorField, searchDivExtraWidth, offsets)
{
	var obj = InitLoadedDiv(searchCompleteID, searchAnchorField, searchDivExtraWidth);

	if (req.responseText == "")
	{
		HideMenuAndShim(obj);
	  ShowSearchStatus(searchAnchorField, "searchStatusNoneDiv");
	}
	else
	{
	  ShowSearchStatus();
		obj.innerHTML = req.responseText;
		lastMenuParent = null; // So the menu will re-show, I think.

		if (ShouldShowMenu(searchAnchorField, true))
		  ShowMenu(searchAnchorField, searchCompleteID, "", true, offsets);
	}

}

var divToHide = null;

function HideDiv(divID)
{
	divToHide = document.getElementById(divID);
	setTimeout("HideDivCore();", 100);
}

function HideDivCore()
{
	if (divToHide == null)
		return;

	divToHide.style.visibility = 'hidden';
	divToHide = null;
}

function CheckRows(obj)
{
//WILLDO(snewman) - need to do real line count here - count the number of chars on the line, break at spaces,
//include crs in the count, etc.
	var desiredRows = Math.max(1, Math.round((obj.value.length +  obj.cols)/ obj.cols) + 1);
	if (obj.rows != desiredRows)
		obj.rows = desiredRows;
}

/********************* TIPS UTILITIES *****************************/

function ShowHideTips(a, v)
{
	asyncPOST("command=showhidetip&show=" + v + "&page=" + a, "UserMiscCommands", null);
  if (v == 0)
  {
    document.getElementById('Tip').style.display = "none";
    document.getElementById('TipShower').style.display = "";
  }
  else
  {
    document.getElementById('Tip').style.display = "";
    document.getElementById('TipShower').style.display = "none";
  }
}


/***************** POPUP MENUS **********************/

var idDoc = null;

function DocAction(action, newWindow, passedID, externalUrl)
{
  var docToUse = idDoc;

  if (typeof(externalUrl) != "undefined" && externalUrl != "") {
    popupWindow(externalUrl, "", false);
    return;
  }

  if (passedID && passedID != "")
    docToUse = passedID;

  if (!docToUse) {
    DebugAlert("Missing doc id in DocAction");
    return null;
  }

  var url = "Edit?tab=" + action + "&docid=" + docToUse;
  if (action == "pushsalesforce")
  {
    asyncPOST("command=pushsalesforce&docid=" + docToUse
        + "&finis=true", "UserMiscCommands", function (req, timedOut) {
      SFCompletion(req);
    });
    return null;
  }

  if (action == "archive" || action == "unarchive" || action == "copy")
    url = "/?action=" + action + "&docid=" + docToUse;
  else if (action == "preview")
    url = "View?docID=" + docToUse + "&revision=_latest";

  if (newWindow)
    return popupWindow(url, "Editor_" + docToUse, false);
  else
    this.location = url;

  return null;
}

function SFCompletion(req)
{
	if (req == null || req.responseText == null || req.responseText == "" )
		return; //just status

	if (req.responseText.indexOf("error") != -1)
		DebugAlert("Salesforce error: " + req.responseText);
	else
	{
		alert("Document Stored to Salesforce");
		ReloadDocLists(window);
	}
}

function getMenuOffsets(menuParent, opt_includeScroll)
{

	var o = menuParent;
	var result = {x: 0, y: 0};

	while (o != null)
	{
	  result.x += o.offsetLeft;
	  result.y += o.offsetTop;
	  if (opt_includeScroll)
	  {
	    result.x -= o.scrollLeft;
	    result.y -= o.scrollTop;
	  }
	  o = o.offsetParent;
	}

  try
  {
    var isRTEMenu = menuParent.className == "misspell" || menuParent.className == "writely-comment";
	  if (isRTEMenu)
	  {
	    result.x += calculateNodeLeftOffset(document.getElementById("wys_frame_parent"));
	    result.y += calculateNodeTopOffset(document.getElementById("wys_frame_parent"));
	  }
  }
  catch (e) {rce("getMenuOffsets", e); }

	return result;
}

var ignoreNextHide = false;
var lastMenu = lastMenuParent = null;
function ShouldShowMenu(menuParent, opt_dontHide)
{
  try {
    if (lastMenuParent == menuParent)
    {
      if (!opt_dontHide)
        HideMenu();
      return false;
    }
  } catch (ex) { rce("ShouldShowMenu", ex); }
  return true;
}

function ShowMenu(menuParent, idMenu, sDoc, useShim, offsets)
{

  try {
    if (!ShouldShowMenu(menuParent))
      return false;

    HideMenus();
	menuInitEvents();
    ignoreNextHide = true;

	  idDoc = sDoc;
	  lastMenuParent = menuParent;
	  lastMenu = document.getElementById(idMenu);

    var menuOffsets = getMenuOffsets(menuParent, (menuParent.tagName.toUpperCase() == "SPAN"));
    if (typeof offsets != "undefined" && offsets != null)
    {
	    menuOffsets.x += offsets.x;
	    menuOffsets.y += offsets.y;
    }

  	if (lastMenu.offsetParent != null)
  	{
  	  if (menuOffsets.x + parseInt(lastMenu.offsetWidth) - parseInt(lastMenu.offsetParent.scrollLeft) > parseInt(lastMenu.offsetParent.clientWidth))
  	    menuOffsets.x = (parseInt(lastMenu.offsetParent.clientWidth) - parseInt(lastMenu.offsetWidth));

  	  if ((menuOffsets.y + parseInt(menuParent.offsetHeight) + parseInt(lastMenu.offsetHeight) - parseInt(lastMenu.offsetParent.scrollTop) > parseInt(lastMenu.offsetParent.clientHeight)) &&
  	      (menuOffsets.y - parseInt(lastMenu.offsetHeight) - parseInt(menuParent.offsetHeight) >= 0))
  	      menuOffsets.y -= (parseInt(lastMenu.offsetHeight) + parseInt(menuParent.offsetHeight));
    }

	  lastMenu.style.left = menuOffsets.x;
    lastMenu.style.top = menuOffsets.y + menuParent.offsetHeight;
	  lastMenu.className = 'shownStyle';
  	lastMenu.style.zIndex = 100;

	  if (isIE && useShim)
	  {
		  var shim = document.getElementById("DivShim");
		  if (shim == null)
		  {
        shim = document.createElement("iframe");
        shim.id = "DivShim";
    		document.body.appendChild(shim);
		  }


			shim.style.width = lastMenu.offsetWidth;
			shim.style.height = lastMenu.offsetHeight;
      shim.style.top = lastMenu.style.top;
      shim.style.left = lastMenu.style.left;
      shim.style.zIndex = lastMenu.style.zIndex - 1;

      shim.style.position = "absolute";
      shim.style.display = "block";
	  }
	} catch (ex) { rce("ShowMenu", ex ); }
	return false;
}

function ShowMenuInPlace(menuParent, idMenu, sDoc, offsets, minWidth)
{
  try {
    HideMenus();
	menuInitEvents();

	  idDoc = sDoc;
	  lastMenuParent = menuParent;
	  lastMenu = document.getElementById(idMenu);

    if (parseInt(lastMenu.offsetWidth) > minWidth) // Freakin Gecko! Why isn't this sized correctly?
      minWidth = parseInt(lastMenu.offsetWidth);

  	if (lastMenu.offsetParent != null)
  	{
  	  if (offsets.x + minWidth - parseInt(lastMenu.offsetParent.scrollLeft) > parseInt(lastMenu.offsetParent.clientWidth))
  	    offsets.x = (parseInt(lastMenu.offsetParent.clientWidth) - minWidth);

  	  if (offsets.y + parseInt(lastMenu.offsetHeight) - parseInt(lastMenu.offsetParent.scrollTop) > parseInt(lastMenu.offsetParent.clientHeight))
  	    offsets.y = (parseInt(lastMenu.offsetParent.clientHeight) - parseInt(lastMenu.offsetHeight));
    }

	  lastMenu.style.left = offsets.x;
	  lastMenu.style.top = offsets.y;
	  lastMenu.className = 'shownStyle';
	} catch (ex) { rce("ShowMenu", ex); }
	return false;
}

function HideMenus(opt_force)
{
  if (!opt_force && ignoreNextHide)
  {
    ignoreNextHide = false;
    return;
  }

  if ((typeof floatingMenu != "undefined") && (floatingMenu != null))
  {
	  showHideElement(floatingMenu, 'hide', false);
	  floatingMenu = null;
  }

  ignoreNextHide = false;
  if (lastMenu != null)
  	SetLocation(lastMenu, -1000, -1000, "px");

  lastMenu = null;
  lastMenuParent = null;

  if (isIE)
  {
	  var shim = document.getElementById("DivShim");
	  if (shim != null)
		{
		shim.style.display = "none";
		shim.style.height = "0px";
		}
  }
}

function HideMenu()
{
  if (lastMenu != null)
    SetLocation(lastMenu, -1000, -1000, "px");

  lastMenu = null;
  lastMenuParent = null;

  if (isIE)
  {
	  var shim = document.getElementById("DivShim");
	  if (shim != null)
		{
		shim.style.display = "none";
		shim.style.height = "0px";
		}
  }
}

function showHideElement(element, showHide, rePosition){
	//function to show or hide elements
	//element variable can be string or object
	if(document.getElementById(element)){
		element = document.getElementById(element);
	}
	if(showHide == "show"){
		element.style.visibility = "visible";
	  if(rePosition){
		  element.style.position = "relative";
	    element.style.left = "auto";
	    element.style.top = "auto";
    }
	}else if(showHide == "hide"){
		element.style.visibility = "hidden";
    if(rePosition){
			element.style.position = "absolute";
    	element.style.left = "-1000px";
    	element.style.top = "-1000px";
	  }
  }
}


function getEventElement(event)
{
	if (event == null)
		return null;

	if (typeof(event.srcElement) != "undefined")
		return event.srcElement;
	else
		return event.target; //originalTarget
}

function setEventElementClass(event, newClass)
{
	if (typeof(event.srcElement) != "undefined")
		event.srcElement.className = newClass;
	else if (typeof(event.originalTarget) != "undefined")
		event["originalTarget"].className = newClass;
	else
		event.target.className = newClass;
}


function setCookie(name, value, opt_expires, opt_path, opt_domain, opt_secure)
{
    document.cookie= name + "=" + escape(value) +
        ((opt_expires) ? "; expires=" + opt_expires.toGMTString() : "") +
        ((opt_path) ? "; path=" + opt_path : "") +
        ((opt_domain) ? "; domain=" + opt_domain : "") +
        ((opt_secure) ? "; secure" : "");
}

function deleteCookie(name, path, domain)
{
    if (getCookie(name))
    {
        document.cookie = name + "=" +
            ((path) ? "; path=" + path : "") +
            ((domain) ? "; domain=" + domain : "") +
            "; expires=Thu, 01-Jan-70 00:00:01 GMT";
    }
}

function getCookie(name, opt_defValue)
{
    var dc = document.cookie;
    var prefix = name + "=";
    var begin = dc.indexOf("; " + prefix);
    if (begin == -1)
    {
        begin = dc.indexOf(prefix);
        if (begin != 0) return opt_defValue;
    }
    else
    {
        begin += 2;
    }
    var end = document.cookie.indexOf(";", begin);
    if (end == -1)
    {
        end = dc.length;
    }
    return unescape(dc.substring(begin + prefix.length, end));
}

//Select all the documents in the visible documents list on the page, or unselect them.
function SelectListDocs(checked)
{
	var cbs = document.body.getElementsByTagName("input");
	if (cbs != null)
	{
	  for (var i = 0; i < cbs.length; i++)
	  {
		  var cb = cbs[i];
		  if (cb.name.indexOf("list_cb") == 0)
        cb.checked = checked;
	  }
	}

	UpdateDocListBacks();
	HideMenus();
}

function SelectAllNone(checkbox) {
	SelectListDocs(checkbox.checked);
}

var lastEndpointID = "";

function ParseCheckID(str)
{
	return parseInt(str.replace("list_cb", ""));
}

function DocCheckClick(evt, checkBox)
{
  //Shift click, if we have an endpoint, extend to the endpoint and check or uncheck everything.
  if (evt.shiftKey && lastEndpointID != "")
  {
    var lastCheck = document.getElementById(lastEndpointID);
    var newCheck = checkBox.checked; //Already set by the time we get here.

    var checkInt = ParseCheckID(checkBox.id);
    var lastID = ParseCheckID(lastEndpointID);

    //Find the range.
    var start = (checkInt < lastID) ? checkBox.id : lastEndpointID;
    var end = (checkInt > lastID) ? checkBox.id : lastEndpointID;

    //Check whatever's in between.
    if (start != end)
    {
      var cbs = document.body.getElementsByTagName("input");
      if (cbs != null)
      {
        for (var i = 0; i < cbs.length; i++)
        {
          var cb = cbs[i];
          if (cb.name.indexOf("list_cb") == 0)
          {
            var newID = cb.ID;
            if (newID > start && newID < end)
              cb.checked = newCheck;
            else if (newID > end)
              break;
          }
        }
      }
    }
  }

  //Only set the endpoint on non-shift click, so multiple shift click to the same spot works right.
  if (!evt.shiftKey)
    lastEndpointID = checkBox.id;

  UpdateDocListBacks();
  HideMenus();
}

var checkedDocs = "";

function RestoreCheckedDocsAndBacks()
{
	if (checkedDocs == "")
		checkedDocs = getCookie("checkedDocs", "");

  var cbs = document.body.getElementsByTagName("input");
  if (cbs != null)
  {
    for (var i = 0; i < cbs.length; i++)
    {
      var cb = cbs[i];
		  if (cb.name.indexOf("list_cb") == 0)
      {
			  cb.checked = checkedDocs.indexOf(cb.value) != -1;
			  var row = GetEnclosingTag(cb, "table");
		    if (row != null) {
                row = GetEnclosingTag(row, "tr");
			    row.style.background = cb.checked ? "#FFFFCC" : "#ffffff";
             }
		  }
    }
  }
}

function UpdateDocListBacks()
{
	checkedDocs = "";

  var cbs = document.body.getElementsByTagName("input");
  if (cbs != null)
  {
    for (var i = 0; i < cbs.length; i++)
    {
      var cb = cbs[i];
		  if (cb.name.indexOf("list_cb") == 0)
		  {
		    var row = GetEnclosingTag(cb, "table");
		    if (row != null) {
                row = GetEnclosingTag(row, "tr");
			    row.style.background = cb.checked ? "#FFFFCC" : "#ffffff";
             }

		    if (cb.checked)
			    checkedDocs += "," + cb.value;
			}
    }
  }

	setCookie("checkedDocs", checkedDocs);
}


function ReplaceNode(node, newSrc)
{
	setOuterHTML(node, newSrc);

	/*
    if(newSrc != getOuterHTML(node))
    {


      var newNode;
      newNode = document.createElement("OBJECT");
      newNode.data = newSrc.substring(0,newSrc.indexOf('"'));
      newNode.innerHTML = node.innerHTML;
      node.parentNode.insertBefore(newNode,node);
      ret = true;
    }
    */
}


function FindElementsByClassName(inWindow, className, tagName)
{
	var found = new Array();
	var re = new RegExp('\\b'+className+'\\b', 'i');

	var rawList = inWindow.document.getElementsByTagName(tagName);

	for (var i = 0; i < rawList.length; i++)
	{
		if (rawList[i].className && rawList[i].className.search(re) != -1)
			found[found.length] = rawList[i];
	}

	return found;
}

/******************* DOCUMENT LISTS ****************************************/
//HACK - this could be in it's own file, only included when a page has a doc list.

//Index delta is 0 for the same offset, +1 to show the next page, and -1 to show the prev page.
function getDocListParams(docList, pageDirection, sortField, sortDirection)
{
	if (getAttribute(docList, "ListName") == null)
		return null;

	var listTag = "&ListTag=" + getAttribute(docList, "ListTag");
	//if (docList.ListTag != null && docList.ListTag != "")
	//	listTag += docList.ListTag;

	var sortParams = "";

	if (sortField == "")
		sortField = getAttribute(docList, "SortField");

	if (sortDirection == "")
		sortDirection = getAttribute(docList, "SortDirection");

	if (sortField != "" && sortField != null)
		sortParams += "&sortField=" + sortField;

	if (sortDirection != "" && sortDirection != null)
		sortParams += "&sortDirection=" + sortDirection;

	//WILLDO(snewman) better way to do this would be to iterate over all params and look for some prefix.
	 var result = "ShowHeader=" + getAttribute(docList, "ShowHeader") +
			"&Simple=" + getAttribute(docList, "Simple") +
			"&TableTitle=" + getAttribute(docList, "TableTitle") +
			"&StartingIndex=" + getAttribute(docList, "StartingIndex") +
			"&pageDirection=" + pageDirection +
			sortParams +
			"&ListName=" + getAttribute(docList, "ListName") +
			"&ListPageSize=" + getAttribute(docList, "ListPageSize") +
			"&docid=" + getAttribute(docList, "DocID") +
			listTag;

	return result;
}

function SetListCursor(cursor)
{
	var docLists = FindElementsByClassName(window, "doclist", "table");
	for (var i = 0; i < docLists.length; i++)
		docLists[i].style.cursor = cursor;
}

function MoveDocList(listName, pageDirection, startingIndex, increment, numDocs)
{
    var nextPrevHTML = null;
	if (startingIndex != null) {

		var endingIndex = Math.min(startingIndex + increment - 1, numDocs);
		startingIndex = (pageDirection == -1) ? Math.max(endingIndex - 2*increment + 1, 1) : endingIndex + 1;
		endingIndex = Math.min(startingIndex + increment - 1, numDocs);

	    nextPrevHTML = "";
		if (startingIndex != "1") {
			nextPrevHTML += "<a href=# onclick='MoveDocList(\"" + listName + "\", -1, " +
			    startingIndex + ", " + increment + ", " + numDocs + "); return false;' class=app>&#171; Prev</a>&nbsp;&nbsp;";
		}
		nextPrevHTML += "<b>" + startingIndex + " - " + endingIndex + "</b> of <b>" + numDocs + "</b>";
		if (endingIndex != numDocs) {
			nextPrevHTML += "&nbsp;&nbsp;<a href=# onclick='MoveDocList(\"" + listName + "\", 1, " +
			    startingIndex + ", " + increment + ", " + numDocs + "); return false;' class=app>Next &#187;</a>";
		}
	}

 	  var docLists = FindElementsByClassName(window, "maindoclist", "div");
      var recordLists = FindElementsByClassName(window, "doclist", "table");
	  for (var i = 0; i < docLists.length; i++)
		if (getAttribute(recordLists[i], "ListName") == listName) {
			ReloadDocList(docLists[i], recordLists[i], pageDirection, "", "", nextPrevHTML);
		}
}

function SortDocList(listName, sortField, sortDirection)
{
	try	{
  	  var docLists = FindElementsByClassName(window, "maindoclist", "div");
      var recordLists = FindElementsByClassName(window, "doclist", "table");
  
  	  for (var i = 0; i < docLists.length; i++)
  		if (getAttribute(recordLists[i], "ListName") == listName)
  			ReloadDocList(docLists[i], recordLists[i], 0, sortField, sortDirection);
	} catch (e) { DebugAlert(e);}
}

function ReloadDocList(theOuterList, theList, pageDirection, sortField, sortDirection, nextPrevHTML) {
	var docParams = getDocListParams(theList, pageDirection, sortField, sortDirection);
	if (docParams == null)
		return;

	var docListName = getAttribute(theList, "ListName");

	theList.style.cursor = "wait";
	asyncPOST("command=doclist&" + docParams,
				"UserMiscCommands",
				function (req, timedOut) { ReloadDocListCompletion(req, timedOut, theOuterList, theList, nextPrevHTML); }, "ReloadDocList_" + docListName );
}

function ReloadDocListCompletion(req, timedOut, theOuterList, theList,
                                 nextPrevHtml)
{
  if (ReqErrorAlert(req, timedOut)) return false;
  if (req == null || timedOut || req.responseText == "")
    return;

  theOuterList.innerHTML = req.responseText;
  RestoreCheckedDocsAndBacks();
  runJavascript(req.responseText);

  if (nextPrevHtml != null) {
    var nextPrev = document.getElementsByName("docListNextPrev");
    for (var i = 0; i < nextPrev.length; i++)
      nextPrev[i].innerHTML = nextPrevHtml;
  }

  theList.style.cursor = "default";
}

function runJavascript(responseText) {
  var ScriptFragment = '(?:<script.*?>)((\n|.)*?)(?:</script>)';

  var match = new RegExp(ScriptFragment, 'img');
  var scripts = responseText.match(match);

  if (scripts) {
    var js = '';
    for (var s = 0; s < scripts.length; s++) {
      var match = new RegExp(ScriptFragment, 'im');
      js += scripts[s].match(match)[1];
    }

    eval(js);
  }
}

function ReloadDocLists(inWindow)
{
	var docLists = FindElementsByClassName(inWindow, "maindoclist", "div");
    var recordLists = FindElementsByClassName(inWindow, "doclist", "table");

	for (var i = 0; i < docLists.length; i++)
		ReloadDocList(docLists[i], recordLists[i], 0, "", "");
}

/***************** TRICKS WITH TEXT AREAS **************************/

//Count the rows of a text area, including word wrap and hard line breaks, for the current cols.
function countRows(elementValue, columns)
{
	var hardLines = elementValue.split("\n");

	var lineCount = 0;

	//go through the hard lines, check for word wrap
	for( i=0; i < hardLines.length; i++)
		lineCount += Math.floor(hardLines[i].length/columns) + 1;

	return lineCount;
}

function adjustHeightForRows(element, evt)
{
	var newString = element.value;

	if (evt != null)
		{
		if (evt.keyCode == 13)
			newString += "\n";
		else if (evt.keyCode == 8)
			return; //Do it on key up...no scrollbar
		else
			newString += "X"; //Doesn't matter, mono font.
		}

	var newRows = countRows(newString, element.cols);

	if (!isIE)
		newRows = Math.max(1, newRows - 1);

	if (element.rows != newRows)
		element.rows = newRows;
}

/*********** OBJECT UTILS ************/

//Generic Event handler, cross browser.
function makeHandler(handler)
{
	return	function(evt, arg)
			{
				evt = (evt) ? evt : ((window.event) ? window.event : null);

				if (evt == null)
				{
					var wys_frame = GetWYSEditor();

					if (wys_frame)
						evt = wys_frame.event;
				}

				if (evt)
				{
					var target = (evt.target) ? evt.target : evt.srcElement;
					if (target)
						return handler(evt, target, arg);
				}
				return true;
			}
 }


function getAttribute(object, attrName)
{
	if (object.attributes[attrName] == null) {
		if (object.attributes[attrName.toLowerCase()] == null)
			return null;
		else
			return object.attributes[attrName.toLowerCase()].value;
	}

	return object.attributes[attrName].value;
}

function AddOrRemoveAttrib(table, v, s, test)
{
	if (test == true)
	{
    table.setAttribute(s, v, 0);
    return true;
  }
  else
  {
    table.removeAttribute(s);
    return false;
  }
}

function isNumber(n)
{
  if (n == null) return false;
  if (!IsDefined(n, "length")) return false;
  for (i = 0; i < n.length; i++)
    if (!isDigit(n.charAt(i)))
      return false;
  return true;
}

function isString(n)
{
  if (n == null) return false;
  if (!IsDefined(n, "length")) return false;
  return true;
}

function isDigit(n)
{
	if (n.length < 1)
	  return false;

	return ("1234567890".indexOf(n)!= -1);
}

 var _emptyTags = {
   "IMG":   true,
   "BR":    true,
   "INPUT": true,
   "META":  true,
   "LINK":  true,
   "PARAM": true,
   "HR":    true
};

//Note that we could just define the getter, but this seems more efficient, HTMLElement.prototype.__defineGetter__("outerHTML", function () {
/* alternate implementation - WILLDO(snewman) - review this, should use it.
function mozOuterHTML(node)
  {
  var str = '';
  switch (node.nodeType)
    {
    case Node.ELEMENT_NODE:
      str += '&lt;' + node.nodeName.toLowerCase();
      for (var i = 0; i < node.attributes.length; i++)
        {
        var attr = node.attributes.item(i);
        str += ' ' + attr.nodeName;
        str += '=' + '\"' + attr.nodeValue + '\"';
        }
      if ( !node.hasChildNodes && !node.hasAttributes )
        {  str += '/>';  }
      else
        {
        str += '>';
        str += mozInnerHTML(node);
        str += '&lt;/' + node.nodeName.toLowerCase() + '>';
        }
      break;
    case Node.TEXT_NODE:
      str += node.nodeValue;
      break;
    default:
      break;
    }
  return str;
  }
  */

function getOuterHTML(element)
{
   var attrs = element.attributes;
   var str = "<" + element.tagName;
   for (var i = 0; i < attrs.length; i++)
      str += " " + attrs[i].name + "=\"" + attrs[i].value + "\"";

   if (_emptyTags[element.tagName])
      return str + ">";

   return str + ">" + element.innerHTML + "</" + element.tagName + ">";
}

//Again, we could set this up as the setter, but this is faster. HTMLElement.prototype.__defineSetter__("outerHTML", function (sHTML) {

function setOuterHTML(element, newHTML)
{
	if ( typeof(element.outerHTML) != "undefined" )
		element.outerHTML = newHTML; //ie
	else if (element.ownerDocument.createRange) //mo
	{
		if (newHTML == "")
			element.parentNode.removeChild(element);
		else
		{
			var r = element.ownerDocument.createRange();
			r.setStartBefore(element);
			var df;
			if (typeof(r.createContextualFragment) != "undefined" )
				df = r.createContextualFragment(newHTML);
			else
				df = element.ownerDocument.createTextNode(newHTML);

			element.parentNode.replaceChild(df, element);
		}
	}
}

/*************** TABLES AND SELECTION *********************/

function GetWYSEditor()
{
	if(document.all)
		return  frames["wys_frame"];
	else
	{
		var editorBase = document.getElementById("wys_frame");
		if (NullOrMissing(editorBase))
			return null;

		return editorBase.contentWindow;
	}
}


//Find the first tag containing ofTag, of the given type.
function GetEnclosingTag(ofTag, targetType)
{
	var element = ofTag;
	targetType = targetType.toLowerCase();

	while (element)
	{
		if (element.tagName.toLowerCase() == targetType)
			return element;

		var temp = element.parentNode;

		if (temp == element)
			return null;

		element = temp;
	}
	return null;
}


//Call GetRTEObject().document to get the doc object, then call this.
function GetNodeContainingSel(inDocument, targetName)
{
	var sel = inDocument.selection.createRange();
	return GetEnclosingTag(sel.parentElement(), targetName);
}

/******** TYPEAHEAD *************************/

// Return the range of selected text in the given input tag.  We return
// an object with "start" and "end" properties, giving the character position
// of the selection start and end.  Line breaks are counted as one character,
// even if they are represented as CRLF in the tag's value.
//
// (NOTE snewman 6/14/05: tested only for <textarea>, but probably will work with <input
// type=text> as well.  I don't know what this will do if the input tag didn't have focus.)
function GetSelectionStartEnd(input)
	{
	if (typeof(input.selectionStart) != "undefined")
		{
		// Mozilla

		return {start: input.selectionStart, end: input.selectionEnd};
		}
	else if (typeof window.getSelection != "undefined" && GetWYSEditor() != null)
	{
		var oEditor = GetWYSEditor();

		var sel = oEditor.getSelection();
		var range = sel.getRangeAt(0);

		range = range.cloneRange();

		range.collapse(true);
		range.setStartBefore(oEditor.document.body.childNodes[0]);
		var kids = "";
		var rangeNode = range.extractContents();

		for (i=0;i<rangeNode.childNodes.length;i++)
			kids +=  rangeNode.childNodes[i].data;
	}
	else
		{
			// IE
			var range = document.selection.createRange().duplicate();
			try
			{
				range.moveToElementText(input);
				var controlStart = -range.moveStart("character", -10000000);

				range = document.selection.createRange().duplicate();
				var selStart = -controlStart - range.moveStart("character", -10000000);
				var selEnd   = -controlStart - range.moveEnd("character", -10000000);
				if (selStart < 0) selStart = 0;
				if (selEnd   < 0) selEnd   = 0;
				return {start: selStart, end: selEnd};
			}
			catch (e)
			{
				//If we blow up, assume the sel was at the start - this should be harmless.
				return {start: 0, end: 0};
			}
		}

	} // GetSelectionStartEnd


// Set the text selection range in the given input tag.  As with GetSelectionStartEnd,
// line breaks are counted as one character, even if represented as CRLF.
//
// (NOTE snewman 6/14/05: tested only for <textarea>, but probably will work with <input
// type=text> as well.  I don't know what this will do if the input tag didn't have focus.)
function SelectRange(input, start, end)
	{
	if (typeof(input.selectionStart) != "undefined")
		{
		// Mozilla
		input.selectionStart = start;
		input.selectionEnd   = end;
		input.focus();
		}
	else
		{		
		// IE
		var range = document.selection.createRange().duplicate();
		try
		{
		range.moveToElementText(input);
		range.collapse();
		range.move("character", start);
		range.moveEnd("character", end - start);
		range.select();
		} catch (e) {}
		}

	} // SelectRange

	var lastWasAlt = false;

function KeydownTypeahead(evt, input, completions)
{
	input.absorbKeyUp = false;

	// Sometimes we get keycode 17 then 18 instead of the ctrl events. So...if
	// that's the case, record it here, and the next keystroke will be unmodified.
	//
	// This code was added to resolve a problem entering the '@' symbol on German
	// keyboards -- Sam says, "Sometimes alt gr comes across as two separate
	// events, keycode 17 and 18, instead of a modifier on the actual keypress".
	if (evt.keyCode == 18 || evt.keyCode == 17)
	{
		lastWasAlt = true;
		return;
	}

	//If the last keystroke was an alt, just assume this one doesn't get messed with. This is
	//very imperfect - we can't really track the key up for some reason, so we just get the effect
	//for one key press.
	if (lastWasAlt)
	{
		lastWasAlt = false;
		return;
	}

	if ( evt.ctrlKey )
		return;

	var semicolon = (isIE) ? 186 : 59;
	var dash = (isIE) ? 189 : 109;

	if (evt.keyCode == 13 || evt.keyCode == 188 || evt.keyCode == semicolon)
		{
		// Line break, comma, or semicolon -- move caret to end of selection.
		var selRange = GetSelectionStartEnd(input);
		SelectRange(input, selRange.end, selRange.end);
		return;
		}


	var c = null;

	if (evt.altKey  && evt.keyCode == 81) //German AltGr+q is @. This goes first because it needs to block some later options
		c = "@";
	else if (evt.keyCode >= 65 && evt.keyCode <= 90)
		{
		// NOTE snewman 6/16/05: we're ignoring the Capslock key here.  I haven't been able
		// to find a way to get the state of the Capslock key.
		c = String.fromCharCode(evt.keyCode + ((evt.shiftKey) ? 0 : 32)); // uppercase or lowercase letter
		}
	else if (evt.keyCode >= 48 && evt.keyCode <= 57 && !evt.shiftKey)
		c = String.fromCharCode(evt.keyCode); // digit
	else if (evt.keyCode == 32)
		c = " ";
	else if (evt.keyCode == dash)
		c = (evt.shiftKey) ? "_" : "-";
	else if (evt.keyCode == 190 && !evt.shiftKey)
		c = ".";
	else if (evt.keyCode == 50 && (evt.shiftKey || evt.altKey ) ) //altGr, european, for this
		c = "@";


	// else
	// 	c = String.fromCharCode(evt.keyCode + ((evt.shiftKey) ? 0 : 32)); //Default, might be right

	if (c == null)
		return;

	// Letter, digit, or space.
	var selRange = GetSelectionStartEnd(input);
	var selStart = selRange.start;
	var selEnd   = selRange.end;

	var oldValue = input.value.replace(/\r\n/gi, "\r");
	var newValue = oldValue.substring(0, selStart) + c + oldValue.substring(selEnd);

	var match = null;

	// Find the start of the address containing the new insertion point.
	var addressStart = selStart+1;
	while (addressStart > 0 && !IsAddressDelimiter(newValue.charAt(addressStart-1)))
		addressStart--;
	while (addressStart < newValue.length && newValue.charAt(addressStart) == " ")
		addressStart++;

	if (addressStart < selStart+1)
	{
		// Check to see if the insertion point is at the end of an address (mod whitespace).
		// If not, we don't do autocomplete.
		var scanPos = selStart+1;
		while (scanPos < newValue.length && newValue.charAt(scanPos) == " ")
			scanPos++;

		if (scanPos >= newValue.length || IsAddressDelimiter(newValue.charAt(scanPos)))
			match = Complete(newValue.substring(addressStart, selStart+1), completions);
	}

	if (match != null)
	{
		var oldScrollTop = input.scrollTop;
		input.value = (oldValue.substring(0, selStart) + c + match.substring(selStart+1 - addressStart) + oldValue.substring(selEnd));
		input.scrollTop = oldScrollTop;
		SelectRange(input, selStart+1, addressStart + match.length);
	}
	else
	{
		input.value = newValue;
		SelectRange(input, selStart+1, selStart+1);
	}

	input.absorbKeyUp = true;
	stopEvent(evt);
}

function KeypressTypeahead(evt, input) { if (input.absorbKeyUp) stopEvent(evt); }
function KeyupTypeahead   (evt, input) { if (input.absorbKeyUp) stopEvent(evt); }

function SetCaretToEnd (control)
{
  if (control.createTextRange) {
    var range = control.createTextRange();
    range.collapse(false);
    range.select();
  }
  else if (control.setSelectionRange) {
    control.focus();
    var length = control.value.length;
    control.setSelectionRange(length, length);
  }
}

// Return true if the given character serves to separate entries in a typeahead
// e-mail field.
function IsAddressDelimiter(c)
	{
	return c == "\n" || c == "\r" || c == ";" || c == ",";
	} // IsAddressDelimiter


// If s is a prefix for one of the specified completion strings, return the first such
// completion string.  Otherwise return null.
function Complete(s, completions)
	{
	if (s == "")
		return null;

	for (i in completions)
		if (completions[i].indexOf(s) == 0)
			return completions[i];

	return null;
	}


function TrimString( theString )
{
   //   /            open search
   //     ^            beginning of string
   //     \s           find White Space, space, TAB and Carriage Returns
   //     +            one or more
   //   |            logical OR
   //     \s           find White Space, space, TAB and Carriage Returns
   //     $            at end of string
   //   /            close search
   //   g            global search

   return theString.replace(/^\s+|\s+$/g, "");
}


// Return a checksum for the given string, equivalent
// to the server-side method GeneralUtils.OldHash.
//
// WILLDO(snewman) 8/2/05: actually, this is probably too slow to use.  I'm not sure
// there's anything to be done about this, except not use checksums in JavaScript.
function Checksum(str)
{
	var hash=0;
	var len = str.length;
	for (var i=0; i<len; i++)
		hash = (hash<<3) + ((hash>>28) & 0x7FFFFFFF) + str.charCodeAt(i);

	return hash & 0x3FFFFFFF;
}



/*********** DOCUMENT TAGS *****************/

function SaveDocTags(element)
{
	var local_docID = getAttribute(element, "docID");
	if (element.value == "")
		return;

	asyncPOST("command=changetags&setTags=true&addtags=" + element.value + "&docid=" + local_docID, "UserMiscCommands",  null, "SaveDocTags_" + docID );
}

function InitDocTags()
{
	var textEdit = document.getElementById("docTags");
	textEdit.onblur = function () { SaveDocTags(this);  };

	if (isIE)
		textEdit.attachEvent("onkeydown", function (evt) {  adjustHeightForRows(textEdit,  evt);  });
	else
		textEdit.addEventListener("keydown", function (evt) {  adjustHeightForRows(textEdit,  evt);  }, true);

	textEdit.onkeyup = function (evt) {  adjustHeightForRows(this, null);  };

	adjustHeightForRows(textEdit, null);
}

//Some browsers have issues with various ways of doing this.
function NavWindowToURL(newURL)
{
		if (typeof location.assign == 'function')
			location.assign(newURL);
		else if (typeof location.replace == 'function')
			location.replace(newURL);
		else if (self.location.href)
			self.location.href = newURL;
		else
			window.location = newURL;
}

//If we never had an opener, or our opener is closed, open a new window
//and close this one. Otherwise, just close this one.
function ReloadOpener(goHome)
{
	try
	{

		var openerIsOurs = false;
		try { openerIsOurs = (	window.opener != null &&
								!window.opener.closed &&
								typeof window.opener.isUPWindow != "undefined" &&
								window.opener.isUPWindow != null);
		}
		catch (e) {} //Do nothing, we just couldn't get to the window - so it ain't ours.

		//For firefox, if you set it to open new windows in the same tab, this will be true.
		//In that case, we need to behave a little differently.
		var openerIsUs = window.opener == window;

		//If the opener is ours, no matter what, reload the doc lists if any.
		if (openerIsOurs && !openerIsUs)
		{

		if (window.opener.ReloadDocLists)
			window.opener.ReloadDocLists(window.opener);
		else
			window.opener.location.reload(true);
		}

		//If we're going home, but we don't have a valid opener, then load the home page into
		//our window, and return. If we try to close this window, we'll get a warning because a script
		//didn't open it. If the opener is us, again, don't close the window, just reload into it.
		if (goHome && (!openerIsOurs || openerIsUs) )
		{
			window.location.href = '/';
			window.name = "Writely";
			return; //Don't drop through, we don't want to close our window in this case.
		}

		//If we get to here, the window we're in is useless, so
		//close it if we're going home. The home page should exist and be valid.
		if (goHome )
		{

			if (!window.closed)
			{

				//Mozilla is really fragile here - you really, really don't want to close a window with a pending
				//request like this. Also, most of the time it just doesn't work. So, I wait a tenth of a second
				//before doing the close call, so we have time to get out of this callback. Since no further
				//trips to the server are happening on this request (this is the completion proc),
				//that should be more than enough time. SS 5 12 05
				if (isIE)
					window.close();
				else
					setTimeout( function () { window.close(); }, 100);
			}

			if (openerIsOurs && window.opener.closed) //Might have closed in the meantime
				window.opener.focus(); //Bring the opener to the front
		}


	}
	catch(e) {  rce("ReloadOpener", e); }
}


/************ EDITOR COMMON ************************/

var cancelRevision = "";			//The revision we would go back to, to cancel.
var notifyURL = "";					//Call this URL when we are done or cancel, if nonempty.

var gDownloadDocPage = "RawDocContents"; // Page where we send fetch-document requests; initialized by C# code
var gPostbackDocPage = "RawDocContents"; // Page where we send document postbacks; initialized by C# code


function SetCancelRevision(newValue) { cancelRevision = newValue; }

//These are common things to both the HTML editor and the design editor - keyboard handlers, post back routines,
//etc. Note that an editor has to be named "wys_frame" to be found here, typically.

//This section could be in a different JS file if this file gets too big. It only needs to be around during either
//of the editors.
function SwitchToTab(newTab, inDocID_notused, lsr, extra)
{
	//Don't switch to the new tab until we've saved changes, we get weird effects in the
	//view page, etc if you do this. If we don't have unsaved changes, just switch.
	var completion = function ()
					{
					leavePageButtonClicked = true;

					var cancelRevParam = "";
					var lastSeenRevParam = "";
					var notifyURLParam = "";

					if (cancelRevision != "")	cancelRevParam = "&cancelRevision=" + cancelRevision;
					if (notifyURL != "")		notifyURLParam = "&notifyURL=" + notifyURL;

					if (extra == null) extra = "";
					location.href="Edit?tab=" + newTab + "&docid=" + docID + cancelRevParam + notifyURLParam +lastSeenRevParam + extra;
					};

	// NOTE snewman 8/2/05: we always call PostEditorContents here.  It's not
	// cool to bypass it and go straight to the completion function, because
	// there might be other things going on, such as an earlier postback that's
	// still in progress.  PostEditorContents is smart enough to skip the server
	// transaction if we don't really need it.
	//
	// if (!EditorHasPendingChanges(-1))
	// 	completion();
	// else
	if (!inEditor) {
		var msg = MiscEditorWindowClosing();
		if (msg != null)
			if (!confirm(msg))
				return;
		completion();
	} else
		PostEditorContents(false, true, false, completion, false);
}



function stopEvent(evt)
{

	if (evt.preventDefault)
	{
		evt.preventDefault();
		evt.stopPropagation();
	}
	else
	{
		// NOTE snewman 6/14/05: this line was tripping a permissions error in IE for
		// autocomplete text fields, and it doesn't seem to be necessary, so I'm
		// commenting it out.
		//
		// evt.keyCode = 0;

		evt.cancelBubble = true;
		evt.returnValue = false;
	}
}

function GetSafeEvent(event)
{
	if (event)
		return event;

	if (window.event)
		return window.event;

	var oEditor = GetWYSEditor();

	if (oEditor)
		return oEditor.event;

	return null;
}

function DebugAlert(msg)
{
	if (RunningOnLocalServer())
		alert(msg);
	else
		rce("DebugAlert", msg );
}




function Stack()
{
	var result = "";
	var curParent = Stack;
	try
	{
	while (curParent != null)
	{
		var raw = curParent.toString();
		var firstParen = raw.indexOf("(");
		if (firstParen != null)
			raw = raw.substring(0, firstParen);

		result += "" + raw + "(";

		if (IsDefined(curParent, "arguments"))
			for (var i=0; i < curParent.arguments.length; i++)
			{
				var curArg = curParent.arguments[i].toString();
				if (curArg.length > 100)
					curArg = curArg.substring(0, 100);

				result += curArg;
				if (i < curParent.arguments.length-1)
					result += ", ";
			}

		result += ")\n";

		if (curParent.caller == curParent)
			break;

		curParent = curParent.caller;
	}
	}
	catch (e)
	{

	}

	return result;
}

function DebugAssert(cond, msg)
{
	if (cond) return;

	DebugAlert(msg);
}

function RunningOnLocalServer() { if (typeof onLocalServer == 'undefined') return false; return onLocalServer; }

function InstallHook(doc, evt, fcn, capture)
{
  try {
    if (IsDefined(doc, "attachEvent"))
		  doc.attachEvent("on"+evt, function(event) { fcn(event); });

    else if (IsDefined(doc, "addEventListener"))
      doc.addEventListener(evt, fcn, capture);
    else
      rce("InstallHook", "No way to attach event");
  } catch (ex) { rce("InstallHook", ex); }
}

function RemoveHook(doc, evt, fcn, capture)
{
  try {
    if (IsDefined(doc, "detachEvent"))
		  doc.detachEvent("on"+evt, function(event) { fcn(event); });

    else if (IsDefined(doc, "removeEventListener"))
      doc.removeEventListener(evt, fcn, capture);
    else
      rce("RemoveHook", "No way to detach event");
  } catch (ex) { rce("RemoveHook", ex); }
}

//The browsers are really weird about JS code in a link that's created via inserting HTML...this creates
//a link string, including the A tag, that works right in both.
function MakeDynamicJSLink(jsCode, title, extraParams)
{
	if (isIE)
		return "<a href=x onclick='" + jsCode + " return false' " + extraParams + " >" + title + "</a>";
	else
		return "<a href='javascript:" + jsCode + "' " + extraParams + " >" + title + "</a>";
}

function ReportReturnNull(l, m, opt_p, opt_n)
{
  if (opt_p != null && opt_p.length > 0) m += opt_p;
  if (opt_n != null) m += ": " + opt_n.tagName.toLowerCase();
  rce(l, m);
  return null;
}

function UpToTag(nodeorpath, tag, opt_altTag)
{
  try {
    if (nodeorpath == null) return ReportReturnNull("UpToTag", "nodeorpath is null");
    var node = (typeof(nodeorpath.length) == "undefined") ? nodeorpath : nodeorpath[0];

    while (true)
    {
      if (node == null) return ReportReturnNull("UpToTag", "node is null in while", path, null);
      if (!IsDefined(node, "tagName")) return ReportReturnNull("UpToTag", "tagName is undefined in while", path, null);
      if (node.tagName == null) return ReportReturnNull("UpToTag", "node.tagName is null in while", path, null);
      if (!IsDefined(node, "parentNode")) return ReportReturnNull("UpToTag", "parentNode is undefined in while", path, node);
      if (node.parentNode == null) return ReportReturnNull("UpToTag", "node.parentNode is null in while", path, node);
      if (node.tagName.toLowerCase() == tag) return node;
      if (opt_altTag != null && node.tagName.toLowerCase() == opt_altTag) return node;
      if (node.tagName.toLowerCase() == "body") return null;

      node = node.parentNode;
  	}
  } catch (ex) { rce("UpToTag", ex, "Can't go up to '" + tag + "'."); }

  return null;
}

/************************** ShowDialog **********************************/
var gData = null;
function ShowEditorDialog(dlgUrl, opt_okCallback, opt_cancelCallback, opt_debugOn)
{
  dlgUrl += (dlgUrl.indexOf("?") < 0) ? "?" : "&";
	dlgUrl += 'DocID=' + DocID;

  ShowDialogInternal(dlgUrl, GetWYSEditor(), opt_okCallback, opt_cancelCallback, opt_debugOn);
}

function ShowDialog(dlgUrl, okCallback, cancelCallback, debugOn)
{
  ShowDialogInternal(dlgUrl, null, okCallback, cancelCallback, debugOn);
}

function ShowDialogInternal(dlgUrl, oEditor, okCallback, cancelCallback) {
  gData = new Object();
  gData.Opener = window;
  gData.WYSIWYGEditor = oEditor;
  gData.okCallback = okCallback;
  gData.cancelCallback = cancelCallback;

  HideMenus();
  ShowWorkingDiv("Working...");
  SetSize(document.getElementById("appDlgBgSep"),
          parseInt(document.body.clientWidth),
          parseInt(document.body.clientHeight), "px");
  document.getElementById("appDlgBgSep").style.display = "";
  document.getElementById("appDlgFrame").src = dlgUrl;
}

function FixUpEmptyParas(oEditor)
{
	if (!isIE) return false;
  if (typeof(oEditor.document.body.getElementsByTagName) == "undefined") return false;
  if (typeof(oEditor.document.body.innerHTML) == "undefined") return false;

	var patched = false;
	var paras = oEditor.document.body.getElementsByTagName("p");
	if (paras != null && paras.length > 0)
	{
	  for (var i = 0; i < paras.length; i++)
	  {
	    var p = paras[i];
	    if (p.innerHTML == " " || p.innerHTML == "" || p.innerHTML == "\r\n")
	    {
	      p.innerHTML = "&nbsp;";
	      patched = true;
	    }
	  }
	}
	return patched;
}

function ShowHideCombos(show, opt_doc)
{
  var comboList = opt_doc.getElementsByTagName("SELECT");
	for (var i = 0; i < comboList.length; i++)
	  comboList[i].style.display = (show) ? "" : "none";
}

function SafeFocus(c)
{
  try { c.focus(); } catch (ex) { return false; } return true;
}

var MsgBoxTitle;
var MsgBoxCaption;
var MsgBoxText;
var MsgBoxWidth;
var MsgBoxHeight;
function ShowMiscTextBox(text, caption, title, dx, lines)
{
  MsgBoxCaption = caption;
  MsgBoxText = text;
  MsgBoxTitle = title;
  MsgBoxWidth = dx;
  MsgBoxLines = lines;
  ShowEditorDialog('Dialogs/MiscTextBox');
}

function SetSize(element, dx, dy, unit)
{
  try {
	if (element.style) element = element.style;
	if (dx >= 0) element.width = dx + unit;
	if (dy >= 0) element.height = dy + unit;
  } catch (e) {rce("SetSize", e); }
}

function SetLocation(element, x, y, unit)
{
  try {
	if (element.style) element = element.style;
	element.position = "absolute";
	element.zIndex = 1000;
	element.left = x + unit;
	element.top = y + unit;
  } catch (e) {rce("SetLocation", e); }
}

function ReqErrorAlert(req, timedOut)
{
  if (req == null || timedOut)
  {
    alert(MSG_UNABLE_TO_CONNECT_TO_SERVER);
    return true;
  }
  else if (IsErrorMsg(req.responseText))
  {
   alert(GetErrorMsg(req.responseText));
   return true;
  }

  return false;
}

function IsErrorMsg(msg)
{
  if (msg == null) return false;
  return msg.indexOf("Error:") == 0;
}

function GetErrorMsg(msg)
{
  if (msg == null) return "";
  var errMsg = msg;
  if (errMsg.indexOf("Error:") == 0)
    errMsg = errMsg.substring("Error: ".length);
  if (errMsg.indexOf("<!DOCTYPE") > -1)
   	errMsg = errMsg.substring(0, errMsg.indexOf("<!DOCTYPE"));
  return errMsg;
}

/************************** Ranges *****************************/

function FocusToNode(node)
{
  var oRTE = GetWYSEditor();
  if (oRTE.document.createRange)
  {
    var range = oRTE.document.createRange();
    range.setStart(node, 0);
    range.setEnd(node, 0);
    var selection = GetWYSIWYGSelection();
    selection.removeAllRanges();
    selection.addRange(range);
  }
  else
  {
    var range = oRTE.document.body.createTextRange();
	  range.moveToElementText(node);
    range.collapse();
    range.select();
  }
  return false;
}

function SelectNode(node, opt_index, opt_offsetFromEnd)
{
  var oRTE = GetWYSEditor();
  if (oRTE.document.createRange)
  {
    var range = oRTE.document.createRange();
    range.selectNodeContents(node);
    var selection = GetWYSIWYGSelection();
    selection.removeAllRanges();
    selection.addRange(range);
  }
  else
  {
    var range = oRTE.document.body.createTextRange();
	  range.moveToElementText(node);
    range.select();
  }

  if (opt_offsetFromEnd != null)
    moveRange(true, opt_offsetFromEnd);

  return false;
}

function GetSelRanges()
{
	var oRTE = GetWYSEditor();
	var selRanges;
	if (isIE)
		selRanges = GetIESelRanges();
	else if (isSafari)
		selRanges = GetSafariSelRanges();
	else
		selRanges = GetGeckoSelRanges();
  return selRanges;
}

function IsSelectionInNode(node)
{
  var selRange = GetSelRanges();
  if (selRange == null) return false;

  var rangeNode = selRange.selStartNode;
  return rangeNode == node;
}

function AdjustDocIfLastNode(oRTE, node)
{
  if (node == null) return;
  if (node.parentNode == oRTE.document.body)
  {
    if (node.nextSibling == null || !IsDefined(node.nextSibling, "tagName") || node.nextSibling.tagName == null)
    {
      var newNode = oRTE.document.createElement("br");
		  oRTE.document.body.appendChild(newNode);
    }
  }
}

/////////////////////////// Menus //////////////////////////////////

function menuMakeTable(w) {
	return "<table border=0 cellpadding=0 cellspacing=0 class=menu_table " +
           w + ">";
}

function menuMakeTableEnd() {
  return "</table >";
}

function menuMakeRow(strText, strOnClick, strAccel, cb) {
	var img = "";
	if (cb == "on")
		img = "<img border=0 class=menu_cb src=\"/images/blankdot.gif\" width=7><img border=0 class=menu_cb src=\"/images/checkmark.gif\">"
	else if (cb = "off")
		img = "<img border=0 class=menu_cb src=\"/images/blankdot.gif\">"

	return menuMakeRowImg(strText, strOnClick, strAccel, img);
}

function menuMakeRowImg(strText, strOnClick, strAccel, img) {
	return "<tr class=menu_row_unsel name=menu_row todo=\"" + strOnClick + "\">" +
	       "<td>" + img + "</td>" + "<td class=menu_cell><nobr>&nbsp;" + strText +
           "&nbsp;</nobr></td><td class=menu_accel><nobr>&nbsp;" + strAccel +
           "</nobr></td></tr>\r\n";
}

function menuMakeLabelRow(strText) {
	return "<tr class=menu_row_unsel><td class=menu_label colspan=3><nobr>&nbsp;" +
           strText + "&nbsp;</nobr></td></tr>\r\n";
}

function menuMakeIndentedLabelRow(strText) {
  return "<tr class=menu_row_unsel><td>&nbsp;</td>" +
         "<td class=menu_label colspan=2><nobr>&nbsp;" + strText +
         "&nbsp;</nobr></td></tr>\r\n";
}

function menuMakeSep() {
	return "<tr><td class=menu_sep_cell colspan=3><div class=menu_sep_div>" +
           "<img border=0 src=\"/images/blankdot.gif\" width=1 height=1></div>" +
           "</td></tr>\r\n";
}

function menuInitEvents() {
  var rr = FindElementsByClassName(this, "menu_row_unsel", "TR");

  for (var i = 0; i < rr.length; i++) {
    if (rr[i].className == "menu_row_unsel") {
      rr[i].onmouseover = menuOver;
      rr[i].onmouseout = menuOut;
      rr[i].onmousedown = menuDown;
      rr[i].onmouseup = menuUp;
      rr[i].onclick = menuUp;
    }
  }
}

function menuOver() { this.className = "menu_row_sel"; }
function menuOut() { this.className = "menu_row_unsel"; }
function menuUp(evt) { stopEvent(evt); return false; }
function menuDown(evt) { 
  HideMenus();
  eval(this.getAttribute("TODO"));
  stopEvent(evt);
  return false; 
}

// **************** Status *****************************
var ErrorMsg = null;
function ShowSavingDiv() {
  ShowWorkingDiv("Saving...");
}

function HideSavingDiv() {
  HideWorkingDiv();
}

function ShowWorkingDiv(str) {
  if (typeof(str) == "undefined" || str == null || str == "")
    str = "Working...";
  var div = document.getElementById("savingDiv");
  if (div != null) {
    div.innerHTML = str;
    div.className = 'visibleStatus';
    div.style.left = div.offsetParent.clientWidth - div.clientWidth;
  }
}

function HideWorkingDiv() {
  var div = document.getElementById("savingDiv");
  if (div != null) {
    div.className = 'hiddenStatus';
  }
}

function SetResult(s, optStyle, optTimeout)
{
  HideStatus();
  var div = document.getElementById("noticeDiv");
  if (div == null) return;

  div.innerHTML = "";

  if (s.indexOf("<nobr>" < 0))
    s = "<nobr>" + s + "</nobr>";
  div.innerHTML = s;

  if (typeof optTimeout != "undefined")
    setTimeout(HideNotice, optTimeout);
}

function UpdateNotice(req)
{
  //alert("in UpdateNotice");
  if (req != null)
  {
    if (req.responseText == null)
      HideStatus();
    else
    {
      var msg = req.responseText;
      if (msg.indexOf(" at ") == msg.length - " at ".length)
      {
        var d = new Date();
        msg += d.toLocaleTimeString();
      }

      SetResult(msg, "savedNotice");
    }
  }
}

function UpdateStatus(req)
{
  HideStatus();
  UpdateNotice(req);
}

function HideStatus()
{
  HideSavingDiv();
  HideWorkingDiv();
}

function RefreshScreen()
{
  window.location.reload(true);
}

function InError(req)
{
  if (req != null)
  {
    if (IsErrorMsg(req.responseText))
    {
      HideStatus();
      var msg = (ErrorMsg == null) ? GetErrorMsg(req.responseText) : ErrorMsg;
      alert(msg);
      ErrorMsg = null;
      return true;
    }
  }
  ErrorMsg = null;
  return false;
}

function UpdateStatusIfNoError(req)
{
  if (!InError(req))
    UpdateStatus(req);
}

function UpdateOrRefresh(req, tab)
{
  //alert(Tab + ", " + tab);
  if (Tab == tab)
    RefreshScreen();
  else
    UpdateStatus(req);
  return true;
}

function newListRow(id, name, isWritelyDoc, tags, actions) {
  listData.newRow(id, name, isWritelyDoc, tags, actions)
}

function redirectToLogin() {
	window.location.href = "/?action=home";
}