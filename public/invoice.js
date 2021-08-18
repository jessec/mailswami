var invoiceManager = (function () {

    var encKey = "";
    var aesKey = "";
    var id = "";
    var widget = {};
    var invoices = [];
    var pageSize = 0;
    var account = {};
    
    return {
        init : async function (id, serverUrl) {
            invoiceManager.id = id;
            invoiceManager.widget = document.getElementById(invoiceManager.id);
            invoiceManager.listenForLogin();
            invoiceManager.pageSize = 10;
        },
        setupEvents : async function(){
            document.addEventListener('click', async function(e) {
                
                if(e.target.classList.contains("pagination-item")){
                    invoiceManager.showInvoiceTable(parseInt(e.target.innerText) - 1);
                }
                
                if(e.target.id == "close-invoice"){
                    document.querySelector('#invoice-viewer').style.display = "none";
                    document.querySelector('#invoice-manager').style.display = "block";
                    var elements = document.querySelector('#paypal-button-container').children;
                    for (var i = 0; i < elements.length; i++) {
                        elements[i].remove();
                    }
                }
                
                if(e.target.classList.contains("fa-times-circle")||e.target.classList.contains("fa-check-circle")){
                    document.querySelector('#invoice-viewer').style.display = "flex";
                    document.querySelector('#invoice-manager').style.display = "none";
                    
                    var invoiceNr = e.target.parentNode.dataset.invoicenr;
                    
                    var invoice = invoiceManager.getInvoiceByInvoiceNr(invoiceNr);
                    invoiceManager.fillInvoice(invoice);
                }

                
            });
        },
        fillInvoiceId : function(id,value){
            document.querySelector(id).innerText = value;
        },
        fillInvoice : function(invoice){
            console.log(invoice);
            
            invoiceManager.fillInvoiceId("#invoice-nr",invoice.invoiceNumber);
            invoiceManager.fillInvoiceId("#customer-name",invoiceManager.account.name);
            invoiceManager.fillInvoiceId("#customer-email",invoiceManager.account.email);         
            
            document.querySelector('#invoice-table-body').innerHTML = '';
            
            for (var i = 0; i < invoice.items.length; i++) {
                var item = invoice.items[i];
                var tr = document.createElement("tr");
                var td1 = document.createElement("td");
                td1.append(item.description);
                var td2 = document.createElement("td");
                td2.append(item.dashboardStartDate);
                var td3 = document.createElement("td");
                if(item.dashboardEndDate != null){
                    td3.append(item.dashboardEndDate);
                }
                var td4 = document.createElement("td");
                td4.append(item.amount);
                tr.appendChild(td1);
                tr.appendChild(td2);
                tr.appendChild(td3);
                tr.appendChild(td4);
                document.querySelector('#invoice-table-body').appendChild(tr);
            }
            
            
            invoiceManager.fillInvoiceId("#invoice-table-totals","$"+invoice.amount);       
            
            if(invoice.balance != 0){
                invoiceManager.addPayPal(invoice);
            }
        },
        getInvoiceByInvoiceNr : function(nr){
            for (var i = 0; i < invoiceManager.invoices.length; i++) {
                var invoice = invoiceManager.invoices[i];
                if(nr == invoice.invoiceNumber) return invoice;
            }
            return null;
        },
        getInvoicesAll : async function(page){
            var authKey = userManager.getAuthKey();
            var dataUrl = userManager.serverUrl+"/api/dashboard/invoice/all?auth=" + authKey;
            var invoices = await invoiceManager.fetchJson(dataUrl);
            invoiceManager.invoices = invoices;
            invoiceManager.invoices.reverse();
            invoiceManager.pages = invoiceManager.splitArrayIntoChunksOfLen(invoiceManager.invoices, invoiceManager.pageSize);
            invoiceManager.showInvoiceTable(page);
        },
        showInvoiceTable : function(page){
            var hiddenColumns = [
                "json",
                "balance"
            ];
            var formatColumns = ['payment','enddate'];
            var filteredInvoices = [];
            for (var i = 0; i < invoiceManager.invoices.length; i++) {
                var invoice = invoiceManager.invoices[i];
                var filteredInvoice = {}
                filteredInvoice.nr = invoice.invoiceNumber;

                filteredInvoice.balance = invoice.balance;
                filteredInvoice.invoicedate = invoice.dashboardInvoiceDate;
                // filteredInvoice.targetdate = invoice.dashboardTargetDate;

                filteredInvoice.amount = "$"+invoice.amount;
                filteredInvoice.payment = "";
                filteredInvoice.json = invoice;
                
                filteredInvoices[i] = filteredInvoice;
            }
            
            var tableWrapper = document.createElement("div");
            let table = new Table();
            var startSlice = page * invoiceManager.pageSize;
            var endSlice = startSlice + invoiceManager.pageSize;
            var tbl = table.createJsonTable("invoice-table", filteredInvoices.slice(startSlice, endSlice), [], hiddenColumns, formatColumns);
            tableWrapper.appendChild(tbl);
            if(document.querySelector('#invoice-manager')){
                if(document.querySelector('#invoice-manager > img')){
                    document.querySelector('#invoice-manager > img').remove();
                }
                document.querySelector('#invoice-manager').appendChild(tableWrapper);  

                document.querySelector('#invoice-manager').appendChild(invoiceManager.getInvoiceTablePagination(invoiceManager.pages, page));  
            }
        },
        splitArrayIntoChunksOfLen : function(arr, len) {
            var chunks = [], i = 0, n = arr.length;
            while (i < n) {
              chunks.push(arr.slice(i, i += len));
            }
            return chunks;
         },
        addPaginationItem : function(text, clazz){
            var li = document.createElement("li");
            var a = document.createElement("a");
            a.classList = "pagination-item " + clazz;
            a.innerHTML = text;
            li.appendChild(a);
            return li;
        },
        getInvoiceTablePagination : function(pages, page){
            if(document.querySelector("#invoice-table-paginagion")){
                document.querySelector("#invoice-table-paginagion").remove();   
            }
            var paginationTable = document.createElement("div");
            paginationTable.id = "invoice-table-paginagion";
            var paginationList = document.createElement("ul");
            for (var i = 0; i < pages.length; i++) {
                if(page == i){
                    paginationList.appendChild(invoiceManager.addPaginationItem((i + 1),"current-page"));
                }else{
                    paginationList.appendChild(invoiceManager.addPaginationItem((i + 1),""));   
                }
            }
            paginationTable.appendChild(paginationList);
            return paginationTable;
        },
        main : async function(){
            invoiceManager.setupControles();
            invoiceManager.setupEvents();
            invoiceManager.account = await invoiceManager.setupAccount();
            invoiceManager.run();
        },
        run : function(){
            invoiceManager.getInvoicesAll(0);
        },
        setupControles : function () {
            this.setupMessages = document.createElement("div");
            this.setupMessages.id = this.id + "-messages";
            this.widget.appendChild(this.setupMessages);
           
            this.setupControles = document.createElement("div");
            this.setupControles.classList = this.id + "-controles";
            this.widget.appendChild(this.setupControles);

        },
        listenForLogin : function(){
            var targetNode = document.querySelector('body');
            if(targetNode.classList.contains('dashboard')){
                invoiceManager.main();
            }else{
                var config = { attributes: true, childList: true };
                var callback = function(mutationsList) {
                    for(var mutation of mutationsList) {
                        if (mutation.type == 'childList') {
                        }
                        else if (mutation.type == 'attributes') {
                            if(document.body.classList.contains('dashboard')){
                                invoiceManager.main();
                            }
                        }
                    }
                };
                var observer = new MutationObserver(callback);
                observer.observe(targetNode, config);
            }
        },
        addPayPal : function(invoice){
            paypal.Buttons({
                createOrder : function (data, actions) {
                    return actions.order.create({
                        purchase_units : [ {
                            custom_id : invoice.accountId,
                            invoice_id : invoice.invoiceId,
                            description : "MailSwami account : "+invoice.invoiceCheckSum,
                            amount : {
                                value : invoice.amount,
                                currency_code:'USD'
                            }
                        } ]
                    });
                },
                onShippingChange : function (data, actions) {
                    return actions.resolve();
                },
                onApprove : function (data, actions) {
                    return actions.order.capture().then(function (details) {
                        console.log(details);
                        var u = details.purchase_units[0];
                        var req = "&amount="+u.amount.value;
                        req += "&id="+details.id;
                        req += "&description="+u.description;
                        req += "&custom_id="+u.custom_id;
                        req += "&invoice_id="+u.invoice_id;
                        req += "&payments_captures_id="+u.payments.captures[0].id;
                        req += "&payments_captures_status="+u.payments.captures[0].status;
                        req += "&payments_captures_amount_value="+u.payments.captures[0].amount.value;
                        var authKey = userManager.getAuthKey();
                        var dataUrl =  encodeURI(userManager.serverUrl+"/api/dashboard/invoice/paid?auth=" + authKey + req);
                        console.log(dataUrl);
                        invoiceManager.fetchJson(dataUrl);
                        //console.log(paid);
                        invoiceManager.getInvoicesAll(0);   
                        setTimeout(function(){
                              document.querySelector('#close-invoice').click();
                        }, 2000);

                    });
                }
            }).render('#paypal-button-container');
        },
        setupAccount : async function(){
            var auth = userManager.getAuthKey();
            var dataUrl = userManager.serverUrl+"/api/dashboard/invoice/account?auth=" + auth;
            var account = await invoiceManager.fetchJson(dataUrl);
            return account;
        },
        fetchJson : async function(url){
            const response = await fetch(url);
            response.ok;     
            response.status; 
            const json = await response.json();
            return json;
        },
        postJson : async function(data, url){
            const rawResponse = await fetch(url, {
                method: 'POST',
                headers: {
                  'Accept': 'application/json',
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
              });
            return await rawResponse.json();            
        }
        
        
        
        
    }    
})();