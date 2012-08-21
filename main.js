/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, undef: true, indent: 4, maxerr: 50 */
/*global define, $, brackets, window, event, PhoneGapBuild */

/** Simple extension that adds a "File > Hello World" menu item */
define(function (require, exports, module) {
    'use strict';

    var CommandManager   = brackets.getModule("command/CommandManager"),
        Menus            = brackets.getModule("command/Menus"),
        Commands         = brackets.getModule("command/Commands"),
        EditorManager    = brackets.getModule("editor/EditorManager"),
        ProjectManager   = brackets.getModule("project/ProjectManager"),
        NativeFileSystem = brackets.getModule("file/NativeFileSystem").NativeFileSystem,
        FileUtils        = brackets.getModule("file/FileUtils"),
        DocumentManager  = brackets.getModule("document/DocumentManager");

    // First, register a command - a UI-less object associating an id to a handler
    var local_require = require;
    var id = ""; //hardcode this value for now.

    var PG_PROJECT_ASSOCIATION = "pg.toggleProjectAssociation";   // package-style naming to avoid collisions

    // Local modules
    require('phonegapbuild');
    var phonegapbuild = new PhoneGapBuild();

    function getAssociatedID() {
        var projectPath = ProjectManager.getProjectRoot().fullPath;
        var id = phonegapbuild.getAssociation(projectPath);
        return id;
    }

    function togglePGMenu(force) {
        if (typeof (force) === "undefined") {
            force = "";
        }

        var $pgMenu = $('#pg-menu');

        if (force.length > 0) {
            if (force === "open") {
                $pgMenu.css("display", "block");
            } else if (force === "close") {
                $pgMenu.css("display", "none");
            }
        } else {
            if ($pgMenu.css("display") === "block") {
                $pgMenu.css("display", "none");
            } else {
                $pgMenu.css("display", "block");
            }
        }
    }

    function togglePGPanelDisplay(force, height) {
        if (typeof (force) === 'undefined') {
            force = "";
        }

        if (typeof (height) === 'undefined') {
            height = "200px";
        }

        var $pgInterface = $("#pg-interface");

        if (force.length > 0) {
            if (force === "open") {
                $pgInterface.show();
            } else if (force === "close") {
                $pgInterface.hide();
            }
        } else {
            if ($pgInterface.css("display") === "none") {
                $pgInterface.show();
            } else {
                $pgInterface.hide();
            }
        }
        $('#pg-interface').css("height", height);
        $('#pg-interface').css("overflow-y", "scroll");
        EditorManager.resizeEditor();
    }

    function getPGList() {
        phonegapbuild.getList();
    }


    function errorHandler(error) {
        console.log("Login Error");
        console.log(error.responseText);
    }


    function setMenuToAssociated() {
        var iconURL = local_require.nameToUrl('assets/pg_icon_idle.png').split('[')[0];
        $("#pg-menu-toggle img").css("background-color", "#85BF71");
        $("#pg-menu-toggle img").attr("src", iconURL);
    }

    function setMenuToIdle() {
        var iconURL = local_require.nameToUrl('assets/pg_icon_idle.png').split('[')[0];
        $("#pg-menu-toggle img").css("background-color", "transparent");
        $("#pg-menu-toggle img").attr("src", iconURL);
    }

    function setMenuToError() {
        var iconURL = local_require.nameToUrl('assets/pg_icon_idle.png').split('[')[0];
        $("#pg-menu-toggle img").css("background-color", "#ff0000");
        $("#pg-menu-toggle img").attr("src", iconURL);
    }

    function setMenuToBuilding() {
        var iconURL = local_require.nameToUrl('assets/pg_icon_building.png').split('[')[0];
        $("#pg-menu-toggle img").css("background-color", "#fad791");
        $("#pg-menu-toggle img").attr("src", iconURL);
    }

    function setMenuToLogout() {
        var iconURL = local_require.nameToUrl('assets/pg_icon_disabled.png').split('[')[0];
        $("#pg-menu-toggle img").css("background-color", "transparent");
        $("#pg-menu-toggle img").attr("src", iconURL);
    }

    function handlePGMenuList(e) {
        e.preventDefault();
        togglePGMenu("close");
        var list = "";
        var i = 0;
        for (i = 0; i < phonegapbuild.list.length; i++) {
            list += phonegapbuild.list[i].title + ", ";
        }

        window.alert(list);
    }

    function updateIncompleteCount(count) {
        var $orig = $('#incomplete-count').text();
        var stringCount = count.toString();

        if ($orig !== stringCount) {
            if (count > 0) {
                $('#incomplete-count').show();
            } else {
                $('#incomplete-count').hide();
            }

            $('#incomplete-count').text(stringCount);
        }
    }

    function orderPGMenu() {
        var $pgMenu = $("#pg-menu");
        var $logout = $('#pg-logout-holder');
        var $logoutDivider = $('#pg-logout-divider');

        $logout.detach();
        $logoutDivider.detach();
        $pgMenu.append($logoutDivider);
        $pgMenu.append($logout);
    }

    function createListMenuItem() {
        if ($("#pg-list-holder").length === 0) {
            $("#pg-menu").prepend('<li id="pg-list-holder"><a id="pg-list" href="">List</li>');
            $("#pg-list").click(handlePGMenuList);
            orderPGMenu();
        }
    }

    function createPGContextMenu() {
        var menu = Menus.getContextMenu("project-context-menu");
        menu.addMenuDivider();
        menu.addMenuItem(PG_PROJECT_ASSOCIATION);
    }

    function removePGContextMenu() {
        //REMOVE MENU NOT IMPLEMENTED YET
        //var menu = Menus.getContextMenu("project-context-menu");
        //menu.removeMenuItem(PG_PROJECT_ASSOCIATION);
        //console.log(menu);
    }

    function handlePGLoginFailure() {
        $('#pg-login-alert').show();
        $('#pg-login-indicator').hide();
    }


    
    function handlePGMenuLogout(e) {
        e.preventDefault();
        phonegapbuild.logout();
        $("#pg-menu").empty();
        createLoginMenuItem();
        togglePGMenu("close");
        setMenuToLogout();
        removePGContextMenu();
    }
    
    function createLogoutMenuItem() {
        if ($("#pg-logout-holder").length === 0) {
            $("#pg-menu").append('<li id="pg-logout-divider"><hr class="divider" /></li>');
            $("#pg-menu").append('<li id="pg-logout-holder"><a id="pg-logout" href="">Logout</li>');
            $("#pg-logout").click(handlePGMenuLogout);
            orderPGMenu();
        }
    }
    
    function handlePGLoginSuccess() {
        togglePGPanelDisplay("close");
        $("#login-holder").remove();
        createLogoutMenuItem();
        phonegapbuild.addListener("listloaded", createListMenuItem);
        setMenuToIdle();
        getPGList();
        createPGContextMenu();
    }
    
    function doLogin() {
        event.preventDefault();
        $('#pg-login-indicator').show();
        $('#pg-login-alert').hide();
        var $username = $('#username').val();
        var $password = $('#password').val();
        phonegapbuild.addListener("loginerror", handlePGLoginFailure);
        phonegapbuild.addListener("login", handlePGLoginSuccess);
        phonegapbuild.login($username, $password);
    }

    function createPGLoginForm() {
        var iconURL = local_require.nameToUrl('../../../styles/images/throbber.gif').split('[')[0];
        var form = '<form id="pg-login-form">' +
                    '<div id="pg-login-alert" class="alert-message error">Check your username and password.</div>' +
                    '    <fieldset>' +
                    '    <div class="clearfix">' +
                    '    <label for="username">Username:</label>' +
                    '    <input id="username" type="email" name="username" placeholder="Username">' +
                    '    </div>' +
                    '    <div class="clearfix">' +
                    '    <label for="password">Password:</label>' +
                    '    <input id="password" type="password" name="password" placeholder="Password">' +
                    '    </div>' +
                    '    <div class="actions">' +
                    '        <input id="pg-submit-login" type="submit" class="btn primary" name="sumbit" value="Login!">' +
                    '        <span id="pg-login-indicator"><img src=' + iconURL + ' width="16" height="16" /></span>' +
                    '    </div>' +
                    '    </fieldset>' +
                    '</form>';
        $('#pg-interface-content').empty();
        $('#pg-interface-content').append(form);
        $('#pg-submit-login').click(function () {doLogin(); });
        $('#pg-submit-login').css("margin-left", "-20px");
        $('#pg-login-alert').hide();
        $('#pg-login-indicator').hide();
    }

    function handlePGMenuLogin(e) {
        e.preventDefault();
        createPGLoginForm();
        togglePGPanelDisplay("open", "250px");
        togglePGMenu("close");
    }

    function createLoginMenuItem() {
        $("#pg-menu").prepend('<li id="login-holder"><a id="pg-login" href="">Login</li>');
        $('#pg-login').click(handlePGMenuLogin);
    }

    function createPGStatusView() {
        var table = '<table class="table table-bordered">' +
            '<tr><th>Title</th><td id="pg-project-title">Loading <i class="icon-cog status-indicator"></i></td></tr>' +
            '<tr><th>Description</th><td id="pg-project-description">Loading <i class="icon-cog status-indicator"></i></td></tr>' +
            '<tr><th>Project Status</th><td id="pg-project-status">Loading <i class="icon-cog status-indicator"></i></td></tr>' +
            '<tr><th>Download Page</th><td id="pg-project-download">Download Unavailable</td></tr>' +
            '</table>';
        $('#pg-interface-content').empty();
        $('#pg-interface-content').append(table);
    }

    function handlePGMenu(e) {
        e.preventDefault();
        togglePGMenu();
    }

    function createPGInterface() {
        $('.content').append('  <div id="pg-interface" class="bottom-panel">' +
                                    '<div class="toolbar simple-toolbar-layout">' +
                                    '   <div class="title">PhoneGap Build</div>' +
                                    '       <a href="#" class="close">&times;</a>' +
                                    '   </div>' +
                                    '   <div id="pg-interface-content">' +
                                    '   </div>' +
                                '</div>');

        $('#pg-interface input').css("float", "none");

        $('#pg-interface .close').click(function () {
            togglePGPanelDisplay();
        });

        togglePGPanelDisplay("close");

        var iconURL = local_require.nameToUrl('assets/pg_icon_disabled.png').split('[')[0];
        var pgUICode =      '<span id="pg-menu-holder" class="dropdown">' +
                                '<a href="" class="" id="pg-menu-toggle">' +
                                    '<img src="' + iconURL + '" width="24" height="24" />' +
                                    '<span id="incomplete-count"></span>' +
                                '</a>' +
                                '<ul id="pg-menu" class="dropdown-menu">' +
                                '</ul>' +
                            '</span>';
        $('.buttons').append(pgUICode);
        $('#pg-menu-toggle').click(handlePGMenu);

        $('.CodeMirror').click(function () {togglePGMenu("close"); });
        $('.sidebar').click(function () {togglePGMenu("close"); });
        $('#sidebar-resizer').click(function () {togglePGMenu("close"); });
        $('#main-toolbar .nav').click(function () {togglePGMenu("close"); });

        $('#pg-menu-toggle img').css("margin-bottom", "-8px");
        $('#pg-menu-toggle img').css("border-radius", "8px");

        // There is a probably a better way of doing this then having a bazillion jQuery calls.
        $('#incomplete-count').click(handlePGMenu);
        $('#incomplete-count').css("border-radius", "8px");
        $('#incomplete-count').css("height", "16px");
        $('#incomplete-count').css("width", "16px");
        $('#incomplete-count').css("font-size", "16px");
        $('#incomplete-count').css("color", "#FFF");
        $('#incomplete-count').css("background-color", "#F00");
        $('#incomplete-count').css("text-align", "center");
        $('#incomplete-count').css("position", "relative");
        $('#incomplete-count').css("float", "right");
        $('#incomplete-count').css("margin-top", "-5px");
        $('#incomplete-count').css("margin-left", "-5px");
        $('#incomplete-count').hide();

        var $pgMenu = $('#pg-menu');
        $pgMenu.css("top", "10px");
        $pgMenu.css("right", "10px");
        $pgMenu.css("border-top", "1px solid #CCC");
        createLoginMenuItem();
    }

    function handlePGStatusResponse(e) {
        var project = e.detail;
        var propertyname;

        var projectTitleLink = '<a target="_blank" href="' +
            phonegapbuild.qualifyLink("/apps/" + project.id) +
            '">' + project.title + '</a>';

        var downloadUrl = phonegapbuild.qualifyLink('/apps/' + project.id + '/install/?qr_key=' + phonegapbuild.token);

        var subtable = '<table class="condensed-table">';

        for (propertyname in project.status) {
            if (project.status.hasOwnProperty(propertyname)) {
                subtable += '<tr><th>' + propertyname + '</th><td>' + project.status[propertyname] + '</td></tr>';
            }
        }
        subtable += '</table>';

        $("#pg-project-title").html(projectTitleLink);
        $("#pg-project-description").text(project.description || "");
        $("#pg-project-status").html(subtable);
        $("#pg-project-download").html('<a href="' + downloadUrl + '" target="_blank">Download</a>');

        if (project.complete === true) {
            setMenuToAssociated();
            updateIncompleteCount(0);
        } else {
            setMenuToBuilding();
            updateIncompleteCount(project.incompleteCount);
        }
    }
    
    function handlePBRebuildRequested(e) {
        console.log("handlePBRebuildRequested");
        var id = getAssociatedID();
        setMenuToBuilding();
        phonegapbuild.addListener("statusresponse", handlePGStatusResponse);
        phonegapbuild.getProjectStatus(id);
    }
    
    function handlePGMenuRebuild(e) {
        var id = getAssociatedID();
        e.preventDefault();
        togglePGMenu("close");
        phonegapbuild.addListener("rebuildrequested", handlePBRebuildRequested);
        phonegapbuild.rebuild(id);
    }

    function handlePGMenuViewStatus(e) {
        e.preventDefault();
        var id = getAssociatedID();
        togglePGMenu("close");
        createPGStatusView();

        if ($("#pg-interface").css("display") === 'none') {
            togglePGPanelDisplay("open", "360px");
        }
        console.log("handlePGMenuViewStatus");

        phonegapbuild.addListener("statusresponse", handlePGStatusResponse);
        phonegapbuild.getProjectStatus(id);
    }

    function createViewStatusMenuItem() {
        $("#pg-menu").append('<li id="pg-status-holder"><a id="pg-status" href="">View Status</li>');
        $("#pg-status").click(handlePGMenuViewStatus);
        orderPGMenu();
    }

    function removeViewStatusMenuItem() {
        $("#pg-status-holder").remove();
    }

    function createRebuildMenuItem() {
        if ($("#pg-rebuild-holder").length === 0) {
            $("#pg-menu").append('<li id="pg-rebuild-holder"><a id="pg-rebuild" href="">Rebuild</li>');
            $("#pg-rebuild").click(handlePGMenuRebuild);
            orderPGMenu();
        }
    }

    function removeRebuildMenuItem() {
        $("#pg-rebuild-holder").remove();
    }

    function checkAssociation() {
        var id = getAssociatedID();
        if ((typeof (id) === 'undefined') || (id === null)) {
            console.log("handlePGStatusResponse 1");
            CommandManager.get(PG_PROJECT_ASSOCIATION).setName("Link with PhoneGap Build");
            removeRebuildMenuItem();
            removeViewStatusMenuItem();
            setMenuToIdle();
            phonegapbuild.removeListener("statusresponse", handlePGStatusResponse);
            updateIncompleteCount(0);
            phonegapbuild.killTimers();
        } else {
            console.log("handlePGStatusResponse 2");
            CommandManager.get(PG_PROJECT_ASSOCIATION).setName("Unlink with PhoneGap Build");
            createRebuildMenuItem();
            createViewStatusMenuItem();
            phonegapbuild.addListener("statusresponse", handlePGStatusResponse);
            phonegapbuild.getProjectStatus(id);
            setMenuToAssociated();
        }
    }

    function handlePGInitialize(e) {
        if (e.detail.tokenDefined === true) {
            handlePGLoginSuccess();
            checkAssociation();
        } else {
            console.log("Token was NOT in localstorage");
        }
    }


    function doAssociate(e) {
        event.preventDefault();
        var $id = $('#projectid').val();
        var projectPath = ProjectManager.getProjectRoot().fullPath;

        phonegapbuild.setAssociation(projectPath, $id);
        togglePGPanelDisplay("close");
        checkAssociation();
    }

    function createPGAssociation() {
        var options = "";
        var form = "";
        var i = 0;

        var projectList = phonegapbuild.list;

        for (i = 0; i < projectList.length; i++) {
            options += '<option value=' + projectList[i].id + '>' + projectList[i].title + '</option>';
        }


        form = '<form>' +
            '   <label for="projectid">Project:</label>' +
            '   <select id="projectid">' +
            options +
            '   </select><br />' +
            '   <input id="submit-associate" type="submit" class="btn" name="sumbit" value="Link" /><br />' +
            '</form>';
        $('#pg-interface-content').empty();
        $('#pg-interface-content').append(form);
        $('#submit-associate').click(function () {doAssociate(); });
    }

    function handlePGAssociate() {
        var projectPath = ProjectManager.getProjectRoot().fullPath;
        var id = phonegapbuild.getAssociation(projectPath);

        if ((typeof (id) === 'undefined') || (id === null)) {
            createPGAssociation();
            togglePGPanelDisplay("open");
        } else {
            phonegapbuild.removeAssociation(projectPath);
            checkAssociation();
        }
    }

    CommandManager.register("Associate with PhoneGap Build", PG_PROJECT_ASSOCIATION, handlePGAssociate);

    createPGInterface();
    phonegapbuild.addListener("initialized", handlePGInitialize);
    phonegapbuild.initialize();

    // close all dropdowns on ESC
    $(window.document).on("keydown", function (e) {
        if (e.keyCode === 27) {
            togglePGMenu("close");
        }
    });
});