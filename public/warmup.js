var accountManager = (function () {


    return {
        init : async function (id, serverUrl) {
            console.log("warmup init");
            
            serverManager.id = id;
            document.querySelector("#"+id).innerHTML = "";
            
            accountManager.masterDB = {};
            accountManager.serverUrl = serverUrl;
            accountManager.editableColoms = ['expression','email','batchSize'];
            accountManager.hiddenColoms = ['id','expressiondesc','user', 'warmerEmailAccount','expression','command','batchSize'];
            accountManager.formatColoms = ['command','state','email'];
            accountManager.id = id;
            accountManager.widget = document.getElementById(this.id);
            accountManager.industries = await this.getIndustries();
            accountManager.publicKey = "MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCBWMSNABfvlZCM2EBJiDllyoIsChTxxyuxeE1pbaaxab/lwumdE9RJWAwYMUufgnGncaYZXwZInH0W3Ys+dLbu3j7zxXZ7x9LWhZA9MLbCH+Xf+DxgbU5kaeNx1m0f7tz7xj2CntHuYBYY9BkDNyTbnKOr7RwilNllVQvpV6A9RwIDAQAB";
            accountManager.listenForLogin();
        },
        main : async function(){
            accountManager.initControles();
            accountManager.setupEvents();
            await accountManager.run();
            spinner.off();
        },
        
        run : async function (e) {
            if(e)e.preventDefault();
            var authKey = userManager.getAuthKey();
            var dataUrl = accountManager.serverUrl+"/api/dashboard/domains?auth=" + authKey;
            var serverJson = await accountManager.fetchJson(dataUrl);
            var email = userManager.getUserEmail();
            var domain = email.substring(email.lastIndexOf("@") +1);
            if(!serverJson.serverlist){
                serverJson.serverlist = [];
            }

            var timeZoneUrl = accountManager.serverUrl+"/api/dashboard/timezones?auth=" + authKey;
            accountManager.timeZoneData = await accountManager.fetchJson(timeZoneUrl);
            accountManager.servers = serverJson.serverlist;
            
            
//            if(serverJson.serverlist.length == 0){
//                serverJson.serverlist[0] = "http://"+domain;
//            }
            
            if(serverJson.serverlist.length > 0){
                //serverJson.serverlist[0] = "http://"+domain;
                accountManager.setupServerDropDown("account-manager", "domain-dropdown-id", "domain-dropdown-name", accountManager.servers);
            }
            
            
            for (var i = 0; i < accountManager.servers.length; i++) {
                await accountManager.createServerTable(accountManager.servers[i], authKey);
            }
            if(document.querySelector('#domain-dropdown-id')){
                document.querySelector('#domain-dropdown-id').disabled = false;   
                
                
                
                var firstEmail = document.querySelector("#domain-dropdown-id").value;
                if(firstEmail != ""){
                    if(document.querySelector("#warmup_wrapper_"+firstEmail)){
                        document.querySelector("#warmup_wrapper_"+firstEmail).style.display = "block";   
                    }
                    if(document.querySelector('#'+firstEmail+'-table')){
                        document.querySelector('#'+firstEmail+'-table').style.width = "100%";    
                    }  
                }
                
            }
            

            
        },
        
        
        listenForLogin : function(){
            var targetNode = document.querySelector('body');
            if(targetNode.classList.contains('dashboard')){
                accountManager.main();
            }else{
                var config = { attributes: true, childList: true };
                var callback = function(mutationsList) {
                    for(var mutation of mutationsList) {
                        if (mutation.type == 'childList') {
                        }
                        else if (mutation.type == 'attributes') {
                            if(document.body.classList.contains('dashboard')){
                                accountManager.main();
                            }
                        }
                    }
                };
                var observer = new MutationObserver(callback);
                observer.observe(targetNode, config);
            }

        },
        getIndustries : async function(){
            return await accountManager.fetchJson("industries.json");
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
            return document.querySelector("#"+id+" .email-input-wrapper").querySelector('[name='+name+']').value;
        },
        displayEmailButtons : function(display){
            var serverWrappers = document.querySelectorAll('.warmup_wrapper_class');
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
            if(document.querySelector('.homeinit'))return;
            document.querySelector('#Home').classList.add('homeinit');
            //console.log("warmup init.");
            document.addEventListener('change', async function(e) {             
                var tabcontent = e.target.closest('.tabcontent');
                if(tabcontent !== null){
                    if(tabcontent.id !== "Home"){
                        return;
                    }
                }
                if(e.target.id == "esp-provider"){
                     var id = e.target.closest(".warmup_wrapper_class").id;
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
                    if(tabcontent.id !== "Home"){
                        return;
                    }
                }
                
                
                if(e.target.classList == "help-link"){
                    document.getElementById("help-modal").style.display = "block";
                    document.getElementById("inner-help-modal").innerHTML='<object type="text/html" data="help/warmup.html" ></object>';
                }
                
                
                if(e.target.classList == "btn-cancel-renew"){
                    accountManager.selectServerWrapper(document.querySelector('#domain-dropdown-id').value);
                }
                
                if(e.target.classList == "btn-renew-email"){
                    accountManager.displayEmailButtons("none");
                    accountManager.displayRenewCancelButtons('block');
                    //accountManager.displayRenewAmountsButtons("block");
                    var serverWrappers = document.querySelectorAll('.warmup_wrapper_class');
                    for (var i = 0; i < serverWrappers.length; i++) {
                        var serverWrap = serverWrappers[i];
                        serverWrap.style.display = "block";
                    }
                    var renewAmounts = accountManager.getDropDown("renew-amounts", "renew-amounts", [{"value-0-87":"----"},{"value-0-87":"1 week"},{"value-0-187":"2 week"},{"value-0-87":"1 month"},{"value-0-187":"2 months"},{"value-0-287":"3 months"}]);
                    var renewAmountsWrapper = document.querySelector('.renew-amounts-wrapper');
                    if(renewAmountsWrapper.children.length == 0){
                        renewAmountsWrapper.appendChild(renewAmounts);
                    }
                    accountManager.displayRenewAmountsButtons("block");
                }
                
          
                if(e.target.classList == "btn-save-email"){
                    spinner.on();
                    var serverWrapper = e.target.closest(".warmup_wrapper_class");                   
                    var id = serverWrapper.id;
                    var newEmailAccount = {
                            "espProvider": accountManager.getFormValueByName(id, "espProvider"),
                            "firstName": accountManager.getFormValueByName(id, "firstName"),
                            "lastName": accountManager.getFormValueByName(id, "lastName"),
                            "email": accountManager.getFormValueByName(id, "email"),
                            "industry": accountManager.getFormValueByName(id, "industry"),
                            "timeZone": accountManager.getFormValueByName(id, "timeZone"),
                            "imapUsername": accountManager.getFormValueByName(id, "imapUsername"),
                            "imapPassword": accountManager.getFormValueByName(id, "imapPassword"),
                            "imapHost": accountManager.getFormValueByName(id, "imapHost"),
                            "imapPort": accountManager.getFormValueByName(id, "imapPort"),
                            "imapSecurity": accountManager.getFormValueByName(id, "imapSecurity"),
                            "smtpUsername": accountManager.getFormValueByName(id, "smtpUsername"),
                            "smtpPassword": accountManager.getFormValueByName(id, "smtpPassword"),
                            "smtpHost": accountManager.getFormValueByName(id, "smtpHost"),
                            "smtpPort": accountManager.getFormValueByName(id, "smtpPort"),
                            "smtpSecurity": accountManager.getFormValueByName(id, "smtpSecurity")
                          }
                    let RSAEncrypt = new JSEncrypt();
                    RSAEncrypt.setPublicKey(accountManager.publicKey);
                    let encImapPassword = RSAEncrypt.encrypt(newEmailAccount.imapPassword);
                    let encSmtpPassword = RSAEncrypt.encrypt(newEmailAccount.smtpPassword);
                    newEmailAccount.imapPassword = encImapPassword;
                    newEmailAccount.smtpPassword = encSmtpPassword;
                    var newAccount = JSON.stringify(newEmailAccount);
                    var encNewAccount = userManager.encryptString(newAccount, userManager.encKey);
                    var addEmailAccountUrl = accountManager.serverUrl+"/api/dashboard/email/account/add?auth=" + userManager.getAuthKey() + "&newAccount=" + encNewAccount;
                    var newEmailAccount = await accountManager.fetchJson(addEmailAccountUrl);
                    console.log(newEmailAccount);
                    var messages = document.querySelector('#account-manager-messages');
                    if(newEmailAccount.status == "true"){
                        messages.innerHTML = "Please wait 1 day for the email to become active";
                    }else{
                        messages.innerHTML = newEmailAccount.message;
                    }
                    setTimeout(() => {
                        messages.innerHTML = "";
                        spinner.off();
                    }, 5000);
                }
                

                
                if(e.target.classList == "btn-add-email"){
                    accountManager.switchAddEmailButton(false);
                    var wrapper = e.target.parentNode.parentNode.querySelector('.email-input-wrapper'); 
                    wrapper.style.display = "grid";
                    var inputs = wrapper.querySelectorAll('input');
                    for (var i = 0; i < inputs.length; i++) {
                        inputs[i].value = "";
                    }
                    accountManager.displayRenewButton("none");
                    accountManager.displayRenewCancelButtons("none");
                    accountManager.displayRenewAmountsButtons("none");
                }
                
                if(e.target.classList == "btn-cancel-email"){
                    accountManager.switchAddEmailButton(true);
                    e.target.parentNode.parentNode.style.display = "none";
                    accountManager.displayRenewButton("block");
                }
                
                if(e.target.innerText.trim() == "edit"){
                    accountManager.switchAddEmailButton(false);
                    var tdId = e.target.parentNode.parentNode.id;
                    
                    var emailRowId = "#"+tdId.replace("_state","_email");
                    var email = document.querySelector(emailRowId+' .email-line > div').innerText;
                    
                    
                    var accounts = accountManager.masterDB.warmerEmailAccounts;
                    for (var i = 0; i < accounts.length; i++) {
                        var account = accounts[i];
                        if(account.email == email){  
                            var serverWrapper = e.target.closest(".warmup_wrapper_class");
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
                        //var serverWrapper = e.target.closest(".warmup_wrapper_class");                   
                        //var id = serverWrapper.id;
                        //var idParts = id.split('_');
                        //var serverId = idParts[2];
                        //var server = accountManager.serverLookup[serverId];
                        var email = document.querySelector("#"+tdId.replace("_state","_email")).innerText.trim();
                        var r = confirm("You are canceling the subscription for this email account. Are you sure you want to delete "+ email + "?");
                        if (r == true) {
                              var deleteCronJobUrl = accountManager.serverUrl+"/api/dashboard/email/accounts/delete?auth=" + userManager.getAuthKey() + "&id=" + cronJobId + "&deleteemail=true&email="+email;
                              var result = await accountManager.fetchJson(deleteCronJobUrl);
                              console.log(result);
                              if(result.message == "There are outstanding invoices"){
                                  alert(result.message);
                              }else{
                                  e.target.parentNode.parentNode.parentNode.style.backgroundColor = "";
                                  //var authKey = userManager.getAuthKey();
                                  delete accountManager.masterDB.warmerEmailAccounts;
                                  e.target.closest('tr').remove();
                                  //accountManager.createServerTable(server, authKey);
                                  //setTimeout(function(){ 
                                  //    document.querySelector('#'+id).style.display = "inline-grid"; 
                                  //}, 500);   
                              }
                        }
                    }, 500);
                }
                

                
                
                if(e.target.innerText.trim() == "pause" || e.target.innerText.trim() == "active"){
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

                    var result = await accountManager.saveEmailState(email,state);
                    if(result.status != "false"){
                        e.target.innerText = state;  
                        accountManager.replaceStateClass(e.target);   
                    }else{
                        if(result.message == "There are outstanding invoices"){
                            alert(result.message);
                        }else if (result.message == "There is no subscription for this email do you want to create one?"){
                            var r = confirm(result.message);
                            if (r == true) {
                                var createInvoiceUrl = accountManager.serverUrl+"/api/dashboard/invoice/create?auth=" + userManager.getAuthKey() + "&email=" + email + "&plan=email-warm-up-6";
                                var newInvoice = await accountManager.fetchJson(createInvoiceUrl);
                                console.log(newInvoice);
                                alert("The invoice was created in the account tab");
                                invoiceManager.getInvoicesAll(0);
                            }   
                        }
                    }
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
            var dataUrl = accountManager.serverUrl+"/api/dashboard/email/state?auth="+userManager.getAuthKey()+"&email="+ email + "&state="+state;
            var json = await this.fetchJson(dataUrl);
            console.log(json);
            return json;
        },
        
        displayEmailInputWrapper : function(display){
            var emailInputWrappers = document.querySelectorAll('.email-input-wrapper');
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
            var renewCancelButtons = document.querySelectorAll('.btn-cancel-renew');
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
            var serverWrappers = document.querySelectorAll(".warmup_wrapper_class");
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
            
            var wrappers = document.querySelectorAll('.warmup_wrapper_class');
            for (var i = 0; i < wrappers.length; i++) {
                wrappers[i].style.display = "none";
            }
            document.querySelector('#warmup_wrapper_'+server).style.display = "flex";
            accountManager.displayEmailButtons("block");
            accountManager.displayRenewButton("block");
            accountManager.displayRenewCancelButtons("none");
            accountManager.displayRenewAmountsButtons("none");
            accountManager.switchAddEmailButton(true);
            accountManager.displayEmailInputWrapper("none");
            
            
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
                var serverId =accountManager.getIdFromServerUrl(val);
                option.value = serverId;
                option.text = sanatizedVal;
                select.appendChild(option);
            }
            select.addEventListener("change", function() {
                accountManager.selectServerWrapper(this.value);
            });
            if(document.querySelector('#'+selectId)){
                document.querySelector('#'+selectId).remove();
                //console.log("delete dropdown")
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
            var serverId = accountManager.getIdFromServerUrl(server);
            var warmerEmailAccountsJson = {};
            
            if(!accountManager.masterDB.hasOwnProperty('warmerEmailAccounts')){
                var warmerEmailAccountsUrl = accountManager.serverUrl+"/api/dashboard/email/accounts?auth=" + pass;
                warmerEmailAccountsJson = await this.fetchJson(warmerEmailAccountsUrl);
                accountManager.masterDB.warmerEmailAccounts = warmerEmailAccountsJson;
            }else {
                warmerEmailAccountsJson = accountManager.masterDB.warmerEmailAccounts;
            }
            var cronJobJson = warmerEmailAccountsJson;
            if(accountManager.getCronJobsByServerID === undefined)accountManager.getCronJobsByServerID = {};
            accountManager.getCronJobsByServerID[serverId] = cronJobJson;
            var tblWrapper = document.createElement("div");
            tblWrapper.style.marginTop = '20px';  
            tblWrapper.style.display = 'none'; 
            tblWrapper.style.border = "1px solid";
            tblWrapper.style.padding = "5px";
            tblWrapper.style.flexDirection = "column";
            tblWrapper.id = "warmup_wrapper_"+serverId;
            tblWrapper.classList = "warmup_wrapper_class"; 
            var tblLabel = document.createElement("span");
            var tblLabelServer = document.createElement("span");
            tblLabelServer.classList = "server-name";
            tblLabelServer.innerText = new URL(server).hostname;
            var tblAddShowEmailButton = this.getButton("add email", {"class":"btn-add-email","style":"float:right;"});
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
            var inputNewEmail = this.getInputField("text", {"placeholder":"Email","class":"add-new-email","name":"email","style":"float:right;"});
            var industry = this.getDropDown("industry", "industry", accountManager.industries);
            var timeZone = this.getDropDown("timezone", "timeZone", accountManager.timeZoneData);
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
            emailInputWrapper.classList = "email-input-wrapper";
            emailInputWrapper.appendChild(this.fieldWrapper("Email provider", espProvider));
            emailInputWrapper.appendChild(this.fieldWrapper("First name", inputFirstName));
            emailInputWrapper.appendChild(this.fieldWrapper("Last name", inputLastName));
            emailInputWrapper.appendChild(this.fieldWrapper("Email", inputNewEmail));
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
            var tbl = table.createJsonTable(serverId, cronJobJson, accountManager.editableColoms, accountManager.hiddenColoms, accountManager.formatColoms);
            tbl.style.marginTop = '20px';  
            tblWrapper.appendChild(tbl);
            document.querySelector('#account-manager').appendChild(tblWrapper);           
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
            //var id = url.hostname.replace('.', '-');
            var id = url.hostname.replaceAll('.', '-');
            if(accountManager.serverLookup === undefined)accountManager.serverLookup = {};
            accountManager.serverLookup[id] = serverUrl;
            return id;
        }
    }
})();