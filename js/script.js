var nameTranslations = {
	personnel : {	// this key must match name in DB
		displayName : 'Personnel',
		columnsList : {
			// all below keys must match name in DB
			firstName: 'First Name',
			lastName: 'Last Name',
			jobTitle: 'Job Title',
			email: 'E-mail',
			department: 'Department',
			location: 'Location'
		}
	},
	department : {	// this key must match name in DB
		displayName : 'Departments',
		columnsList : {
			// all below keys must match name in DB
			name: 'Name',
			location: 'Location'
		}
	},
	location : {	// this key must match name in DB
		displayName : 'Locations',
		columnsList : {
			// all below keys must match name in DB
			name: 'Name'
		}
	},
}

var localRecords;
var dataTable;

function recordDetailsAtDesktopClose() {
	// close profile at Desktop
	$('#personnelAtDesktop').removeClass('d-md-block');
	$('#departmentAtDesktop').removeClass('d-md-block');
	$('#locationAtDesktop').removeClass('d-md-block');
	recalculateContentHeight();
}

function displayRecordsDetails(records){

	// show button for Mobile
	$('#showRecordsBtnM').removeClass('d-none');
	
	// combine records if more than one selected
	var recordCombined = {};
	var messageForMultipleEntries = '...multiple entries...';
	// copy first record as-is
	for (var key in records[0]) {
		recordCombined[key] = records[0][key];
	}
	// compare with remainings records
	records.forEach(function(record) {
		for (var key in record) {
			if (recordCombined[key] != messageForMultipleEntries) {
				if (recordCombined[key] != record[key]) {
					recordCombined[key] = messageForMultipleEntries;
				}
			}
		}
	});

	// update DOM with record details
	switch (localRecords.table) {
		case 'personnel': {
			var container = $('#personnelAtDesktop');
			container.children('#recordId').text(recordCombined.DT_RowId);
			container.children('#firstName').text(recordCombined[0]);
			container.children('#lastName').text(recordCombined[1]);
			container.children('#jobTitle').text(recordCombined[2]);
			container.children('#email').text(recordCombined[3]);
			container.children('#department').text(recordCombined[4]);
			container.children('#location').text(recordCombined[5]);
			// show profile, but only if Desktop
			container.addClass('d-md-block');
			// Mobile
			container = $('#personnelAtMobile .modal-content .modal-body');
			container.children('#recordId').text(recordCombined.DT_RowId);
			container.children('#firstName').text(recordCombined[0]);
			container.children('#lastName').text(recordCombined[1]);
			container.children('#jobTitle').text(recordCombined[2]);
			container.children('#email').text(recordCombined[3]);
			container.children('#department').text(recordCombined[4]);
			container.children('#location').text(recordCombined[5]);	
		} break;
		case 'department': {
			var container = $('#departmentAtDesktop');
			container.children('#recordId').text(recordCombined.DT_RowId);
			container.children('#name').text(recordCombined[0]);
			container.children('#location').text(recordCombined[1]);
			// show profile, but only if Desktop
			container.addClass('d-md-block');
			// Mobile
			container = $('#departmentAtMobile .modal-content .modal-body');
			container.children('#recordId').text(recordCombined.DT_RowId);
			container.children('#name').text(recordCombined[0]);
			container.children('#location').text(recordCombined[1]);
		} break;
		case 'location': {
			var container = $('#locationAtDesktop');
			container.children('#recordId').text(recordCombined.DT_RowId);
			container.children('#name').text(recordCombined[0]);
			// show profile, but only if Desktop
			container.addClass('d-md-block');
			// Mobile
			container = $('#locationAtMobile .modal-content .modal-body');
			container.children('#recordId').text(recordCombined.DT_RowId);
			container.children('#name').text(recordCombined[0]);
		} break;
	}
	recalculateContentHeight();
}

function selectRecords(selectionType) {
	// update selection in local records
	// and optionaly build array of selected records
	var selectedRecords = [];
	localRecords.data.forEach(function(record) {
		switch(selectionType) {
			case 'all' :{
				record['checked'] = true;
			} break;
			case 'none' :{
				record['checked'] = false;
			} break;
			case 'inverse' :{
				if ('checked' in record) {
					// if key exist
					if (record.checked) {
						// and set true, then change to false
						record['checked'] = false;
					} else {
						// and set false, then change to true
						record['checked'] = true;
					}
				} else {
					// key does not exist, then assume false and change to true
					record['checked'] = true;
				}
				// build array of selected records
				if ('checked' in record) {
					if (record.checked) {
						selectedRecords.push(record);
					}
				}
			} break;
		}
	});

	// update checkbox's
	$('#content table tbody').children('tr').each(function () {
		var td = this.children[1];
		var div = $(td).children('div')[0];
		var checkbox = $(div).children('input')[0];
		localRecords.data.forEach(function(record) {
			if (record.id == checkbox.id) {
				checkbox.checked = record.checked;
			}
		});
	});

	// decide how to update display
	switch(selectionType) {
		case 'all': {
			recordDetailsAtDesktopClose();
		} break;
		case 'none': {
			recordDetailsAtDesktopClose();
		} break;
		case 'inverse' : {
			if (selectedRecords.length > 0) {
				displayRecordsDetails(selectedRecords);
			} else {
				recordDetailsAtDesktopClose();
			}
		} break;
	}

}

function generateTable(records) {
	
	// determine columns list
	var columnsList = nameTranslations[records.table].columnsList;
	
	// define columns titles
	var tableHead = $("<thead></thead>");
	var columnsTitles = $("<tr></tr>");
	for (var key in columnsList) {
		columnsTitles.append($("<th></th>").text(columnsList[key]).attr("scope", "col"));
	};
	tableHead.append(columnsTitles);

	// define table body
	var tableBody = $("<tbody></tbody>");
	records.data.forEach(function(element) {
		// define row
		var row = $("<tr></tr>").attr('id', element.id);
		// main data
		for (var key in columnsList){
			row.append($('<td></td>').text(element[key]));
		}
		tableBody.append(row);
	});

	// load head and body to table
	var table = $("<table></table>").attr("class", "table table-hover");
	table.append(tableHead);
	table.append(tableBody);
	return table;
}

function getSelectedRecords(dt) {
	var data = dt.rows( { selected: true } ).data();
	var selectedRecords = [];
	for (var key in data) {
		var item = data[key];
		if (Array.isArray(item) && 'DT_RowId' in item) {
			selectedRecords.push(item);
		}
	}
	return selectedRecords;
}

function displayRecordsList(records) {
	// hide modals, which shows record details
	recordDetailsAtDesktopClose();
	// hide button for Mobile
	$('#showRecordsBtnM').addClass('d-none');

	var table = generateTable(records);
	$('#content').html('').append(table);
		
	dataTable = $('#content > table').DataTable({
		paging: false,
		responsive: true,
		scrollY: 300,
		scrollCollapse: true,
		colReorder: true,
		select: {
			style: 'multi+shift',
		}
	})
	.on('select', function (e, dt, type, indexes) {
		// update DOM with selected record details
		displayRecordsDetails(getSelectedRecords(dt));
	})
	.on('deselect', function (e, dt, type, indexes) {
		if (getSelectedRecords(dt).length > 0) {
			// update DOM with selected record details
			displayRecordsDetails(getSelectedRecords(dt));
		} else {
			// hide modals, which shows record details
			recordDetailsAtDesktopClose();
			// hide button for Mobile
			$('#showRecordsBtnM').addClass('d-none');
		}
		
	});
	
	recalculateContentHeight();

	$('#tableSelectionDropdown > a').text(nameTranslations[records.table].displayName);
}

function getRecords(selectedTable){
	// request all records
	$.ajax({
		url: "php/getRecords.php",
		type: 'POST',
		dataType: 'json',
		data: {
			table: selectedTable
		},	
		success: function(response) {
			localRecords = response;
			displayRecordsList(localRecords);
		},
		error: function(jqXHR, textStatus, errorThrown) {
			console.log("request failed");
			console.log(jqXHR);
		}
	});
}

function recalculateContentHeight(){
	var htmlInnerHeight = $('html').height();
	
	// calculate space available for entire body element - no visible elements in html except body
	var bodyOuterHeight = htmlInnerHeight;
	
	// calculate total available space inside body element
	var bodyInnerHeigh = bodyOuterHeight - ($('body').outerHeight() - $('body').height());
	
	// calculate space available for entire main element
	var mainOuterHeight = bodyInnerHeigh - $('header').outerHeight(true) - $('footer').outerHeight(true);
	
	// calculate total available space inside main element
	var mainInnerHeight = mainOuterHeight - ($('main').outerHeight(true) - $('main').height());
	
	// calculate space available for content element
	var contentOuterHeight = mainInnerHeight - $('#sub-header').outerHeight(true) - $('#sub-footer').outerHeight(true);
	
	// calculate total available space inside content element
	var contentInnerHeight = contentOuterHeight - ($('#content').outerHeight(true) - $('#content').height());
	
	//$('#content').height(contentInnerHeight);

	var maxHeight = contentInnerHeight - 200;
	$('#content .dataTables_scrollBody').css('max-height', maxHeight);
}

// ##############################################################################
// #                        Events handlers                                     # 
// ##############################################################################

$(window).on('load', function () {

	// populate list of available tables
	for (var key in nameTranslations) {
		var link = $('<a></a>')
					.attr('class', 'dropdown-item')
					.attr('href', '#')
					.attr('value', key)
					.text(nameTranslations[key].displayName);
		var listItem = $('<li></li>').append(link);
		$('#tableSelectionDropdown > ul').append(listItem);
	}
	
	// load default table
	getRecords('personnel');

	// display preloader
	if ($('#preloader').length) {
		$('#preloader').delay(100).fadeOut('slow', function () {
			$(this).remove();
		});
	}
});

$(window).resize(function() {
	recalculateContentHeight();
});

// action when user click to change the table
$('#tableSelectionDropdown > ul').on('click', 'li', function(event) {
	var selectedTable = event.target.attributes.value.value;
	getRecords(selectedTable);
});

$('#selectAll').on('click', function () {
	selectRecords('all');
});

$('#selectNone').on('click', function () {
	selectRecords('none');
});

$('#selectInverse').on('click', function () {
	selectRecords('inverse');
});

$('#showRecordsBtnM').on('click', function() {
	switch (localRecords.table) {
		case 'personnel' : {
			new bootstrap.Modal(document.getElementById('personnelAtMobile')).show();
		} break;
		case 'department' : {
			new bootstrap.Modal(document.getElementById('departmentAtMobile')).show();
		} break;
		case 'location' : {
			new bootstrap.Modal(document.getElementById('locationAtMobile')).show();
		} break;
		
	}
});

$('#personnelAtDesktop button.btn-close').on('click', recordDetailsAtDesktopClose);

$('#departmentAtDesktop button.btn-close').on('click', recordDetailsAtDesktopClose);

$('#locationAtDesktop button.btn-close').on('click', recordDetailsAtDesktopClose);