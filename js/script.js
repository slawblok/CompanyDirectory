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

function recordDetailsAtDesktopClose() {
	// close profile at Desktop
	$('#personnelAtDesktop').removeClass('d-md-block');
	$('#departmentAtDesktop').removeClass('d-md-block');
	$('#locationAtDesktop').removeClass('d-md-block');
	recalculateContentHeight();
}

function displayRecordsDetails(records, displayAtMobile){
	// hide profile if any displayed
	recordDetailsAtDesktopClose();
	
	// combine records if more than one selected
	var recordCombined = {};
	var messageForMultipleEntries = '...multiple entries...';
	if (records.length > 0) {
		for (var key in records[0]) {
			recordCombined[key] = records[0][key];
		}
		records.forEach(function(record) {
			for (var key in record) {
				if (recordCombined[key] != messageForMultipleEntries) {
					if (recordCombined[key] != record[key]) {
						recordCombined[key] = messageForMultipleEntries;
					}
				}
			}
		});
	}

	// update DOM with record details
	switch (localRecords.table) {
		case 'personnel': {
			var container = $('#personnelAtDesktop');
			container.children('#recordId').text(recordCombined.id);
			container.children('#firstName').text(recordCombined.firstName);
			container.children('#lastName').text(recordCombined.lastName);
			container.children('#jobTitle').text(recordCombined.jobTitle);
			container.children('#email').text(recordCombined.email);
			container.children('#department').text(recordCombined.department);
			container.children('#location').text(recordCombined.location);
			// show profile, but only if Desktop
			container.addClass('d-md-block');
			// show profile, but only if Mobile
			if (!($('#personnelAtDesktop').is(':visible')) && displayAtMobile) {
				var container = $('#personnelAtMobile .modal-content .modal-body');
				container.children('#recordId').text(recordCombined.id);
				container.children('#firstName').text(recordCombined.firstName);
				container.children('#lastName').text(recordCombined.lastName);
				container.children('#jobTitle').text(recordCombined.jobTitle);
				container.children('#email').text(recordCombined.email);
				container.children('#department').text(recordCombined.department);
				container.children('#location').text(recordCombined.location);
				new bootstrap.Modal(document.getElementById('personnelAtMobile')).show();
			}
		} break;
		case 'department': {
			var container = $('#departmentAtDesktop');
			container.children('#recordId').text(recordCombined.id);
			container.children('#name').text(recordCombined.name);
			container.children('#location').text(recordCombined.location);
			// show profile, but only if Desktop
			container.addClass('d-md-block');
			// show profile, but only if Mobile
			if (!($('#departmentAtDesktop').is(':visible')) && displayAtMobile) {
				var container = $('#departmentAtMobile .modal-content .modal-body');
				container.children('#recordId').text(recordCombined.id);
				container.children('#name').text(recordCombined.name);
				container.children('#location').text(recordCombined.location);
				new bootstrap.Modal(document.getElementById('departmentAtMobile')).show();
			}
		} break;
		case 'location': {
			var container = $('#locationAtDesktop');
			container.children('#recordId').text(recordCombined.id);
			container.children('#name').text(recordCombined.name);
			// show profile, but only if Desktop
			container.addClass('d-md-block');
			// show profile, but only if Mobile
			if (!($('#locationAtDesktop').is(':visible')) && displayAtMobile) {
				var container = $('#locationAtMobile .modal-content .modal-body');
				container.children('#recordId').text(recordCombined.id);
				container.children('#name').text(recordCombined.name);
				new bootstrap.Modal(document.getElementById('locationAtMobile')).show();
			}
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
		var checkbox = this.children[1].firstChild.firstChild;
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
				displayRecordsDetails(selectedRecords, false);
			} else {
				recordDetailsAtDesktopClose();
			}
		} break;
	}

}

function markRowHandler(event){
	var row = event.target.parentElement;
	var recordId = row.children[1].children[0].children[0].id;
	var markedRecord = [];
	localRecords.data.forEach(function(record) {
		if (record.id == recordId) {
			markedRecord.push(record);
		}
	});
	// display record details
	displayRecordsDetails(markedRecord, true);
}

function checkRowHandler(event){
	var checkBox = event.target;	
	var recordId = checkBox.id;
	var checkBoxStatus = checkBox.checked;
	var selectedRecords = [];

	// if check box was checked than save this in global variable
	// this is needed when table will be re-generated after screen resize
	localRecords.data.forEach(function(record) {
		if (record.id == recordId) {
			record['checked'] = checkBoxStatus;
		}
		if ('checked' in record) {
			if (record.checked) {
				selectedRecords.push(record);
			}
		}
	});

	// update number of selected record fields
	$('#selectedNumberOfRecords').text(selectedRecords.length);

	// display the record(s) details
	if (selectedRecords.length > 0) {
		displayRecordsDetails(selectedRecords, false);
		// show button for Mobile
		$('#showRecordsBtnM').removeClass('d-none');
	} else {
		recordDetailsAtDesktopClose();
		// hide button for Mobile
		$('#showRecordsBtnM').addClass('d-none');
	}
}

function generateTable(records, columnsReduction) {
	
	// determine columns list
	var fullColumnsList = nameTranslations[records.table].columnsList;
	var columnsList = {};
	var numberOfColumns = 2; // 'number' and 'checkbox'
	var maxNumberOfColumns = numberOfColumns 
							+ Object.keys(fullColumnsList).length 
							- columnsReduction;
	for (var key in fullColumnsList) {
		if (numberOfColumns >= maxNumberOfColumns) break;
		columnsList[key] = fullColumnsList[key];
		numberOfColumns++;
	};

	// define columns titles
	var tableHead = $("<thead></thead>");
	var columnsTitles = $("<tr></tr>");
	columnsTitles.append($("<th></th>").text('').attr("scope", "col"));
	columnsTitles.append($("<th></th>").text('').attr("scope", "col"));
	for (var key in columnsList) {
		columnsTitles.append($("<th></th>").text(columnsList[key]).attr("scope", "col"));
	};
	tableHead.append(columnsTitles);

	// define table body
	var tableBody = $("<tbody></tbody>");
	var rowNumber = 1;
	records.data.forEach(function(element) {
		// define row
		var row = $("<tr></tr>");
		// number
		row.append($("<th></th>").text(rowNumber++).attr("scope", "row").on('click', markRowHandler));
		// check box
		var checkBox = $('<input></input').attr("class", "form-check-input")
											.attr("type", "checkbox")
											.attr("value", "")
											.attr("id", element.id)
											.on('click', checkRowHandler);
		if ('checked' in element) {
			checkBox.attr("checked", element.checked);
		}
		var div = $('<div></div>').attr("class", "form-check")
										.append(checkBox);								
		row.append($("<td></td>").append(div));
		// main data
		for (var key in columnsList){
			row.append($("<td></td>").text(element[key]).on('click', markRowHandler));
		}
		tableBody.append(row);
	});

	// load head and body to table
	var table = $("<table></table>").attr("class", "table table-hover");
	table.append(tableHead);
	table.append(tableBody);
	return table;
}

function displayRecordsList(records) {
	
	// generate table which fit to available width
	var iteration = 0;
	do {
		// generate table
		var table = generateTable(records, iteration);
		iteration++;
		$('#content').html('').append(table);
		// check widths
		var tableWidth = $('#content > table').outerWidth(true);
		var containerWidth = $('#content').width();
	} while (tableWidth > containerWidth);
	
	// count selected records
	var count = 0;
	localRecords.data.forEach(function(record) {
		if ('checked' in record) {
			if (record.checked) {
				count++;
			}
		}
	});

	$('#totalNumberOfRecords').text(records.data.length);
	$('#tableSelectionDropdown > a').text(nameTranslations[records.table].displayName);
	$('#selectedNumberOfRecords').text(count);
}

function changeTable(selectedTable){
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
	
	$('#content').height(contentInnerHeight);
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
	changeTable('personnel');

	recalculateContentHeight();

	// display preloader
	if ($('#preloader').length) {
		$('#preloader').delay(100).fadeOut('slow', function () {
			$(this).remove();
		});
	}
});

$(window).resize(function() {
	recalculateContentHeight();
	displayRecordsList(localRecords);
});

// action when user click to change the table
$('#tableSelectionDropdown > ul').on('click', 'li', function(event) {
	var selectedTable = event.target.attributes.value.value;
	recordDetailsAtDesktopClose();
	changeTable(selectedTable);
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
	var selectedRecords = [];
	localRecords.data.forEach(function(record) {
		// build array of selected records
		if ('checked' in record) {
			if (record.checked) {
				selectedRecords.push(record);
			}
		}
	});
	displayRecordsDetails(selectedRecords, true);
});

$('#personnelAtDesktop button.btn-close').on('click', recordDetailsAtDesktopClose);

$('#departmentAtDesktop button.btn-close').on('click', recordDetailsAtDesktopClose);

$('#locationAtDesktop button.btn-close').on('click', recordDetailsAtDesktopClose);