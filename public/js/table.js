class Table {
  constructor() {
  }
  createJsonTable(serverId, jsonArray, editableColoms, hiddenColoms, formatColoms){
      this.removeJsonTable(serverId);
      var tbl = document.createElement("table");
      tbl.style.width = "100%";
      var tblBody = document.createElement("tbody");
      for(var j = 0; j < jsonArray.length; j++) {
          var trObj = jsonArray[j];
          if(j == 0){
              var row = document.createElement("tr");
              for (var key of Object.keys(trObj)) {
                  var cell = document.createElement("td");
                  cell.classList = "table-th";  
                  //cell.style.border = '1px solid black';  
                  //cell.style.padding = '3px'; 
                  if(hiddenColoms.includes(key)){
                      cell.classList = "hidden-json-field"; 
                      cell.style.display = "none";
                  }
                  if(formatColoms.includes(key)){
                      tdObj = this.formatColom(key+"_th",tdObj,trObj);
                  }                        
                  var cellText = document.createTextNode(key);
                  cell.appendChild(cellText);
                  row.appendChild(cell);   
              }
              tblBody.appendChild(row);                    
          }
          var row = document.createElement("tr");
          for (var key of Object.keys(trObj)) {
              var tdObj = trObj[key];
              var cell = document.createElement("td");
              //cell.style.border = '1px solid black';  
              //cell.style.padding = '3px'; 
              var tdId = serverId+"_"+j+"_"+key;
              cell.setAttribute("id", tdId);  
              if(editableColoms.includes(key)){
                  cell.classList = "json-field"; 
              }
              if(hiddenColoms.includes(key)){
                  cell.classList = "hidden-json-field"; 
                  cell.style.display = "none";
              }
              if(formatColoms.includes(key)){
                  tdObj = this.formatColom(key,tdObj,trObj);
              }
              if (!this.isElement(tdObj)){
                  var cellText = document.createTextNode(tdObj);
                  cell.appendChild(cellText);
                  row.appendChild(cell);  
              }else{
                  cell.appendChild(tdObj);
                  row.appendChild(cell);  
              }

              
          }
          tblBody.appendChild(row);
      }
      tbl.appendChild(tblBody); 
      tbl.style.borderCollapse = 'collapse';  
      tbl.setAttribute("id", serverId+"-table");   
      return tbl;
  }
  
  removeJsonTable(serverId){
      if(document.querySelector('#'+serverId+"-table")){
          document.querySelector('#'+serverId+"-table").parentNode.remove();
      }           
  }
  
  isElement(element) {
      return element instanceof Element || element instanceof HTMLDocument;  
  }
  
  createElementFromHTML(htmlString) {
      var div = document.createElement('div');
      div.innerHTML = htmlString.trim();

      // Change this to div.childNodes to support multiple top-level nodes
      return div.firstChild; 
  }
   
  formatColom(key,tdObj,trObj){
      switch(key) {
      case "email":
          var email = '<div class="email-line"><div><input type="checkbox" name="update" value="">'+tdObj+'</div><div class="nrdays">active</div></div>';
          return this.createElementFromHTML(email);
      case "enddate":
          if(tdObj)return tdObj;
          return "";
      case "payment":
          var pay = '<i class="far fa-check-circle"></i>';
          if(trObj.balance != 0){
              pay = '<i class="far fa-times-circle"></i>';
          }
          var span = document.createElement("span");
          span.dataset.invoicenr = trObj.json.invoiceNumber;
          span.appendChild(this.createElementFromHTML(pay));
          return span;
      case "command":
          return tdObj.replace(/^.*[\\\/]/, '').replace(".sh","");
      case "state":
          var val = tdObj;
          var div1 = document.createElement("div");
          var span1 = document.createElement("span");
          var cellText = document.createTextNode(val);
          span1.appendChild(cellText);
          span1.classList = "state state-"+val; 
          div1.appendChild(span1);
          var span2 = document.createElement("span");
          span2.classList = "state state-edit"; 
          var cellText2 = document.createTextNode("edit");
          span2.appendChild(cellText2);
          div1.appendChild(span2);
          var span3 = document.createElement("span");
          span3.classList = "state state-delete"; 
          var cellText3 = document.createTextNode("delete");
          span3.appendChild(cellText3);
          div1.appendChild(span3);
          return div1;
      default:
    }
  } 
  
  
}