## Do not use in production, and do not expect support.

The base features aren't even implemented yet, and there's a lot of code that will be rewritten.
If you go make something just for API to change, it'll be on you to work out the changes.

https://overextended.github.io/docs/ox_core/

## Third-party resources

We ask that any resources you create _do not use the ox prefix_.
Doing so adds confusion about the resource creator and can lead to multiple resources existing with the name (i.e. ox_banking).

---

Server-side sample.

```lua
CreateThread(function()
    -- Get an array containing all players, and apply metamethods.
    local players = Ox.GetPlayers(true)

    -- Get the first entry
    local player = players[1]

    if player then
        -- Print the table, containing their identity, ids, phone number, etc.
        print(json.encode(player, { indent = true }))

        -- Set 'police' to a random grade.
        player.setGroup('police', math.random(0, 3))

        -- Get the new grade and print it.
        local group = player.getGroup('police')
        print(player.source, 'police grade:', group)

        -- Retrieve all player metadata. These values are stored separately from the standard 'player' table.
        local data = player.get()
        print(json.encode(data, { indent = true }))

        -- Retrieve the player's discord id from metadata.
        local discord = player.get('discord')
        print(json.encode(discord, { indent = true }))

        -- This can create a new persistent vehicle, owned by the player.
        -- local vehicle = Ox.CreateVehicle({
        --     model = 'sultanrs',
        --     owner = player.charid,
        -- }, player.getCoords(), GetEntityHeading(player.ped))

        -- Select the first owned vehicle from the database.
    end
end)

RegisterCommand('getveh', function(source)
	-- Get the player ref for source.
    local player = Ox.GetPlayer(source)

	-- Select the first vehicle owned by the current character.
    local vehicleId = MySQL.scalar.await('SELECT id FROM vehicles WHERE owner = ? LIMIT 1', { player.charid })

    if vehicleId then
        local coords = player.getCoords()

        -- Spawn it
        local vehicle = Ox.CreateVehicle(vehicleId, vector3(coords.x, coords.y + 3.0, coords.z + 1.0), GetEntityHeading(player.ped))

        if vehicle then
            -- Print the vehicle table.
            print(json.encode(vehicle, { indent = true }))

            -- Print the vehicle metadata.
            print(json.encode(vehicle.get(), { indent = true }))

            print(vehicle.getCoords())

        end
    end
end)

RegisterNetEvent('saveProperties', function(netid, data)
    local vehicle = Ox.GetVehicle(netid)

	-- Set properties in the vehicle's metadata.
    vehicle.set('properties', data)

	-- Save and despawn the vehicle.
    vehicle.store()
end)

```

![image](https://user-images.githubusercontent.com/65407488/174664196-181ffe51-a21f-40c2-9ffa-7d582f7de876.png)

Client-side sample.

```lua
RegisterCommand('saveveh', function()
    if not cache.vehicle then return end

	local data = lib.getVehicleProperties(cache.vehicle)
	TriggerServerEvent('saveProperties', VehToNet(cache.vehicle), data)
end)

local function init()
    print(json.encode(player, { indent = true }))
    print(player.hasGroup('police'))
    print(player.getCoords())
end

RegisterNetEvent('ox:playerLoaded', init)

if player then CreateThread(init) end
```
