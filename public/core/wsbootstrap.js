var debugEnabled = false;

//
// M""MMMMMMMM                            dP    MP""""""`MM   dP                                                
// M  MMMMMMMM                            88    M  mmmmm..M   88                                                
// M  MMMMMMMM .d8888b. .d8888b. .d8888b. 88    M.      `YM d8888P .d8888b. 88d888b. .d8888b. .d8888b. .d8888b. 
// M  MMMMMMMM 88'  `88 88'  `"" 88'  `88 88    MMMMMMM.  M   88   88'  `88 88'  `88 88'  `88 88'  `88 88ooood8 
// M  MMMMMMMM 88.  .88 88.  ... 88.  .88 88    M. .MMM'  M   88   88.  .88 88       88.  .88 88.  .88 88.  ... 
// M         M `88888P' `88888P' `88888P8 dP    Mb.     .dM   dP   `88888P' dP       `88888P8 `8888P88 `88888P' 
// MMMMMMMMMMM                                  MMMMMMMMMMM                                        .88          
//                                                                                             d8888P          

/**
 * Simple implementation of local storage session interface
 */
(function() {

	window.LS = {

		/**
		 * Determine whether the local storage API is available or not
		 * 
		 * @return true if it is available
		 */		
		available : function() {
			try {
				return 'localStorage' in window && window['localStorage'] !== null;
			} 
			catch (e) {
				return false;
			}		
		},


		/**
		 * Set a new value with the JSON version of the data object
		 * 
		 * @param {string} name Is the name to store this value under
		 * @param {string} data Is the data to store
		 */
		set : function(name, data) {
			if (!LS.available()) {
				console.error("localStorage is not available in this browser");
				return;
			}
			var before = LS.get(name);
			localStorage.setItem(name, JSON.stringify(data));
		},

		/**
		 * Get the unserialized version of the value that is stored at 'name'. Returns
		 * null when there is nothing to unserialize.
		 * 
		 * @param  {string} name Is the name to retrieve
		 * @return {object} an object or null when the key does not exist.
		 */
		get : function(name) {
			if (!LS.available()) {
				console.error("localStorage is not available in this browser");
				return;
			}
			var serialized = localStorage[name];
			if (!serialized) {
				return null;
			}
			return JSON.parse(localStorage[name]);
		},

		/**
		 * Delete a key from the local storage
		 */
		delete : function(name) {
			if (!LS.available()) {
				console.error("localStorage is not available in this browser");
				return;
			}

			if (typeof(name) === "undefined") {
				localStorage.clear();
			}
			else {
				localStorage.removeItem(name);
			}
		},

		/**
		 * Return the length of the local storage
		 */
		length : function() {
			return localStorage.length;
		},

		/**
		 * Iterate over each element in the local storage. The itfun is of 
		 * the following signature: function(key, value) {}
		 */
		each : function(itfun) {
			for (var idx = 0; idx < LS.length(); ++idx) {
				var key = localStorage.key(idx);
				var val = LS.get(key);

				itfun(key, val);
			}
		}

	};

})();

//
// M#"""""""'M                      dP              dP                              
// ##  mmmm. `M                     88              88                              
// #'        .M .d8888b. .d8888b. d8888P .d8888b. d8888P 88d888b. .d8888b. 88d888b. 
// M#  MMMb.'YM 88'  `88 88'  `88   88   Y8ooooo.   88   88'  `88 88'  `88 88'  `88 
// M#  MMMM'  M 88.  .88 88.  .88   88         88   88   88       88.  .88 88.  .88 
// M#       .;M `88888P' `88888P'   dP   `88888P'   dP   dP       `88888P8 88Y888P' 
// M#########M                                                             88       
//

(function(undefined) {

	var actions = {};
	var appView = null;
	var templates = {};
	var observables = {};
	var observerHistory = [];
	var msgCallbackById = {};
	var wsMsgId = 0;
	var offline = true;



	//          dP          dP                dP 
	//          88          88                88 
	// .d8888b. 88 .d8888b. 88d888b. .d8888b. 88 
	// 88'  `88 88 88'  `88 88'  `88 88'  `88 88 
	// 88.  .88 88 88.  .88 88.  .88 88.  .88 88 
	// `8888P88 dP `88888P' 88Y8888' `88888P8 dP 
	//      .88                                  
	//  d8888P  

	window.isOnline = function() {
		return !offline;
	};

	window.goOffline = function() {
		offline = true;
		if (debugEnabled) {
			console.log("Going offline");
		}
	};

	window.goOnline = function() {
		offline = false;
		if (debugEnabled) {
			console.log("Going online");
		}
	}

	window.loadPage = function(name) {
		if (templates[name]) {
			
			// replace content
			var content = templates[name];
			document.getElementById("app").innerHTML = content;
			
			// initialize.
			if (jQuery) {
			 	$("body").trigger("load-complete");
			}
		}
		else {
			console.error("No template to load for page called `" + name + "`")
		}
	}



	window.getTemplate = function(name) {
		return templates[name];
	};

	window.getAllTemplates = function() {
		return templates;
	};

	window.registerAction = function(action, func) {
		if (!actions[action]) {
			actions[action] = [];
		}
		actions[action].push(func);
	};

	window.sendMessage = function(action, payload, callback) {

		if (!isOnline()) {
			if (debugEnabled) {
				console.error("Cannot send `" + action + "`, application is in offline mode");
			}
			return;
		}

		var thisMsgId = ++wsMsgId;

		if (callback) {
			msgCallbackById[thisMsgId] = {
				id : thisMsgId,
				func : callback
			};
		}

		ws.send(
			JSON.stringify({
				id : thisMsgId,
				action: action,
				payload: payload
			})
		);
	};


	// ------------------------------------------------------------------------------------
	// 		Dispatch incoming messages
	// ------------------------------------------------------------------------------------

	/**
	 * Dispatches messages to one or more actions registered on the address
	 * of the 'action' attribute's name.
	 * 
	 * @param  {Event} evt is an event with json information to parse
	 * @return {void}     
	 */
	function messageDispatcher(evt) {
		var data = null;

		try {
			data = JSON.parse(evt.data);
		}
		catch (ex) {
			console.error("Could not parse: " + evt.data);
			return;
		}

		// is this an error message?
		if (data.status && data.status === "error") {
			console.error("An error occured: " + data.error);
			console.log(data);
			return;
		}

		// is this a response message?
		if (typeof(data['respond-to']) !== "undefined") {
			var callbackDesc = msgCallbackById[data['respond-to']];
			if (callbackDesc) {
				callbackDesc.func(data);
				delete msgCallbackById[data['respond-to']];
			}
			else {
				console.error("Response lost as no callback was registered, application error?");
				console.log(data);
			}

			return;
		}

		// should be an action message
		if (!data.action) {
			console.log("Has no action, cannot process, offending message below");
			console.log(data)
			return;
		}

		// action doesn't exist?
		if (!actions[data.action]) {
			console.log("No action registered for " + data.action + ", ignoring message.");
			console.log(data);
			return;
		}

		// call everything that is registered to handle this action
		for (var idx = 0; idx < actions[data.action].length; ++idx) {
			actions[data.action][idx](data.payload);
		}	
	}


	/**
	 * Start observing a certain information source and tie it to a scoped variable.
	 */
	window.observe = function(name, scope, varname) {
		if (!observables[name]) {
			observables[name] = [];
		}

		observables[name].push(function(val, name) {
			scope[varname] = val;
			scope.$apply();
		});

		// lets see if there is stuff we can pawn off to this new observer.
		var untouchedHistory = [];
		for (var idx = 0; idx < observerHistory.length; ++idx) {

			// oo! we can rerun this on the newly registered observer.
			if (observerHistory[idx].name == name) {

				scope[varname] = observerHistory[idx].value;

				// run apply in next scheduled break.
				setTimeout(function() { scope.$apply(); }, 0);
			}
			else {
				untouchedHistory.push(observerHistory[idx]);
			}
		}

		observerHistory = untouchedHistory;
	};



	// MP""""""`MM   dP                       dP      MMP"""""""MM                   
	// M  mmmmm..M   88                       88      M' .mmmm  MM                   
	// M.      `YM d8888P .d8888b. 88d888b. d8888P    M         `M 88d888b. 88d888b. 
	// MMMMMMM.  M   88   88'  `88 88'  `88   88      M  MMMMM  MM 88'  `88 88'  `88 
	// M. .MMM'  M   88   88.  .88 88         88      M  MMMMM  MM 88.  .88 88.  .88 
	// Mb.     .dM   dP   `88888P8 dP         dP      M  MMMMM  MM 88Y888P' 88Y888P' 
	// MMMMMMMMMMM                                    MMMMMMMMMMMM 88       88       
	//                                                             dP       dP       

	window.wsBoot = function(host, view) { 

		if (!("WebSocket" in window)) {
			alert("Websocket not supported by your browser, this application cannot run");
			return;
		}

		appView = view;

		// call some proce
		window.addEventListener("online", function() {
			goOnline();
		});

		window.addEventListener("offline", function() {
			goOffline();
		});

	    // Let us open a web socket if we're in online mode
		if (window.navigator.onLine) {
			window.ws = new WebSocket(host, ["chat"]);
			ws.onopen = function() {};
			ws.onmessage = messageDispatcher;
			ws.onclose = function() {};
			offline = false;
	    }
	    else {
	    	var data = LS.get("app-resources");
	    	if (!data) {
	    		alert("Cannot load the application in offline mode if it hasn't been loaded before");
	    		return;
	    	}
	    	else {
	    		loadApplicationResources(data);
	    		goOffline();
	    	}

	    }

	}

	// ------------------------------------------------------------------------------------
	// 		Resource loading related functions
	// ------------------------------------------------------------------------------------


	function loadApplicationResources(data) {

		// load styles one by one
		if (data.styles) {
			for (var idx = 0; idx < data.styles.length; ++idx) {
				loadStylesheet(data.styles[idx]);
			}
		}

		// load in sequence
		if (data.javascripts) {
			loadJavascript(data.javascripts[0], data.javascripts, 1);
		}

		if (data.templates) {
			templates = data.templates;
		}

		// page to load?
		if (data.page) {
			if (templates[data.page]) {
				var content = templates[data.page];
				document.getElementById("app").innerHTML = content;
			}
			else {
				console.error("No template to load for page called `" + data.page + "`")
			}
		}
		
	}

	function loadStylesheet(url) {
		var head = document.getElementsByTagName("head")[0];
		var link = document.createElement("link");
		
		link.type = "text/css";
		link.rel = "stylesheet";
		link.href = url;

		head.appendChild(link);
	}

	/**
	 * Load a javascript, after it's done loading, render another javascript
	 * until the list of javascripts has been completely loaded.
	 * 
	 * @param  {String} url        	the url to render
	 * @param  {array} list       	the list with all urls
	 * @param  {integer} next_index the next index
	 */
	function loadJavascript(url, list, next_index) {
		var script = document.createElement("script");
		var body = document.getElementsByTagName("body")[0];

		script.onload = function() {
			if (next_index < list.length) {
				setTimeout(function() { 
					loadJavascript(list[next_index], list, next_index + 1);
				}, 0);
			}
			else {
				$("body").trigger("load-complete", []);
				sendMessage("load-complete", {});
			}
		};

		script.type = "text/javascript";
		script.src = url;

		body.appendChild(script);
	}



	// ------------------------------------------------------------------------------------
	//     Implementation of load resources action
	// ------------------------------------------------------------------------------------

	// MMP"""""""MM            dP   oo                            
	// M' .mmmm  MM            88                                 
	// M         `M .d8888b. d8888P dP .d8888b. 88d888b. .d8888b. 
	// M  MMMMM  MM 88'  `""   88   88 88'  `88 88'  `88 Y8ooooo. 
	// M  MMMMM  MM 88.  ...   88   88 88.  .88 88    88       88 
	// M  MMMMM  MM `88888P'   dP   dP `88888P' dP    dP `88888P' 
	// MMMMMMMMMMMM                                               
                                                 

	registerAction("script", function(data) {
		eval("(function(undefined){" + data.content + "})()");
	});

	/**
	 * Load resources action OOTB action that helps render 
	 * @param  {[type]} data [description]
	 * @return {[type]}      [description]
	 */
	registerAction("load-resources", function(data) {
		LS.set("app-resources", data);
		loadApplicationResources(data);
	});

	/**
	 * Loads a page onto the screen and reinitializes angular.
	 */
	registerAction("load-page", function(data) {

		// page to load?
		if (data.page) {
			loadPage(data.page);

		}

	});

	registerAction("observable-update", function(data) {

		if (observables[data.name]) {
			for (var idx = 0; idx < observables[data.name].length; ++idx) {
				var notifyMe = observables[data.name][idx];
				notifyMe(data.value, data.name);
			}
		} else {
			observerHistory.push(data);
		}

	});


	// boot the application
	wsBoot("ws://" + document.location.host + "/ws/jsonrpc", document.getElementById("app"));
})();
