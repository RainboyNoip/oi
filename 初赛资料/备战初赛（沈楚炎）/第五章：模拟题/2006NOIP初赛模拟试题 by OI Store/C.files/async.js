////Copyright 2004-2005, Upstartle LLC
////All rights reserved. 

//private
function GenericCallback(req)
{
    if (req.readyState == 4 && req.status == 200)
        return true;
        
    return false; 
}

function InitActiveXObject(startingReq, desiredVersion)
{
	if (startingReq != null)
		return startingReq;
		
	try 
	{ return new ActiveXObject("MSXML2.XMLHttp.3.0"); }
	catch (e)
	{ return null; }

}

//private - Don't call this yourself! Let the get or post call handle it! 
function InitializeAsync(FinalizeCallback)
{
	var req = null; 
	req = InitActiveXObject(req, "MSXML2.XMLHttp.4.0"); 
	req = InitActiveXObject(req, "MSXML2.XMLHttp.3.0"); 
	req = InitActiveXObject(req, "MSXML2.XMLHttp.2.0"); 
	req = InitActiveXObject(req, "MSXML2.XMLHttp"); 
	req = InitActiveXObject(req, "Microsoft.XMLHttp"); 
	
    if(req == null && typeof XMLHttpRequest != "undefined")
        req= new XMLHttpRequest();
	
	if (req == null)
		return null; 
		
    //req.onreadystatechange = Process;
    if (FinalizeCallback != null)
    {
		req.onreadystatechange =  function () 
									{ 
										var aborted = false;
										try {
											aborted = (req.readyState == 4 && req.status == 0); 
											} 
											catch (ex) 
											{ 
											//Mozilla gets an exception throw here - you abort the thread, it calls
											//the readystatechange as part of the abort, and you're not 
											//allowed to look at the status field. So, if we get one
											//just assume the request is aborted.
											aborted = true; 
											}
										
										if (GenericCallback(req) || (aborted) ) 
										{ 
										
										if (!aborted)
											FinalizeCallback(req, false);
										
										//Note that this is not just a simple detach call. IE has a bug where 
										//it'll crash if we detach in the middle of this routine. So, we need to 
										//delay a tiny bit, to get out of here, before we do the detach. Without 
										//this, IE crashes badly. 
										setTimeout( function () { 
										//Get rid of circular reference leaks
										//Sometimes we see a readyState of 0 here, as though the object was being 
										//reused. So, to be on the safe side, dont clear the handler in that case. 
											if (req.readyState == 4)
												req.onreadystatechange = foofunc;
											}, 10);
										}  
									} 
	
		//CheckRequest(req, FinalizeCallback);
	}
	
	return req;
}

function foofunc() {}

var requestCache = new Object();

function asyncPOST(data, passedURL, opt_FinalizeCallback, opt_RequestName)
{
	// Append a "finis=true" parameter to the data section.
	// The server uses this to detect incomplete postbacks.
   if (data == "")
		data = "finis=true";
	else
		data += "&finis=true";
	
	data += "&" + getPostTokenParam();
	
	//Mozilla has a bug with the async calls from a different window - the reply object is all trashed 
	//up in this case. The solution to this is to just use a closure here with a 0 ms delay. 
	setTimeout( function () {  AsyncPOSTCore(data, passedURL, opt_FinalizeCallback, opt_RequestName); }, 0);
}


function requestIsPending(requestName)
{
	return (typeof requestCache[requestName] != "undefined" && 
			requestCache[requestName] != null && 
			requestCache[requestName].readyState != 4);
}

//private - call AsyncPOST instead
function AsyncPOSTCore(data, passedURL, FinalizeCallback, RequestName)
{
	//alert("AsyncPOSTCore: " + data);
	var step = 0;
	try
	{
	step = 1;
	if (typeof requestCache[RequestName] != "undefined" && requestCache[RequestName] != null)
	{
		step = 2;
		//Kill the identical request. 
		var local = requestCache[RequestName]; 
		step = 3;
		requestCache[RequestName] = null;
		step = 4;
		try { local.abort(); } catch (e1) {} //just in case
		step = 5;
	}
	
	step = 6;
	var req = InitializeAsync(FinalizeCallback);
	step = 7;
	requestCache[RequestName] = req; 
	step = 8;
	
    req.open("POST", passedURL, true);
	 step = 9;
    req.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8');
	 step = 10;
    //xmlhttp.setRequestHeader('Content-Type', 'text/xml; charset=UTF-8');

    //req.setRequestHeader("content-type", "text/xml");
	//req.setRequestHeader("content-length", data.length); 
	
    req.send(data);
    
	 step = 11;
	 
    setTimeout (function () { 
					if (typeof requestCache[RequestName] != "undefined" && requestCache[RequestName] != null)
					{
						if (req != null && 
						    typeof(req.status) != "undefined" && 
						    typeof(req.status) != "unknown") {
							if (req.status == 302) {
								// If we get a redirect response, then there's nothing more we can usefully
								// do at this location.  We have to reload and let the main window redirect.
								leavePageButtonClicked = true;
								window.location.reload();
							} else if (req.status == 12029) {
								// IE doesn't let us see the 302 status, we get this weird 12029 value
								// instead.  There may be other errors that lead to the same status code,
								// so we can't safely reload the window.
								alert("We are unable to contact the server, so your changes to this document cannot be saved.\n\nPlease close this window and try re-opening the document before editing further.");
							}
						}
						//Check for completion
						if (	requestCache[RequestName] == req && 
							   ( req.readyState != 4 || 
							     req.status != 200) )
							     FinalizeCallback(null, true);
					}
				}, 30000);
    }
    catch (e)
	{
		if (data.indexOf("command=reportclienterror") >= 0)
		{
			if (RunningOnLocalServer())
				alert(msg);
		}
		else
			rce("AsyncPOST"+step, "passedURL: " + passedURL + " RequestName: " + RequestName + " exception: " + e); 
		
		requestCache[RequestName] = null;
	}
}

function asyncGET( url, FinalizeCallback)
{
	setTimeout( function () {AsyncGETCore(url, FinalizeCallback, true); }, 0);
}

//private - call AsyncGET instead
function AsyncGETCore( url, FinalizeCallback, async)

{
    try
	{
		var req = InitializeAsync(FinalizeCallback);
		
        req.open("GET", url, async);
        req.send(null);
    }
	catch (e)
	{
		rce("AsyncPOST", "url: " + url + " exception: " + e); 
	}
}
   
