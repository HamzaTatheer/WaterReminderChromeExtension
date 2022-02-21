function getTodayUTC(){
    return new Date().toJSON().slice(0,10).replace(/-/g,'/');
}


function resetStorage(){
    chrome.storage.local.set({water_date:getTodayUTC()});

}

function ResolveDate(){

    return new Promise((res,rej)=>{
        
        var utc = getTodayUTC();
        chrome.storage.local.get(['water_date'],({water_date})=>{
            if(water_date == null){
                chrome.storage.local.set({water_date:utc});
                res(utc);
            }
            else{
                res(water_date);
            }

        });
    })
}

function UpdateDateInStorage(){
    chrome.storage.local.set({water_date:getTodayUTC()});

}

function ResolveTotalCups(){
    return new Promise((res,rej)=>{
        res(6);
    })
}


function ResolveCups(stored_date,water_total_cups){
    return new Promise((res,rej)=>{

        let new_cups = 0;

        chrome.storage.local.get(['water_cups'],({water_cups})=>{
            if(water_cups == null){
                new_cups = 0;
            }
            else{
                if(stored_date == getTodayUTC()){
                    new_cups = water_cups;
                }
                else{
                    new_cups = water_total_cups;
                }
            }

            chrome.storage.local.set({water_cups:new_cups});
            res(new_cups);
        });

    })
}




function Cups(value){

    //keep track of day
    //store default cups
    //read file and update Cups
    let cups=value;

    function setCups(value){
        cups = value;
    }

    function getCups(){
        return cups;
    }

    function incrementCups(){
        cups++;
    }

    function decrementCups(){
        if(cups-1>=0){
            cups--;
        }
    }

    return {setCups,getCups,incrementCups,decrementCups};
}



function ConvertMsToTime(duration) {
    var milliseconds = Math.floor((duration % 1000) / 100),
      seconds = Math.floor((duration / 1000) % 60),
      minutes = Math.floor((duration / (1000 * 60)) % 60),
      hours = Math.floor((duration / (1000 * 60 * 60)) % 24);
  
    hours = (hours < 10) ? "0" + hours : hours;
    minutes = (minutes < 10) ? "0" + minutes : minutes;
    seconds = (seconds < 10) ? "0" + seconds : seconds;
  
    return {minutes,seconds}
}

function ResolveStorage(){
    return new Promise((res,rej)=>{
        ResolveDate().then((date)=>{
            ResolveTotalCups().then((total_cups)=>{
                ResolveCups(date,total_cups).then((current_cups)=>{
                    UpdateDateInStorage();
                    res({total_cups,current_cups});
                })
            })
        })
    })
}

function getCupsInUI(){
    return parseInt(document.getElementById("remaining_cups").innerHTML);
}

function updateCupsInUI(value){
    document.getElementById("remaining_cups").innerHTML=value;
}

function updateWaterLevel(val){


    val+=30;
    document.getElementById('water').style.height = val+"%";

}

ResolveStorage().then(({total_cups,current_cups})=>{
    let cups = Cups(total_cups - current_cups);
    updateCupsInUI(cups.getCups());
    updateWaterLevel(Math.floor((current_cups/total_cups)*100))
});


document.getElementById('drankCupBtn').addEventListener('click',()=>{
    ResolveTotalCups().then((total_cups)=>{
        let drunk_cups = Cups(total_cups - getCupsInUI());
        drunk_cups.incrementCups();
        chrome.storage.local.set({water_cups:drunk_cups.getCups()});
        updateCupsInUI(total_cups - drunk_cups.getCups());
        updateWaterLevel(Math.floor((drunk_cups.getCups()/total_cups)*100));
    })
})

chrome.alarms.get("water_alarm",(data)=>{
    let time = data.scheduledTime;
    let next = new Date(time);
    let now = new Date();

    let remaining_time = next.getTime() - now.getTime();

    chrome.storage.local.get(['water_timer'],({water_timer})=>{
        clearInterval(water_timer);

        let interval_id = setInterval(()=>{
            let {minutes,seconds} = ConvertMsToTime(remaining_time);
            
            if(remaining_time-1000>0)
                remaining_time-=1000;
          
            let sentence = minutes+":"+seconds;
            document.getElementById("timer").innerHTML="<div style='font-size: 40px;'>"+sentence+"</div>";
            
        },1000)
    
        chrome.storage.local.set({water_timer:interval_id});


    })

})










