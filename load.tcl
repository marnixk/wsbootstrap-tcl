package provide wsbootstrap 1.0

puts ">> Loading Websocket Bootstrap web archive"

set pkg_dir [file dirname [info script]]

source "$pkg_dir/app/actions/startup.tcl"
source "$pkg_dir/app/actions/autoreload.tcl"
source "$pkg_dir/app/actions/loadcomplete-dummy.tcl"

source "$pkg_dir/app/utils/sources.tcl"
source "$pkg_dir/app/utils/files.tcl"
source "$pkg_dir/app/utils/application.tcl"

files'add-context "$pkg_dir/public"

