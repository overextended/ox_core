lib.callback.register('ox:getLicense', function(source, licenseName, target)
    local player = Ox.GetPlayer(target or source)

    if player then
        if licenseName then
            return player.private.licenses[licenseName]
        end

        return player.private.licenses
    end
end)
