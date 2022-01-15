Contents for secondary testing resource, using @core/imports.lua

```lua
function test(source)
    Wait(1500)
    for k, v in pairs(Ox) do
        print(k, v)
    end

    print('~~~~~')
    local oxPlayer = Ox.Player(source)

    if oxPlayer then
        local coords = vec3(oxPlayer.getCoords())
        print(oxPlayer.source, coords)
    end
    print('~~~~~')

end

AddEventHandler('playerJoined', function()
	test(source)
end)

AddEventHandler('onServerResourceStart', function(resource)
    if resource == 'core' or resource == 'test' then
        local players = GetPlayers()
        for i=1, #players do
            test(tonumber(players[i]))
        end
    end
end)
```
