/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*global define, $, brackets, window, event, CustomEvent, localStorage, setTimeout */

var PhoneGapBuild = function () {
    'use strict';
	var URL_BASE = "https://build.phonegap.com",
        URL_TOKEN = URL_BASE + "/token",
        URL_LIST = URL_BASE + "/api/v1/apps",
        URL_REBUILD = URL_BASE + "/api/v1/apps/",
        self = this,
        timers = [],
        prefix = "com.terrenceryan.brackets.phonegapbuild.";

    function addListener(type, listener) {
        if (typeof self._listeners[type] === "undefined") {
            self._listeners[type] = [];
        }
        self._listeners[type].push(listener);
    }

    function fire(event) {
        var i = 0;
        
        if (typeof event === "string") {
            event = { type: event };
        }
        
        if (!event.target) {
            event.target = self;
        }

        if (!event.type) {  //falsy
            throw new Error("Event object missing 'type' property.");
        }

        if (self._listeners[event.type] instanceof Array) {
            var listeners = self._listeners[event.type];

            for (i = 0; i < listeners.length; i++) {
                listeners[i].call(self, event);
            }
        }
    }

    function removeListener(type, listener) {
        var i = 0;
        if (self._listeners[type] instanceof Array) {
            var listeners = self._listeners[type];
            for (i = 0; i < listeners.length; i++) {
                if (listeners[i] === listener) {
                    listeners.splice(i, 1);
                    break;
                }
            }
        }
    }

    function areAllOSComplete(statusObj) {
        var os = "";
        for (os in statusObj) {
            console.log(statusObj[os], statusObj[os] !== "complete");
            if (statusObj[os] !== null && statusObj[os] !== "complete") {
                return false;
            }
        }
        console.log("RETURNING TRUE");
        return true;
    }

    function incompleteCount(statusObj) {
        var os = "";
        var i = 0;
        for (os in statusObj) {
            if (statusObj[os] !== "complete") {
                i++;
            }
        }
        return i;
    }

    function parseProjectInfo(response) {
        try {
            response.complete = areAllOSComplete(response.status);
            response.incompleteCount = incompleteCount(response.status);
            var myEvent = new CustomEvent("statusresponse", {detail: response});
            fire(myEvent);

            var functionCall = function () { self.getProjectStatus(response.id); };

            if (areAllOSComplete(response.status)) {
                console.log("all OSes are complete");
            } else {
                console.log("all OSes are NOT complete");
                timers.push(setTimeout(functionCall, 2000));
            }
        } catch (an_exception) {
            console.log(response);
            console.log(an_exception);
        }
    }

    function compareAppsByTitle(a,b) {
      if (a.title < b.title)
         return -1;
      if (a.title > b.title)
        return 1;
      return 0;
    }

    function errorHandler(error) {
        console.log("Call Error");
        console.log(error.status);
        console.log(error.statusText);
        console.log(error.responseText);
    }

    function loginErrorHandler(error) {
        console.log("Login Error");
        var myEvent = new CustomEvent("loginerror");
        fire(myEvent);
    }

    function getProjectStatus(id) {
        console.log("getProjectStatus");
        $.ajax({
            url: URL_LIST + "/" + id,
            success: parseProjectInfo,
            type: "get",
            dataType: 'jsonp',
            error: errorHandler,
            cache: false,
            crossDomain: true
        });
    }

    function setToken(token) {
        self.token = token;
        localStorage.setItem(prefix + 'token', token);
    }

    function setAssociation(fullPath, id) {
        localStorage.setItem(prefix + fullPath, id);
        localStorage.setItem(prefix + id, fullPath);
    }

    function getAssociation(fullPath) {
        return localStorage.getItem(prefix + fullPath);
    }
    
    function getLocalPathForId(id) {
        return localStorage.getItem(prefix + id);
    }

    function removeAssociation(fullPath) {
        localStorage.removeItem(prefix + fullPath);
        localStorage.removeItem(prefix + id);
    }
    
    function qualifyLink(link) {
        return URL_BASE + link;
    }

    function initialize() {
        var token = localStorage.getItem(prefix + "token");
        var tokenDefined = false;
        if ((token === null) || (token === 'null')) {
            console.log("Token is null");
            self.initialized = true;
        } else if (token === "") {
            self.initialized = true;
        } else {
            tokenDefined = true;
            setToken(token);
            self.initialized = true;
        }

        var myEvent = new CustomEvent("initialized", {detail: {tokenDefined: tokenDefined}});
        fire(myEvent);

    }


    function uploadFileToProject(id, FileEntry) {
        // STUB
    }



	function setList(list) {
        list.sort(compareAppsByTitle);
		self.list = list;
	}

    function handleLoginSuccess(response, status, jqXHR) {
        setToken(response.token);

        var myEvent = new CustomEvent("login", {});
        fire(myEvent);
    }

	function login(username, password) {
		$.ajax({
            url: URL_TOKEN,
            type: "post",
            error: loginErrorHandler,
            context: PhoneGapBuild,
            success: handleLoginSuccess,
            username: username,
            password: password,
            cache: false,
            crossDomain: true
        });
	}

    function handleRebuildSuccess(response, status, jqXHR) {
        var myEvent = new CustomEvent("rebuildrequested", {});
        fire(myEvent);

    }

    function rebuild(id) {
        $.ajax({
            url: URL_REBUILD + "/" + id + "?auth_token=" + self.token,
            type: "put",
            error: errorHandler,
            context: PhoneGapBuild,
            success: handleRebuildSuccess,
            cache: false,
            crossDomain: true
        });
        getProjectStatus(id);

    }



    function logout() {
        setToken("");
        self.tokenDefined = false;
        self.initialized = false;
        self.list = [];

        var myEvent = new CustomEvent("logout", {});
        fire(myEvent);
    }

    function handleListSuccess(response, status, jqXHR) {
        setList(response.apps);
        var myEvent = new CustomEvent("listloaded", {detail: {list: response.apps}});
        fire(myEvent);
    }

    function getList() {
        $.ajax({
            url: URL_LIST + "?auth_token=" + self.token,
            success: handleListSuccess,
            dataType: 'jsonp',
            type: "get",
            error: errorHandler,
            cache: false,
            crossDomain: true
        });
    }

    function getQRCode(link) {
        return 'https://chart.googleapis.com/chart?chs=150x150&cht=qr&chl=' + link + '&chld=L|1&choe=UTF-8';
    }

    function killTimers() {
        var timer = "";
        console.log("Timer Kill has been invoked.  Beware timers. ");
        console.log(timers);
        for (timer in timers) {
            clearTimeout(timers[timer]);
            console.log(timers[timer] + " - Killed");
        }
    }

    this._listeners = {};

    this.token = "";
    this.list = "List of PhoneGap Build projects.";
    this.initialized = false;
    this.login = login;
    this.getList = getList;
    this.addListener = addListener;
    this.removeListener = removeListener;
    this.initialize = initialize;
    this.logout = logout;
    this.rebuild = rebuild;
    this.uploadFileToProject = uploadFileToProject;
    this.setAssociation = setAssociation;
    this.getAssociation = getAssociation;
    this.removeAssociation = removeAssociation;
    this.getProjectStatus = getProjectStatus;
    this.killTimers = killTimers;
    this.qualifyLink = qualifyLink;
    this.getQRCode = getQRCode;
    this.getLocalPathForId = getLocalPathForId;

};