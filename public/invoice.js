var invoiceManager = (function () {

    var encKey = "";
    var aesKey = "";
    var id = "";
    var widget = {};
    
    return {
        init : async function (id, serverUrl) {
            invoiceManager.id = id;
            invoiceManager.widget = document.getElementById(invoiceManager.id);
            invoiceManager.listenForLogin();
        },
        setupEvents : async function(){
            document.addEventListener('click', async function(e) {
                
                if(e.target.id == "dummy-link"){

                }

                
            });
        },
        getInvoicesAll : async function(){
            var authKey = userManager.getAuthKey();
            var dataUrl = userManager.serverUrl+"/api/dashboard/invoice/all?auth=" + authKey;
            var invoices = await accountManager.fetchJson(dataUrl);
            console.log(invoices);

            let table = new Table();
            var hiddenColumns = [
                "auditLogs",
                "currency",
                "bundleKeys",
                "accountId",
                "refundAdj",
                "trackingIds",
                "isParentInvoice",
                "parentAccountId",
                "parentInvoiceId",
                "invoiceDate",
                "invoiceNumber",
                "items",
                "credits",
                "invoiceId",
                "status"
            ];
            
            invoices.reverse();
            var tbl = table.createJsonTable("invoice-table", invoices, [], hiddenColumns, []);
            document.querySelector('#invoice-manager').appendChild(tbl);        
        },
        main : function(){
            invoiceManager.setupControles();
            invoiceManager.setupEvents();
            invoiceManager.run();
        },
        run : function(){
            invoiceManager.getInvoicesAll();
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
                            console.log('A child node has been added or removed.');
                        }
                        else if (mutation.type == 'attributes') {
                            console.log('The ' + mutation.attributeName + ' attribute was modified.');
                            if(document.body.classList.contains('dashboard')){
                                invoiceManager.main();
                            }
                        }
                    }
                };
                var observer = new MutationObserver(callback);
                observer.observe(targetNode, config);
                //observer.disconnect();
            }

        }
        
    }    
})();