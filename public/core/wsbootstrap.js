(function(undefined) {

	var actions = {};
	var appView = null;
	var templates = {};

	// ------------------------------------------------------------------------------------
	// 		External facing methods
	// ------------------------------------------------------------------------------------

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

	window.sendMessage = function(action, payload) {
		ws.send(
			JSON.stringify({
				action: action,
				payload: payload
			})
		);
	};

	window.wsBoot = function(host, view) { 

		if (!("WebSocket" in window)) {
			alert("Websocket not supported by your browser, this application cannot run");
			return;
		}

		appView = view;

	    // Let us open a web socket
		window.ws = new WebSocket(host, ["chat"]);
		ws.onopen = function() {};
		ws.onmessage = messageDispatcher;
		ws.onclose = function() {};

	}

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

		if (data.status && data.status === "error") {
			console.error("An error occured: " + data.error);
			console.log(data);
			return;
		}

		if (!data.action) {
			console.log("Has no action, cannot process, offending message below");
			console.log(data)
			return;
		}

		if (!actions[data.action]) {
			console.log("No action registered for " + data.action + ", ignoring message.");
			console.log(data);
			return;
		}

		for (var idx = 0; idx < actions[data.action].length; ++idx) {
			actions[data.action][idx](data.payload);
		}	
	}

	// ------------------------------------------------------------------------------------
	//     Implementation of load resources action
	// ------------------------------------------------------------------------------------

	(function(actions, undefined) {

		registerAction("script", function(data) {
			eval("(function(undefined){" + data.content + "})()");
		});

		/**
		 * Load resources action OOTB action that helps render 
		 * @param  {[type]} data [description]
		 * @return {[type]}      [description]
		 */
		registerAction("load-resources", function(data) {

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
		});

		/**
		 * Loads a page onto the screen and reinitializes angular.
		 */
		registerAction("load-page", function(data) {

			// page to load?
			if (data.page) {
				if (templates[data.page]) {
					
					// replace content
					var content = templates[data.page];
					document.getElementById("app").innerHTML = content;
					
					// initialize.
					if (jQuery) {
					 	$("body").trigger("load-complete");
					}
				}
				else {
					console.error("No template to load for page called `" + data.page + "`")
				}
			}

		});
		

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

	})(actions);

	wsBoot("ws://localhost:1337/ws/jsonrpc", document.getElementById("app"));

})();
