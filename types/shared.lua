---@class OxGroupProperties
---@field name string
---@field label string
---@field grades number[]
---@field principal string
---@field hasAccount boolean
---@field adminGrade number

---@class VehicleStats
---@field acceleration number
---@field braking number
---@field handling number
---@field speed number

---@class TopVehicleStats
---@field air VehicleStats
---@field land VehicleStats
---@field sea VehicleStats

---@class VehicleData : VehicleStats
---@field class number
---@field doors number
---@field make string
---@field name string
---@field price number
---@field seats number
---@field type string
