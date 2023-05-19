var statsManager = (function () {


    return {
        init : async function (id, serverUrl) {
            
            statsManager.id = id;
            document.querySelector("#"+id).innerHTML = "";
            
            statsManager.masterDB = {};
            statsManager.serverUrl = serverUrl;
            statsManager.listenForLogin();
            
            console.log("Hi from stats..");
            
        },
        getAllStats : function (serverUrl) {
			console.log(serverUrl);
        },
        initControles : function() {
			

        },
        setupEvents : function() {


        },
        subtractDays : function(date, days) {
  			date.setDate(date.getDate() - days);
  			return date;
		},
		addDataPointToGraph : function(register, timeLineFullDate, obj){
			
			let owner = obj._id.owner;
			let folder = obj._id.folder;
			let count = obj.count;
			let date = obj._id.date;
			

			if(timeLineFullDate.includes(date)){
			
				if(!(owner in register.accountData)){
					register.accountData[owner] = {};
				}
				if(!(folder in register.accountData[owner])){
					register.accountData[owner][folder] = {};
				}		
				register.accountData[owner][folder][date] = count;	
			}
			return register;
		},
		fillMissingDataForGraphs : function(register, timeLineFullDate){
			
			    for (var account in register) {
			        if (register.hasOwnProperty(account)) {
						let accountObj = register[account];
						for (var folders in register[account]) {
							if (register[account].hasOwnProperty(folders)) {
								let requiredFolders = ['INBOX','Sent'];
								for (var folder in register[account][folders]) {
									if (register[account][folders].hasOwnProperty(folder)) {
										let dates = register[account][folders][folder];
										register[account][folders][folder] = statsManager.fillMissingDates(dates, timeLineFullDate);
										requiredFolders = requiredFolders.filter(function(item) {
										    return item !== folder
										})
									}
								}
								for(var requiredFolder in requiredFolders){
									//console.log("creating date range for: "+requiredFolders[requiredFolder]);
									register[account][folders][requiredFolders[requiredFolder]] = statsManager.fillMissingDates({}, timeLineFullDate);								
								}
							}
						}
						register[account] = accountObj;
			    	}
    			}
    			return register;
		},fillMissingDates : function(dates, timeLineFullDate){
			const dateKeys = Object.keys(dates);
			for(dat in timeLineFullDate){
				if (!dateKeys.includes(timeLineFullDate[dat])) {
					dates[timeLineFullDate[dat]] = 0;
				}
			}			
			return dates;
		},
        run : async function() {
            var authKey = userManager.getAuthKey();
            var dataUrl = statsManager.serverUrl+"/api/mongo/get/stats?auth=" + authKey;
            var statsJson = await statsManager.fetchJson(dataUrl);
			
			let dateArray = []; 
			let timeLine = [];
			let timeLineFullDate = [];
			
			for(let i = 0; i < 15; i++) {
				let date = statsManager.subtractDays(new Date(), i * 2);
				const month = date.toLocaleString('default', { month: 'short' });
				let dateStr = date.getDate() +" "+ month;
				dateArray[i] = dateStr;				
				const fullDate = date.toISOString().split('T')[0]
				timeLine[i] = {dateStr : dateStr, fullDate : fullDate};
				timeLineFullDate[i] = fullDate;		
			}
			
			dateArray.reverse();
			let register = {};
			register.accountData = {};
			
			for(let i = 0; i < statsJson.payload.length; i++) {
    			let obj = statsJson.payload[i];
    			register = statsManager.addDataPointToGraph(register, timeLineFullDate, obj);
			}
			
			register = statsManager.fillMissingDataForGraphs(register, timeLineFullDate);
			for (var account in register.accountData) {
			        if (register.accountData.hasOwnProperty(account)) {
						statsManager.renderGraph(dateArray, account, register.accountData[account]);
					}
			 }
			
			
        },
        renderGraph : function(dateArray, account, accountData){

			const accountId = account;
			
			let sentArray = [];
			let sentKeys = Object.keys(accountData['Sent']);
			sentKeys.sort();
			for(key in sentKeys) {
		    	if(accountData['Sent'].hasOwnProperty(sentKeys[key])) {
		        	var value = accountData['Sent'][sentKeys[key]];
		        	sentArray.push(value);
		    	}
			}
			
			let receivedArray = [];
			let receivedKeys = Object.keys(accountData['INBOX']);
			receivedKeys.sort();
			for(key in receivedKeys) {
		    	if(accountData['INBOX'].hasOwnProperty(receivedKeys[key])) {
		        	var value = accountData['INBOX'][receivedKeys[key]];
		        	receivedArray.push(value);
		    	}
			}
			
			
			var divWrapper = document.createElement('div');
			var divtitle = document.createElement('div');
			divtitle.innerText = accountId;
			divtitle.style.padding = "20px";
			divtitle.style.border = "1px solid";
			divtitle.style.marginBottom = "50px";
			var canv = document.createElement('canvas');
			let graphId = 'myChart'+accountId;
			canv.id = graphId;
			document.querySelector("#"+statsManager.id).appendChild(divWrapper).appendChild(divtitle).appendChild(canv); 
			
			  const ctx = document.getElementById(graphId);

			  new Chart(ctx, {
			    type: 'line',
			    data: {
			      labels: dateArray,
			      datasets: [{
			        label: 'Sent',
			        data: sentArray,
			        borderWidth: 1
			      },{
			        label: 'Received',
			        data: receivedArray,
			        borderWidth: 1
			      }]
			    },
			    options: {
			      scales: {
			        y: {
			          beginAtZero: true
			        }
			      }
			    }
			  });
			
		},
        main : async function(){
            statsManager.initControles();
            statsManager.setupEvents();
            await statsManager.run();
            spinner.off();
        },
        listenForLogin : function(){
            var targetNode = document.querySelector('body');
            if(targetNode.classList.contains('dashboard')){
                statsManager.main();
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
                fetchJson : async function(url){
                const response = await fetch(url);
                response.ok;     
                response.status; 
                const json = await response.json();
                return json;
        }
    }
})();