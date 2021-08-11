var cronManager = (function () {

    var servers = [];
    var serverLookup = {};
    var emailByServerIdLookup = {};
    var widget = {};
    var setupControles = {};
    var loginForm;
    var editableColoms = [];
    var hiddenColoms = [];
    var formatColoms = [];
    var getCronJobsByServerID = {};
    var encKey = "";
    var aesKey = "";
    var serverUrl = "";
    var timeZoneData = [];
    var masterDB = {};
    var industries = {};


    return {
        init : async function (id, serverUrl) {
            cronManager.masterDB = {};
            cronManager.serverUrl = serverUrl;
            cronManager.encKey = "1234567891234567";
            cronManager.aesKey = "xx35f242a46d67eeb74aabc37d5e5d05";
            cronManager.editableColoms = ['expression','email','batchSize'];
            cronManager.hiddenColoms = ['id','expressiondesc','user', 'warmerEmailAccount','expression','command','batchSize'];
            cronManager.formatColoms = ['command','state'];
            cronManager.id = id;
            cronManager.widget = document.getElementById(this.id);
            cronManager.industries = await this.getIndustries();
            cronManager.setupControles();
            cronManager.setupEvents();
            cronManager.setupLogoutLink();
        },
        setupCss : function(){
            document.body.classList.add("dashboard");
        },
        getIndustries : async function(){
            return await cronManager.fetchJson("industries.json");
        },
        addLogoutLink : function(){
            var ra = document.createElement("a");
            ra.innerText = "Logout";
            ra.id = "logout-link";
            ra.href = "#";      
            //document.querySelector('.cron-manager-controles').appendChild(ra);
        },
        setupLogoutLink : function(){
            var authKey = this.getAuthKey();
            if(authKey.length > 1){
                this.submitLogin();
            }else{
                this.setupLogin();   
            }
        },
        setupControles : function () {
            this.setupMessages = document.createElement("div");
            this.setupMessages.id = this.id + "-messages";
            this.widget.appendChild(this.setupMessages);
           
            this.setupControles = document.createElement("div");
            this.setupControles.classList = this.id + "-controles";
            this.widget.appendChild(this.setupControles);

        },
        getFormValueByName: function(id, name){
            return document.querySelector("#"+id+" .email-input-wrapper").querySelector('[name='+name+']').value;
        },
        setupEvents : async function(){
            document.addEventListener('click', async function(e) {
                
                if(e.target.id == "logout-link"){
                    cronManager.eraseCookie('authkey', location.pathname.replace('/dashboard.html', ''));
                    location.reload();
                }
                
                if(e.target.id == "register-user"){
                    var auth = cronManager.getAuthKey();
                    var dataUrl = cronManager.serverUrl+"/api/dashboard/register/account?auth=" + auth;
                    var responseJson = await cronManager.fetchJson(dataUrl);
                    console.log(responseJson);
                }
                
                if(e.target.id == "reset-link"){
                    cronManager.showLogin(["user-forgot-password","reset-password"]);
                }
                
                if(e.target.id == "register-link"){
                    cronManager.showLogin(["loginname","loginpass","register-user"]);
                }

                if(e.target.classList == "btn-save-email" || e.target.classList == "btn-check-email"){
                    var check = false;
                    if(e.target.classList == "btn-check-email"){
                        check = true;
                    }
                        
                    var serverWrapper = e.target.closest(".server_wrapper_class");                   
                    var id = serverWrapper.id;
                    var idParts = id.split('_');
                    var serverId = idParts[2];
                    var server = cronManager.serverLookup[serverId];

                    var newEmailAccount = {
                            "espProvider": cronManager.getFormValueByName(id, "espProvider"),
                            "firstName": cronManager.getFormValueByName(id, "firstName"),
                            "lastName": cronManager.getFormValueByName(id, "lastName"),
                            "email": cronManager.getFormValueByName(id, "email"),
                            "industry": cronManager.getFormValueByName(id, "industry"),
                            "timeZone": cronManager.getFormValueByName(id, "timeZone"),
                            "imapUsername": cronManager.getFormValueByName(id, "imapUsername"),
                            "imapPassword": cronManager.getFormValueByName(id, "imapPassword"),
                            "imapHost": cronManager.getFormValueByName(id, "imapHost"),
                            "imapPort": cronManager.getFormValueByName(id, "imapPort"),
                            "imapSecurity": cronManager.getFormValueByName(id, "imapSecurity"),
                            "smtpUsername": cronManager.getFormValueByName(id, "smtpUsername"),
                            "smtpPassword": cronManager.getFormValueByName(id, "smtpPassword"),
                            "smtpHost": cronManager.getFormValueByName(id, "smtpHost"),
                            "smtpPort": cronManager.getFormValueByName(id, "smtpPort"),
                            "smtpSecurity": cronManager.getFormValueByName(id, "smtpSecurity")
                          }

                    var newEmailPlusAuth = cronManager.encryptString(JSON.stringify(newEmailAccount), cronManager.encKey);
                    
                    var addEmailAccountUrl = cronManager.serverUrl+"/api/dashboard/email/account/add?auth=" + cronManager.getAuthKey() + "&newAccount=" + newEmailPlusAuth + "&check="+check;
                    var newEmailAccount = await cronManager.fetchJson(addEmailAccountUrl);
                    console.log(newEmailAccount);
                    var messages = document.querySelector('#cron-manager-messages');
                    if(newEmailAccount.status == "true"){
                        // e.target.previousSibling.click();
                        messages.innerHTML = "Please wait 1 day for the email to become active";
                    }else{
                        messages.innerHTML = "Oops could not send the test email";
                    }
                    setTimeout(() => {
                        messages.innerHTML = "";
                    }, 3000);
                }
                
                if(e.target.classList == "btn-add-email"){
                    console.log('adding email');
                    var wrapper = e.target.parentNode.parentNode.querySelector('.email-input-wrapper'); 
                    wrapper.style.display = "grid";
                }
                
                if(e.target.classList == "btn-cancel-email"){
                    console.log('cancel email');
                    e.target.parentNode.parentNode.style.display = "none";
                }
                
                if(e.target.innerText.trim() == "edit"){
                    console.log();
                    var tdId = e.target.parentNode.parentNode.id;
                    var email = document.querySelector("#"+tdId.replace("_state","_email")).innerText.trim();
                    console.log(email);
                    var accounts = cronManager.masterDB.warmerEmailAccounts;
                    for (var i = 0; i < accounts.length; i++) {
                        var account = accounts[i];
                        if(account.email == email){
                            console.log(account);   
                            var serverWrapper = e.target.closest(".server_wrapper_class");
                            serverWrapper.querySelector('.btn-add-email').click();
                            account = account.warmerEmailAccount;
                            serverWrapper.querySelector('select[name=espProvider]').value = account.espProvider;
                            serverWrapper.querySelector('input[name=email]').value = account.email;
                            serverWrapper.querySelector('input[name=firstName]').value = account.firstName;
                            serverWrapper.querySelector('input[name=lastName]').value = account.lastName;
                            serverWrapper.querySelector('select[name=industry]').value = account.industry;
                            serverWrapper.querySelector('select[name=imapSecurity]').value = account.imapSecurity;
                            serverWrapper.querySelector('input[name=imapHost]').value = account.imapHost;
                            serverWrapper.querySelector('input[name=imapPassword]').value = account.imapPassword;
                            serverWrapper.querySelector('input[name=imapPort]').value = account.imapPort;
                            serverWrapper.querySelector('input[name=imapUsername]').value = account.imapUsername;
                            serverWrapper.querySelector('select[name=smtpSecurity]').value = account.smtpSecurity;
                            serverWrapper.querySelector('input[name=smtpHost]').value = account.smtpHost;
                            serverWrapper.querySelector('input[name=smtpPassword]').value = account.smtpPassword;
                            serverWrapper.querySelector('input[name=smtpPort]').value = account.smtpPort;
                            serverWrapper.querySelector('input[name=smtpUsername]').value = account.smtpUsername;
                            serverWrapper.querySelector('select[name=timeZone]').value = account.timeZone;
                        }
                    }
                }
                
                if(e.target.innerText.trim() == "delete"){
                    e.target.parentNode.parentNode.parentNode.style.backgroundColor = "#9ecdf5";
                    setTimeout(async function(){ 
                        var tdId = e.target.parentNode.parentNode.id;
                        var cronJobIdParts = tdId.split("_");
                        var cronJobId = cronJobIdParts[cronJobIdParts.length - 2];
                        var serverWrapper = e.target.closest(".server_wrapper_class");                   
                        var id = serverWrapper.id;
                        var idParts = id.split('_');
                        var serverId = idParts[2];
                        var server = cronManager.serverLookup[serverId];
                        var email = document.querySelector("#"+tdId.replace("_state","_email")).innerText.trim();
                        var r = confirm("Are you sure you want to delete "+ email + "?");
                        if (r == true) {
                              var deleteCronJobUrl = cronManager.serverUrl+"/api/dashboard/email/accounts/delete?auth=" + cronManager.getAuthKey() + "&id=" + cronJobId + "&deleteemail=true&email="+email;
                              var newCronJob = await cronManager.fetchJson(deleteCronJobUrl);
                              console.log(newCronJob);
                        }
                        e.target.parentNode.parentNode.parentNode.style.backgroundColor = "";
                        var authKey = cronManager.getAuthKey();
                        delete cronManager.masterDB.warmerEmailAccounts
                        cronManager.createServerTable(server, authKey);
                        setTimeout(function(){ 
                            document.querySelector('#'+id).style.display = "inline-grid"; 
                        }, 500);
                        
                    }, 500);
                }
                
                if(e.target.classList == "btn-add-cron-job"){
                    console.log('adding a cron job');
                    var serverWrapper = e.target.closest(".server_wrapper_class");                   
                    var id = serverWrapper.id;
                    var inputValue = "* * 31 2 *";
                    var idParts = id.split('_');
                    var serverId = idParts[2];
                    var server = cronManager.serverLookup[serverId];
                    
                    var cronJobJson = cronManager.getCronJobsByServerID[serverId];

                    var newCronJobUrl = cronManager.serverUrl+"/api/dashboard/job/new?auth=" + cronManager.getAuthKey();
                    var newCronJob = await cronManager.fetchJson(newCronJobUrl);
                    console.log(cronJobJson);
                    console.log(newCronJob);
                    // reload table
                    
                    var formData = new FormData(cronManager.loginForm);
                    // var user = formData.get("user");
                    var authKey = cronManager.getAuthKey();
                  
                    cronManager.createServerTable(server, authKey);
                    
                    
                    setTimeout(function(){ 
                        document.querySelector('#'+id).style.display = "flex"; 
                        document.querySelector('#'+id+' table > tbody > tr:last-child').style.backgroundColor = "yellow";
                    }, 500);
                    
                    return;
                }
                
                if(e.target.innerText.trim() == "* * 31 2 *"){
                    return;
                }
                
                if(e.target.innerText.trim() == "paused"){
                    var tmpTdId = e.target.parentNode.parentNode.id.replace("_state","_expression");
                    var tmpTd = e.target.parentNode.parentNode.parentNode.querySelector('#'+tmpTdId);
                    tmpTd.innerText = "0 * 31 2 *"
                        
                    var inputValue = "0 * 31 2 *";
                    var id = tmpTdId;
                    var idParts = id.split('_');
                    var server = cronManager.serverLookup[idParts[0]];
                    var cronId = idParts[1];
                    var cronField = idParts[2];
                    cronManager.saveJsonField(server, cronId, cronField, inputValue, id);
                    e.target.innerText = "active";   
                    return;
                        
                }
                if(e.target.innerText.trim() == "active"){
                    console.log(e.target);
                    var tmpTdId = e.target.parentNode.parentNode.id.replace("_state","_expression");
                    var tmpTd = e.target.parentNode.parentNode.parentNode.querySelector('#'+tmpTdId);
                    tmpTd.innerText = "* * 31 2 *";
                    var inputValue = "* * 31 2 *";
                    var id = tmpTdId;
                    var idParts = id.split('_');
                    var server = cronManager.serverLookup[idParts[0]];
                    var cronId = idParts[1];
                    var cronField = idParts[2];
                    cronManager.saveJsonField(server, cronId, cronField, inputValue, id);
                    e.target.innerText = "paused";
                    return;
                }
                
                if (e.target.closest('.json-field--OFF')) {
                    var jsonField = e.target;
                    var inputField = document.querySelector('#edit-json-field');
                    var dropDownField = document.querySelector('#email-dropdown');
                    if (jsonField.id.endsWith("_email")){
                        if(dropDownField){
                            cronManager.saveEmailDropDownField(dropDownField);
                        }
                        jsonField.innerText = "";
                        var serverId = jsonField.id.split("_")[0];
                        var elementId = jsonField.id;
                        var selectId = "email-dropdown";
                        var name = "email-dropdown";
                        var values = cronManager.emailByServerIdLookup[serverId];
                        var innerHTML = "";
                        var htmlFor = "email";
                        cronManager.createEmailDropDown(elementId, selectId, name, values, innerHTML, htmlFor);
                    }else if(!inputField && jsonField.id != 'email-dropdown' && !jsonField.id.endsWith("_email")){
                        cronManager.handleJsonField(jsonField);
                    }else if(!inputField){
                        
                    }else if(inputField.parentNode.id == jsonField.id || inputField.id == e.target.id){
                        // console.log('currently editing');
                    }else{
                        if(dropDownField){
                            cronManager.saveEmailDropDownField(dropDownField);
                        }else if(inputField){
                            var inputValue = inputField.value;
                            var id = inputField.parentNode.id;
                            var idParts = id.split('_');
                            var server = cronManager.serverLookup[idParts[0]];
                            var cronId = idParts[1];
                            var cronField = idParts[2];
                            inputField.parentNode.innerText = inputValue;
                            inputField.remove();
                            cronManager.saveJsonField(server, cronId, cronField, inputValue, id);
                        }
                    }
                }
             });
        },
        
        isLastEmailAccount : function(email, cronJobJson){
            var index = 0;
            for (var i = 0; i < cronJobJson.length; i++) {
                var cronJob = cronJobJson[i];
                if(cronJob.email == email){
                    index++;
                }
            }
            if(index > 1){
                return false;
            }else{
                return true;
            }
        },
        
        createEmailDropDown : function(elementId, selectId, name, values){
            var select = document.createElement("select");
            select.name = name;
            select.id = selectId;         
            for (const val of values)
            {
                var option = document.createElement("option");
                option.value = val;
                option.text = val.charAt(0).toUpperCase() + val.slice(1);
                select.appendChild(option);
            }
            select.addEventListener("change", function() {
                var dropDownField = document.querySelector('#'+selectId);
                cronManager.saveEmailDropDownField(dropDownField);
            });
            document.getElementById(elementId).appendChild(select);
        },
        
        saveEmailDropDownField : function(that){
            var inputValue = that.value;
            var id = that.parentNode.id;
            var idParts = id.split('_');
            var server = cronManager.serverLookup[idParts[0]];
            var cronId = idParts[1];
            var cronField = idParts[2];
            that.parentNode.innerText = inputValue;
            that.remove();
            cronManager.saveJsonField(server, cronId, cronField, inputValue, id);
        },
        
        createCronJob : async function(server, cronId, cronField, inputValue, tdid){
            var data = {
                 cronid : cronId,
                 field : cronField,
                 value : inputValue,
                 tdid : tdid
            }
            var dataUrl = cronManager.serverUrl+"/api/dashboard/jobs/edit?auth="+cronManager.getAuthKey()+"&payload="+  encodeURIComponent(JSON.stringify(data));
            var json = await this.fetchJson(dataUrl);
            if(json.status == "error"){
                document.querySelector('#'+data.tdid).style.backgroundColor = 'red';
            }else{
                document.querySelector('#'+data.tdid).style.backgroundColor = 'white';
            }
        },
        
        saveJsonField : async function(server, cronId, cronField, inputValue, tdid){
            var data = {
                 cronid : cronId,
                 field : cronField,
                 value : inputValue,
                 tdid : tdid
            }
            var dataUrl = cronManager.serverUrl+"/api/dashboard/jobs/edit?auth="+cronManager.getAuthKey()+"&payload="+  encodeURIComponent(JSON.stringify(data));
            var json = await this.fetchJson(dataUrl);
            if(json.status == "error"){
                document.querySelector('#'+data.tdid).style.backgroundColor = 'red';
            }else{
                document.querySelector('#'+data.tdid).style.backgroundColor = 'white';
            }
        },

        handleJsonField : function(jsonField){
            var orgValue = jsonField.innerText;
            var input = document.createElement("INPUT");
            input.setAttribute("type", "text");
            jsonField.innerText = "";
            input.value = orgValue;
            input.id = "edit-json-field";
            jsonField.append(input);
        },
        showLogin : function (excludeIdList) {
            var allIds = [ 
            "loginname",
            "loginpass",
            "user-forgot-password",
            "login-user",
            "register-user",
            "reset-password",
            "register-link",
            "reset-link",
            "login-link"
            ]
            for (var i = 0; i < allIds.length; i++) {
                if(excludeIdList.includes(allIds[i])){
                    document.querySelector('#'+allIds[i]).style.display = "block";
                }else{
                    document.querySelector('#'+allIds[i]).style.display = "none";
                }
            }
        },
        setupLogin : function () {
            this.loginForm = document.createElement("form");
            this.loginForm.id = "loginform";
            var user = document.createElement("input");
            user.setAttribute('type', "text");
            user.setAttribute('name', "user");
            user.id = "loginname";
            user.style.display = "block";
            var userforgotpassword = document.createElement("input");
            userforgotpassword.id = "user-forgot-password";
            userforgotpassword.setAttribute('type', "text");
            userforgotpassword.setAttribute('name', "userforgotpassword");
            userforgotpassword.style.display = "none";
            var pass = document.createElement("input");
            pass.setAttribute('type', "password");
            pass.setAttribute('name', "pass");
            pass.id = "loginpass";
            pass.style.display = "block";
            var s = document.createElement("input");
            s.id = "login-user";
            s.setAttribute('type', "submit");
            s.setAttribute('value', "Login");
            s.addEventListener("click", this.submitLogin);
            var r = document.createElement("input");
            r.id = "register-user";
            r.setAttribute('type', "submit");
            r.setAttribute('value', "Register");
            r.style.display = "none";
            r.addEventListener("click", function(e){e.preventDefault();});
            var ufp = document.createElement("input");
            ufp.id = "reset-password";
            ufp.setAttribute('type', "submit");
            ufp.setAttribute('value', "Reset Password");
            ufp.style.display = "none";
            var rr = document.createElement("a");
            rr.innerText = "Register";
            rr.id = "register-link";
            rr.href = "#";
            var ra = document.createElement("a");
            ra.innerText = "Forgot Password";
            ra.id = "reset-link";
            ra.href = "#";
            var rl = document.createElement("a");
            rl.innerText = "Login";
            rl.id = "login-link";
            rl.href = "#";
            rl.style.display = "none";
            var br1 = document.createElement("br");
            var br2 = document.createElement("br");
            var br3 = document.createElement("br");
            this.loginForm.appendChild(user);
            this.loginForm.appendChild(pass);
            this.loginForm.appendChild(userforgotpassword);
            this.loginForm.appendChild(s);
            this.loginForm.appendChild(r);
            this.loginForm.appendChild(ufp);
            this.loginForm.appendChild(br1);
            this.loginForm.appendChild(rr);
            this.loginForm.appendChild(br2);
            this.loginForm.appendChild(ra);
            this.loginForm.appendChild(br3);
            this.loginForm.appendChild(rl);

            this.setupControles.appendChild(this.loginForm);
        },
        getUserAndPassFromCookie : function(){
            var cookieAuthKey = this.getCookie('authkey');
            var res = {}
            res.iscached = false;
            if(cookieAuthKey){
                var authKey = cronManager.aesDecrypt(cookieAuthKey);
                var authKeyParts = authKey.split(":::::");
                if(authKeyParts.length > 1){
                    res.user =  authKeyParts[0];
                    res.pass =  authKeyParts[1];
                    res.iscached = true;
                }
            }
            return res;
        },
        getUser : function(){
            var formData = new FormData(cronManager.loginForm);
            var user = formData.get("user");
            if(!user) user = this.getCookie('authUser');
            return user;
        },
        setUser : function(user){
            this.setCookie('authUser',user,1);
        },
        getAuthKey : function (){
            var res = this.getUserAndPassFromCookie();
            var user = res.user;
            var pass = res.pass; 
            if(!res.iscached){
                var formData = new FormData(cronManager.loginForm);
                user = formData.get("user");
                pass = formData.get("pass"); 
                if(!user || !pass)return "";
                var authKey = cronManager.aesEncrypt(user+":::::"+pass);
                this.setCookie('authkey',authKey,1);
                this.setUser(user);
            }

            return cronManager.encryptUserAndPassword(user, pass, cronManager.encKey);
        },       
        aesEncrypt : function(plainText){
            
            var key = CryptoJS.enc.Utf8.parse('b75524255a7f54d2726a951bb39204df');
            var iv  = CryptoJS.enc.Utf8.parse('1583288699248111');
            var text = plainText;
            var encryptedCP = CryptoJS.AES.encrypt(text, key, { iv: iv });
            var cryptText = encryptedCP.toString();
            return cryptText;
        },
        aesDecrypt : function(cryptText){
            var key = CryptoJS.enc.Utf8.parse('b75524255a7f54d2726a951bb39204df');
            var iv  = CryptoJS.enc.Utf8.parse('1583288699248111');
            var cipherParams = CryptoJS.lib.CipherParams.create({
                 ciphertext: CryptoJS.enc.Base64.parse(cryptText )
            });
            var decryptedFromText = CryptoJS.AES.decrypt(cipherParams, key, { iv: iv});
            return decryptedFromText.toString(CryptoJS.enc.Utf8);
        },
        encryptString : function(string, encKey){
            var iv = CryptoJS.lib.WordArray.random(128/8).toString(CryptoJS.enc.Hex);
            var salt = CryptoJS.lib.WordArray.random(128/8).toString(CryptoJS.enc.Hex);
            var aesUtil = new AesUtil(128, 1000);
            var ciphertext = aesUtil.encrypt(salt, iv, encKey, string);
            var aesPassword = (iv + "::" + salt + "::" + ciphertext);
            var password = btoa(aesPassword);
            return password;
        },
        encryptUserAndPassword : function(user, pass, encKey){
            var iv = CryptoJS.lib.WordArray.random(128/8).toString(CryptoJS.enc.Hex);
            var salt = CryptoJS.lib.WordArray.random(128/8).toString(CryptoJS.enc.Hex);
            var aesUtil = new AesUtil(128, 1000);
            var ciphertext = aesUtil.encrypt(salt, iv, encKey, user+":::::"+pass+":::::"+Date.now());
            var aesPassword = (iv + "::" + salt + "::" + ciphertext);
            var password = btoa(aesPassword);
            return password;
        },

        submitLogin : async function (e) {
            if(e)e.preventDefault();
            var authKey = cronManager.getAuthKey();
            var dataUrl = cronManager.serverUrl+"/api/dashboard/domains?auth=" + authKey;
            var serverJson = await cronManager.fetchJson(dataUrl);
            var timeZoneUrl = cronManager.serverUrl+"/api/dashboard/timezones?auth=" + authKey;
            cronManager.timeZoneData = await cronManager.fetchJson(timeZoneUrl);
            cronManager.servers = serverJson.serverlist;
            cronManager.setupServerDropDown("cron-manager", "server-dropdown-id", "server-dropdown-name", cronManager.servers);
            for (var i = 0; i < cronManager.servers.length; i++) {
                await cronManager.createServerTable(cronManager.servers[i], authKey);
            }
            if(e){
                document.querySelector('form#loginform').style.display = 'none';
            }
            cronManager.addLogoutLink();
            document.querySelector('#server-dropdown-id').disabled = false;
            cronManager.setupCss();
        },
        
        setupServerDropDown : function(elementId, selectId, name, values){
            var select = document.createElement("select");
            select.name = name;
            select.id = selectId;         
            select.style.display = "block";
            for (const val of values)
            {
                var option = document.createElement("option");
                var sanatizedVal = new URL(val).hostname;
                var serverId =cronManager.getIdFromServerUrl(val);
                option.value = serverId;
                option.text = sanatizedVal;
                select.appendChild(option);
            }
            select.addEventListener("change", function() {
                var wrappers = document.querySelectorAll('.server_wrapper_class');
                for (var i = 0; i < wrappers.length; i++) {
                    wrappers[i].style.display = "none";
                }
                document.querySelector('#server_wrapper_'+this.value).style.display = "flex";
            });
            
            if(document.querySelector('#'+selectId)){
                document.querySelector('#'+selectId).remove();
                console.log("delete dropdown")
            }else{
                select.disabled = true;
                document.getElementById(elementId).appendChild(select);
            }
            
            
        },
        getInputField : function(text, attributes){
            var input = document.createElement("INPUT");
            input.setAttribute("type", "text");
            for (variable in attributes) {
                input.setAttribute(variable, attributes[variable]);
            }
            return input;
        },
        getButton : function(text, attributes){
            var button = document.createElement("button");
            button.innerText = text;
            for (variable in attributes) {
                button.setAttribute(variable, attributes[variable]);
            }
            return button;
        },
        
        getDropDown : function(selectId, name, values){
            var select = document.createElement("select");
            select.name = name;
            select.id = selectId;        

            for (let i = 0; i < values.length; i++)
            {
                var option = document.createElement("option");
                var optionObj = values[i];
                for (variable in optionObj) {
                    option.value = variable;
                    option.text = optionObj[variable];
                  }
                select.appendChild(option);
            }
            return select;
        },
        
        createServerTable : async function (server, pass) {
            var serverId = cronManager.getIdFromServerUrl(server);
            var warmerEmailAccountsJson = {};
            
            if(!cronManager.masterDB.hasOwnProperty('warmerEmailAccounts')){
                var warmerEmailAccountsUrl = cronManager.serverUrl+"/api/dashboard/email/accounts?auth=" + pass;
                warmerEmailAccountsJson = await this.fetchJson(warmerEmailAccountsUrl);
                cronManager.masterDB.warmerEmailAccounts = warmerEmailAccountsJson;
            }else {
                warmerEmailAccountsJson = cronManager.masterDB.warmerEmailAccounts;
            }
            console.log(warmerEmailAccountsJson);
            var cronJobJson = warmerEmailAccountsJson;
            if(cronManager.getCronJobsByServerID === undefined)cronManager.getCronJobsByServerID = {};
            cronManager.getCronJobsByServerID[serverId] = cronJobJson;
            
            // Cron table
            
            var tblWrapper = document.createElement("div");
            tblWrapper.style.marginTop = '20px';  
            tblWrapper.style.display = 'none'; 
            tblWrapper.style.border = "1px solid";
            tblWrapper.style.padding = "5px";
            tblWrapper.style.flexDirection = "column";
            tblWrapper.id = "server_wrapper_"+serverId;
            tblWrapper.classList = "server_wrapper_class"; 

            var tblLabel = document.createElement("span");
            var tblLabelServer = document.createElement("span");
            tblLabelServer.classList = "server-name";
            tblLabelServer.innerText = new URL(server).hostname;

            var tblAddShowEmailButton = this.getButton("add email", {"class":"btn-add-email","style":"float:right;"});
            // var tblAddButton = this.getButton("add cron
            // job",{"class":"btn-add-cron-job","style":"float:right;"});
            
            tblLabel.appendChild(tblLabelServer);
            // tblLabel.appendChild(tblAddButton);
            tblLabel.appendChild(tblAddShowEmailButton);


            var espProvider = this.getDropDown("esp-provider", "espProvider", [{"google":"Google"},{"manual":"Manual"}]);
            var inputFirstName = this.getInputField("text", {"placeholder":"First name","name":"firstName","style":"float:right;"});
            var inputLastName = this.getInputField("text", {"placeholder":"Last name","name":"lastName","style":"float:right;"});
            var inputNewEmail = this.getInputField("text", {"placeholder":"Email","class":"add-new-email","name":"email","style":"float:right;"});
            var industry = this.getDropDown("industry", "industry", cronManager.industries);
            var timeZone = this.getDropDown("timezone", "timeZone", cronManager.timeZoneData);
            var inputImapUserName = this.getInputField("text", {"placeholder":"Imap username","name":"imapUsername","style":"float:right;"});
            var inputImapPass = this.getInputField("password", {"placeholder":"Imap password","class":"add-new-imap-password","name":"imapPassword","style":"float:right;"});
            var inputImapHost = this.getInputField("text", {"placeholder":"Imap server","name":"imapHost","style":"float:right;"});
            var inputImapPort = this.getInputField("text", {"placeholder":"Imap port","name":"imapPort","style":"float:right;"});
            var imapSecurity = this.getDropDown("imap-security", "imapSecurity", [{"true":"SSL/TLS"},{"false":"Insecure"}]);
            var inputSmtpUserName = this.getInputField("text", {"placeholder":"Smtp username","name":"smtpUsername","style":"float:right;"});
            var inputSmtpPass = this.getInputField("password", {"placeholder":"Smtp password","name":"smtpPassword","style":"float:right;"});
            var inputSmtpHost = this.getInputField("text", {"placeholder":"Smtp server","name":"smtpHost","style":"float:right;"});
            var inputSmtpPort = this.getInputField("text", {"placeholder":"Smtp port","name":"smtpPort","style":"float:right;"});
            var smtpSecurity = this.getDropDown("smtp-security", "smtpSecurity", [{"true":"SSL/TLS"},{"false":"Insecure"}]);

            
            var tblAddEmailButton = this.getButton("save",{"class":"btn-save-email","style":"float:right;"})
            var tblCancelEmailButton = this.getButton("cancel",{"class":"btn-cancel-email","style":"float:right;"})
            //var tblCheckEmailButton = this.getButton("check",{"class":"btn-check-email","style":"float:right;"})
            
            tblWrapper.appendChild(tblLabel);
            
            var emailInputWrapper = document.createElement("div");
            emailInputWrapper.style.display = "none";
            emailInputWrapper.classList = "email-input-wrapper";
            
            emailInputWrapper.appendChild(espProvider);
            emailInputWrapper.appendChild(inputFirstName);
            emailInputWrapper.appendChild(inputLastName);
            emailInputWrapper.appendChild(inputNewEmail);
            emailInputWrapper.appendChild(industry);
            emailInputWrapper.appendChild(timeZone);
            emailInputWrapper.appendChild(inputImapUserName);
            emailInputWrapper.appendChild(inputImapPass);
            emailInputWrapper.appendChild(inputImapHost);
            emailInputWrapper.appendChild(inputImapPort);
            emailInputWrapper.appendChild(imapSecurity);
            emailInputWrapper.appendChild(inputSmtpUserName);
            emailInputWrapper.appendChild(inputSmtpPass);
            emailInputWrapper.appendChild(inputSmtpHost);
            emailInputWrapper.appendChild(inputSmtpPort);
            emailInputWrapper.appendChild(smtpSecurity);
            
            var emailButtonWrapper = document.createElement("div");
            emailButtonWrapper.style.display = "flex";
            emailButtonWrapper.appendChild(tblCancelEmailButton);
            //emailButtonWrapper.appendChild(tblCheckEmailButton);            
            emailButtonWrapper.appendChild(tblAddEmailButton);
            
            emailInputWrapper.appendChild(emailButtonWrapper);

            tblWrapper.appendChild(emailInputWrapper);

            
            let table = new Table();
            
            var filteredCronJobJson = [];

            console.log(cronJobJson);
            var j = 0;
            for (var i = 0; i < cronJobJson.length; i++) {
                if(!cronJobJson.hasOwnProperty('state')){
                    cronJobJson[i].state = "active";
                    if(cronJobJson[i].expression == "* * 31 2 *"){
                        cronJobJson[i].state = "paused";
                        cronJobJson[i].state = "";
                    }              
                    // * * 31 2 * disabled cron -- “At every minute on
                    // day-of-month 31 in February.”
                }
                var email = cronJobJson[i].email;
                var domain = email.split('@').pop();
                
                if(domain == server.replace("http://","")){
                    filteredCronJobJson[j] = cronJobJson[i];
                    j++;
                }

            }
            cronJobJson = filteredCronJobJson;
            
            var tbl = table.createJsonTable(serverId, cronJobJson);
            tbl.style.marginTop = '20px';  
            tblWrapper.appendChild(tbl);
            document.querySelector('#cron-manager').appendChild(tblWrapper);           
//            var emailUrl = cronManager.serverUrl+"/api/dashboard/emails?auth=" + pass
//            var emailJson = await this.fetchJson(emailUrl);
//            if(cronManager.emailByServerIdLookup === undefined)cronManager.emailByServerIdLookup = {};           
//            cronManager.emailByServerIdLookup[serverId] = emailJson;
        },
        
        fetchJson : async function(url){
                const response = await fetch(url);
                response.ok;     
                response.status; 
                const json = await response.json();
                return json;
        },
        
        getIdFromServerUrl : function (serverUrl) {
            var url = new URL(serverUrl);
            var id = url.hostname.replace('.', '-');
            if(cronManager.serverLookup === undefined)cronManager.serverLookup = {};
            cronManager.serverLookup[id] = serverUrl;
            return id;
        },
        
        seconds_since_epoch : function(d){ 
            return Math.floor( d / 1000 ); 
        },
        
        setCookie : function (name,value,days) {
            var expires = "";
            if (days) {
                var date = new Date();
                date.setTime(date.getTime() + (days*24*60*60*1000));
                expires = "; expires=" + date.toUTCString();
            }
            document.cookie = name + "=" + (value || "")  + expires + "; path=/";
        },
        
        getCookie : function(name) {
            var nameEQ = name + "=";
            var ca = document.cookie.split(';');
            for(var i=0;i < ca.length;i++) {
                var c = ca[i];
                while (c.charAt(0)==' ') c = c.substring(1,c.length);
                if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
            }
            return null;
        },
        
        eraseCookie: function(name, path) {
            document.cookie = name + '=; Path=' + path + '; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
        }
        

    }
})();