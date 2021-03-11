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
		displayName : 'Department',
		columnsList : {
			// all below keys must match name in DB
			name: 'Department Name',
			location: 'Location'
		}
	},
	location : {	// this key must match name in DB
		displayName : 'Location',
		columnsList : {
			// all below keys must match name in DB
			name: 'Location Name'
		}
	},
}

// globa lvariables
var dataTable;
var selectedTable;
var editedRecords;

// ##############################################################################
// #                        General section                                     # 
// ##############################################################################

function getRecords(requestedTable, target){
	// request all records
	$.ajax({
		url: "php/getRecords.php",
		type: 'GET',
		dataType: 'json',
		data: {
			table: requestedTable
		},	
		success: function(response) {
			switch (target) {
				case 'toTable': {
					selectedTable = requestedTable;
					displayRecordsList(response);
				} break;
				case 'toSelectOptions': {
					populateSelectOptions(response, requestedTable);
				} break;
			}
		},
		error: function(jqXHR, textStatus, errorThrown) {
			console.log("request failed");
			console.log(jqXHR);
		}
	});
};

$(window).on('load', function () {

	// populate list of available tables
	for (var key in nameTranslations) {
		var link = $('<a></a>')
					.attr('class', 'dropdown-item')
					.attr('value', key)
					.text(nameTranslations[key].displayName);
		var listItem = $('<li></li>').append(link);
		$('#tableSelectionDropdown > ul').append(listItem);
	}
	
	// load default table
	getRecords('personnel', 'toTable');

	initiateColOrderPopover();
	
	// display preloader
	if ($('#preloader').length) {
		$('#preloader').delay(100).fadeOut('slow', function () {
			$(this).remove();
		});
	}
});

// action when user click to change the table
$('#tableSelectionDropdown > ul').on('click', 'li', function(event) {
	getRecords(event.target.attributes.value.value, 'toTable');
});

// ##############################################################################
// #                        Displaying records                                  # 
// ##############################################################################

function cloaseRecordDetailsAtDesktop() {
	Object.keys(nameTranslations).forEach( key => {
		$('.recordDetails.'+key+'.desktop').removeClass('d-md-block');
	})
	recalculateContentHeight();
	recordDetailsToPreviewMode();
}

$('.recordDetails.desktop button.btn-close').on('click', cloaseRecordDetailsAtDesktop);

$('#showRecordsBtnM').on('click', function() {
	closeColOrderPopover();
	displaySelectedRecordsDetails();
	new bootstrap.Modal(document.getElementsByClassName(selectedTable+' mobile')[0]).show();
});

function getSelectedRecords() {
	// get selected records
	var selectedRows = dataTable.rows( { selected: true } ).data();
	var selectedRecords = [];
	for (var i=0; i<selectedRows.length; i++) {
		selectedRecords.push(selectedRows[i]);
	}
	return selectedRecords;
}

function displaySelectedRecordsDetails(){
	
	// get selected records
	var selectedRecords = getSelectedRecords();
	
	// combine records if more than one selected
	var recordCombined = {};
	var recordsDifferences = {};
	// copy first record as-is and assume no differences
	for (var key in selectedRecords[0]) {
		recordsDifferences[key] = 'no';
		recordCombined[key] = selectedRecords[0][key];
	}
	
	// compare with remainings records
	selectedRecords.forEach(function(selectedRecord) {
		for (var key in selectedRecord) {
			if (recordsDifferences[key] == 'no') {
				if (selectedRecord[key] != recordCombined[key]) {
					recordsDifferences[key] = 'yes';
					switch(key) {
						case 'id': {
							recordCombined[key] = '#';
						} break;
						case 'email': {
							recordCombined[key] = 'multiple@emails';
						} break;
						default: {
							recordCombined[key] = 'multiple';
						} break;
					}
				}
			}
		}
	});

	// update DOM with record details
	var desktopContainer = $('.recordDetails.'+selectedTable+'.desktop');
	var mobileContainer = $('.recordDetails.'+selectedTable+'.mobile');
	
	var recordName = nameTranslations[selectedTable].displayName;
	desktopContainer.find('.modal-title span').text(recordName);
	mobileContainer.find('.modal-title span').text(recordName);

	var recordId = recordCombined.id;
	desktopContainer.find('#recordId').text(recordId);
	mobileContainer.find('#recordId').text(recordId);

	var columnsList = nameTranslations[selectedTable].columnsList;
	for (var key in columnsList) {
		var value = recordCombined[key];
		var columnName = columnsList[key];
		desktopContainer.find('input.'+key).val(value).attr('placeholder', columnName+' placeholder');
		desktopContainer.find('span.'+key).text(value);
		desktopContainer.find('label.'+key).text(columnName);
		
		mobileContainer.find('input.'+key).val(value).attr('placeholder', columnName+' placeholder');
		mobileContainer.find('span.'+key).text(value);
		mobileContainer.find('label.'+key).text(columnName);
	};

	if ('departmentID' in recordCombined) {
		desktopContainer.find('span.'+'department').attr('id', recordCombined.departmentID);
		mobileContainer.find('span.'+'department').attr('id', recordCombined.departmentID);
	}
	if ('locationID' in recordCombined) {
		desktopContainer.find('span.'+'location').attr('id', recordCombined.locationID);
		mobileContainer.find('span.'+'location').attr('id', recordCombined.locationID);
	}
}

function displayRecordsList(records) {
	// hide modals, popup
	cloaseRecordDetailsAtDesktop();
	closeColOrderPopover();

	// clear search box
	$('#searchBox > input').val('');

	// hide button for Mobile
	$('#showRecordsBtnM').addClass('d-none');

	// prepare columns list and table header for DataTable
	var columns = [];
	var columnsList = nameTranslations[selectedTable].columnsList;
	var tableHead = $("<thead></thead>");
	var columnsTitles = $("<tr></tr>");
	for (var key in columnsList){
		columns.push({'data': key});
		columnsTitles.append($("<th></th>").text(columnsList[key]).attr("scope", "col"));
	}
	tableHead.append(columnsTitles);

	// load head to table
	var table = $("<table></table>").attr("class", "table table-hover");
	table.append(tableHead);
	$('#content').html('').append(table);


	// DataTable uses below extensions:
	// - Responsive
	// - ColReorder
	// - Select
	dataTable = $('#content > table').DataTable({
		destroy: true,
		data: records.data,
		columns: columns,
		paging: false,
		scrollY: 300,
		scrollX: false,
		scrollCollapse: true,
		"drawCallback": function(settings, json) {
			recalculateContentHeight();
		},
		responsive: true,
		colReorder: true,
		select: {
			style: 'multi+shift'
		},
		searchPanes: true,
		dom: 'lrtip'			// remove 'i' to stop displaying bottom infor
	})
	.on('select', function () {
		displaySelectedRecordsDetails();
		// show profile for Desktop
		$('.recordDetails.'+selectedTable+'.desktop').addClass('d-md-block');
		recalculateContentHeight();
		// show button for Mobile
		$('#showRecordsBtnM').removeClass('d-none');
	})
	.on('deselect', function (e, dt, type, indexes) {
		// check if 1 or more 1 selected
		if (dt.rows( { selected: true } ).data().length > 0) {
			displaySelectedRecordsDetails();
			// show profile for Desktop
			$('.recordDetails'+selectedTable+'.desktop').addClass('d-md-block');
			recalculateContentHeight();
			// show button for Mobile
			$('#showRecordsBtnM').removeClass('d-none');
		} else {
			// hide modals, which shows record details at Desktop
			cloaseRecordDetailsAtDesktop();
			// hide button for Mobile
			$('#showRecordsBtnM').addClass('d-none');
		}
	});
	
	$('#tableSelectionDropdown > a > span').text(nameTranslations[selectedTable].displayName);
}

function getHeighConsumedByOtherElements(element) {
	
	// calculate total height consumed by all visible siblings elements
	var heightOfSiblings = 0;
	element.siblings().each( function(sibling) {
		// count only visible elements, which are not popover
		if ($(this).is(':visible') && !$(this).hasClass('popover')) {
			heightOfSiblings += $(this).outerHeight(true);
		}
	});
	
	// calculate total thickness of top and bottom
	// margins, borders and paddings of parent element
	var parent = element.parent();
	var parentThickness = -parent.height();
	if (parent.is('body')) {
		// somehow there is exception for <body>
		// its height must be without margins
		// this is probably due to margin collapse
		parentThickness += parent.outerHeight();
	} else {
		parentThickness += parent.outerHeight(true);
	}

	// heigh consumed at element level
	var heightConsumed = heightOfSiblings + parentThickness;

	// check for root element
	if (parent.is('html')) {
		// if the element is root than finish the recursive calculation
		return heightConsumed;
	} else {
		// go to upper parent (next iteration)
		return heightConsumed + getHeighConsumedByOtherElements(parent);
	}
	
}

function recalculateContentHeight(){
	var contentElement = $('#content .dataTables_scrollBody');
	// check if the element has parents, otherwise recursive function will hang
	if (contentElement.parents().length > 0) {
		// recursive calculations up to root element
		var heightOfOtherElements = getHeighConsumedByOtherElements(contentElement);
		var heighOfRootElement = $('html').outerHeight(true);
		var outerHeight = heighOfRootElement - heightOfOtherElements;

		// heigh calculation uses DOM element properies,
		// thus need to check if heigh is > 0, it not 
		// if not, then try again after some delay
		if (outerHeight > 0) {
			contentElement.css('max-height', outerHeight);
			//console.log('Content height calculated to: ' + outerHeight);
		} else {
			//console.log('Attempt to content height calculation, but it is negative: ' + outerHeight + '. Next attempt after 100ms.');
			setTimeout( function() {
				recalculateContentHeight();
			}, 100);
		}
	} else {
		//console.log('Attempt to content height calculation, but no parents.');
	}
	// small tweek to content/table width, 
	// Probably due to error in DataTable library, table is 1.317px wider that its container
	// thus horozontal scroll is shown. This turn off the horizontla scroll.
	contentElement.css('overflow-x', 'hidden');
	
}

$(window).resize(function() {
	closeColOrderPopover();
	recalculateContentHeight();
});

$('#navbarSupportedContent').on('shown.bs.collapse',function() {
	recalculateContentHeight();
});

$('#navbarSupportedContent').on('hidden.bs.collapse',function() {
	recalculateContentHeight();
});

$('#navbarSupportedContent li.dropdown').on('shown.bs.dropdown',function() {
	recalculateContentHeight();
});

$('#navbarSupportedContent li.dropdown').on('hidden.bs.dropdown',function() {
	recalculateContentHeight();
});

// ##############################################################################
// #                             Searching                                      # 
// ##############################################################################

$('#searchBox > input').on('keyup', function(event) {
	dataTable.search(event.target.value).draw();
});

$('#searchBox > input').on('change', function(event) {
	dataTable.search(event.target.value).draw();
});

// ##############################################################################
// #                        Selecting records                                   # 
// ##############################################################################

$('#selectAll').on('click', function () {
	dataTable.rows({ search:'applied' }).select().draw();
});

$('#selectNone').on('click', function () {
	dataTable.rows().deselect().draw();
});

$('#selectInverse').on('click', function () {
	var selectedIndexes = dataTable.rows({selected: true}).indexes();
	// select all, than unselect those, which were selected
	dataTable.rows({ search:'applied' }).select().rows(selectedIndexes).deselect().draw();
});

// ##############################################################################
// #                        Sorting records                                     # 
// ##############################################################################

$('#sortRecordsBtnM').on('click', function() {
	
	closeColOrderPopover();
	
	// show Modal
	new bootstrap.Modal(document.getElementById('sortAtMobile')).show();
	
	// get current order and columns visibility
	var currentOrder = dataTable.order();
	var columnsVisibility = dataTable.columns().visible();
	var columnsHidden = dataTable.columns().responsiveHidden();

	// pupulate and select columns
	var currentColumnIndex = currentOrder[0][0];
	$('#sortByColumns').html('');
	dataTable.columns().header().each(function(value, index) {
		// list only visible(enabled) columns
		if (columnsVisibility[index]) {
			var option = $('<option></option>').val(index);
			if (index == currentColumnIndex) {
				option.prop('selected', true);
			}
			if (columnsHidden[index]) {
				option.text(value.innerText);
			} else {
				option.text(value.innerText + ' (hidden)');
			}
			$('#sortByColumns').append(option);
		}
	});

	// select direction
	var currentOrderDirection = currentOrder[0][1];
	$('#sortDirection option[value="'+currentOrderDirection+'"]').prop('selected', true);
	
});

$('#sortByColumns').on('change', function() {
	// show message if user wants to sort by hidden column
	var columsnVisibility = dataTable.columns().responsiveHidden();
	if (columsnVisibility[$('#sortByColumns').val()]) {
		$('#sortAtMobile .modal-body div:last-child').addClass('d-none');
	} else {
		$('#sortAtMobile .modal-body div:last-child').removeClass('d-none');
	}
});

$('#sortConfirmBtnM').on('click', function() {
	var selectedColumnIndex = parseInt($('#sortByColumns').val());
	var selectedOrderDirection = $('#sortDirection').val();
	var columnsVisibility = dataTable.columns().responsiveHidden();
	if (columnsVisibility[selectedColumnIndex]) {
		dataTable.order( [selectedColumnIndex, selectedOrderDirection] ).draw();
	} else {
		// if selected column is hidden than move it to most left position
		dataTable.colReorder.move(selectedColumnIndex, 0);
		dataTable.order( [0, selectedOrderDirection] ).draw();
	}
});

// ##############################################################################
// #                        Columns ordering                                    # 
// ##############################################################################

function updateContentForColOrder() {
	// handler to lists at Modal (for Mobile) and Popover (for Desktop)
	var content = $('#colOrderAtMobile, #colOrderAtDesktop');
	var list = content.find('ul').html('');
	
	// generate columns list based on actual column order and visibility
	var columnsVisibility = dataTable.columns().visible();
	var columnsList = {column: []};
	dataTable.columns().header().each(function(value, currentTndex) {
		columnsList.column.push({
			// convert to original index
			// convert the index from current to original (prior potential reordering)
			index: dataTable.colReorder.transpose(currentTndex, 'toOriginal'),
			name: value.innerText,
			visible: columnsVisibility[currentTndex]
		});	
	});

	// use Handlebar to generate HTML
	const source = $('#colOrderTemplate').html();
	const template = Handlebars.compile(source);
	list.append(template(columnsList));
}

function updateColumnsOrder(event, ui) {
	// get new order of columns from sortable list and convert it to array format acceptable by DataTable
	var newOrder = ui.item[0].parentNode;
	var newOrderArray = [];
	$(newOrder).children().each(function(index, item) {
		newOrderArray.push(item.value);
	});
	// apply new order, 'true' parameter indicates
	// that the indexes passed in are the original indexes
	dataTable.colReorder.order(newOrderArray, true).draw();
}

function updateColumnsVisibility(event){
	var columnIndex = event.target.value;
	// convert the index from original to current (after potential reordering)
	var currentColumnIndex = dataTable.colReorder.transpose(parseInt(columnIndex));
	var visibility = event.target.checked;
	dataTable.column(currentColumnIndex).visible(visibility).draw();
}

function moveUpColumn(event) {
	// get button from element to move
	var button;
	if ($(event.target).is('button')) {
		button = event.target;
	} else {
		button = event.target.parentElement;
	}
	// convert the index from original to current (after potential reordering)
	var currentColumnIndex = dataTable.colReorder.transpose(parseInt(button.value)); 
	var targetColumnIndex = currentColumnIndex - 1;
	if (targetColumnIndex < 0) targetColumnIndex = 0;
	// reorder columns
	dataTable.colReorder.move(currentColumnIndex, targetColumnIndex).draw();
	// reorder list
	var elementToMove = button.closest('li');
	var upperElement = $(elementToMove).prev();
	if (upperElement != null) {
		$(elementToMove).insertBefore(upperElement);
	}
}

function moveDownColumn(event) {
	// get button from element to move
	var button;
	if ($(event.target).is('button')) {
		button = event.target;
	} else {
		button = event.target.parentElement;
	}
	// convert the index from original to current (after potential reordering)
	var currentColumnIndex = dataTable.colReorder.transpose(parseInt(button.value)); 
	var targetColumnIndex = currentColumnIndex + 1;
	var maxNumberOfColumns = dataTable.columns()[0].length - 1;
	if (targetColumnIndex >= maxNumberOfColumns) targetColumnIndex = maxNumberOfColumns;
	// reorder columns
	dataTable.colReorder.move(currentColumnIndex, targetColumnIndex).draw();
	// reorder list
	var elementToMove = button.closest('li');
	var bottomElement = $(elementToMove).next();
	if (bottomElement != null) {
		$(elementToMove).insertAfter(bottomElement);
	}
}

function assignActionsForColOrder(content) {
	// makes list sortable and assing action on change
	content.find('ul').sortable({update: updateColumnsOrder});
	// assing action to checkboxes
	content.find('input').on('click', updateColumnsVisibility);
	// assing action to up/down buttons
	content.find('.btn-up').on('click', moveUpColumn);
	content.find('.btn-down').on('click', moveDownColumn);
}

function closeColOrderPopover() {
	var trigger = document.getElementById('colOrderBtn');
	var popover = bootstrap.Popover.getInstance(trigger);
	popover.hide();
}

function initiateColOrderPopover() {
	// add elements and attributies to Popup allowed elements
	bootstrap.Tooltip.Default.allowList.button = ['type', 'value'];
	bootstrap.Tooltip.Default.allowList.input = ['type', 'checked', 'value'];
	bootstrap.Tooltip.Default.allowList.label = ['for'];
	bootstrap.Tooltip.Default.allowList.li = ['value'];

	// initialize popover
	var trigger = document.getElementById('colOrderBtn');
	new bootstrap.Popover(trigger, {
		content: function() {return $('#colOrderAtDesktop').html()},
		html: true,
		trigger: 'manual'
	});
	trigger.addEventListener('shown.bs.popover', function () {
		// once content of popover is created, then
		// it is feasible to assign some actions to its elements
		var popover = bootstrap.Popover.getInstance(this);
		var content = $(popover.tip);
		// action assigned to close buttons
		content.find('.closeBtn').on('click', closeColOrderPopover);
		assignActionsForColOrder(content);
		// adjust width, by removing max-widht property
		$(content).css('max-width', '1000px');
	});
}

$('#colOrderBtn').on('click', function() {
	updateContentForColOrder();
	// check if nav bar if collapsed (Mobile)
	if ($('nav .navbar-toggler').is(':visible')) {
		// show Modal
		assignActionsForColOrder($('#colOrderAtMobile'));
		new bootstrap.Modal(document.getElementById('colOrderAtMobile')).show();
	} else {
		// show Popover
		var trigger = document.getElementById('colOrderBtn');
		var popover = bootstrap.Popover.getInstance(trigger);
		popover.show();
	}
})

// ##############################################################################
// #                             Filtering                                      #
// ##############################################################################

$('#filterRecordsBtnD').on('click', function() {
	console.log('show filter option on desktop');
	//dataTable.searchPanes.container().prependTo(dataTable.table().container());
    //dataTable.searchPanes.resizePanes();
});

$('#filterRecordsBtnM').on('click', function() {
	console.log('show filter option on mobile');
});

// ##############################################################################
// #                                  Edit                                      #
// ##############################################################################

function recordDetailsToEditMode() {
	var content = $('.recordDetails');
	content.find('.editable').removeClass('d-none');
	content.find('.preview').addClass('d-none');
	content.find('.editBtn').addClass('d-none');
	content.find('.confirmBtn').removeClass('d-none');
	content.find('.duplicateBtn').addClass('d-none');
	content.find('.deleteBtn').removeClass('d-none');
	recalculateContentHeight();
};

$('.recordDetails').find('.editBtn').on('click', function() {		
	recordDetailsToEditMode();
});

function recordDetailsToPreviewMode() {
	// configure record details modal to preview mode
	var content = $('.recordDetails');
	content.find('.preview').removeClass('d-none');
	content.find('.editable').addClass('d-none');
	content.find('.editBtn').removeClass('d-none');
	content.find('.confirmBtn').addClass('d-none');
	content.find('.duplicateBtn').removeClass('d-none');
	content.find('.deleteBtn').addClass('d-none');
	recalculateContentHeight();
};

$('.recordDetails').on('hidden.bs.modal', function () {
	recordDetailsToPreviewMode();
});

function populateSelectOptions(records, table) {
	var select = $('select.'+table);
	// clear any existing options
	select.html('');
	records.data.forEach(function(element) {
		// define option
		var option = $("<option></option>");
		for (var key in element) {
			// 'name' is displayed on the list for user
			// 'id' goes as value of option
			// other fields goes as attributes to option element
			switch (key) {
				case 'id': {
					option.val(element[key]);
				} break;
				case 'name': {
					option.text(element[key]);
				} break;
				default: {
					option.attr(key, element[key]);
				} break;
			}
		}
		select.append(option);
	});
	// one more option is added to handle case, where more than one record is selected
	// thus list should have 'multiple' option available to display only, but not to select by user
	select.append($("<option></option>").val('multiple').text('multiple').addClass('d-none'));
	select.val(select.next('span').attr('id'));
};

$('.recordDetails.department').find('.editBtn').on('click', function() {
	getRecords('location', 'toSelectOptions');
});

$('.recordDetails.personnel').find('.editBtn').on('click', function() {
	getRecords('department', 'toSelectOptions');
});

$('select.department').change(function() {
	var location = $(this).find(':selected').attr('location');
	var locationId = $(this).find(':selected').attr('locationId');
	var spanElement = $(this).closest('.recordDetails').find('span.location');
	spanElement.text(location).attr('id', locationId);
});

function determineValue(originalValue, displayedValue, editedValue) {
	if (displayedValue != editedValue) {
		// user edited field of this record, thus new/edited value is taken
		return editedValue;
	} else {
		// no edit occur; thus original value is taken
		// this migh be different for each record if more than one selected
		return originalValue;
	}
};

$('.recordDetails.personnel').find('.confirmBtn').on('click', function() {
	var container = $(this).closest('.recordDetails');
	var selectedRecords = getSelectedRecords();
	// read DOM to local variably
	editedRecords = [];
	selectedRecords.forEach (function (selectedRecord) {
		var editedRecord = {};
		// id remains unchanged
		editedRecord['id'] = selectedRecord.id;
		
		// original value is value, which is currently is DB
		var originalValue = selectedRecord.firstName;
		// displayed value might differ from original value, when multiple records are selected
		// then 'multiple' is displayed instead original value
		var displayedValue = container.find('span.firstName').text();
		// edited value is entered by the user
		var editedValue = container.find('input.firstName').val();
		editedRecord['firstName'] = determineValue(originalValue, displayedValue, editedValue);
		
		var originalValue = selectedRecord.lastName;
		var displayedValue = container.find('span.lastName').text();
		var editedValue = container.find('input.lastName').val();
		editedRecord['lastName'] = determineValue(originalValue, displayedValue, editedValue);

		var originalValue = selectedRecord.jobTitle;
		var displayedValue = container.find('span.jobTitle').text();
		var editedValue = container.find('input.jobTitle').val();
		editedRecord['jobTitle'] = determineValue(originalValue, displayedValue, editedValue);
		
		var originalValue = selectedRecord.email;
		var displayedValue = container.find('span.email').text();
		var editedValue = container.find('input.email').val();
		editedRecord['email'] = determineValue(originalValue, displayedValue, editedValue);

		var originalValue = selectedRecord.departmentID;
		var displayedValue = container.find('span.department').attr('id');
		var editedValue = container.find('select.department').val();
		editedRecord['departmentID'] = determineValue(originalValue, displayedValue, editedValue);

		editedRecords.push(editedRecord);
	});
	showChanges(selectedRecords, container);
});

$('.recordDetails.department').find('.confirmBtn').on('click', function() {
	var container = $(this).closest('.recordDetails');
	var selectedRecords = getSelectedRecords();
	// read DOM to local variably
	editedRecords = [];
	selectedRecords.forEach (function (selectedRecord) {
		var editedRecord = {};
		// id remains unchanged
		editedRecord['id'] = selectedRecord.id;
		
		// original value is value, which is currently is DB
		var originalValue = selectedRecord.name;
		// displayed value might differ from original value, when multiple records are selected
		// then 'multiple' is displayed instead original value
		var displayedValue = container.find('span.name').text();
		// edited value is entered by the user
		var editedValue = container.find('input.name').val();
		editedRecord['name'] = determineValue(originalValue, displayedValue, editedValue);
		
		var originalValue = selectedRecord.locationID;
		var displayedValue = container.find('span.location').attr('id');
		var editedValue = container.find('select.location').val();
		editedRecord['locationID'] = determineValue(originalValue, displayedValue, editedValue);

		editedRecords.push(editedRecord);
	});
	showChanges(selectedRecords, container);
});

$('.recordDetails.location').find('.confirmBtn').on('click', function() {
	var container = $(this).closest('.recordDetails');
	var selectedRecords = getSelectedRecords();
	// read DOM to local variably
	editedRecords = [];
	selectedRecords.forEach (function (selectedRecord) {
		var editedRecord = {};
		// id remains unchanged
		editedRecord['id'] = selectedRecord.id;
		
		// original value is value, which is currently is DB
		var originalValue = selectedRecord.name;
		// displayed value might differ from original value, when multiple records are selected
		// then 'multiple' is displayed instead original value
		var displayedValue = container.find('span.name').text();
		// edited value is entered by the user
		var editedValue = container.find('input.name').val();
		editedRecord['name'] = determineValue(originalValue, displayedValue, editedValue);
		
		editedRecords.push(editedRecord);
	});
	showChanges(selectedRecords, container);
});

function showChanges(originalRecords, container) {
	// generata table which show list of changs and count number of changed records
	var table = $("<table></table>").attr("class", "table");
	var tbody = $('<tbody></tbody>');
	table.append(tbody);
	var recordNumber = 0;
	var numberOfRecordsEdited = 0;
	editedRecords.forEach (function (editedRecord) {
		var wasModified = false;
		var rowsRecordFields = [];
		for (var key in editedRecord) {
			var originalValue = originalRecords[recordNumber][key];
			var editedValue = editedRecord[key];
			if (originalValue != editedValue) {
				wasModified = true;
				var originalValueToShow;
				var editedValueToShow;
				var fieldNameToShow;
				switch (key) {
					case 'departmentID': {
						// need to convert department ID on its Name
						originalValueToShow = $('.mobile select.department option[value='+originalValue+']').text();
						editedValueToShow = $('.mobile select.department option[value='+editedValue+']').text();
						fieldNameToShow = nameTranslations.department.displayName;
					} break;
					case 'locationID': {
						// need to convert location ID on its Name
						originalValueToShow = $('.mobile select.location option[value='+originalValue+']').text();
						editedValueToShow = $('.mobile select.location option[value='+editedValue+']').text();
						fieldNameToShow = nameTranslations.location.displayName;
					} break;
					default: {
						originalValueToShow = originalValue;
						editedValueToShow = editedValue;
						fieldNameToShow = nameTranslations[selectedTable].columnsList[key];
					}
				}
				var row = $('<tr></tr>')
							.append($('<td></td>').text(fieldNameToShow))
							.append($('<td></td>').text(originalValueToShow))
							.append($('<td></td>').append($('<i></i>').addClass('bi bi-arrow-right')))
							.append($('<td></td>').text(editedValueToShow));
				rowsRecordFields.push(row);
			}
		}
		recordNumber +=1;
		if (wasModified) {
			numberOfRecordsEdited += 1;
			var rowRecordId = $('<tr></tr>').append($('<th></th>').text('Record ID: ' + editedRecord.id));
			tbody.append(rowRecordId);
			rowsRecordFields.forEach(function(row) {
				tbody.append(row);
			})
		}
	});

	if (numberOfRecordsEdited == 0) {
		// show info about no changes
		var info = container.find('div.alert-info').removeClass('d-none');
		recalculateContentHeight();
		// hide info
		setTimeout( function() {
			info.addClass('d-none');
			recalculateContentHeight();
		}, 3000);
	} else {
		// hide record details on mobile
		if (container.hasClass('mobile')) {
			bootstrap.Modal.getInstance(document.getElementsByClassName('recordDetails '+selectedTable+' mobile')[0]).hide();
		}
		// move to confirmation modal
		$('#confirmEdited span.number').text(numberOfRecordsEdited);
		$('#confirmEdited div.listOfChanges').html('').append(table);
		new bootstrap.Modal(document.getElementById('confirmEdited'), {
			backdrop: 'static'
		}).show();
	}
};

$('#confirmEdited .btn-close, #confirmEdited .backBtn').on('click', function() {
	// check if mobile by checking if nav bar if collapsed
	if ($('nav .navbar-toggler').is(':visible')) {
		// move back to record details modal
		new bootstrap.Modal(document.getElementsByClassName('recordDetails '+selectedTable+' mobile')[0]).show();
	}
	recordDetailsToEditMode();
});

$('#confirmEdited .updateBtn').on('click', function() {
	// show spinner and disable update button
	$(this).attr('disabled', 'true').find('span').removeClass('d-none');
	$.ajax({
		url: "php/updateRecords.php",
		type: 'POST',
		dataType: 'json',
		data: {
			table: selectedTable,
			records: editedRecords
		},	
		success: updateDBsuccess,
		error: function(jqXHR, textStatus, errorThrown) {
			console.log("request failed");
			console.log(jqXHR);
			updateDBerror();
		}
	});
});

function updateDBsuccess(response) {
	// stop spinner and enable confirm button
	$('#confirmEdited .updateBtn').removeAttr('disabled').find('span').addClass('d-none');
	if (response.status.code == "200") {
		// show OK message and reconfigure buttons of confirmation modal
		$('#confirmEdited .alert-success').removeClass('d-none');
		$('#confirmEdited .alert-warning').addClass('d-none');
		$('#confirmEdited .updateBtn').addClass('d-none');
		$('#confirmEdited .backBtn').addClass('d-none');
		$('#confirmEdited .closeBtn').removeClass('d-none');
		// return to 'preview' mode of records details modal
		recordDetailsToPreviewMode();
		// reload table
		getRecords(selectedTable, 'toTable');
	} else {
		updateDBerror();
	}
};

function updateDBerror() {
	// stop spinner and enable button
	$('#confirmEdited .updateBtn').removeAttr('disabled').find('span').addClass('d-none');
	// show error message
	$('#confirmEdited .alert-success').addClass('d-none');
	$('#confirmEdited .alert-warning').removeClass('d-none');
};

$('#confirmEdited').on('hidden.bs.modal', function() {
	// return confirmation modal to default state
	$('#confirmEdited .alert-success').addClass('d-none');
	$('#confirmEdited .alert-warning').addClass('d-none');
	$('#confirmEdited .updateBtn').removeClass('d-none');
	$('#confirmEdited .backBtn').removeClass('d-none');
	$('#confirmEdited .closeBtn').addClass('d-none');
});

// ##############################################################################
// #                                  Duplicate                                 #
// ##############################################################################

$('.recordDetails').find('.duplicateBtn').on('click', function() {
	var container = $(this).closest('.recordDetails');
	var selectedRecords = getSelectedRecords();
	// hide record details on mobile
	if (container.hasClass('mobile')) {
		bootstrap.Modal.getInstance(document.getElementsByClassName('recordDetails '+selectedTable+' mobile')[0]).hide();
	}
	// move to confirmation modal
	$('#confirmDuplication span.number').text(selectedRecords.length);
	new bootstrap.Modal(document.getElementById('confirmDuplication'), {
		backdrop: 'static'
	}).show();
});

$('#confirmDuplication .btn-close, #confirmDuplication .backBtn').on('click', function() {
	// check if mobile by checking if nav bar if collapsed
	if ($('nav .navbar-toggler').is(':visible')) {
		// move back to record details modal
		new bootstrap.Modal(document.getElementsByClassName(' recordDetails '+selectedTable+' mobile')[0]).show();
	}
});

$('#confirmDuplication .duplicateBtn').on('click', function() {
	var selectedRecords = getSelectedRecords();
	// show spinner and disable duplicate button
	$(this).attr('disabled', 'true').find('span').removeClass('d-none');
	$.ajax({
		url: "php/duplicateRecords.php",
		type: 'POST',
		dataType: 'json',
		data: {
			table: selectedTable,
			records: selectedRecords
		},	
		success: duplicateDBsuccess,
		error: function(jqXHR, textStatus, errorThrown) {
			console.log("request failed");
			console.log(jqXHR);
			duplicateDBerror();
		}
	});
});

function duplicateDBsuccess(response) {
	// stop spinner and enable confirm button
	$('#confirmDuplication .duplicateBtn').removeAttr('disabled').find('span').addClass('d-none');
	if (response.status.code == "201") {
		// show OK message and reconfigure buttons of confirmation modal
		$('#confirmDuplication .alert-success').removeClass('d-none');
		$('#confirmDuplication .alert-warning').addClass('d-none');
		$('#confirmDuplication .duplicateBtn').addClass('d-none');
		$('#confirmDuplication .backBtn').addClass('d-none');
		$('#confirmDuplication .closeBtn').removeClass('d-none');
		// reload table
		getRecords(selectedTable, 'toTable');
	} else {
		duplicateDBerror();
	}
};

function duplicateDBerror() {
	// stop spinner and enable button
	$('#confirmDuplication .duplicateBtn').removeAttr('disabled').find('span').addClass('d-none');
	// show error message
	$('#confirmDuplication .alert-success').addClass('d-none');
	$('#confirmDuplication .alert-warning').removeClass('d-none');
};

$('#confirmDuplication').on('hidden.bs.modal', function() {
	// return confirmation modal to default state
	$('#confirmDuplication .alert-success').addClass('d-none');
	$('#confirmDuplication .alert-warning').addClass('d-none');
	$('#confirmDuplication .duplicateBtn').removeClass('d-none');
	$('#confirmDuplication .backBtn').removeClass('d-none');
	$('#confirmDuplication .closeBtn').addClass('d-none');
});

// ##############################################################################
// #                                  Delete                                    #
// ##############################################################################

function getListOfIds(records) {
	var list = [];
	records.forEach(function (record) {
		list.push(record.id);
	})
	return list;
}

$('.recordDetails').find('.deleteBtn').on('click', function() {
	var container = $(this).closest('.recordDetails');
	var selectedRecordIds = getListOfIds(getSelectedRecords());
	// hide record details on mobile
	if (container.hasClass('mobile')) {
		bootstrap.Modal.getInstance(document.getElementsByClassName('recordDetails '+selectedTable+' mobile')[0]).hide();
	}
	// move to confirmation modal
	$('#confirmDeletion span.numberOfRecordsToDelete').text(selectedRecordIds.length);
	new bootstrap.Modal(document.getElementById('confirmDeletion'), {
		backdrop: 'static'
	}).show();
});

$('#confirmDeletion .btn-close, #confirmDeletion .backBtn').on('click', function() {
	// check if mobile by checking if nav bar if collapsed
	if ($('nav .navbar-toggler').is(':visible')) {
		// move back to record details modal
		new bootstrap.Modal(document.getElementsByClassName('recordDetails '+selectedTable+' mobile')[0]).show();
	}
	recordDetailsToEditMode();
});

$('#confirmDeletion .deleteBtn').on('click', function() {
	var selectedRecordIds = getListOfIds(getSelectedRecords());
	// show spinner and disable delete button
	$(this).attr('disabled', 'true').find('span').removeClass('d-none');
	$.ajax({
		url: "php/deleteRecords.php",
		type: 'POST',
		dataType: 'json',
		data: {
			table: selectedTable,
			records: selectedRecordIds,
			newDependency: {}
		},	
		success: deleteDBsuccess,
		error: function(jqXHR, textStatus, errorThrown) {
			console.log("request failed");
			console.log(jqXHR);
			deleteDBerror();
		}
	});
});

function deleteDBsuccess(response) {
	// stop spinner and enable confirm button
	$('#confirmDeletion .deleteBtn').removeAttr('disabled').find('span').addClass('d-none');
	$('#confirmDeletion .releaseDependenciesBtn').removeAttr('disabled').find('span').addClass('d-none');
	switch (response.status.code) {
		case '400': {
			deleteDBerror();
		}
		case '204': {
			// show OK message and reconfigure buttons of confirmation modal
			$('#confirmDeletion .alert-success').removeClass('d-none');
			$('#confirmDeletion .alert-warning').addClass('d-none');
			$('#confirmDeletion .deleteBtn').addClass('d-none');
			$('#confirmDeletion .backBtn').addClass('d-none');
			$('#confirmDeletion .closeBtn').removeClass('d-none');
			$('#confirmDeletion .deleteMessage').addClass('d-none');
			$('#confirmDeletion .dependenciesDetails').addClass('d-none');
			$('#confirmDeletion .releaseDependenciesBtn').addClass('d-none');
			// reload table
			getRecords(selectedTable, 'toTable');
		} break;
		case '202': {
			// some records has dependencies
			$('#confirmDeletion .alert-success').addClass('d-none');
			$('#confirmDeletion .alert-warning.dependencies').removeClass('d-none');
			$('#confirmDeletion .alert-warning.error').addClass('d-none');
			$('#confirmDeletion .deleteBtn').addClass('d-none');
			$('#confirmDeletion .editDependenciesBtn').removeClass('d-none');
			$('#confirmDeletion .deleteMessage').addClass('d-none');
			$('#confirmDeletion .dependenciesDetails').addClass('d-none');
			$('#confirmDeletion .releaseDependenciesBtn').addClass('d-none');

			// prepare list of dependencies foe each record to delete, which has dependencies
			var recordsWithDependencies = response.recordsWithDependencies;
			var alternatives = response.alternatives;
			var quantity = Object.keys(recordsWithDependencies).length;
			$('#confirmDeletion span.numberOfRecorsWithDependencies').text(quantity);
			var container = $('#confirmDeletion .dependenciesDetails').html('');
			for (var recordIdToDelete in recordsWithDependencies) {
				var dependentRecords = recordsWithDependencies[recordIdToDelete].dependencies;
				var valueOfRecordToDelete = recordsWithDependencies[recordIdToDelete].value;

				// build text message
				var numberOfRecordsText1;
				var numberOfRecordsText2;
				if (dependentRecords.length == 1) {
					numberOfRecordsText1 = 'is 1 record';
					numberOfRecordsText2 = 'it';
				} else {
					numberOfRecordsText1 = 'are ' + dependentRecords.length + ' records';
					numberOfRecordsText2 = 'them';
				}
				var dependencyText = valueOfRecordToDelete + ' ' + nameTranslations[selectedTable].displayName;
				var infoText = 'There '+numberOfRecordsText1+' dependend on ' + dependencyText
								+ ', which you selected to delete. Where you would like to move '
								+ numberOfRecordsText2 + '?';
				container.append($('<p></p>').text(infoText));
				
				// build options list
				var select = $('<select></select>').addClass('form-select').attr('id', recordIdToDelete);
				if (alternatives.length == 0) {
					// no alternative options, inform user
					select.append($("<option></option>").val('unchange').text('No alternatives available.').addClass('d-none'));
				} else {
					// first  option is a message to user
					select.append($("<option></option>").val('unchange').text('Please select alternative').addClass('d-none'));
					alternatives.forEach(function(option) {
						var text = option.name;
						if ('location' in option) {
							text += ' ('+option.location+')';
						}
						select.append($("<option></option>").val(option.id).text(text));
					});
				}
				select.append($("<option></option>").val('unchange').text('Leave unchanged'));
				container.append(select);

				// spacer
				container.append($('<hr>'));
			};

		} break;
	}
};

function deleteDBerror() {
	// stop spinner and enable button
	$('#confirmDeletion .deleteBtn').removeAttr('disabled').find('span').addClass('d-none');
	$('#confirmDeletion .releaseDependenciesBtn').removeAttr('disabled').find('span').addClass('d-none');
	// show error message
	$('#confirmDeletion .alert-success').addClass('d-none');
	$('#confirmDeletion .alert-warning.dependencies').addClass('d-none');
	$('#confirmDeletion .alert-warning.error').removeClass('d-none');
	$('#confirmDeletion .deleteMessage').addClass('d-none');
};

$('#confirmDeletion').on('hidden.bs.modal', function() {
	// return confirmation modal to default state
	$('#confirmDeletion .alert-success').addClass('d-none');
	$('#confirmDeletion .alert-warning').addClass('d-none');
	$('#confirmDeletion .deleteBtn').removeClass('d-none');
	$('#confirmDeletion .backBtn').removeClass('d-none');
	$('#confirmDeletion .closeBtn').addClass('d-none');
	$('#confirmDeletion .editDependenciesBtn').addClass('d-none');
	$('#confirmDeletion .dependenciesDetails').addClass('d-none');
	$('#confirmDeletion .deleteMessage').removeClass('d-none');
	$('#confirmDeletion .releaseDependenciesBtn').addClass('d-none');
});

$('#confirmDeletion .editDependenciesBtn').on('click', function() {
	// hide alerts and reconfigure buttons to update dependencies
	$('#confirmDeletion .alert-success').addClass('d-none');
	$('#confirmDeletion .alert-warning').addClass('d-none');
	$('#confirmDeletion .editDependenciesBtn').addClass('d-none');
	$('#confirmDeletion .releaseDependenciesBtn').removeClass('d-none');
	// show dependencies details/list
	$('#confirmDeletion .dependenciesDetails').removeClass('d-none');
});

$('#confirmDeletion .releaseDependenciesBtn').on('click', function() {
	
	// show spinner and disable button
	$(this).attr('disabled', 'true').find('span').removeClass('d-none');
	
	// read DOM
	var selects = $('#confirmDeletion .dependenciesDetails').find('select');
	var recordsToDelete = [];
	var newDependency = {};
	selects.each(function() {
		var idOfRecordToDelete = $(this).attr('id');
		recordsToDelete.push(idOfRecordToDelete);
		var newIdOfDepencency = $(this).val();
		if (newIdOfDepencency != 'unchange') {
			newDependency[idOfRecordToDelete] = newIdOfDepencency;
		}
	});

	// send request, the success and error function creates a loop
	// so user can iterate dependencies as long as he want or break the loop any time.
	$.ajax({
		url: "php/deleteRecords.php",
		type: 'POST',
		dataType: 'json',
		data: {
			table: selectedTable,
			records: recordsToDelete,
			newDependency: newDependency,
		},
		success: deleteDBsuccess,
		error: function(jqXHR, textStatus, errorThrown) {
			console.log("request failed");
			console.log(jqXHR);
			deleteDBerror();
		}
	});
});

