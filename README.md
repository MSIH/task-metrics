## task-metrics

This actor provides basic metrics for each task run for a given actor. The Actor will find all of your tasks limited by the input filter.

### input / filter
You can filter data based on: `last-day`, `last-month` or `this-month`

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



