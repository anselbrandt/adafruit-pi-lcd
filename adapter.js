const I2C = require("i2c-bus");

const I2CBusWireAdapter = (function () {
  function I2CBusWireAdapter(device, address) {
    if (!(typeof device === "number")) {
      throw new Error(
        "parameter device has to be the number of the device, not a path or device name. e.g. 1 instead of /dev/i2c-1 or i2c-1"
      );
    }
    this._DEVICE = device;
    this._ADDRESS = address;
    this._WIRE = I2C.openSync(device);
  }

  I2CBusWireAdapter.prototype.writeByte = function (value) {
    return this._WIRE.sendByteSync(this._ADDRESS, value);
  };

  I2CBusWireAdapter.prototype.writeBytes = function (cmd, values) {
    if (!Buffer.isBuffer(values)) {
      values = Buffer.from(values);
    }
    return this._WIRE.writeI2cBlockSync(
      this._ADDRESS,
      cmd,
      values.length,
      values
    );
  };

  I2CBusWireAdapter.prototype.readByte = function (cmd) {
    if (cmd != null) {
      return this._WIRE.readByteSync(this._ADDRESS, cmd);
    } else {
      return this._WIRE.receiveByteSync(this._ADDRESS);
    }
  };

  return I2CBusWireAdapter;
})();

module.exports = I2CBusWireAdapter;
