class bot{

  constructor() {
    this.isBotRunning = false;
    this.alertCaptcha = false;
    this.checkCpuPercent = 80;
    this.timerDelay = 810000;
    this.checkMinedelay = false;
    this.firstMine = true;
    this.previousMineDone = false;
	this.serverGetNonce = 'alien';
	this.interval;
}

delay = (millis) =>
  new Promise((resolve, reject) => {
    setTimeout((_) => resolve(), millis);
  });

async postData(url = '', data = {}, method = 'POST',header = {'Content-Type': 'application/json'},returnMode = 'json') {
  try {
    const init = (method == 'POST') ? {method: method,mode: 'cors', cache: 'no-cache',credentials: 'same-origin',headers: header,redirect: 'follow',referrerPolicy: 'no-referrer',body: JSON.stringify(data)} : {method: method,mode: 'cors', cache: 'no-cache',credentials: 'same-origin',headers: header,redirect: 'follow',referrerPolicy: 'no-referrer'}
    if(returnMode == 'json'){
      const response = await fetch(url, init);
      return response.json(); // parses JSON response into native JavaScript objects
    }else{
      const response = await fetch(url, init).then(function(response) {
          if(response.ok)
          {
            return response.text(); 
          }

          throw new Error('Something went wrong.');
      })  
      .then(function(text) {
        console.log('Request successful', text);
        return text;
      })  
      .catch(function(error) {
        console.log('Request failed', error);
        return '';
      });

      return response
    }
  }catch (err) {
    this.appendMessage(`Error:${err.message}`)
}
}

async checkCPU (userAccount){
  let result = true;
  while(result){
    try {
      //const accountDetail = await this.postData('https://api.waxsweden.org/v1/chain/get_account', { account_name: userAccount })
	  const accountDetail = await this.postData('https://wax.pink.gg/v1/chain/get_account', { account_name: userAccount })
      
      if(accountDetail.cpu_limit != null){
        const rawPercent = ((accountDetail.cpu_limit.used/accountDetail.cpu_limit.max)*100).toFixed(2)
        console.log(`%c[Bot] Raw CPU Percent : ${rawPercent}%`, 'color:yellow')
        this.appendMessage(`CPU ${rawPercent}%`)
        if(rawPercent < this.checkCpuPercent){
          result = false;
        }
      }
    }catch (err) {
      console.log(err.message);
	  this.appendMessage(`Error:${err.message}`)
	  this.appendMessage(`Error:${err.message}`)
	  
      result = false;
    }
    
    if(result){
      const delayCheckCpu = 120000 + Math.floor(Math.random() * 30001)
      console.log(`%c[Bot] delay ${(delayCheckCpu/1000/60)} min check cpu again`, 'color:yellow')
      await this.delay(delayCheckCpu);
    }
  }
}

appendMessage(msg , box = ''){
  const dateNow = moment().format('  HH:mm ');
  const boxMessage = document.getElementById("box-message"+box)
  boxMessage.value += '\n'+ `${dateNow} : ${msg}`
  boxMessage.scrollTop = boxMessage.scrollHeight;
}

countDown(countDown){
	clearInterval(this.interval);
	let countDownDisplay = (parseFloat(countDown/1000)).toFixed(2);
  
	this.interval = setInterval(function() {
    document.getElementById("text-cooldown").innerHTML = countDownDisplay + " Sec"
    countDown = countDown - 1000;
    countDownDisplay = countDown/1000;
    if (countDown < 0) {
	clearInterval(this.interval);
	document.getElementById("text-cooldown").innerHTML = "Go mine";
    }
  }, 1000);
}

async getUserMineDelay(userAccount){
  return getMineDelay(userAccount);
}

async stop() {
  this.isBotRunning = false;
  this.appendMessage("bot STOP")
  console.log(`%c[Bot] stop`, 'color:yellow');
}

async start() {
  console.log('this.serverGetNonce',this.serverGetNonce)
  const userAccount = await wax.login();
  document.getElementById("text-user").innerHTML = userAccount
  console.log('timerDelay',this.timerDelay,'checkCpuPercent',this.checkCpuPercent)
 // unityInstance.SendMessage(
    //"Controller",
    //"Server_Response_LoginData",
    //userAccount
  //);
  this.isBotRunning = true;
  await this.delay(2000);
  console.log("bot StartBot");
  this.appendMessage("bot START")
  while (this.isBotRunning) {
    let minedelay = 1;
    do {
      if(this.timerDelay != 0){
        if(this.checkMinedelay){
          minedelay = this.timerDelay;
        }
      }else{
        minedelay = await getMineDelay(userAccount);
      }
      // console.log(`%c[Bot] Cooldown for ${Math.ceil((minedelay / 1000)/60)} min`, 'color:yellow');
      this.countDown(minedelay)
      const RandomTimeWait = minedelay + Math.floor(1000 + (Math.random() * 9000))
      this.appendMessage(`Cooldown for ${Math.ceil((RandomTimeWait / 1000)/60)} min`)
      await this.delay(RandomTimeWait);
      minedelay = 0;
      console.log("bot checkCPU1");
      await this.checkCPU(userAccount);
    } while (minedelay !== 0 && (this.previousMineDone || this.firstMine));
    await this.mine(userAccount)
  }
}

async mine(userAccount){
  document.getElementById("btn-mine").disabled = true
  const balance = await getBalance(userAccount, wax.api.rpc);
	console.log(`%c[Bot] balance: (before mine) ${balance}`, 'color:yellow');
	document.getElementById("text-balance").innerHTML = balance
    
    const mine_work = await background_mine(userAccount)
    let nonce = "";
    if(this.serverGetNonce == 'ninjamine'){
      nonce = await this.postData('https://gateway-cors.herokuapp.com/https://server-mine-b7clrv20.an.gateway.dev/server_mine?wallet='+userAccount, {}, 'GET',{Origin : ""}, 'raw')     
      console.log('nonceNinjamine',nonce)
      if(nonce == ''){      
        nonce = mine_work.rand_str
      }
    }else{
      nonce = mine_work.rand_str
    }

    const mine_data = {
      miner: mine_work.account,
      nonce: nonce,
    };
    const actions = [
      {
        account: mining_account,
        name: "mine",
        authorization: [
          {
            actor: mine_work.account,
            permission: "active",
          },
        ],
        data: mine_data,
      },
    ];
    
    try {
      console.log("bot checkCPU2");
      await this.checkCPU(userAccount);
      if(this.alertCaptcha){
        const audio = new Audio('https://media.geeksforgeeks.org/wp-content/uploads/20190531135120/beep.mp3');
        audio.play();
      }

      const result = await wax.api.transact(
        {
          actions,
        },
        {
          blocksBehind: 3,
          expireSeconds: 360,
        }
      );
      console.log(`%c[Bot] result is = ${result}`, 'color:yellow');
      var amounts = new Map();
	  var transaction_id = "";
      if (result && result.processed) {
        result.processed.action_traces[0].inline_traces.forEach((t) => {
          if (t.act.data.quantity) {
            const mine_amount = t.act.data.quantity;
            console.log(`%c[Bot] ${mine_work.account} Mined ${mine_amount}`, 'color:yellow');
            if (amounts.has(t.act.data.to)) {
              let obStr = amounts.get(t.act.data.to);
              obStr = obStr.substring(0, obStr.length - 4);
              let nbStr = t.act.data.quantity;
              nbStr = nbStr.substring(0, nbStr.length - 4);
              let balance = (parseFloat(obStr) + parseFloat(nbStr)).toFixed(4);
              amounts.set(t.act.data.to, balance.toString() + " TLM");
            } else {
              amounts.set(t.act.data.to, t.act.data.quantity);
            }
			console.log('transaction_id1',transaction_id)
          }
			console.log('transaction_id2',transaction_id)
			transaction_id = result.transaction_id;
        });
        //unityInstance.SendMessage(
          //"Controller",
          //"Server_Response_Claim",
          //amounts.get(mine_work.account)
        //);
        //this.appendMessage(amounts.get(mine_work.account),'2')
		const claimBounty = await getBountyFromTx(transaction_id, userAccount, ["https://api.waxsweden.org","https://wax.eosrio.io"])        
        this.appendMessage(claimBounty.toString(),'2')
		
        this.firstMine = false;
        this.previousMineDone = true;
        this.checkMinedelay = true;
      }
    } catch (err) {
      //unityInstance.SendMessage(
        //"ErrorHandler",
        //"Server_Response_SetErrorData",
        //err.message
      //);
      this.previousMineDone = false;
      this.checkMinedelay = false;
      console.log(`%c[Bot] Error:${err.message}`, 'color:red');
      this.appendMessage(`Error:${err.message}`)
    }

    const afterMindedBalance = await getBalance(userAccount, wax.api.rpc);
    this.appendMessage(`balance (after mined): ${afterMindedBalance}`)
    document.getElementById("text-balance").innerHTML = afterMindedBalance
    // console.log(`%c[Bot] balance (after mined): ${afterMindedBalance}`, 'color:yellow');
    document.getElementById("btn-mine").disabled = false
}

}
