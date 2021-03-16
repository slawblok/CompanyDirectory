<?php

	// example use from browser
	// http://localhost/companydirectory/libs/php/getAll.php

	// remove next two lines for production
	ini_set('display_errors', 'On');
	error_reporting(E_ALL);
	$executionStartTime = microtime(true);
	include("config.php");
	header('Content-Type: application/json; charset=UTF-8');

	// create conection to DB
	$conn = new mysqli($cd_host, $cd_user, $cd_password, $cd_dbname, $cd_port, $cd_socket);
	if (mysqli_connect_errno()) {
		$output['status']['code'] = "300";
		$output['status']['name'] = "failure";
		$output['status']['description'] = "database unavailable";
		$output['status']['returnedIn'] = (microtime(true) - $executionStartTime) / 1000 . " ms";
		$output['data'] = [];
		mysqli_close($conn);
		echo json_encode($output);
		exit;
	}	

	// get filterst from POST if exists
	$filters = [];
	if (array_key_exists('filters', $_POST)) {
		$filters = $_POST['filters'];
	}

	$query = null;
	switch ($_POST['table']){
		case 'personnel': {
			// select and left join
			$query = 'SELECT p.id, p.lastName, p.firstName, p.jobTitle, p.email, p.departmentID, d.name as department, d.locationID, l.name as location FROM personnel p LEFT JOIN department d ON (d.id = p.departmentID) LEFT JOIN location l ON (l.id = d.locationID)';
			// apply filters
			$query .= applyFilters($filters);
			// order
			$query .= ' ORDER BY p.lastName, p.firstName, d.name, l.name';
		} break;
		case 'department': {
			// select and left join
			$query = 'SELECT d.id, d.name, d.locationID, l.name as location FROM department d LEFT JOIN location l ON (l.id = d.locationID)';
			// apply filters
			$query .= applyFilters($filters);
			// order
			$query .= ' ORDER BY d.name, l.name';
		} break;
		case 'location': {
			// select
			$query = 'SELECT id, name FROM location';
			// apply filters
			$query .= applyFilters($filters);
			// order
			$query .=' ORDER BY name';
		} break;
	}
	
	$result = $conn->query($query);
	if (!$result) {
		$output['status']['code'] = "400";
		$output['status']['name'] = "executed";
		$output['status']['description'] = "query failed";	
		$output['records'] = [];
		mysqli_close($conn);
		echo json_encode($output); 
		exit;
	}
   
   	$records = [];
	while ($row = mysqli_fetch_assoc($result)) {
		array_push($records, $row);
	}
	$output['records'] = $records;

	$output['status']['code'] = "200";
	$output['status']['name'] = "ok";
	$output['status']['description'] = "success";
	$output['status']['returnedIn'] = (microtime(true) - $executionStartTime) / 1000 . " ms";
	mysqli_close($conn);
	echo json_encode($output); 

	// ############################### Helper function ############################################

	function applyFilters($filters) {
		$query = '';
		// apply filters if exists
		if (count($filters) > 0) {
			$query .= ' WHERE';
			$addAnd = false;
			foreach ($filters as $filter) {
				// 1st run does not add 'and' at the begining, but followings runs does 
				if ($addAnd) {
					$query .= ' and';
				}
				$addAnd = true;
				// convert 'key'
				$key;
				switch($filter['key']) {
					case 'department': {
						$key = 'd.name';
					} break;
					case 'location': {
						$key = 'l.name';
					} break;
					default: {
						$key = 'p.'.$filter['key'];
					}
				}
				// build query for given filter
				$query .= ' ' . $key . ' LIKE ' . '"%' . $filter['query'] . '%"';
			}
		}
		return $query;
	}


?>