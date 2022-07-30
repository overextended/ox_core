local ox_core = exports.ox_core
local CAccount = {}
local AccountExports = {}
setmetatable(AccountExports, {
    __index = function(_, index)
        AccountExports = Ox.AccountExports()
        return AccountExports[index]
    end
})

function CAccount:__index(index)
    local export = AccountExports[index]

    if export then
        return function(...)
            return ox_core:CAccount(self.owner, index, ...)
        end
    end
end

function Ox.GetAccounts(owner)
    return setmetatable({
        owner = owner
    }, CAccount)
end
