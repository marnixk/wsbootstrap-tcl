proc app'load-page {chan page} {
	set payload [create LoadPage {
		page $page
	}]
	Websocket::send-message $chan [jsonrpc'message "load-page" $payload]
}

proc app'start {} {
	global config
	files'add-context "[pwd]/../public"
	HttpServer::start $config(wsport)
}