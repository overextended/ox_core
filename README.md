## Do not use in production, and do not expect support.
The base features aren't even implemented yet, and there's a lot of code that will be rewritten.
If you go make something just for API to change, it'll be on you to work out the changes.

## Third-party resources
If you create a resoure that is dependent on ox_core, ox_accounts, etc. *do not use the ox_ prefix*.
Doing so adds confusion about the resource creator and can lead to multiple resources existing with the name _ox_banking_ or similar.

---

Sample to showcase playerdata, player methods, groups, and vehicles.

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
        local vehicleId = MySQL.scalar.await('SELECT id FROM vehicles WHERE owner = ? LIMIT 1', { player.charid })

        if vehicleId then
            local coords = player.getCoords()

            -- Spawn it
            local vehicle = Ox.CreateVehicle(vehicleId,
                vector3(coords.x + math.random(-10, 10), coords.y + math.random(-10, 10), coords.z + math.random(-10, 10))
                , GetEntityHeading(player.ped))

            if vehicle then
                -- Print the vehicle table.
                print(json.encode(vehicle, { indent = true }))

                -- Print the vehicle metadata.
                print(json.encode(vehicle.get(), { indent = true }))

                print(vehicle.getCoords())
            end
        end
    end
end)

```

![image](https://user-images.githubusercontent.com/65407488/174664196-181ffe51-a21f-40c2-9ffa-7d582f7de876.png)


Work-in-progress JS support.

```js
const player = Ox.GetPlayers()[0];

if (player) {
  console.log(player);

  const data = player.get();
  console.log(data);

  console.log(player.getPed());
  console.log(player.getCoords());

  const [group, grade] = player.hasGroup({ mem: 3, police: 1 });
  console.log(group, grade);
}
```
