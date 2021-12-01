var cronManager = (function () {
    
    var hasRun = false;
    var timestamp;
    var timestampDelete;

    return {
        init : async function (id, serverUrl) {
            
            console.log("setup init");
            
            this.widget = document.getElementById(id);
            if(cronManager.widget){
                cronManager.widget.innerHTML = "";   
            }
            
            
            this.encKey = "1234567891234567";
            this.editableColoms = ['expression','email','batchSize'];
            this.hiddenColoms = ['id','expressiondesc','user','command','active'];
            this.formatColoms = ['state'];
            this.availableEmails = [];
            this.id = id;
            this.serverUrl = serverUrl;

            cronManager.listenForLogin();
            

        },
        main : async function(){
            await cronManager.initControles();
            await cronManager.setupEvents();
        },
        initControles : async function () {
            this.setupMessages = document.createElement("div");
            this.setupMessages.id = this.id + "-messages";
            
            if(this.setupMessages){
                cronManager.widget.appendChild(this.setupMessages);   
            }
            
            this.setupControles = document.createElement("div");
            this.setupControles.classList = this.id + "-controles";
            
            if(this.setupControles){
                cronManager.widget.appendChild(this.setupControles);                
            }

            
            await this.setupTable();

        },
        
        listenForLogin : async function(){
            var targetNode = document.querySelector('body');
            if(targetNode.classList.contains('dashboard')){
                await cronManager.main();
                spinner.off();
            }else{
                var config = { attributes: true, childList: true };
                var callback = async function(mutationsList) {
                    for(var mutation of mutationsList) {
                        if (mutation.type == 'childList') {
                        }
                        else if (mutation.type == 'attributes') {
                            if(document.body.classList.contains('dashboard')){
                                await cronManager.main();
                                spinner.off();
                            }
                        }
                    }
                };
                var observer = new MutationObserver(callback);
                observer.observe(targetNode, config);
            }
        },
        
        howManyCronJobsForThisEmail : function(email){
            var nrOfEmails = 0;
            for (var i = 0; i < cronManager.cronJobJsonArray.length; i++) {
                var job = cronManager.cronJobJsonArray[i];
                if(job.email == email){
                    nrOfEmails++;
                }
            }
            return nrOfEmails;
        },
        
        setupTable : async function(){
        
            
            
            var dataUrl = cronManager.serverUrl + "/api/server/domains?auth=" + userManager.getAuthKey();
            cronManager.serverList = await this.fetchJson(dataUrl);
            
            
            
            
            var dataUrl = cronManager.serverUrl + "/api/crontab/jobs?auth=" + userManager.getAuthKey();
            var cronJobJsonArray = await this.fetchJson(dataUrl);
            cronManager.cronJobJsonArray = cronJobJsonArray;
            var domains = [];
            for (var i = 0; i < cronJobJsonArray.length; i++) {
                var job = cronJobJsonArray[i];
                var domain = "http://"+job.email.replace(/.*@/, "");
                if(!domains.includes(domain)){
                    domains.push(domain);
                    cronManager.availableEmails.push(job.email);
                }
            }
            if(cronManager.serverList){
                if(cronManager.serverList.serverlist.length > 0){
                    cronManager.setupServerDropDown("cron-manager", "email-dropdown-id", "server-dropdown-name", cronManager.serverList.serverlist);   
                }
                cronManager.createServerTable(cronJobJsonArray);   
            }
            
            //if(cronManager.cronJobJsonArray.length == 0){
                document.querySelector("#email-dropdown-id").style.visibility = "hidden";
            //}
            
        },
        
        
        setupEvents : async function(){
            console.log("setup events");
            document.addEventListener('click', async function(e) {
                
                if(cronManager.timestamp){
                   var diff = Date.now() - cronManager.timestamp;
                   if(diff < 1000){
                       // FIXME
                       return;
                   }
                }
                cronManager.timestamp = Date.now();
                
                var tabcontent = e.target.closest('.tabcontent');
                if(tabcontent !== null){
                    if(tabcontent.id !== "Contact"){
                        return;
                    }
                }
                
                if(e.target.classList == "help-link"){
                    document.getElementById("help-modal").style.display = "block";
                    document.getElementById("inner-help-modal").innerHTML='<object type="text/html" data="help/schedule.html" ></object>';
                    return;
                }

                if(e.target.classList == "btn-save-email"){
                    spinner.on();
                    console.log('saving email');
                    var email = e.target.parentNode.parentNode.querySelector('.add-new-email').value.trim();
                    var password = "nopass";// e.target.parentNode.parentNode.querySelector('.add-new-password').value.trim();
                    
                    var isValidEmail = true; // we can create random cronjobs
                                                // no problem
                    // if server has account it's ok if not it's no problem
                    var domains = cronManager.serverList.serverlist;
                    for (var i = 0; i < domains.length; i++) {
                        var domain = domains[i];
                        // console.log(domain);
                        var url = new URL(domain);
                        var hostname = url.hostname;
                        var emaildomain = email.split('@')[1];
                        if(hostname == emaildomain){
                            isValidEmail = true;
                        }
                        
                    }
                    
                    var messages = document.querySelector('#cron-manager-messages');
                    
                    if(isValidEmail){
                        var newEmailPlusAuth = userManager.encryptUserAndPassword(email, password, userManager.encKey);
                        var serverWrapper = e.target.closest(".email_wrapper_class");                   
                        var id = serverWrapper.id;
                        var addEmailAccountUrl = cronManager.serverUrl + "/api/crontab/email/account/add?auth=" + userManager.getAuthKey() + "&newEmailPlusAuth=" + newEmailPlusAuth;
                        var newEmailAccount = await cronManager.fetchJson(addEmailAccountUrl);
                        console.log(newEmailAccount);

                        if(newEmailAccount.status == "success"){
                            e.target.previousSibling.click();
                            cronManager.addCronJob(email);
                            messages.innerHTML = "Please create an new cronjob to activate the email";
                        }else{
                            messages.innerHTML = "Oops something went wrong";
                        }
                        setTimeout(() => {
                            messages.innerHTML = "";
                        }, 13000);
                    }else{
                        messages.innerHTML = "There is no server for this email";
                    }
                    setTimeout(() => {
                        messages.innerHTML = "";
                    }, 13000);
                    
                    return;
                }
                
                if(e.target.classList == "btn-add-email"){
                    var wrapper = e.target.parentNode.parentNode.querySelector('.email-input-wrapper'); 
                    wrapper.style.display = "grid";
                    return;
                }
                
                if(e.target.classList == "btn-cancel-email"){
                    e.target.parentNode.parentNode.style.display = "none";
                    return;
                }
                
                if(e.target.innerText.trim() == "delete"){
                    spinner.on();
                    if(cronManager.timestampDelete){
                        var diff = Date.now() - cronManager.timestampDelete;
                        console.log(diff);
                        if(diff < 3000){
                            // FIXME
                            console.log("delete return");
                            return;
                        }
                     }
                     cronManager.timestampDelete = Date.now();
                    
                    
                    e.target.parentNode.parentNode.parentNode.style.backgroundColor = "#9ecdf5";

                        var tdId = e.target.parentNode.parentNode.id;
                        var cronJobIdParts = tdId.split("_");
                        var cronJobId = cronJobIdParts[cronJobIdParts.length - 2];
                        var serverWrapper = e.target.closest(".email_wrapper_class");                   
                        var id = serverWrapper.id;
                        var email = document.querySelector("#"+tdId.replace("_state","_email")).innerText.trim();
                        // FIXME
                        
                        var nrOfEmails = cronManager.howManyCronJobsForThisEmail(email);

                        var isLastEmailAccount = false;
                        if(nrOfEmails == 1){
                            isLastEmailAccount = true;
                        }
                        
                        if(isLastEmailAccount){
                            var r = confirm("By deleting this cronjob you will also delete email account : "+ email + " do you want this?");
                            if (r == true) {
                              var deleteCronJobUrl = cronManager.serverUrl + "/api/crontab/job/delete?auth=" + userManager.getAuthKey() + "&id=" + cronJobId + "&deleteemail=true&email="+email;
                              await cronManager.fetchJson(deleteCronJobUrl);
                              await cronManager.setupTable();
                            }
                        }else{
                            var r = confirm("Are you sure you want to delete this cron job?");
                            if (r == true) {
                              var deleteCronJobUrl = cronManager.serverUrl + "/api/crontab/job/delete?auth=" + userManager.getAuthKey() + "&id=" + cronJobId + "&deleteemail=false";
                              await cronManager.fetchJson(deleteCronJobUrl);
                              await cronManager.setupTable();
                            }
                        }
                        e.target.parentNode.parentNode.parentNode.style.backgroundColor = "";
                        spinner.off();
                        return;
                }
                
                if(e.target.classList == "btn-add-cron-job"){
                    spinner.on();
                    cronManager.addCronJob(email);
                    return;
                }
//                if(e.target.innerText.trim() == "* * 31 2 *"){
//                    return;
//                }
                if(e.target.innerText.trim() == "pause"){
                    spinner.on();
                    var tmpTdId = e.target.parentNode.parentNode.id.replace("_state","_expression");

                    //var tmpTdIdActive = e.target.parentNode.parentNode.id.replace("_state","_active");
                    //var tmpTdActive = e.target.parentNode.parentNode.parentNode.querySelector('#'+tmpTdIdActive);
                    
                    //var tmpTd = e.target.parentNode.parentNode.parentNode.querySelector('#'+tmpTdId);
                    //tmpTd.innerText = "0 * 31 2 *"
                    //var inputValue = "0 * 31 2 *";
                    var id = tmpTdId;
                    var idParts = id.split('_');
                    var cronId = idParts[1];
                    //var cronField = idParts[2];
                    
                    //await cronManager.saveJsonField(cronId, cronField, inputValue, id);
                    
                    await cronManager.saveJsonField(cronId, "active", "active", id);
                    
                    e.target.innerText = "active";   
                    e.target.classList.remove("state-pause");
                    e.target.classList.add("state-active");
                    spinner.off();
                    return;
                }
                
                if(e.target.innerText.trim() == "active"){
                    spinner.on();
                    //console.log(e.target);
                    var tmpTdId = e.target.parentNode.parentNode.id.replace("_state","_expression");
                    //var tmpTd = e.target.parentNode.parentNode.parentNode.querySelector('#'+tmpTdId);
                    //tmpTd.innerText = "* * 31 2 *";
                    //var inputValue = "* * 31 2 *";
                    var id = tmpTdId;
                    var idParts = id.split('_');
                    var cronId = idParts[1];
                    //var cronField = idParts[2];
                    
                    //await cronManager.saveJsonField(cronId, cronField, inputValue, id);
                    
                    await cronManager.saveJsonField(cronId, "active", "pause", id);
                    
                    e.target.innerText = "pause";
                    e.target.classList.remove("state-active");
                    e.target.classList.add("state-pause");
                    spinner.off();
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
                        var elementId = jsonField.id;
                        var selectId = "email-dropdown";
                        var name = "email-dropdown";
                        var values = cronManager.availableEmails;
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
                            spinner.on();
                            await cronManager.saveEmailDropDownField(dropDownField);
                            spinner.off();
                        }else if(inputField){
                            var inputValue = inputField.value;
                            var id = inputField.parentNode.id;
                            var idParts = id.split('_');
                            var cronId = idParts[1];
                            var cronField = idParts[2];
                            inputField.parentNode.innerText = inputValue;
                            inputField.remove();
                            spinner.on();
                            await cronManager.saveJsonField(cronId, cronField, inputValue, id);
                            spinner.off();
                        }
                    }
                    return;
                }
             });
        },
        
        addCronJob : async function(email){
            spinner.on();
            if(!email){
                email = "set-email@no-email.com";
            }
            var newCronJobUrl = cronManager.serverUrl + "/api/crontab/job/new?auth=" + userManager.getAuthKey() + "&email="+email;
            await cronManager.fetchJson(newCronJobUrl);
            await cronManager.setupTable();
            document.querySelector('#serverId-table > tbody > tr:last-child').style.backgroundColor = "yellow";
            setTimeout(function(){ 
                document.querySelector('#serverId-table > tbody > tr:last-child').style.backgroundColor = "transparent"; 
                spinner.off();
            }, 10000);
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
            
            var uniq = [...new Set(values)];
            
            var select = document.createElement("select");
            select.name = name;
            select.id = selectId;         
            for (const val of uniq)
            {
                if(val !== "undefined"){
                    var option = document.createElement("option");
                    option.value = val;
                    option.text = val.charAt(0).toUpperCase() + val.slice(1);
                    select.appendChild(option);   
                }
            }
            select.addEventListener("change", function() {
                var dropDownField = document.querySelector('#'+selectId);
                cronManager.saveEmailDropDownField(dropDownField);
            });
            document.getElementById(elementId).appendChild(select);
        },
        
        saveEmailDropDownField : async function(that){
            var inputValue = that.value;
            var id = that.parentNode.id;
            var idParts = id.split('_');
            var cronId = idParts[1];
            var cronField = idParts[2];
            that.parentNode.innerText = inputValue;
            that.remove();
            await cronManager.saveJsonField(cronId, cronField, inputValue, id);
        },



        isIterable : function(obj) {
            // checks for null and undefined
            if (obj == null) {
              return false;
            }
            return typeof obj[Symbol.iterator] === 'function';
        },
        
        setupServerDropDown : function(elementId, selectId, name, values){
            if(!cronManager.isIterable(values))return;
            var select = document.createElement("select");
            select.name = name;
            select.id = selectId;         
            select.style.display = "block";
            for (const val of values)
            {
                var option = document.createElement("option");
                var sanatizedVal = new URL(val).hostname;
                option.value = "";
                option.text = sanatizedVal;
                select.appendChild(option);
            }
            select.addEventListener("change", function() {
                var wrappers = document.querySelectorAll('.email_wrapper_class');
                for (var i = 0; i < wrappers.length; i++) {
                    wrappers[i].style.display = "none";
                }
                if(document.querySelector('#email_wrapper_'+this.value)){
                    document.querySelector('#email_wrapper_'+this.value).style.display = "inline-grid";   
                }
            });
            
            if(document.querySelector('#'+selectId)){
                document.querySelector('#'+selectId).remove();
                console.log("delete dropdown")
                document.getElementById(elementId).appendChild(select);
            }else{
                document.getElementById(elementId).appendChild(select);
            }  
        },

        fieldWrapper : function(text, field){
            var fieldWrapper = document.createElement("div");
            var newlabel = document.createElement("Label");
            newlabel.innerHTML = text;
            fieldWrapper.appendChild(newlabel);
            fieldWrapper.appendChild(field);
            return fieldWrapper;
        },
        
        createServerTable : async function (cronJobJson) {

            var tblWrapper = document.createElement("div");
            tblWrapper.style.marginTop = '20px';  
            tblWrapper.style.border = "1px solid";
            tblWrapper.style.padding = "5px";
            tblWrapper.style.width = "100%";
            tblWrapper.id = "email_wrapper_";// +serverId;
            tblWrapper.classList = "email_wrapper_class"; 
            var tblLabel = document.createElement("span");
            var tblLabelServer = document.createElement("span");
            tblLabelServer.classList = "server-name";
            tblLabelServer.innerText = "";// new URL(server).hostname;
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
            input.id = "add-new-email_";// +serverId;
            input.classList = "add-new-email";
            input.style.marginTop = "10px";
            input.placeholder = "Email";
            var inputPass = document.createElement("INPUT");
            inputPass.setAttribute("type", "password");
            inputPass.id = "add-new-password_";// +serverId;
            inputPass.classList = "add-new-password";
            inputPass.style.marginBottom = "10px";
            inputPass.style.marginTop = "10px";
            inputPass.placeholder = "Password";
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
// emailInputWrapper.appendChild(input);
// emailInputWrapper.appendChild(inputPass);
            
            emailInputWrapper.appendChild(this.fieldWrapper("Email", input));
            // emailInputWrapper.appendChild(this.fieldWrapper("Password",
            // inputPass));
            
            var emailButtonWrapper = document.createElement("div");
            emailButtonWrapper.style.display = "flex";
            emailButtonWrapper.appendChild(tblCancelEmailButton);
            emailButtonWrapper.appendChild(tblAddEmailButton);
            emailInputWrapper.appendChild(emailButtonWrapper);
            
            
            tblWrapper.appendChild(emailInputWrapper);
            
            
            // tblWrapper.appendChild(this.fieldWrapper("Imap password",
            // emailInputWrapper));
            
            
            
            let table = new Table();
            if(cronJobJson !== null){
                for (var i = 0; i < cronJobJson.length; i++) {
                    

                    
                    if(cronJobJson[i].active == "null"){
                        cronJobJson[i].active = "pause";
                    }
                    
                    cronJobJson[i].state = cronJobJson[i].active;
                    
//                    if(!cronJobJson.hasOwnProperty('state')){
//                        cronJobJson[i].state = "active";
//                        if(cronJobJson[i].expression == "* * 31 2 *"){
//                            cronJobJson[i].state = "pause";
//                        }
//                    }
                }  
                var tbl = table.createJsonTable("serverId", cronJobJson, cronManager.editableColoms, cronManager.hiddenColoms, cronManager.formatColoms);
                tbl.style.marginTop = '20px'; 
                tblWrapper.appendChild(tbl);
                document.querySelector('#cron-manager').appendChild(tblWrapper);
            }
        },
        
        fetchJson : async function(url){
            try {
                const response = await fetch(url);
                response.ok;     // => false
                response.status; // => 404
                const json = await response.json();
                return json;
            } catch (e) {
                return null;
            }

        },
        
        
        saveJsonField : async function(cronId, cronField, inputValue, tdid){
            var data = {
                 cronid : cronId,
                 field : cronField,
                 value : inputValue,
                 tdid : tdid
            }
            var dataUrl = cronManager.serverUrl + "/api/crontab/jobs/edit?auth="+userManager.getAuthKey()+"&payload="+  encodeURIComponent(JSON.stringify(data));
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
        
        seconds_since_epoch : function(d){ 
            return Math.floor( d / 1000 ); 
        }

    }
})();