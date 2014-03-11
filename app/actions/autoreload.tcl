#
#	When development mode is set to true we will want to reload the automagically loaded
# 	sources when new user connects. Won't trigger in production mode.
#
namespace eval Wsbootstrap::reload-sources {

	jsonrpc'has-on-connect-callback

	proc on-connect {chan} {
		global config

		if { $config(development-mode) == "true" } then {
			source'reload!
		}
	}
}