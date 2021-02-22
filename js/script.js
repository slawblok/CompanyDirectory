var nameTranslations = {
	personnel : {	// this key must match name in DB
		displayName : 'Personel',
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
			name: 'Name',
			location: 'Location'
		}
	},
	location : {	// this key must match name in DB
		displayName : 'Location',
		columnsList : {
			// all below keys must match name in DB
			name: 'Name'
		}
	},
}

function showRecords(response) {
	
	var columnsList = nameTranslations[response.table].columnsList;

	// define columns titles
	var columnsTitles = $("<tr></tr>");
	columnsTitles.append($("<th></th>").text('').attr("scope", "col"));
	for (var key in columnsList) { 
		columnsTitles.append($("<th></th>").text(columnsList[key]).attr("scope", "col"));
	};
		
	// define table body
	var tableBody = $("<tbody></tbody>");
	var rowNumber = 1;
	response.data.forEach(function(element) {
		// define row
		var row = $("<tr></tr>");
		row.append($("<th></th>").text(rowNumber++).attr("scope", "row"));
		for (var key in columnsList){
			row.append($("<td></td>").text(element[key]));
		}
		tableBody.append(row);
	});

	// load table columns titles and body to table
	var table = $("<table></table>").attr("class", "table table-hover");
	table.append($("<thead></thead>").append(columnsTitles));
	table.append(tableBody);

	// update DOM
	$('#dataTable').html('').append(table);
	$('#totalNumberOfRecords').text(response.data.length);
	$('#tableSelectionDropdown > a').text(nameTranslations[response.table].displayName);
}

function changeTable(selectedTable){
	// request all records
	$.ajax({
		url: "php/getAll.php",
		type: 'POST',
		dataType: 'json',
		data: {
			table: selectedTable
		},		
		success: function(response) {
			showRecords(response);
		},
		error: function(jqXHR, textStatus, errorThrown) {
			console.log("request failed");
			console.log(jqXHR);
		}
	});
}

function changeTableHandler(event) {
	var selectedTable = event.target.attributes.value.value;
	changeTable(selectedTable);
}

// action when user click to change the table
$('#tableSelectionDropdown > ul').on('click', 'li', changeTableHandler);

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

	// display preloader
	if ($('#preloader').length) {
		$('#preloader').delay(100).fadeOut('slow', function () {
			$(this).remove();
		});
	}
});