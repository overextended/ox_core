server.PRIMARY_IDENTIFIER = GetConvar('ox_core:primaryIdentifier', 'fivem')

SetRoutingBucketEntityLockdownMode(0, 'relaxed')
SetRoutingBucketEntityLockdownMode(60, 'strict')
SetRoutingBucketPopulationEnabled(60, false)

SetConvarReplicated('inventory:framework', 'ox')
SetConvarReplicated('inventory:trimplate ', 'false')

SetConvarReplicated('pe-basicloading:disableAutoShutdown', 1)

SetConvar('npwd:useResourceIntegration', 'true')
SetConvar('npwd:database', json.encode({
	playerTable = 'characters',
	identifierColumn = 'charid',
}))
