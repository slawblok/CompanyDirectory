<?php

	// example use from browser
	// http://localhost/companydirectory/libs/php/getAll.php

	// remove next two lines for production
	
	ini_set('display_errors', 'On');
	error_reporting(E_ALL);

	$executionStartTime = microtime(true);

	include("config.php");

	header('Content-Type: application/json; charset=UTF-8');

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

    $deleted = [];
    $withDependencies = [];
    $error = [];
    
    // iterate over all requested records
    foreach ($_POST['records'] as $id) {
        
        $result = tryToRemoveRecord($conn, $_POST['table'], $id);
        
        switch($result['status']) {
            case 'deleted': {
                array_push($deleted, $id); 
            } break;
            case 'withDependencies': {
                $withDependencies[$id]['records'] = $result['dependencies'];
                $withDependencies[$id]['type'] = $result['type'];
            } break;
            case 'error': {
                array_push($error, $id); 
            } break;
        }

    }

    $output['deleted'] = $deleted;
    $output['withDependencies'] = $withDependencies;
    $output['error'] = $error;

    // if there are dependencies, then get list of alternatives
    if (count($withDependencies) > 0) {
        $output['alternatives'] = getAlternatives($conn, $_POST['table'], $_POST['records']);
    }

    if (count($deleted) == count($_POST['records'])) {
        // all records removed
        $output['status']['code'] = "204";
	    $output['status']['name'] = "ok";
	    $output['status']['description'] = "all requested records removed";
    } else {
        if (count($error) == 0) {
            // no error, but some records cannot be removed due to dependencies
            $output['status']['code'] = "202";
	        $output['status']['name'] = "accepted";
	        $output['status']['description'] = "some records cannot be removed due to dependencies";
        } else {
            $output['status']['code'] = "400";
	        $output['status']['name'] = "error";
	        $output['status']['description'] = "errors occured during records removal, some records might be removed and some not";
        }
    }
	
	$output['status']['returnedIn'] = (microtime(true) - $executionStartTime) / 1000 . " ms";

	mysqli_close($conn);

	echo json_encode($output); 

    // ############################################################################################ 

    function tryToRemoveRecord($conn, $table, $id) {
        
        $query;
        $result;
        switch ($table){
            case 'personnel': {
                // there is no dependencies by the DB definition; thus it can go straight to remove request
                $result['status'] = removeRecord($conn, $table, $id);
                return $result;
            } break;
            case 'department': {
                // need to check if there is/are personel who belongs to this department
                $query = 'SELECT p.id, p.lastName, p.firstName, p.jobTitle, p.email, p.departmentID, d.name as department FROM personnel p LEFT JOIN department d ON (d.id = p.departmentID) WHERE p.departmentID = "' . $id . '"';
                $result['type'] = 'personnel';
            } break;
            case 'location': {
                // need to check if there is department which belongs to this location
                $query = 'SELECT d.id, d.name, d.locationID, l.name as location FROM department d LEFT JOIN location l ON (l.id = d.locationID) WHERE d.locationID = "' . $id . '"';
                $result['type'] = 'department';
            } break;
        }
        
        $dBresult = $conn->query($query);
        
        if (!$dBresult) {
            // error occured during checking dependencies
            $result['status'] = 'error';
        } else {
            $dependencies = [];
            while ($row = mysqli_fetch_assoc($dBresult)) {
                array_push($dependencies, $row);
            }
            if (count($dependencies) == 0) {
                // no dependencies; thus record can be to removed
                $result['status'] = removeRecord($conn, $table, $id);
            } else {
                // record cannot be removed, dependecies are reported
                $result['status'] = 'withDependencies';
                $result['dependencies'] = $dependencies;
            }
        }
        return $result;
    }

    function removeRecord($conn, $table, $id) {
        $query = 'DELETE FROM '.$table.' WHERE id = '.$id;
        
        // TEST: simulate error
        //if ($id == 6 || $id == 4) return 'error';

        // TEST: simulate removal
        $dBresult = true;// $conn->query($query);
        
        if (!$dBresult) {
            return 'error';
        } else {
            return 'deleted';
        }
    }

    function getAlternatives($conn, $table, $recordsToDelete) {

        // get all options

        $query = null;
        switch ($_POST['table']){
            case 'personnel': {
                // there is no dependencies by the DP definition
            } break;
            case 'department': {
                $query = 'SELECT d.id, d.name, d.locationID, l.name as location FROM department d LEFT JOIN location l ON (l.id = d.locationID) ORDER BY d.name, l.name';
            } break;
            case 'location': {
                $query = 'SELECT id, name FROM location ORDER BY name';
            } break;
        }

        $result = $conn->query($query);

        $alternatives = [];
        if ($result) {
            while ($option = mysqli_fetch_assoc($result)) {
                $addOption = true; 
                // dont add this option if it is intended to be removed
                foreach ($recordsToDelete as $recordToDelete) {
                    if ($option['id'] == $recordToDelete) {
                        $addOption = false;
                    }
                }
                if ($addOption) array_push($alternatives, $option);
            }
        }

        return $alternatives;
    }
        

?>