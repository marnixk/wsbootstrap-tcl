#
#	A resource bundle contains information about the resources that
#	are supposed to be loaded when the application starts. 
#
#	page: the start page
#	styles: a list of CSS file locations
#	javascripts: a list of JS file locations
#	templates: an array of templates
#
struct ResourceBundle {
	page val
	styles list
	javascripts list
	templates array
}


struct LoadPage {
	page val
}