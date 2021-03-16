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
	
	// iterate over all records to create
	foreach ($_POST['records'] as $record) {
		
		$query = null;
		switch ($_POST['table']){
			case 'personnel': {
				$query = 'INSERT INTO personnel (id, firstName, lastName, jobTitle, email, departmentID) VALUES (NULL, "' . $record['firstName'] . '", "' . $record['lastName'] . '", "' . $record['jobTitle'] . '", "' . $record['email'] . '", "' . $record['departmentID'] . '")';
            } break;
			case 'department': {
                $query = 'INSERT INTO department (id, name, locationID) VALUES (NULL, "' . $record['name'] . '", "' . $record['locationID'] . '")';
            } break;
			case 'location': {
                $query = 'INSERT INTO location (id, name) VALUES (NULL, "' . $record['name'] . '")'; 
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
   
	$output['status']['code'] = "201";
	$output['status']['name'] = "ok";
	$output['status']['description'] = "success";
	$output['status']['returnedIn'] = (microtime(true) - $executionStartTime) / 1000 . " ms";
	mysqli_close($conn);
	echo json_encode($output); 

?>