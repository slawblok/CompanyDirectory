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

// ##############################################################################
// #                        General section                                     # 
// ##############################################################################

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
	getRecords('personnel');

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
	var selectedTable = event.target.attributes.value.value;
	getRecords(selectedTable);
});

// ##############################################################################
// #                        Displaying records                                  # 
// ##############################################################################

function cloaseRecordDetailsAtDesktop() {
	Object.keys(nameTranslations).forEach( key => {
		$('#'+key+'AtDesktop').removeClass('d-md-block');
	})
	recalculateContentHeight();
}

$('#personnelAtDesktop button.btn-close').on('click', cloaseRecordDetailsAtDesktop);

$('#departmentAtDesktop button.btn-close').on('click', cloaseRecordDetailsAtDesktop);

$('#locationAtDesktop button.btn-close').on('click', cloaseRecordDetailsAtDesktop);

$('#showRecordsBtnM').on('click', function() {
	closeColOrderPopover();
	var table = localRecords.table;
	new bootstrap.Modal(document.getElementById(table+'AtMobile')).show();
});

function displaySelectedRecordsDetails(){

	// get selected records
	var selectedRows = dataTable.rows( { selected: true } ).data();
	var selectedRecords = [];
	for (var i=0; i<selectedRows.length; i++) {
		selectedRecords.push(selectedRows[i]);
	}
	
	// combine records if more than one selected
	var recordCombined = {};
	var messageForMultipleEntries = '...multiple entries...';
	// copy first record as-is
	for (var key in selectedRecords[0]) {
		recordCombined[key] = selectedRecords[0][key];
	}
	// compare with remainings records
	selectedRecords.forEach(function(selectedRecord) {
		for (var key in selectedRecord) {
			if (recordCombined[key] != messageForMultipleEntries) {
				if (recordCombined[key] != selectedRecord[key]) {
					recordCombined[key] = messageForMultipleEntries;
				}
			}
		}
	});

	// update DOM with record details
	var table = localRecords.table;
	$('#'+table+'AtDesktop').children('#recordId').text(recordCombined.DT_RowId);
	$('#'+table+'AtMobile .modal-content .modal-body').children('#recordId').text(recordCombined.DT_RowId);
	Object.keys(nameTranslations[table]['columnsList']).forEach( (key, index) => {
		var currentIndex = dataTable.colReorder.transpose( index );
		var value = recordCombined[currentIndex];
		$('#'+table+'AtDesktop').children('#'+key).text(value);
		$('#'+table+'AtMobile .modal-content .modal-body').children('#'+key).text(value);
	});

	// show profile for Desktop
	$('#'+table+'AtDesktop').addClass('d-md-block');
	
	// show button for Mobile
	$('#showRecordsBtnM').removeClass('d-none');

	recalculateContentHeight();
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

function displayRecordsList(records) {
	// hide modals, popup
	cloaseRecordDetailsAtDesktop();
	closeColOrderPopover();

	// hide button for Mobile
	$('#showRecordsBtnM').addClass('d-none');

	var table = generateTable(records);
	$('#content').html('').append(table);
	
	// DataTable uses below extensions:
	// - Responsive
	// - ColReorder
	// - Select
	dataTable = $('#content > table').DataTable({
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
		dom: 'lrtp'			// remove 'i' to stop displaying bottom infor
	})
	.on('select', displaySelectedRecordsDetails)
	.on('deselect', function (e, dt, type, indexes) {
		// check if 1 or more 1 selected
		if (dt.rows( { selected: true } ).data().length > 0) {
			displaySelectedRecordsDetails();
		} else {
			// hide modals, which shows record details at Desktop
			cloaseRecordDetailsAtDesktop();
			// hide button for Mobile
			$('#showRecordsBtnM').addClass('d-none');
		}
	});
	
	$('#tableSelectionDropdown > a > span').text(nameTranslations[records.table].displayName);
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

$('#navbarSupportedContent  li.dropdown').on('hidden.bs.dropdown',function() {
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
	bootstrap.Tooltip.Default.allowList.label = [];
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
		content.find('.btn-close').on('click', closeColOrderPopover);
		assignActionsForColOrder(content);
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