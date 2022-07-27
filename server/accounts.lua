local Query = {
    VALIDATE_USER_EXISTS = 'SELECT 1 FROM characters WHERE charid = ?',
    VALIDATE_GROUP_EXISTS = 'SELECT 1 FROM ox_groups WHERE name = ?',
    SELECT_USER_ACCOUNT = 'SELECT balance FROM user_accounts WHERE charid = ? AND account = ?',
    SELECT_GROUP_ACCOUNT = 'SELECT balance FROM group_accounts WHERE `group` = ? AND account = ?',
    UPDATE_USER_ACCOUNT = 'INSERT INTO user_accounts (charid, account, balance) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE balance = VALUES(balance)',
    UPDATE_GROUP_ACCOUNT = 'INSERT INTO group_accounts (`group`, account, balance) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE balance = VALUES(balance)',
}

local accounts = {}
local saveTimeout

---Fetch the balance of an account in the database.
---After 60 seconds, accounts will be synced and unloaded.
---@param owner number | string
---@param account string
local function fetchAccount(shared, owner, account)
    if not saveTimeout then
        saveTimeout = true

        SetTimeout(60000, function()
            local parameters = { {}, {} }

            for owner, _accounts in pairs(accounts) do
                local index = _accounts.__shared and 1 or 2
                local arr = parameters[index]

                for account, balance in pairs(_accounts) do
                      if not account:find('^__') then
                        arr[#arr + 1] = { owner, account, balance }
                    end
                end
            end

            accounts = {}

            if #parameters[1] > 0 then
                MySQL.prepare(Query.UPDATE_GROUP_ACCOUNT, parameters[1])
            end

            if #parameters[2] > 0 then
                MySQL.prepare(Query.UPDATE_USER_ACCOUNT, parameters[2])
            end

            saveTimeout = false
        end)
    end

    return MySQL.prepare.await(shared and Query.SELECT_GROUP_ACCOUNT or Query.SELECT_USER_ACCOUNT, { owner, account })
end

---@class CAccount
local CAccount = {}
CAccount.__index = CAccount

---Get the current balance for the account.
---@param account string
---@return number
function CAccount:get(account)
    local balance = self[account]

    if balance then return balance end

    self[account] = fetchAccount(self.__shared, self.__owner, account) or 0

    return self[account]
end

---Sets the account's balance to the specified amount.
---@param account string
---@param amount number
function CAccount:set(account, amount)
    if account:find('^__') then return end
    amount = math.floor(amount + 0.5)
    self[account] = amount
end

---Adds the specified amount to the account's balance.
---@param account string
---@param amount number
function CAccount:add(account, amount)
    if account:find('^__') then return end
    amount = math.floor(amount + 0.5)

    if not self[account] then
        self[account] = fetchAccount(self.__shared, self.__owner, account) or 0
    end

    self[account] += amount
end

---Removes the specified amount from the account's balance.
---@param account string
---@param amount number
function CAccount:remove(account, amount)
    if account:find('^__') then return end
    amount = math.floor(amount + 0.5)

    if not self[account] then
        self[account] = fetchAccount(self.__shared, self.__owner, account) or 0
    end

    self[account] -= amount
end

---@param owner number|string The owner's character id, or a group name.
---@return CAccount
local function getAccounts(owner)
    if not accounts[owner] then
        local ownerType = type(owner)

        if ownerType == 'number' then
            if not MySQL.scalar.await(Query.VALIDATE_USER_EXISTS, { owner }) then
                error(("Attempted to load accounts for a non-existent character id '%s'"):format(owner))
            end
        elseif ownerType == 'string' then
            if not MySQL.scalar.await(Query.VALIDATE_GROUP_EXISTS, { owner }) then
                error(("Attempted to load accounts for a non-existent group '%s'"):format(owner))
            end
        else
            error(("Attempted to load accounts for an invalid owner type '%s'"):format(ownerType))
        end

        accounts[owner] = setmetatable({
            __owner = owner,
            __shared = ownerType == 'string',
        }, CAccount)
    end

    return accounts[owner]
end

function Ox.AccountExports()
    return {
        get = true,
        set = true,
        add = true,
        remove = true,
    }
end

---API entry point for triggering account methods.
---@param source number
---@param method string
---@param ... unknown
---@return unknown
function Ox.CAccount(source, method, ...)
    local _accounts = getAccounts(source)
    return _accounts[method](_accounts, ...)
end
