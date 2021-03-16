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

    // iterate over all requested records
    $deleted = [];
    $withDependencies = [];
    $error = [];
    foreach ($_POST['records'] as $id) {
        
        $result = tryToRemoveRecord($conn, $_POST['table'], $id);
        
        switch($result['status']) {
            case 'deleted': {
                array_push($deleted, $id); 
            } break;
            case 'withDependencies': {
                $withDependencies[$id]['dependencies'] = $result['dependencies'];
                $withDependencies[$id]['type'] = $result['type'];
                $withDependencies[$id]['value'] = $result['value'];
            } break;
            case 'error': {
                array_push($error, $id); 
            } break;
        }

    }
    $output['deleted'] = $deleted;
    $output['recordsWithDependencies'] = $withDependencies;
    $output['error'] = $error;

    // if there are dependencies, then get list of alternatives
    if (count($withDependencies) > 0) {
        $output['alternatives'] = getAlternatives($conn, $_POST['table'], $_POST['records']);
    }

    // determine the status
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

    // ############################### Helper function ############################################

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
                $query = 'SELECT p.id, d.name as value FROM personnel p LEFT JOIN department d ON (d.id = p.departmentID) WHERE p.departmentID = ' . $id;
                $result['type'] = 'personnel';
                $result['field'] = 'departmentID';
            } break;
            case 'location': {
                // need to check if there is department which belongs to this location
                $query = 'SELECT d.id, l.name as value FROM department d LEFT JOIN location l ON (l.id = d.locationID) WHERE d.locationID = ' . $id;
                $result['type'] = 'department';
                $result['field'] = 'locationID';
            } break;
        }
        
        $dBresult = $conn->query($query);
        
        if (!$dBresult) {
            // error occured during checking dependencies
            $result['status'] = 'error';
        } else {
            $dependencies = [];
            while ($row = mysqli_fetch_assoc($dBresult)) {
                array_push($dependencies, $row['id']);
                $result['value'] = $row['value'];
            }
            if (count($dependencies) == 0) {
                // no dependencies; thus record can be to removed
                $result['status'] = removeRecord($conn, $table, $id);
            } else {
                // record cannot be removed, because dependecies are reported
                // check if alternative was provided and try to update
                if (tryToUpdateDependency($conn, $result['type'], $result['field'], $dependencies, $id)) {
                    // no more dependencies thus can be removed
                    $result['status'] = removeRecord($conn, $table, $id);
                } else {
                    // dependenciew were not updated/released
                    $result['status'] = 'withDependencies';
                    $result['dependencies'] = $dependencies;
                }
            }
        }
        return $result;
    }

    function tryToUpdateDependency($conn, $table, $field, $dependencies, $id) {
        
        if (array_key_exists('newDependency', $_POST)) {
            if (array_key_exists($id, $_POST['newDependency'])) {
                $newValue = $_POST['newDependency'][$id];
                $status = true;
                foreach ($dependencies as $dependencieId) {
                    $query = 'UPDATE ' . $table . ' SET ' . $field . ' = ' . $newValue . ' WHERE id = ' . $dependencieId;
                    $dBresult = $conn->query($query);
                    if (!$dBresult) {
                        $status = false;
                    }
                }
                return $status;
            }
        } 
        return false;
    }

    function removeRecord($conn, $table, $id) {
        $query = 'DELETE FROM ' . $table . ' WHERE id = ' . $id;
        
        $dBresult = $conn->query($query);
        
        if ($dBresult) {
            return 'deleted';
        } else {
            return 'error';
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
                $query = 'SELECT d.id, d.name, l.name as location FROM department d LEFT JOIN location l ON (l.id = d.locationID) ORDER BY d.name, l.name';
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