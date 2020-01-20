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

const getAllActors = async (acts, items, offset) => {
    callsThisSecond++
    await waitForThrottle()
    const newItems = await acts.listActs({
        offset,
    }).then(res => res.items);
    items = items.concat(newItems)
    if (newItems.length === 0) {
        return items
    }
    return getAllActors(acts, items, offset + 1000)
}

const getRuns = async (acts, items, offset, actId, dateFrom) => {
    callsThisSecond++
    await waitForThrottle()
    const newItems = await acts.listRuns({
        offset,
        desc: true,
        actId
    }).then(res => res.items);
    items = items.concat(newItems)
    if (newItems.length === 0) {
        return items
    }
    const lastRunDate = new Date(newItems[newItems.length - 1].startedAt)
    console.log('last run date', lastRunDate)
    if (dateFrom > lastRunDate) {
        return items
    }
    return getRuns(acts, items, offset + 1000, actId, dateFrom)
}

Apify.main(async () => {
    const input = await Apify.getValue('INPUT')
    console.log('input')
    console.dir(input)

    const {
        acts
    } = Apify.client
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

    console.log('Date from')
    console.log(dateFrom)
    console.log('Date to')
    console.log(dateTo)

    const myActors = await getAllActors(acts, [], 0)
    console.log(`I have ${myActors.length} actors`)
    for (const myActor of myActors) {
        console.log('checking actor:', myActor.name)
        const myRuns = await getRuns(acts, [], 0, myActor.id, dateFrom)
        console.log('runs loaded', myRuns.length)
        const filteredRuns = myRuns.filter(run => new Date(run.startedAt) >= dateFrom && new Date(run.startedAt) < dateTo);
        console.log('runs last day', filteredRuns.length)
        let sumCU = 0
        for (const run of filteredRuns) {
            callsThisSecond++
            await waitForThrottle()
            const runInfo = await acts.getRun({
                actId: myActor.id,
                runId: run.id,
            })
            const dataset = Apify.openDataset(runInfo.defaultDatasetId);
            let {
                itemCount
            } = await dataset.getInfo();
            console.log('itemCount:', itemCount)
            console.log('runInfo.stats.runTimeSecs:', runInfo.stats.runTimeSecs)
            console.log('runInfo.stats.computeUnits:', runInfo.stats.computeUnits)

            const itemsPerMinute = itemCount / (runInfo.stats.runTimeSecs * 60)
            console.log('itemsPerMinute:', itemsPerMinute)
            const ItemsPerCU = itemCount / runInfo.stats.computeUnits
            console.log('ItemsPerCU:', ItemsPerCU)

            const metrix = {
                actId: runInfo.actId,
                actorTaskId: runInfo.actorTaskId,
                startedAt: runInfo.startedAt,
                finishedAt: runInfo.finishedAt,
                status: runInfo.status,
                memAvgBytes: runInfo.stats.memAvgBytes,
                memMaxBytes: runInfo.stats.memMaxBytes,
                cpuAvgUsage: runInfo.stats.cpuAvgUsage,
                cpuMaxUsage: runInfo.stats.cpuMaxUsage,
                runTimeSecs: runInfo.stats.runTimeSecs,
                computeUnits: runInfo.stats.computeUnits,
                memoryMbytes: runInfo.options.memoryMbytes,
                defaultDatasetId: runInfo.defaultDatasetId,
                itemCount: itemCount,
                itemsPerMinute: itemCount / runInfo.stats.runTimeSecs * 60,
                ItemsPerCU: itemCount / runInfo.stats.computeUnits

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