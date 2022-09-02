local vehicles = json.load('shared/files/vehicles.json')

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

function Ox.GetVehicleData(filter)
    if type(filter) == 'table' then
        local rv = {}

        if table.type(filter) == 'array' then
            for i = 1, #filter do
                local model = filter[i]
                rv[model] = vehicles[model]
            end
        else
            for model, data in pairs(vehicles) do
                if filterData(model, data, filter) then
                    rv[model] = data
                end
            end
        end

        return rv
    end

    return vehicles[filter]
end
