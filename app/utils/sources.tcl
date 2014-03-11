proc source'glob-r {{dir .} ext} {
 	
 	lappend res

    set sorted_list [lsort [glob -nocomplain -dir $dir *]]

    foreach file $sorted_list {

        if {[file type $file] == "directory"} {
        	foreach child [source'glob-r $file $ext] {
        		lappend res $child
        	}
        } else {
        	if {[file ext $file] == ".$ext"} then {
	            lappend res $file 
        	}
        }
    }


    return $res
}


#
# load all source files specified 
#
proc source'load {folders} {
	global _autoreload_sources

	foreach folder $folders {
		set files [source'glob-r $folder "tcl"]

		foreach file $files {
			puts ".. autoloading $file"
			file stat $file info
			set _autoreload_sources($file) $info(mtime)
			source "$file"
		}

	}
}


proc source'reload! {} {
	global _autoreload_sources

	foreach file [array names _autoreload_sources] {
		file stat $file info
		if { $_autoreload_sources($file) != $info(mtime) } then {
			set _autoreload_sources($file) $info(mtime)
			puts "Detected change in $file .. reloading!"
			source $file
		}
	}
}