---@type { [string]: { [string]: number } }
local topStats = json.load('shared/files/topVehicleStats.json')

---@type { [string]: { [string]: number }}
local vehicleList = json.load('shared/files/vehicles.json')

local function filterData(model, data, filter)
    if filter.model and not model:find(filter.model) then return end
    if filter.bodytype and filter.bodytype ~= data.bodytype then return end
    if filter.class and filter.class ~= data.class then return end
    if filter.doors and filter.doors == data.doors then return end
    if filter.make and filter.make ~= data.make then return end
    if filter.minprice and filter.minprice > data.price then return end
    if filter.maxprice and data.price > filter.maxprice then return end
    if filter.seats and filter.seats ~= data.seats then return end
    if filter.type and filter.type ~= data.type then return end

    return true
end

---@param filter 'land' | 'air' | 'sea' | nil
---@return { [string]: { [string]: number } } | nil
function Ox.GetTopVehicleStats(filter)
    if filter then
        return topStats[filter]
    end

    return topStats
end

---@param filter string | string[] | { [string]: string | number } | nil
---@return { [string]: { [string]: number } } | nil
function Ox.GetVehicleData(filter)
    if filter then
        if type(filter) == 'table' then
            local rv = {}

            if table.type(filter) == 'array' then
                for i = 1, #filter do
                    local model = filter[i]
                    rv[model] = vehicleList[model]
                end
            else
                for model, data in pairs(vehicleList) do
                    if filterData(model, data, filter) then
                        rv[model] = data
                    end
                end
            end

            return rv
        end

        return vehicleList[filter]
    end

    return vehicleList
end
