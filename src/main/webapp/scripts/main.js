(function() {
    // Get all elements
    let oAvatar = document.getElementById('avatar'),
        oWelcomeMsg = document.getElementById('welcome-msg'),
        oLogoutBtn = document.getElementById('logout-link'),
        oLoginBtn = document.getElementById('login-btn'),
        oLoginForm = document.getElementById('login-form'),
        oLoginUsername = document.getElementById('username'),
        oLoginPwd = document.getElementById('password'),
        oLoginFormBtn = document.getElementById('login-form-btn'),
        oLoginErrorField = document.getElementById('login-error'),
        oRegisterBtn = document.getElementById('register-btn'),
        oRegisterForm = document.getElementById('register-form'),
        oRegisterUsername = document.getElementById('register-username'),
        oRegisterPwd = document.getElementById('register-password'),
        oRegisterFirstName = document.getElementById('register-first-name'),
        oRegisterLastName = document.getElementById('register-last-name'),
        oRegisterFormBtn = document.getElementById('register-form-btn'),
        oRegisterResultField = document.getElementById('register-result'),
        oNearbyBtn = document.getElementById('nearby-btn'),
        oFavBtn = document.getElementById('fav-btn'),
        oRecommendBtn = document.getElementById('recommend-btn'),
        oNavBtnBox = document.getElementsByClassName('main-nav')[0],
        oNavBtnList = document.getElementsByClassName('main-nav-btn'),
        oItemNav = document.getElementById('item-nav'),
        oItemList = document.getElementById('item-list'),
        oTpl = document.getElementById('tpl').innerHTML;

    // Default values
    let userId = '1111',
        userFullName = 'John',
        // lng = -122.08,
        // lat = 37.38,
        lng = -122,
        lat = 47,
        itemArr;

    // Main logic
    function init() {
        // validate session
        validateSession();
        // bind event
        bindEvent();
    }

    function validateSession() {
        switchLoginRegister('login');
    }

    function bindEvent() {
        // Switch between login and register
        oRegisterFormBtn.addEventListener('click', function(){
            switchLoginRegister('register')
        }, false);
        oLoginFormBtn.addEventListener('click', function() {
            switchLoginRegister('login')
        }, false);

        // Click login button
        oLoginBtn.addEventListener('click', loginExecutor, false);
        // Click register button
        oRegisterBtn.addEventListener('click', registerExecutor, false);
        // Click nearby button
        oNearbyBtn.addEventListener('click', loadNearbyData, false);
        // Click favorite button
        oFavBtn.addEventListener('click', loadFavoriteItems, false);
        // Click recommend button
        oRecommendBtn.addEventListener('click', loadRecommendedItems, false);
        // Click item list button
        oItemList.addEventListener('click', changeFavoriteItem, false);
    }

    function switchLoginRegister(name) {
        // Hide header elements
        showOrHideElement(oAvatar, 'none');
        showOrHideElement(oWelcomeMsg, 'none');
        showOrHideElement(oLogoutBtn, 'none');
        // Hide item list area
        showOrHideElement(oItemNav, 'none');
        showOrHideElement(oItemList, 'none');

        if(name === 'login') {
            // Hide register form
            showOrHideElement(oRegisterForm, 'none');
            // Clear register error
            oRegisterResultField.innerHTML = ''
            // Show login form
            showOrHideElement(oLoginForm, 'block');
        } else {
            // Hide login form
            showOrHideElement(oLoginForm, 'none');
            // Clear login error if existed
            oLoginErrorField.innerHTML = '';
            // Show register form
            showOrHideElement(oRegisterForm, 'block');
        }
    }

    // API for logging-in
    function loginExecutor() {
        let username = oLoginUsername.value,
            password = oLoginPwd.value;

        if (username === "" || password === "") {
            oLoginErrorField.innerHTML = 'Please fill in all fields';
            return;
        }
        password = md5(username + md5(password));
        // console.log(username, password);

        ajax({
            method: 'POST',
            url: './login',
            data: {
                user_id: username,
                password: password,
            },
            success: function(res) {
                // Case 1: login is successful
                if (res.status === 'OK') {
                    // console.log('login');
                    // console.log(res);
                    // Show welcome message
                    welcomeMsg(res);
                    // Fetch data
                    fetchData();
                } else {
                    // Case 2: login failed
                    oLoginErrorField.innerHTML = 'Invalid username or password';
                }
            },
            error: function() {
                // Show login error
                throw new Error('Invalid username or password');
            }
        })
    }

    // API for changing favorite items
    function changeFavoriteItem(evt) {
        let tar = evt.target,
            oParent = tar.parentElement;

        if (oParent && oParent.className==='fav-link') {
            console.log('change ...');
            let oCurLi = oParent.parentElement,
                classname = tar.className,
                isFavorite = classname==='fa fa-heart',
                oItems = oItemList.getElementsByClassName('item'),
                index = Array.prototype.indexOf.call(oItems, oCurLi),
                url = './history',
                req = {
                    user_id: userId,
                    favorite: itemArr[index]
                };
            let method = !isFavorite ? 'POST' : 'DELETE';

            ajax({
                method: method,
                url: url,
                data: req,
                success: function(res) {
                    if (res.status==='OK' || res.result==='SUCCESS') {
                        tar.className = !isFavorite ? 'fa fa-heart' : 'fa fa-heart-o';
                    } else {
                        throw new Error('Change Favorite failed!');
                    }
                },
                error: function() {
                    throw new Error('Change Favorite failed!');
                }
            });
        }
    }

    // API for registration
    function registerExecutor() {
        // console.log('register');
        let username = oRegisterUsername.value,
            password = oRegisterPwd.value,
            firstName = oRegisterFirstName.value,
            lastName = oRegisterLastName.value;
        // console.log(username, password,firstName, lastName);

        // Sanity check for empty entries
        if (username === "" || password === "" || firstName === "" || lastName === "") {
            oRegisterResultField.innerHTML = 'Please fill in all fields';
            return;
        }
        // Sanity check for invalid user names
        if (username.match(/^[a-z0-9_]+$/) === null) {
            oRegisterResultField.innerHTML = 'Invalid username';
            return;
        }
        password = md5(username + md5(password));

        ajax({
            method: 'POST',
            url: './register',
            data: {
                user_id: username,
                password: password,
                first_name: firstName,
                last_name: lastName,
            },
            success: function(res) {
                if (res.status==='OK' || res.result==='OK') {
                    oRegisterResultField.innerHTML = 'Successfully registered!';
                } else {
                    oRegisterResultField.innerHTML = 'User already existed!';
                }
            },
            error: function() {
                throw new Error('Failed to register');
            }
        })
    }

    // API for loading nearby items
    function loadNearbyData() {
        // Activate side bar buttons
        activeBtn('nearby-btn');

        let opt = {
            method: 'GET',
            url: './search?user_id=' + userId + '&lat=' + lat + '&lon=' + lng,
            data: null,
            message: 'nearby'
        };
        serverExecutor(opt);
    }

    // API for loading favorite items
    function loadFavoriteItems() {
        activeBtn('fav-btn');
        let opt = {
            method: 'GET',
            url: './history?user_id=' + userId,
            data: null,
            message: 'favorite',
        };
        serverExecutor(opt);
    }

    // API for loading recommended items
    function loadRecommendedItems() {
        activeBtn('recommend-btn');
        let opt = {
            method: 'GET',
            url: './recommendation?user_id=' + userId + '&lat=' + lat + '&lon=' + lng,
            data: null,
            message: 'recommended',
        };
        serverExecutor(opt);
    }

    // Render data
    function render(data) {
        let len = data.length,
            list = '',
            item;

        for (let i=0; i<len; i++) {
            item = data[i];
            list += oTpl.replace(/{{(.*?)}}/gmi, function(node, key) {
                console.log(key);
                if (key==='company_logo') {
                    return item[key] || 'https://via.placeholder.com/100';
                }
                if (key==='location') {
                    return item[key].replace(/,/g, '<br/>').replace(/\"/g, '');
                }
                if (key==='favorite') {
                    return item[key] ? "fa fa-heart" : "fa fa-heart-o";
                }
                return item[key];
            })
            oItemList.innerHTML = list;
        }
    }

    function activeBtn(btnId) {
        let len = oNavBtnList.length;
        for (let i=0; i<len; i++) {
            oNavBtnList[i].className = 'main-nav-btn';
        }
        let btn = document.getElementById(btnId);
        btn.className += ' active';
    }

    // Fetch geolocation
    function initGeo(cb) {
        if(navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(function (position) {
                    lat = position.coords.latitude;
                    lng = position.coords.longitude;
                    cb();
                },
                function () {
                    throw new Error('Geo location fetch failed!');
                },
                {maximumAge: 60000});
            // Show loading message
            oItemList.innerHTML = '<p class="notice"><i class="fa fa-spinner fa-spin"></i>Retrieving your location...</p>';
        } else {
            throw new Error('Your browser does not support navigator!');
        }
    }

    function showOrHideElement(ele, style) {
        ele.style.display = style;
    }

    function welcomeMsg(info) {
        userId = info.user_id || userId;
        userFullName = info.name || userFullName;
        oWelcomeMsg.innerHTML = 'Welcome ' + userFullName;

        // Show welcome message, avatar, item area, logout button
        showOrHideElement(oWelcomeMsg, 'block');
        showOrHideElement(oAvatar, 'block');
        showOrHideElement(oItemNav, 'block');
        showOrHideElement(oItemList, 'block');
        showOrHideElement(oLogoutBtn, 'block');

        // Hide login form
        showOrHideElement(oLoginForm, 'none');
    }

    function fetchData() {
        // Get geolocation info
        initGeo(loadNearbyData);
    }

    // Helper function for utilizing AJAX
    function ajax(opt) {
        var opt = opt || {},
            method = (opt.method || 'GET').toUpperCase(),
            url = opt.url,
            data = opt.data || null,
            success = opt.success || function() {},
            error = opt.error || function() {},
            xhr = new XMLHttpRequest();

        if (!url) {
            throw new Error('missing url');
        }

        xhr.open(method, url, true);

        if (!data) {
            xhr.send();
        } else {
            xhr.setRequestHeader('Content-type', 'application/json;charset=utf-8');
            xhr.send(JSON.stringify(data));
        }

        xhr.onload = function() {
            if (xhr.status === 200) {
                success(JSON.parse(xhr.responseText));
            } else {
                error();
            }
        }

        xhr.onerror = function() {
            throw new Error('The request could not be completed.');
        }
    }

    // Retrieve data from server
    function serverExecutor(opt) {
        oItemList.innerHTML = '<p class="notice"><i class="fa fa-exclamation-triangle"></i>Loading ' + opt.message + ' item...</p>';

        ajax({
            method: opt.method,
            url: opt.url,
            data: opt.data,
            success: function(res) {
                // Case 1: data set is empty
                if (!res || res.length===0) {
                    oItemList.innerHTML = '<p class="notice"><i class="fa fa-exclamation-triangle"></i>No ' + opt.message + ' item!</p>';
                } else {
                    // Case 2: data set is not empty
                    render(res);
                    itemArr = res;
                }
            },
            error: function() {
                throw new Error('No ' + opt.message + ' items!');
            }
        });
    }

    init();
})();