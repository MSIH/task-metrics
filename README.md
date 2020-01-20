## task-metrics

This actor provides basic metrics for each task run for a given actor. 

### metric data

```
const metrix = {
                actId: runInfo.actId,
                actorTaskId: runInfo.actorTaskId,
                startedAt: runInfo.startedAt,
                finishedAt: runInfo.finishedAt,
                status: runInfo.status,
                memAvgMbytes: (runInfo.stats.memAvgBytes / (1024 * 1024)).toFixed(2),
                memMaxMbytes: (runInfo.stats.memMaxBytes / (1024 * 1024)).toFixed(2),
                cpuAvgUsage: runInfo.stats.cpuAvgUsage.toFixed(2),
                cpuMaxUsage: runInfo.stats.cpuMaxUsage.toFixed(2),
                runTimeMinutes: (runInfo.stats.runTimeSecs / 60).toFixed(2),
                computeUnits: runInfo.stats.computeUnits.toFixed(2),
                memoryMbytes: runInfo.options.memoryMbytes.toFixed(2),
                defaultDatasetId: runInfo.defaultDatasetId,
                itemCount: itemCount,
                itemsPerMinute: itemsPerMinute.toFixed(2),
                ItemsPerCU: ItemsPerCU.toFixed(2)
            }
            
```
### input
- checkTime<`String`>: Can be either `last-day`, `last-month` or `this-month`

### usage

Will go through all of your actor and their runs for the previous day/month and collect metric data. 

### warning!

This actor is only usable if you have up to few thousands of runs totally since it has to make a separate API call for each run. There is a throttling of max 20 API calls per second.
