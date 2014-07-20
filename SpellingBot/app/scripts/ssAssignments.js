"use script"
var ss_logMessages = [];
var ss_logDate = new Date();
function ss_log(msg) {
  ss_logMessages.push(ss_logDate.toUTCString() + ":" + msg);
  if (ss_logMessages > 200)
    ss_logMessages = ss_logMessages.slice(100);
}
function ss_loadTeachers(callback) {
  // Lookup all SteamSpaceKeyFiles, should be one for teacher.
  gapi.client.load('drive', 'v2', function() {
    var queryString = "title contains 'SteamSpaceKeyFile' and mimeType = 'application/vnd.google-apps.spreadsheet'"
    var request = gapi.client.drive.files.list({ 'q' : queryString});
    request.execute(function(response) {
      if (response.items === undefined || response.items.length == 0) {
        ss_log("No key files found.");
        return callback(null);
      }
      var teachers = [];
      for (i = 0; i < response.items.length; i++) {
        var entry = response.items[i];
        if (entry.labels.trashed == true) continue;
        var teacherName = entry.title.replace('SteamSpaceKeyFile-','');
        teachers.push({ name: teacherName, teacherKey: entry.description }); // key is in the description!
      }
      ss_log("Found " + teachers.length + " key files.");
      callback(teachers);
    });
  });
}
function ss_loadAssignmentsOld(teacherKey, callback) {
  ss_log('Got Key!' + teacherKey);
  var assignments = [
    { name: "Week of July 14", key: 'AKfycbwK-KmB0ncqSRD1Hais-48oLsx14CohM2jje9Z3xgol4Z953Dc' },
    { name: "Week of July 7", key: 'AKfycbwK-KmB0ncqSRD1Hais-48oLsx14CohM2jje9Z3xgol4Z953Dc' },
    ];
  callback(assignments);
}
function ss_loadAssignment(assignmentKey, loginID, callback) {
  ss_callWebApp(assignmentKey, 'LoginID='+loginID, "get", function(json, errormess) {
    if (json == null) { ss_log(errormess); callback(null);   }  // failure.
    else {
      callback(json);
    }
  });
}
function ss_loadAssignments(teacherKey, emailID, callback) {

  var datatemplate = "LoginID=$0&AppName=SpellingBot";
  var params = datatemplate.replace('$0', emailID);
  
  ss_callWebApp(teacherKey, params, "get", function(json, errormess) {
    if (json == null) { ss_log(errormess); callback(null);   }  // failure.
    else {
      var assignments = [];
      JSON.parse(json).forEach(
        function(x) { 
          var obj =  { name: x.AssignmentName, key: x.Key};
          assignments.push(obj);
        }
      );
      callback(assignments);
    }
  });
}