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
    //FIXME more form data checking


    return {
        init : async function (id) {
            this.encKey = "1234567891234567";
            this.editableColoms = ['expression','email','batchSize'];
            this.hiddenColoms = ['id','expressiondesc','user'];
            this.formatColoms = ['command','state'];
            this.id = id;
            this.widget = document.getElementById(this.id);
            this.setupControles();
            this.setupEvents();
        },

        setupControles : function () {
            this.setupMessages = document.createElement("div");
            this.setupMessages.id = this.id + "-messages";
            this.widget.appendChild(this.setupMessages);
           
            this.setupControles = document.createElement("div");
            this.setupControles.classList = this.id + "-controles";
            this.widget.appendChild(this.setupControles);
            this.setupLogin();
        },

        setupEvents : async function(){
            document.addEventListener('click', async function(e) {

                if(e.target.classList == "btn-save-email"){
                    console.log('saving email');
                    var email = e.target.parentNode.parentNode.querySelector('.add-new-email').value.trim();
                    var password = e.target.parentNode.parentNode.querySelector('.add-new-password').value.trim();
                    console.log();
                    var newEmailPlusAuth = cronManager.encryptUserAndPassword(email, password, cronManager.encKey);
                  
                    
                    var serverWrapper = e.target.closest(".server_wrapper_class");                   
                    var id = serverWrapper.id;
                    var idParts = id.split('_');
                    var serverId = idParts[2];
                    var server = cronManager.serverLookup[serverId];
                    
                    
                    var addEmailAccountUrl = server + "/api/crontab/email/account/add?auth=" + cronManager.getAuthKey() + "&newEmailPlusAuth=" + newEmailPlusAuth;
                    var newEmailAccount = await cronManager.fetchJson(addEmailAccountUrl);
                    console.log(newEmailAccount);
                    var messages = document.querySelector('#cron-manager-messages');
                    if(newEmailAccount.status == "success"){
                        e.target.previousSibling.click();
                        messages.innerHTML = "Please wait 5 minutes for the email to become active";
                    }else{
                        messages.innerHTML = "Oops something went wrong";
                    }
                    setTimeout(() => {
                        messages.innerHTML = "";
                    }, 3000);
                }
                
                if(e.target.classList == "btn-add-email"){
                    console.log('adding email');
                    var wrapper = e.target.parentNode.parentNode.querySelector('.email-input-wrapper'); 
                    console.log(wrapper);
                    wrapper.style.display = "grid";
                }
                
                if(e.target.classList == "btn-cancel-email"){
                    console.log('cancel email');
                    e.target.parentNode.parentNode.style.display = "none";
                }
                
                if(e.target.innerText.trim() == "delete"){
                    e.target.parentNode.parentNode.parentNode.style.backgroundColor = "#9ecdf5";

                    setTimeout(async function(){ 
                        var tdId = e.target.parentNode.parentNode.id;
                        console.log(tdId);
                        var cronJobIdParts = tdId.split("_");
                        var cronJobId = cronJobIdParts[cronJobIdParts.length - 2];
                        
                        console.log("deleting : " + cronJobId);
                        var serverWrapper = e.target.closest(".server_wrapper_class");                   
                        var id = serverWrapper.id;
                        var idParts = id.split('_');
                        var serverId = idParts[2];
                        var server = cronManager.serverLookup[serverId];
                        
                        var cronJobJson = cronManager.getCronJobsByServerID[serverId];
                        
                        var email = document.querySelector("#"+tdId.replace("_state","_email")).innerText.trim();
                        
                        console.log(email);
                        
                        var isLastEmailAccount = cronManager.isLastEmailAccount(email, cronJobJson);
                        
                        console.log(isLastEmailAccount);
                        var txt;
                        
                        if(isLastEmailAccount){
                            var r = confirm("By deleting this cronjob you will also delete email account : "+ email + " do you want this?");
                            if (r == true) {
                              txt = "You pressed OK!";
                              var deleteCronJobUrl = server + "/api/crontab/job/delete?auth=" + cronManager.getAuthKey() + "&id=" + cronJobId + "&deleteemail=true&email="+email;
                              var newCronJob = await cronManager.fetchJson(deleteCronJobUrl);
                              console.log(newCronJob);
                            } else {
                              txt = "You pressed Cancel!";
                            }
                        }else{
                            var r = confirm("Are you sure you want to delete this cron job?");
                            if (r == true) {
                              txt = "You pressed OK!";
                              var deleteCronJobUrl = server + "/api/crontab/job/delete?auth=" + cronManager.getAuthKey() + "&id=" + cronJobId + "&deleteemail=false";
                              var newCronJob = await cronManager.fetchJson(deleteCronJobUrl);
                              console.log(newCronJob);
                            } else {
                              txt = "You pressed Cancel!";
                            }
                        }
                        


                        console.log(txt);
                        e.target.parentNode.parentNode.parentNode.style.backgroundColor = "";
                        
                        var formData = new FormData(cronManager.loginForm);
                        var user = formData.get("user");
                        var password = cronManager.getAuthKey();
                      
                        cronManager.createServerTable(server, user, password);
                        
                        
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

                    var newCronJobUrl = server + "/api/crontab/job/new?auth=" + cronManager.getAuthKey();
                    var newCronJob = await cronManager.fetchJson(newCronJobUrl);
                    console.log(cronJobJson);
                    console.log(newCronJob);
                    // reload table
                    
                    var formData = new FormData(cronManager.loginForm);
                    var user = formData.get("user");
                    var password = cronManager.getAuthKey();
                  
                    cronManager.createServerTable(server, user, password);
                    
                    
                    setTimeout(function(){ 
                        document.querySelector('#'+id).style.display = "inline-grid"; 
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
                
                if (e.target.closest('.json-field')) {
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
            var dataUrl = server + "/api/crontab/jobs/edit?auth="+cronManager.getAuthKey()+"&payload="+  encodeURIComponent(JSON.stringify(data));
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
            var dataUrl = server + "/api/crontab/jobs/edit?auth="+cronManager.getAuthKey()+"&payload="+  encodeURIComponent(JSON.stringify(data));
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
        
        setupLogin : function () {
            this.loginForm = document.createElement("form");
            var user = document.createElement("input");
            user.setAttribute('type', "text");
            user.setAttribute('name', "user");
            var pass = document.createElement("input");
            pass.setAttribute('type', "password");
            pass.setAttribute('name', "pass");
            var s = document.createElement("input");
            s.setAttribute('type', "submit");
            s.setAttribute('value', "Submit");
            this.loginForm.appendChild(user);
            this.loginForm.appendChild(pass);
            this.loginForm.appendChild(s);
            this.loginForm.addEventListener("submit", this.submitLogin);
            this.setupControles.appendChild(this.loginForm);
        },
        
        getAuthKey : function (){
            var formData = new FormData(cronManager.loginForm);
            var user = formData.get("user");
            var pass = formData.get("pass");
            return cronManager.encryptUserAndPassword(user, pass, cronManager.encKey);
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
            e.preventDefault();
            

                
                
            
            
            var formData = new FormData(cronManager.loginForm);
            var user = formData.get("user");
            var password = cronManager.getAuthKey();
            //var serverUrl = "https://agile-ridge-12468.herokuapp.com/?user="+user+"&domain="+location.hostname;
            var serverUrl = "http://0.0.0.0:5000/?user="+user+"&domain="+location.hostname;
            var serverJson = await cronManager.fetchJson(serverUrl);
            cronManager.servers = serverJson.serverlist;
            cronManager.setupServerDropDown("cron-manager", "server-dropdown-id", "server-dropdown-name", cronManager.servers);
            for (var i = 0; i < cronManager.servers.length; i++) {
                cronManager.createServerTable(cronManager.servers[i], user, password);
            }
            document.querySelector('form > input[name=user]').style.visibility = 'hidden';
            document.querySelector('form > input[name=pass]').style.visibility = 'hidden';
            document.querySelector('form > input[type=submit]').value = "reload";
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
                document.querySelector('#server_wrapper_'+this.value).style.display = "inline-grid";
            });
            
            if(document.querySelector('#'+selectId)){
                document.querySelector('#'+selectId).remove();
                console.log("delete dropdown")
            }else{
                document.getElementById(elementId).appendChild(select);
            }
            
            
        },

        
        createServerTable : async function (server, user, pass) {
            var dataUrl = server + "/api/crontab/jobs?auth=" + pass
            var serverId = cronManager.getIdFromServerUrl(server);
            var cronJobJson = await this.fetchJson(dataUrl);

            if(cronManager.getCronJobsByServerID === undefined)cronManager.getCronJobsByServerID = {};
            
            cronManager.getCronJobsByServerID[serverId] = cronJobJson;
            
            // Cron table
            
            var tblWrapper = document.createElement("div");
            tblWrapper.style.marginTop = '20px';  
            tblWrapper.style.display = 'none'; 
            tblWrapper.style.border = "1px solid";
            tblWrapper.style.padding = "5px";
            tblWrapper.id = "server_wrapper_"+serverId;
            tblWrapper.classList = "server_wrapper_class"; 
            
            //var tblLabel = document.createElement("span");

            var tblLabel = document.createElement("span");
            var tblLabelServer = document.createElement("span");
            tblLabelServer.classList = "server-name";
            tblLabelServer.innerText = new URL(server).hostname;


            var tblAddShowEmailButton = document.createElement("button");
            tblAddShowEmailButton.innerText = "add email";
            tblAddShowEmailButton.style.float = "right";
            tblAddShowEmailButton.classList = "btn-add-email";
            
            var tblAddButton = document.createElement("button");
            tblAddButton.innerText = "add cron job";
            tblAddButton.style.float = "right";
            tblAddButton.classList = "btn-add-cron-job";
            
            
            tblLabel.appendChild(tblLabelServer);
            tblLabel.appendChild(tblAddButton);
            tblLabel.appendChild(tblAddShowEmailButton);

            
            
            var input = document.createElement("INPUT");
            input.setAttribute("type", "text");
            input.id = "add-new-email_"+serverId;
            input.classList = "add-new-email";
            input.style.marginTop = "10px";
            input.placeholder = "Email"
            
            var inputPass = document.createElement("INPUT");
            inputPass.setAttribute("type", "password");
            inputPass.id = "add-new-password_"+serverId;
            inputPass.classList = "add-new-password";
            inputPass.style.marginBottom = "10px";
            inputPass.style.marginTop = "10px";
            inputPass.placeholder = "Password"
            
            var tblAddEmailButton = document.createElement("button");
            tblAddEmailButton.innerText = "save email";
            tblAddEmailButton.style.float = "right";
            tblAddEmailButton.classList = "btn-save-email";
            
            var tblCancelEmailButton = document.createElement("button");
            tblCancelEmailButton.innerText = "cancel";
            tblCancelEmailButton.style.float = "right";
            tblCancelEmailButton.classList = "btn-cancel-email";
            
            
            tblWrapper.appendChild(tblLabel);
            
            var emailInputWrapper = document.createElement("div");
            emailInputWrapper.style.display = "none";
            emailInputWrapper.classList = "email-input-wrapper";
            
            emailInputWrapper.appendChild(input);
            emailInputWrapper.appendChild(inputPass);
            
            var emailButtonWrapper = document.createElement("div");
            emailButtonWrapper.style.display = "flex";
            emailButtonWrapper.appendChild(tblCancelEmailButton);
            emailButtonWrapper.appendChild(tblAddEmailButton);
            
            emailInputWrapper.appendChild(emailButtonWrapper);

            tblWrapper.appendChild(emailInputWrapper);
            
            
            let table = new Table();
            
            console.log(cronJobJson);
            for (var i = 0; i < cronJobJson.length; i++) {
                if(!cronJobJson.hasOwnProperty('state')){
                    cronJobJson[i].state = "active";
                    
                    if(cronJobJson[i].expression == "* * 31 2 *"){
                        cronJobJson[i].state = "paused";
                    }
                    
                    //* * 31 2 * disabled cron -- “At every minute on day-of-month 31 in February.”
                }
            }
            
            var tbl = table.createJsonTable(serverId, cronJobJson);
            tbl.style.marginTop = '20px';  
            tblWrapper.appendChild(tbl);

            // Email table           
            
            //var tbl2 = table.createJsonTable(serverId+"-outbounddr-com", cronJobJson);
            //tbl2.style.marginTop = '20px';  
            //tblWrapper.appendChild(tbl2);

            
            document.querySelector('#cron-manager').appendChild(tblWrapper);
            
            var emailUrl = server + "/api/crontab/emails?auth=" + pass
            var emailJson = await this.fetchJson(emailUrl);
            if(cronManager.emailByServerIdLookup === undefined)cronManager.emailByServerIdLookup = {};           
            cronManager.emailByServerIdLookup[serverId] = emailJson;
        },
        
        fetchJson : async function(url){
                const response = await fetch(url);
                response.ok;     // => false
                response.status; // => 404
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
        }

    }
})();