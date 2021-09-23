var serverManager = (function () {

//    var servers = [];
//    var serverLookup = {};
//    var emailByServerIdLookup = {};
//    var widget = {};
//    var setupControles = {};
//    var editableColoms = [];
//    var hiddenColoms = [];
//    var formatColoms = [];
//    var getCronJobsByServerID = {};
//    var serverUrl = "";
//    var timeZoneData = [];
//    var masterDB = {};
//    var industries = {};
//    let publicKey;

    return {
        init : async function (id, serverUrl) {
            
            serverManager.id = id;
            document.querySelector("#"+id).innerHTML = "";
            
            serverManager.masterDB = {};
            serverManager.serverUrl = serverUrl;
            serverManager.editableColoms = ['expression','email','batchSize'];
            serverManager.hiddenColoms = ['serverAccount','id','expressiondesc','user', 'warmerEmailAccount','expression','command','batchSize','email'];
            serverManager.formatColoms = ['command','state','email'];
            serverManager.widget = document.getElementById(this.id);
            serverManager.industries = await this.getIndustries();
            serverManager.publicKey = "MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCBWMSNABfvlZCM2EBJiDllyoIsChTxxyuxeE1pbaaxab/lwumdE9RJWAwYMUufgnGncaYZXwZInH0W3Ys+dLbu3j7zxXZ7x9LWhZA9MLbCH+Xf+DxgbU5kaeNx1m0f7tz7xj2CntHuYBYY9BkDNyTbnKOr7RwilNllVQvpV6A9RwIDAQAB";
            serverManager.listenForLogin();
        },
        main : function(){
            serverManager.initControles();
            serverManager.setupEvents();
            serverManager.run();
        },
        run : async function (e) {
            //console.log("running server manager");
            if(e)e.preventDefault();
            var authKey = userManager.getAuthKey();
            var dataUrl = serverManager.serverUrl+"/api/server/domains?auth=" + authKey;
            var serverJson = await serverManager.fetchJson(dataUrl);
            var email = userManager.getUserEmail();
            var domain = email.substring(email.lastIndexOf("@") +1);
            if(serverJson.serverlist.length == 0){
                serverJson.serverlist[0] = "http://"+domain;
            }
            var timeZoneUrl = serverManager.serverUrl+"/api/server/timezones?auth=" + authKey;
            serverManager.timeZoneData = await serverManager.fetchJson(timeZoneUrl);
            serverManager.servers = serverJson.serverlist;
            serverManager.setupServerDropDown("server-manager", "server-dropdown-id", "server-dropdown-name", serverManager.servers);
            if(document.querySelector('#server-spinner')){
                document.querySelector('#server-spinner').style.display = "none";                
            }
            for (var i = 0; i < serverManager.servers.length; i++) {
                await serverManager.createServerTable(serverManager.servers[i], authKey);
            }
            document.querySelector('#server-dropdown-id').disabled = false;
            var firstEmail = document.querySelector("#server-dropdown-id").value;
            if(firstEmail != ""){
                if(document.querySelector("#server_wrapper_"+firstEmail)){
                    document.querySelector("#server_wrapper_"+firstEmail).style.display = "block";
                    if(document.querySelector('#'+firstEmail+'-table')){
                        document.querySelector('#'+firstEmail+'-table').style.width = "100%";                       
                    }   
                }
            }
        },
        listenForLogin : function(){
            var targetNode = document.querySelector('body');
            if(targetNode.classList.contains('dashboard')){
                serverManager.main();
            }else{
                var config = { attributes: true, childList: true };
                var callback = function(mutationsList) {
                    for(var mutation of mutationsList) {
                        if (mutation.type == 'childList') {
                        }
                        else if (mutation.type == 'attributes') {
                            if(document.body.classList.contains('dashboard')){
                                serverManager.main();
                            }
                        }
                    }
                };
                var observer = new MutationObserver(callback);
                observer.observe(targetNode, config);
            }
        },
        getIndustries : async function(){
            return await serverManager.fetchJson("industries.json");
        },
        initControles : function() {
            this.setupMessages = document.createElement("div");
            this.setupMessages.id = this.id + "-messages";
            this.widget.appendChild(this.setupMessages);
           
            this.setupControles = document.createElement("div");
            this.setupControles.classList = this.id + "-controles";
            this.widget.appendChild(this.setupControles);

        },
        getFormValueByName: function(id, name){
            return document.querySelector("#"+id+" .server-input-wrapper").querySelector('[name='+name+']').value;
        },
        displayEmailButtons : function(display){
            var serverWrappers = document.querySelectorAll('.server_wrapper_class');
            //document.querySelector('.btn-add-email').style.display = display;
            for (var i = 0; i < serverWrappers.length; i++) {
                var serverWrap = serverWrappers[i];
                if(i > 0){
                    var buttons = serverWrap.querySelectorAll('button');
                    for (var j = 0; j < buttons.length; j++) {
                        var button = buttons[j];
                        button.style.display = display;
                    }
                }
            }
        },
        setupEvents : async function(){
            if(document.querySelector('.serverinit'))return;
            document.querySelector('#Servers').classList.add('serverinit');
            //console.log("server init.");
            
            document.addEventListener('change', async function(e) {             
            
                var tabcontent = e.target.closest('.tabcontent');
                if(tabcontent !== null){
                    if(tabcontent.id !== "Servers"){
                        return;
                    }
                }
                if(e.target.id == "esp-provider"){
                     var id = e.target.closest(".server_wrapper_class").id;
                     console.log(id);
                     //document.querySelector('#'+id+'  #esp-provider').value
                     var espProvider = e.target.value;
                     console.log(espProvider);
                     if(espProvider == "google"){
                         document.querySelector('#'+id+'  input[name=imapHost]').value = "imap.gmail.com";
                         document.querySelector('#'+id+'  input[name=imapHost]').disabled = true;
                         document.querySelector('#'+id+'  input[name=imapPort]').value = "993";
                         document.querySelector('#'+id+'  input[name=imapPort]').disabled = true;
                         document.querySelector('#'+id+'  select[name=imapSecurity]').value = "true";
                         document.querySelector('#'+id+'  select[name=imapSecurity]').disabled = true;
                         
                         document.querySelector('#'+id+'  input[name=smtpHost]').value = "smtp.gmail.com";
                         document.querySelector('#'+id+'  input[name=smtpHost]').disabled = true;
                         document.querySelector('#'+id+'  input[name=smtpPort]').value = "465";
                         document.querySelector('#'+id+'  input[name=smtpPort]').disabled = true;
                         document.querySelector('#'+id+'  select[name=smtpSecurity]').value = "true";
                         document.querySelector('#'+id+'  select[name=smtpSecurity]').disabled = true;
                     }else{
                         document.querySelector('#'+id+'  input[name=imapHost]').value = "";
                         document.querySelector('#'+id+'  input[name=imapHost]').disabled = false;
                         document.querySelector('#'+id+'  input[name=imapPort]').value = "";
                         document.querySelector('#'+id+'  input[name=imapPort]').disabled = false;
                         document.querySelector('#'+id+'  select[name=imapSecurity]').value = "true";
                         document.querySelector('#'+id+'  select[name=imapSecurity]').disabled = false;
                         
                         document.querySelector('#'+id+'  input[name=smtpHost]').value = "";
                         document.querySelector('#'+id+'  input[name=smtpHost]').disabled = false;
                         document.querySelector('#'+id+'  input[name=smtpPort]').value = "";
                         document.querySelector('#'+id+'  input[name=smtpPort]').disabled = false;
                         document.querySelector('#'+id+'  select[name=smtpSecurity]').value = "true";
                         document.querySelector('#'+id+'  select[name=smtpSecurity]').disabled = false;
                     }
                }   
                
                
            });
            
            document.addEventListener('click', async function(e) {
                var tabcontent = e.target.closest('.tabcontent');
                if(tabcontent !== null){
                    if(tabcontent.id !== "Servers"){
                        return;
                    }
                }
                if(e.target.classList == "btn-cancel-renew"){
                    serverManager.selectServerWrapper(document.querySelector('#server-dropdown-id').value);
                }
                if(e.target.classList == "btn-renew-email"){
                    serverManager.displayEmailButtons("none");
                    serverManager.displayRenewCancelButtons('block');
                    //serverManager.displayRenewAmountsButtons("block");
                    var serverWrappers = document.querySelectorAll('.server_wrapper_class');
                    for (var i = 0; i < serverWrappers.length; i++) {
                        var serverWrap = serverWrappers[i];
                        serverWrap.style.display = "block";
                    }
                    var renewAmounts = serverManager.getDropDown("renew-amounts", "renew-amounts", [{"value-0-87":"----"},{"value-0-87":"1 week"},{"value-0-187":"2 week"},{"value-0-87":"1 month"},{"value-0-187":"2 months"},{"value-0-287":"3 months"}]);
                    var renewAmountsWrapper = document.querySelector('.renew-amounts-wrapper');
                    if(renewAmountsWrapper.children.length == 0){
                        renewAmountsWrapper.appendChild(renewAmounts);
                    }
                    serverManager.displayRenewAmountsButtons("block");
                }
                if(e.target.classList == "btn-save-email"){
                    document.querySelector('#server-spinner').style.display = "block";
                    var serverWrapper = e.target.closest(".server_wrapper_class");                   
                    var id = serverWrapper.id;
                    var newEmailAccount = {
                            "espProvider": serverManager.getFormValueByName(id, "espProvider"),
                            "firstName": serverManager.getFormValueByName(id, "firstName"),
                            "lastName": serverManager.getFormValueByName(id, "lastName"),
                            "email": serverManager.getFormValueByName(id, "email"),
                            "industry": serverManager.getFormValueByName(id, "industry"),
                            "timeZone": serverManager.getFormValueByName(id, "timeZone"),
                            "imapUsername": serverManager.getFormValueByName(id, "imapUsername"),
                            "imapPassword": serverManager.getFormValueByName(id, "imapPassword"),
                            "imapHost": serverManager.getFormValueByName(id, "imapHost"),
                            "imapPort": serverManager.getFormValueByName(id, "imapPort"),
                            "imapSecurity": serverManager.getFormValueByName(id, "imapSecurity"),
                            "smtpUsername": serverManager.getFormValueByName(id, "smtpUsername"),
                            "smtpPassword": serverManager.getFormValueByName(id, "smtpPassword"),
                            "smtpHost": serverManager.getFormValueByName(id, "smtpHost"),
                            "smtpPort": serverManager.getFormValueByName(id, "smtpPort"),
                            "smtpSecurity": serverManager.getFormValueByName(id, "smtpSecurity")
                          }
                    let RSAEncrypt = new JSEncrypt();
                    RSAEncrypt.setPublicKey(serverManager.publicKey);
                    let encImapPassword = RSAEncrypt.encrypt(newEmailAccount.imapPassword);
                    let encSmtpPassword = RSAEncrypt.encrypt(newEmailAccount.smtpPassword);
                    newEmailAccount.imapPassword = encImapPassword;
                    newEmailAccount.smtpPassword = encSmtpPassword;
                    var newAccount = JSON.stringify(newEmailAccount);
                    var encNewAccount = userManager.encryptString(newAccount, userManager.encKey);
                    var addEmailAccountUrl = serverManager.serverUrl+"/api/server/email/account/add?auth=" + userManager.getAuthKey() + "&newAccount=" + encNewAccount;
                    var newEmailAccount = await serverManager.fetchJson(addEmailAccountUrl);
                    var messages = document.querySelector('#server-manager-messages');
                    await  serverManager.init(serverManager.id, serverManager.serverUrl);
                    document.querySelector('#server-spinner').style.display = "none";
                    if(newEmailAccount.status == "true"){
                        messages.innerHTML = "Please wait 1 day for the email to become active";
                    }else{
                        messages.innerHTML = newEmailAccount.message;
                    }
                    setTimeout(() => {
                        messages.innerHTML = "";
                    }, 5000);
                }
                
                if(e.target.classList == "btn-add-email"){
                    var excludedFields = ['email'];
                    serverManager.switchAddEmailButton(false);
                    var wrapper = e.target.parentNode.parentNode.querySelector('.server-input-wrapper'); 
                    wrapper.style.display = "grid";
                    var inputs = wrapper.querySelectorAll('input');
                    for (var i = 0; i < inputs.length; i++) {
                        inputs[i].value = "";
                        if(!excludedFields.includes(inputs[i].name)){
                            inputs[i].parentNode.style.display = "none";
                        }
                    }
                    var selects = wrapper.querySelectorAll('select');
                    for (var i = 0; i < selects.length; i++) {
                        selects[i].parentNode.style.display = "none";
                    }
                    serverManager.displayRenewButton("none");
                    serverManager.displayRenewCancelButtons("none");
                    serverManager.displayRenewAmountsButtons("none");
                }
                if(e.target.classList == "btn-cancel-email"){
                    serverManager.switchAddEmailButton(true);
                    e.target.parentNode.parentNode.style.display = "none";
                    serverManager.displayRenewButton("block");
                }
                if(e.target.innerText.trim() == "edit"){
                    serverManager.switchAddEmailButton(false);
                    
                    var excludedFields = ['hidefield'];
                    var wrapper = e.target.closest('table').parentNode;
                    var inputs = wrapper.querySelectorAll('input');
                    for (var i = 0; i < inputs.length; i++) {
                        inputs[i].value = "";
                        if(excludedFields.includes(inputs[i].name)){
                            inputs[i].parentNode.style.display = "none";
                        }else{
                            inputs[i].parentNode.style.display = "block";
                        }
                    }
                    var selects = wrapper.querySelectorAll('select');
                    for (var i = 0; i < selects.length; i++) {
                        selects[i].parentNode.style.display = "block";
                    }
                    
                    var tdId = e.target.parentNode.parentNode.id;
                    var emailRowId = "#"+tdId.replace("_state","_email");
                    var email = document.querySelector(emailRowId+' .email-line > div').innerText;
                    var accounts = serverManager.masterDB.warmerEmailAccounts;
                    for (var i = 0; i < accounts.length; i++) {
                        var account = accounts[i];
                        if(account.email == email){  
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
                        var tdId = e.target.parentNode.parentNode.id;
                        var cronJobIdParts = tdId.split("_");
                        var cronJobId = cronJobIdParts[cronJobIdParts.length - 2];
                        var email = document.querySelector("#"+tdId.replace("_state","_server")).innerText.trim();
                        var r = confirm("You are canceling the subscription for this email account. Are you sure you want to delete "+ email + "?");
                        if (r == true) {
                              var deleteCronJobUrl = serverManager.serverUrl+"/api/server/email/accounts/delete?auth=" + userManager.getAuthKey() + "&id=" + cronJobId + "&deleteemail=true&email="+email;
                              var result = await serverManager.fetchJson(deleteCronJobUrl);
                              console.log(result);
                              if(result.message == "There are outstanding invoices"){
                                  alert(result.message);
                              }else{
                                  e.target.parentNode.parentNode.parentNode.style.backgroundColor = "";
                                  delete serverManager.masterDB.warmerEmailAccounts;
                                  e.target.closest('tr').remove();
                              }
                        }
                        await serverManager.init(serverManager.id, serverManager.serverUrl);
                }
                if(e.target.innerText.trim() == "pause" || e.target.innerText.trim() == "active"){
                    document.querySelector('#server-spinner').style.display = "block";
                    var state = e.target.innerText.trim();
                    var emailId = e.target.parentNode.parentNode.id.replace("_state","_email");
                    var cssQuery = '#'+emailId+' .email-line > div';
                    var email = document.querySelector(cssQuery).innerText
                    if(state == "pause"){
                        state = "active";
                        document.querySelector(cssQuery).classList
                    }else{
                        state = "pause";
                    }

                    var result = await serverManager.saveEmailState(email,state);
                    if(result.status != "false"){
                        e.target.innerText = state;  
                        serverManager.replaceStateClass(e.target);   
                    }else{
                        if(result.message == "There are outstanding invoices"){
                            alert(result.message);
                        }else if (result.message == "There is no subscription for this email do you want to create one?"){
                            var r = confirm(result.message);
                            if (r == true) {
                                var createInvoiceUrl = serverManager.serverUrl+"/api/dashboard/invoice/create?auth=" + userManager.getAuthKey() + "&email=" + email + "&plan=basic";
                                var newInvoice = await serverManager.fetchJson(createInvoiceUrl);
                                console.log(newInvoice);
                                alert("The invoice was created in the account tab");
                                invoiceManager.getInvoicesAll(0);
                            }   
                        }
                    }
                    document.querySelector('#server-spinner').style.display = "none";
                    return;
                }                
             });
        },
        
        replaceStateClass : function(target){
            var state = target.innerText.trim();
            if(state == "active"){
                target.classList.remove("state-pause");
                target.classList.add("state-active");
            }else{
                target.classList.remove("state-active");
                target.classList.add("state-pause");
            }
        },
        
        saveEmailState : async function(email,state){
            var dataUrl = serverManager.serverUrl+"/api/server/email/state?auth="+userManager.getAuthKey()+"&email="+ email + "&state="+state;
            var json = await this.fetchJson(dataUrl);
            console.log(json);
            return json;
        },
        
        displayEmailInputWrapper : function(display){
            var emailInputWrappers = document.querySelectorAll('.server-input-wrapper');
            for (var i = 0; i < emailInputWrappers.length; i++) {
                emailInputWrappers[i].style.display = display;
            }  
        },
        
        displayRenewAmountsButtons : function(display){
            var renewAmountsButtons = document.querySelectorAll('.renew-amounts-wrapper');
            for (var i = 0; i < renewAmountsButtons.length; i++) {
                if(renewAmountsButtons[i].firstElementChild){
                    renewAmountsButtons[i].firstElementChild.style.display = "none"; 
                } 
            }  
            if(renewAmountsButtons[0].firstElementChild){
                renewAmountsButtons[0].firstElementChild.style.display = display;   
            }
        },
        
        displayRenewCancelButtons : function(display){
            var renewCancelButtons = document.querySelectorAll('#Servers .btn-cancel-renew');
            for (var i = 0; i < renewCancelButtons.length; i++) {
                renewCancelButtons[i].style.display = "none";
            }  
            renewCancelButtons[0].style.display = display;
        },
        
        displayRenewButton : function(display){
            var renewButtons = document.querySelectorAll('.btn-renew-email');
            for (var i = 0; i < renewButtons.length; i++) {
                renewButtons[i].style.display = display;
            }
        },
        
        switchAddEmailButton : function(turnoff){
            var serverWrappers = document.querySelectorAll(".server_wrapper_class");
            for (var i = 0; i < serverWrappers.length; i++) {
                var wrapper = serverWrappers[i];
                var button = wrapper.querySelector('.btn-add-email');
                if(turnoff){
                    button.style.visibility = "visible";
                }else{
                    button.style.visibility = "hidden";
                }
            }
        },
        selectServerWrapper : function(server){
            
            var wrappers = document.querySelectorAll('.server_wrapper_class');
            for (var i = 0; i < wrappers.length; i++) {
                wrappers[i].style.display = "none";
            }
            document.querySelector('#server_wrapper_'+server).style.display = "flex";
            serverManager.displayEmailButtons("block");
            serverManager.displayRenewButton("block");
            serverManager.displayRenewCancelButtons("none");
            serverManager.displayRenewAmountsButtons("none");
            serverManager.switchAddEmailButton(true);
            serverManager.displayEmailInputWrapper("none");
            
            
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


        handleJsonField : function(jsonField){
            var orgValue = jsonField.innerText;
            var input = document.createElement("INPUT");
            input.setAttribute("type", "text");
            jsonField.innerText = "";
            input.value = orgValue;
            input.id = "edit-json-field";
            jsonField.append(input);
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
                var serverId =serverManager.getIdFromServerUrl(val);
                option.value = serverId;
                option.text = sanatizedVal;
                select.appendChild(option);
            }
            select.addEventListener("change", function() {
                serverManager.selectServerWrapper(this.value);
            });
            if(document.querySelector('#'+selectId)){
                document.querySelector('#'+selectId).remove();
                console.log("delete dropdown")
                document.getElementById(elementId).appendChild(select);
            }else{
                select.disabled = true;
                document.getElementById(elementId).appendChild(select);
            }
            
            
        },        
        getInputField : function(text, attributes){
            var input = document.createElement("INPUT");
            input.setAttribute("type", text);
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
        fieldWrapper : function(text, field){
            var fieldWrapper = document.createElement("div");
            var newlabel = document.createElement("Label");
            newlabel.innerHTML = text;
            fieldWrapper.appendChild(newlabel);
            fieldWrapper.appendChild(field);
            return fieldWrapper;
        },
        createServerTable : async function (server, pass) {
            var serverId = serverManager.getIdFromServerUrl(server);
            var warmerEmailAccountsJson = {};
            if(!serverManager.masterDB.hasOwnProperty('warmerEmailAccounts')){
                var warmerEmailAccountsUrl = serverManager.serverUrl+"/api/server/email/accounts?auth=" + pass;
                warmerEmailAccountsJson = await this.fetchJson(warmerEmailAccountsUrl);
                serverManager.masterDB.warmerEmailAccounts = warmerEmailAccountsJson;
            }else {
                warmerEmailAccountsJson = serverManager.masterDB.warmerEmailAccounts;
            }
            var cronJobJson = warmerEmailAccountsJson;
            if(serverManager.getCronJobsByServerID === undefined)serverManager.getCronJobsByServerID = {};
            serverManager.getCronJobsByServerID[serverId] = cronJobJson;
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
            var tblAddShowEmailButton = this.getButton("add server", {"class":"btn-add-email","style":"float:right;"});
            var tblRenewButton = this.getButton("view all", {"class":"btn-renew-email","style":"float:right;"});
            var tblRenewCancelButton = this.getButton("cancel", {"class":"btn-cancel-renew","style":"float:right;"});
            var renewAmountsWrapper = document.createElement("div");
            renewAmountsWrapper.classList = "renew-amounts-wrapper";
            tblLabel.appendChild(tblLabelServer);
            tblLabel.appendChild(tblAddShowEmailButton);
            tblLabel.appendChild(tblRenewCancelButton);
            tblLabel.appendChild(tblRenewButton);
            tblLabel.appendChild(renewAmountsWrapper);
            var espProvider = this.getDropDown("esp-provider", "espProvider", [{"manual":"Manual"},{"google":"Google"}]);
            var inputFirstName = this.getInputField("text", {"placeholder":"First name","name":"firstName","style":"float:right;"});
            var inputLastName = this.getInputField("text", {"placeholder":"Last name","name":"lastName","style":"float:right;"});
            var inputNewEmail = this.getInputField("text", {"placeholder":"Domain","class":"add-new-email","name":"email","style":"float:right;"});
            var industry = this.getDropDown("industry", "industry", serverManager.industries);
            var timeZone = this.getDropDown("timezone", "timeZone", serverManager.timeZoneData);
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
            var tblAddEmailButton = this.getButton("save",{"class":"btn-save-email","style":"float:right;"});
            var tblCancelEmailButton = this.getButton("cancel",{"class":"btn-cancel-email","style":"float:right;"});
            tblWrapper.appendChild(tblLabel);
            var emailInputWrapper = document.createElement("div");
            emailInputWrapper.style.display = "none";
            emailInputWrapper.classList = "server-input-wrapper";
            emailInputWrapper.appendChild(this.fieldWrapper("Email provider", espProvider));
            emailInputWrapper.appendChild(this.fieldWrapper("First name", inputFirstName));
            emailInputWrapper.appendChild(this.fieldWrapper("Last name", inputLastName));
            emailInputWrapper.appendChild(this.fieldWrapper("Server", inputNewEmail));
            emailInputWrapper.appendChild(this.fieldWrapper("Industry", industry));
            emailInputWrapper.appendChild(this.fieldWrapper("Timezone", timeZone));
            emailInputWrapper.appendChild(this.fieldWrapper("Imap username", inputImapUserName));
            emailInputWrapper.appendChild(this.fieldWrapper("Imap password", inputImapPass));
            emailInputWrapper.appendChild(this.fieldWrapper("Imap server", inputImapHost));
            emailInputWrapper.appendChild(this.fieldWrapper("Imap port", inputImapPort));
            emailInputWrapper.appendChild(this.fieldWrapper("Imap security", imapSecurity));
            emailInputWrapper.appendChild(this.fieldWrapper("Smtp username", inputSmtpUserName));
            emailInputWrapper.appendChild(this.fieldWrapper("Smtp password", inputSmtpPass));
            emailInputWrapper.appendChild(this.fieldWrapper("Smtp server", inputSmtpHost));
            emailInputWrapper.appendChild(this.fieldWrapper("Smtp port", inputSmtpPort));
            emailInputWrapper.appendChild(this.fieldWrapper("Smtp security", smtpSecurity));
            var emailButtonWrapper = document.createElement("div");
            emailButtonWrapper.style.display = "flex";
            emailButtonWrapper.appendChild(tblCancelEmailButton);       
            emailButtonWrapper.appendChild(tblAddEmailButton);
            emailInputWrapper.appendChild(emailButtonWrapper);
            tblWrapper.appendChild(emailInputWrapper);
            let table = new Table();
            var filteredCronJobJson = [];
            var j = 0;
            for (var i = 0; i < cronJobJson.length; i++) {
                cronJobJson[i].server = cronJobJson[i].email;
                if(!cronJobJson.hasOwnProperty('state')){
                    cronJobJson[i].state = "active";
                    if(cronJobJson[i].expression == "* * 31 2 *"){
                        cronJobJson[i].state = "pause";
                    } 
                }
                var email = cronJobJson[i].email;
                var domain = email.split('@').pop();
                
                if(domain == server.replace("http://","")){
                    filteredCronJobJson[j] = cronJobJson[i];
                    j++;
                }
            }
            cronJobJson = filteredCronJobJson;
            var tbl = table.createJsonTable(serverId+"-server-manager", cronJobJson, serverManager.editableColoms, serverManager.hiddenColoms, serverManager.formatColoms);
            tbl.style.marginTop = '20px';  
            tblWrapper.appendChild(tbl);
            document.querySelector('#server-manager').appendChild(tblWrapper);           
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
            var id = url.hostname.replaceAll('.', '-');
            if(serverManager.serverLookup === undefined){
                serverManager.serverLookup = {};
            }  
            serverManager.serverLookup[id] = serverUrl;
            return id;
        }
        
//        seconds_since_epoch : function(d){ 
//            return Math.floor( d / 1000 ); 
//        }

    }
})();