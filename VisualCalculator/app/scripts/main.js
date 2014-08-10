'use strict'
var _that;
function ss_init(loginID, emailID) { // called on auth complete, kicks off menu initialization.
  _that.initGUIForSteamspace(loginID, emailID);
}
// Setup GUI - Called on page load.

$(function () {
  'use strict';
  var voices = window.speechSynthesis.getVoices();  // this needs time to load, kick it off.
  //window.setTimeout(slowStart, 2000);
  slowStart();
  
});
function slowStart() {
  var gui = new GUISetup();
  ss_getUserInfo(true);
}


// handle user clicks. required because I used innerHTML property below.
function teacherSelected(teacherKey, emailID) { _that.teacherSelected(teacherKey, emailID); }
function assignmentSelected(assignmentKey) { _that.assignmentSelected(assignmentKey); }

function GUISetup() {
  // ===== Generic Setup ======
  _that = this;
  var querySelector = document.querySelector.bind(document);

  var navdrawerContainer = querySelector('.navdrawer-container');
  var body = document.body;
  var appbarElement = querySelector('.app-bar');
  var menuBtn = querySelector('.menu');
  var main = querySelector('main');
  
  var selectMenu = querySelector('.selectMenu-container');
  var selectMenuButton = querySelector('.selectMenu');
  selectMenu.style.display='none';

  function closeMenu() {
    body.classList.remove('open');
    appbarElement.classList.remove('open');
    navdrawerContainer.classList.remove('open');
    selectMenu.style.display = 'none';
  }

  function toggleMenu() {
    body.classList.toggle('open');
    appbarElement.classList.toggle('open');
    navdrawerContainer.classList.toggle('open');
  }
  function hideSelectMenu() {      selectMenu.style.display = 'none'; }
  function toggleSelectMenu() {
    if (selectMenu.style.display == 'none')
      selectMenu.style.display = 'block';
    else
      selectMenu.style.display = 'none';
  }

  selectMenuButton.addEventListener('click', toggleSelectMenu);
  main.addEventListener('click', closeMenu);
  menuBtn.addEventListener('click', toggleMenu);
  navdrawerContainer.addEventListener('click', function (event) {
    if (event.target.nodeName === 'A' || event.target.nodeName === 'LI') {
      closeMenu();
    }
  });
  // ======= Handle Steamspace Initialization ========
  var _loginID = "";
  var _emailID = "";
  var _ssPanel;
  this._successfulAuthorization = false;
  this.initGUIForSteamspace = function (loginID, emailID) {
    var querySelector = document.querySelector.bind(document);
    var main = querySelector('main');
    _ssPanel = new ssPanel(main);

    _that._successfulAuthorization = true;
    if (window.SpeechSynthesisUtterance === undefined) {
      return _ssPanel.errorMsg("This browser does not support Speech Synthesis. Try another browser, like Chrome.")
    }
    if (loginID == null) return _ssPanel.errorMsg("You are not logged in. Please log in to Google, and restart.");
    _loginID = loginID;
    _emailID = emailID;

    initApp(_emailID, _ssPanel);
    _ssPanel.showLoading(true);
    ss_loadTeachers(initSelectMenuForTeachers);
  }

  // Some browsers won't show pop-ups except in response to a user click.
  // so if we timeout, lets put up a button to allow use to initiate login sequence.
  this.showLoginButton = function() {
    console.log("in here.");
    if (_that._successfulAuthorization) return; 
    _ssPanel.setContent("<button onclick='tryLogin()'>Click to Login to Google</button>");
  }
  console.log("set timeout.");
  // Turned off for now. Only makes sense for browser interactions.
  //window.setTimeout(this.showLoginButton, 5000);

  function initSelectMenuForTeachers(teachers) {
    _ssPanel.showLoading(false);
    var menuEl = document.getElementById('teacherMenu');
    if (teachers == null || teachers.length == 0) {
      menuEl.innerHTML = '<li><h4>No Teachers Defined</h4></li>';
      return _ssPanel.errorMsg('In order to use this app, you need a key file from your teacher.');
    }
    _ssPanel.errorMsg('');

    var html = '';
    html += '<li ><h4 class="selectMenu-container-header" >Welcome ' + _loginID + '!</h4></li>';
    if (teachers.length > 1)
      html += '<li><h4>Please select a teacher:</h4></li>';
    else
      html += '<li><h4>Your teacher is:</h4></li>'
    var template = "<li><a id='$0' >$1</a></li>";
    for (var i=0; i < teachers.length; i++) {
      var id = "teacher"+i;
      html += template.replace('$0', id)
                      .replace('$1',teachers[i].name);
    }
    menuEl.innerHTML = html;
    for (var i=0; i < teachers.length; i++) {
      var id = "teacher"+i;
      var el = document.getElementById(id);
      var tkey = teachers[i].teacherKey;
      console.log(tkey);
      (function(t,e) { el.onclick = function() { teacherSelected(t,e)  }; })(tkey, _emailID);
    }      
    if (teachers.length == 1)
      teacherSelected(teachers[0].teacherKey, _emailID);
    else {
      toggleSelectMenu();
    }
  }
  var _teacherKey;
  this.teacherSelected = function(teacherKey, loginID) {
    console.log("key is " + teacherKey);
    _teacherKey = teacherKey;
    _ssPanel.normalMsg('');
    hideSelectMenu();
    _ssPanel.showLoading(true);
    ss_loadAssignments(teacherKey, loginID, initAssignmentMenu, "VisualCalculator");
  }
  function initAssignmentMenu(assignments) {
    var menuEl = document.getElementById('assignmentMenu');
    if (assignments == null || assignments.length == 0) {
      menuEl.innerHTML = '<li><h4>No Assignments Defined</h4></li>';
      return _ssPanel.errorMsg('Your teacher has not defined any assignments. Please check back later.');
    }
    _ssPanel.errorMsg('');
  
    var html = '';
    if (assignments.length > 1)
      html += '<li><h4>Pick an Assignment:</h4></li>';
    else
      html = '<li><h4>Current Assignment:</h4></li>'
    var template = '<li><a id=\'$0\'>$1</a></li>';
    for (var i=0; i < assignments.length; i++) {
      var id = 'assignment_'+i;
      html += template.replace('$0',id).replace('$1',assignments[i].name);
    }
    menuEl.innerHTML = html;
    for (var i=0; i < assignments.length; i++) {
      var id = 'assignment_'+i;
      var el = document.getElementById(id);

      (function(ss) { el.onclick = function() {  assignmentSelected(ss);  }; })(assignments[i].spreadSheet);
    }
    
    assignmentSelected(assignments[0].spreadSheet);
  }
  this.assignmentSelected = function(spreadSheet) {
    closeMenu();
    _ssPanel.errorMsg('');
    ss_loadAssignment(_teacherKey, spreadSheet, _emailID, assignmentCallback);
  }
}