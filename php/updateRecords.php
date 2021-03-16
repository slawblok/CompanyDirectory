<?php

	// example use from browser
	// http://localhost/companydirectory/libs/php/getAll.php

	// remove next two lines for production
	//ini_set('display_errors', 'On');
	//error_reporting(E_ALL);
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
		mysqli_close($conn);
		echo json_encode($output);
		exit;
	}	
	
	// iterate over all records to update
	foreach ($_POST['records'] as $record) {
		
		$query = null;
		switch ($_POST['table']){
			case 'personnel': {
				$query = 'UPDATE personnel SET firstName = "' . $record['firstName'] . '", lastName = "' . $record['lastName'] . '", jobTitle = "' . $record['jobTitle'] . '", email = "' . $record['email'] . '", departmentID = ' . $record['departmentID'] . ' WHERE id = ' . $record['id']; 	
			} break;
			case 'department': {
				$query = 'UPDATE department SET name = "' . $record['name'] . '", locationID = ' . $record['locationID'] . ' WHERE id = ' . $record['id']; 	
			} break;
			case 'location': {
				$query = 'UPDATE location SET name = "' . $record['name'] . '" WHERE id = ' . $record['id']; 
			} break;
		}
		
		$result = $conn->query($query);
		if (!$result) {
			$output['status']['code'] = "400";
			$output['status']['name'] = "executed";
			$output['status']['description'] = "query failed";
			mysqli_close($conn);
			echo json_encode($output); 
			exit;
		}
	}
   
	$output['status']['code'] = "200";
	$output['status']['name'] = "ok";
	$output['status']['description'] = "success";
	$output['status']['returnedIn'] = (microtime(true) - $executionStartTime) / 1000 . " ms";
	mysqli_close($conn);
	echo json_encode($output); 

?>