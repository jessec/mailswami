var invoiceManager = (function () {

    var encKey = "";
    var aesKey = "";
    
    return {
        init : async function (id, serverUrl) {
            console.log(id)
            invoiceManager.encKey = "1234567891234567";
            invoiceManager.aesKey = "xx35f242a46d67eeb74aabc37d5e5d05";
            this.getInvoicesAll();
        },
        getInvoicesAll : async function(){
            
        },

        
    }    
})();