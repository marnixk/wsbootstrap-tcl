
#
#   Send information about the resources that should be loaded when someone
#   connects to this application bundle.
#
namespace eval Wsbootstrap::Startup::application-resource-bundle {

	jsonrpc'has-on-connect-callback

	proc on-connect {chan} {
		global config

		array set templates [find-templates "../public/html/"]
		set rel_scripts [find-files "../public/" "js"]

		set scripts [list]

		# base library scripts
		foreach js $config(javascript) {
			lappend scripts $js
		}
		
		# local app bundle scripts
		set base_url "/"
		foreach script $rel_scripts {
			lappend scripts $script
		}

		set templatelist [array get templates]
		set bundle [create ResourceBundle {
			styles $config(styles)
			javascripts $scripts
			page $config(start-page)
			templates $templatelist
		}]

		Websocket::send-message $chan [jsonrpc'message "load-resources" $bundle]

	}

}

