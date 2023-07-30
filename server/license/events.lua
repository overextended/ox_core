lib.callback.register('ox:getLicense', function(source, licenseName, target)
    local player = Ox.GetPlayer(target or source)

    if player then
        if licenseName then
            return player:getLicense(licenseName)
        end

        return player:getLicenses()
    end
end)
