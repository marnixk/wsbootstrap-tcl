wsbootstrap
===============

TCL Websocket bootstrap library that tightly integrates Angular with the websocket implementation that can be found here: 

Multi-module http server implementation: `https://github.com/marnixk/httpserver-tcl`
Websocket addon for httpserver: `https://github.com/marnixk/websocket-tcl` that takes care of json-rpc communication between client and server over websocket..
    
The bootstrapper is able to receive instructions on how to build rich client-side applications using AngularJS. An example application bundle would look something like this:

    # application bundle definition

    array set config {

        development-mode true

        styles {
            "//netdna.bootstrapcdn.com/bootstrap/3.1.1/css/bootstrap.min.css"
            "//netdna.bootstrapcdn.com/bootswatch/3.1.1/lumen/bootstrap.min.css"
            "//netdna.bootstrapcdn.com/font-awesome/4.0.3/css/font-awesome.min.css"

            "/stylesheets/style.css"
        }

        javascript {
            "//code.jquery.com/jquery-2.1.0.min.js"
            "//netdna.bootstrapcdn.com/bootstrap/3.1.1/js/bootstrap.min.js"
            "//ajax.googleapis.com/ajax/libs/angularjs/1.2.14/angular.min.js"
            "//cdnjs.cloudflare.com/ajax/libs/underscore.js/1.6.0/underscore-min.js"
            "//cdnjs.cloudflare.com/ajax/libs/underscore.string/2.3.3/underscore.string.min.js"
        }

        start-page "nickname"
        wsport 8080

    }

    app'start

The `app'start'` command fires up the http server with websocket extensions. When someone loads index.html (found in this module), it will load up `wsbootstrap.js` which connects to its host on the `jsonrpc` websocket URI and will receive instructions on loading up the bundle above. 

