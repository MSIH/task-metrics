const Apify = require('apify');
const moment = require('moment');

console.log('is home', Apify.isAtHome())

const MAX_CALLS_PER_SECOND = 20;
let callsThisSecond = 0

const waitForThrottle = async () => {
    while (callsThisSecond > MAX_CALLS_PER_SECOND) {
        await new Promise(resolve => setTimeout(resolve, 50))
    }
}

const clearThrottle = setInterval(() => {
    callsThisSecond = 0
}, 1000)

const getAllActors = async (client, items) => {
    callsThisSecond++
    await waitForThrottle()
    console.log('actors')
    const newItems = await client.actors().list();
   
    items = items.concat(newItems.items)
     return items
    /*if (newItems.length === 0) {
      //  console.dir(items);
       
    }
    return getAllActors(client, items, offset + 1000)
    */
}

const getActor = async (client, items, actorId) => {
    callsThisSecond++
    await waitForThrottle()
    const newItems = await client.actor(actorId).get()
    items = items.concat(newItems)
   // console.dir(items);
    return items
}

const getRuns = async (client, items, offset, actId, dateFrom) => {
    callsThisSecond++
    await waitForThrottle()
    const newItems = (await client.actor(actId).runs().list({
        offset,
        desc: true,
    })).items;
    //console.dir(newItems);
    items = items.concat(newItems)
    if (newItems.length === 0) {
        return items
    }
    const lastRunDate = new Date(newItems[newItems.length - 1].startedAt)
    console.log('last run date', lastRunDate)
    if (dateFrom > lastRunDate) {
        return items
    }
    return getRuns(client, items, offset + 1000, actId, dateFrom)
}

Apify.main(async () => {
    const input = await Apify.getValue('INPUT')
    console.log('input')
    console.dir(input)

    const client = Apify.newClient();
  //  const { items } = await client.actor("your-actor-id").runs().list();
        
    let dateFrom
    let dateTo
    if (input.checkTime === 'last-day') {
        dateFrom = moment().subtract(1, 'days').startOf('day')
        dateTo = moment().startOf('day')
    }
    if (input.checkTime === 'last-month') {
        dateFrom = moment().subtract(1, 'months').startOf('month')
        dateTo = moment().startOf('month')
    }
    if (input.checkTime === 'this-month') {
        dateFrom = moment().startOf('month');
        dateTo = moment();
    }
    const stats = [];

 //   console.log('Date from')
//    console.log(dateFrom)
 //   console.log('Date to')
 //   console.log(dateTo)

    const myActors = input.actor ? await getActor(client, [], input.actor) : await getAllActors(client, [])
//console.dir(myActors)
   // const myActors = await getAllActors(acts, [], 0)
    console.log(`I have ${myActors.length} actors`)
    for (const myActor of myActors) {
        console.log('checking actor:', myActor.name)
        const myRuns = await getRuns(client, [], 0, myActor.id, dateFrom)
        console.log('runs loaded', myRuns.length)
        const filteredRuns = myRuns.filter(run => new Date(run.startedAt) >= dateFrom && new Date(run.startedAt) < dateTo);
        console.log('runs last day', filteredRuns.length)
        let sumCU = 0
        for (const run of filteredRuns) {
            callsThisSecond++
            await waitForThrottle()
            const runInfo = await client.run(run.id).get();
            /*await acts.getRun({
                actId: myActor.id,
                runId: run.id,
            }) */
            
            const actInfo = client.actor(run.id).get();
                  /*await acts.getAct({
                actId: myActor.id
            })*/
            
            taskInfoName = ""
            if( runInfo.actorTaskId ){
            const taskInfo = client.task(runInfo.actorTaskId).get();
                  /*await tasks.getTask({
                taskId : runInfo.actorTaskId               
            })*/
            taskInfoName = taskInfo.name
            }
                      
            const kvs = await Apify.openKeyValueStore(runInfo.defaultKeyValueStoreId);
         //   console.dir(kvs);
            const getStats = await kvs.getValue('SDK_CRAWLER_STATISTICS_0');
         //   console.dir(getStats);
const itemCount = getStats? getStats.requestsFinished : 0
            
            const itemsPerMinute = itemCount / (runInfo.stats.runTimeSecs / 60)
            const itemsPerCU = itemCount / runInfo.stats.computeUnits


            const metrix = {
                actId: runInfo.actId,
                actName: actInfo.name,
                actorTaskId: runInfo.actorTaskId,
                actorTaskName: taskInfoName,
                startedAt: runInfo.startedAt,
                finishedAt: runInfo.finishedAt,
                status: runInfo.status,
                memAvgMbytes: (+runInfo.stats.memAvgBytes / (1024 * 1024)).toFixed(2),
                memMaxMbytes: (+runInfo.stats.memMaxBytes / (1024 * 1024)).toFixed(2),
                cpuAvgUsage: (+runInfo.stats.cpuAvgUsage).toFixed(2),
                cpuMaxUsage: (+runInfo.stats.cpuMaxUsage).toFixed(2),
                runTimeMinutes: (+runInfo.stats.runTimeSecs / 60).toFixed(2),
                computeUnits: (+runInfo.stats.computeUnits).toFixed(2),
                memoryMbytes: (+runInfo.options.memoryMbytes).toFixed(2),
                defaultDatasetId: runInfo.defaultDatasetId,
                itemCount: itemCount,
                itemsPerMinute: (+itemsPerMinute).toFixed(2),
                ItemsPerCU: (+itemsPerCU).toFixed(2)

            }
            console.log('metrix:', JSON.stringify(metrix))
            stats.push(metrix);
        }

    }

    const datasetMetrix = await Apify.openDataset();
    await datasetMetrix.pushData(stats);
    await Apify.setValue('Metrics', stats)
})

/*
{
    "data": {
        "id": "5s47KmibGZYQhdAhu",
        "actId": "qhyh6h7ZrcP2DhNKB",
        "userId": "BBtRSYW3dujqg3R3n",
        "actorTaskId": "eYBL7pNvD5j5x9Ztk",
        "startedAt": "2020-01-20T11:14:56.357Z",
        "finishedAt": "2020-01-20T11:15:17.924Z",
        "status": "SUCCEEDED",
        "meta": {
            "origin": "WEB",
            "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.117 Safari/537.36"
        },
        "stats": {
            "inputBodyLen": 26,
            "restartCount": 0,
            "workersUsed": 1,
            "initPrepSecs": 0.011,
            "initImagePullSecs": 1.372,
            "initContainerCreateSecs": 0.435,
            "initContainerStartSecs": 0.827,
            "memAvgBytes": 76031414.0406808,
            "memMaxBytes": 88236032,
            "memCurrentBytes": 0,
            "cpuAvgUsage": 3.3249682376460377,
            "cpuMaxUsage": 10.61986448465775,
            "cpuCurrentUsage": 0,
            "netRxBytes": 2039535,
            "netTxBytes": 195848,
            "durationMillis": 20695,
            "runTimeSecs": 20.695,
            "metamorph": 0,
            "readyTimeSecs": 0.871,
            "initTotalSecs": 2.645,
            "emfileError": false,
            "computeUnits": 0.0028743055555555557
        },
        "options": {
            "build": "latest",
            "timeoutSecs": 3000,
            "memoryMbytes": 512,
            "diskMbytes": 1024
        },
        "buildId": "6jasPvRHMSxZZoSXu",
        "exitCode": 0,
        "defaultKeyValueStoreId": "njgRa8s7zLnAQki2K",
        "defaultDatasetId": "RsPrpXJ72ZKDNSbWh",
        "defaultRequestQueueId": "pAzGQj22BTTQra3pz",
        "buildNumber": "0.0.10",
        "containerUrl": "https://wfrmzyejmdmq.runs.apify.net"
    }
}
*/
