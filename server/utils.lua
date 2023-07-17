---@class PlayerIdentifiers
---@field license string
---@field license2 string Preferred identifier; should always refer to Rockstar Social Club ID.
---@field discord? string
---@field fivem? string
---@field steam? string

---Return all identifiers for the given source.
---@param source number | string
---@return PlayerIdentifiers
function Ox.GetIdentifiers(source)
    ---@cast source -number
    local identifiers = {}

    for i = 0, GetNumPlayerIdentifiers(source) - 1 do
        local prefix, identifier = string.strsplit(':', GetPlayerIdentifier(source, i))

        if prefix ~= 'ip' then
            identifiers[prefix] = identifier
        end
    end

    return identifiers
end

function getRandomLetter()
    return string.char(math.random(65, 90))
end

---@param lowLimit number
---@param highLimit number
function getRandomInt(lowLimit, highLimit)
    return math.random(lowLimit or 0, highLimit or 9)
end

function getAlphanumeric()
    return math.random(0, 1) == 1 and getRandomLetter() or getRandomInt()
end