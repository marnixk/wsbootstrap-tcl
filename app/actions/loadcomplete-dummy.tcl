#
#	Callback called when initial load has been completed.
#
#	This is a dummy implementation of the wsbootstrap event that is sent when
#   the loading of all assets has been completed. If you need to do something useful
#   when the loading is complete, please override this action in your own projects.
#
namespace eval Action::load-complete {

	proc on-message {chan data} {
	}

}