const extend = function (child, parent) {
  for (var key in parent) {
    if (hasProp.call(parent, key)) child[key] = parent[key];
  }
  function ctor() {
    this.constructor = child;
  }
  ctor.prototype = parent.prototype;
  child.prototype = new ctor();
  child.__super__ = parent.prototype;
  return child;
};
const hasProp = {}.hasOwnProperty;

// Port expander registers
const MCP23017_IOCON_BANK0 = 0x0a; // IOCON when Bank 0 active
const MCP23017_IOCON_BANK1 = 0x15; // IOCON when Bank 1 active

// These are register addresses when in Bank 1 only:
const MCP23017_GPIOA = 0x09;
const MCP23017_IODIRB = 0x10;
const MCP23017_GPIOB = 0x19;

// LCD Commands
const LCD_CLEARDISPLAY = 0x01;
const LCD_RETURNHOME = 0x02;
const LCD_ENTRYMODESET = 0x04;
const LCD_DISPLAYCONTROL = 0x08;
const LCD_CURSORSHIFT = 0x10;
const LCD_FUNCTIONSET = 0x20;
const LCD_SETCGRAMADDR = 0x40;
const LCD_SETDDRAMADDR = 0x80;

// Flags for display on/off control
const LCD_DISPLAYON = 0x04;
const LCD_DISPLAYOFF = 0x00;
const LCD_CURSORON = 0x02;
const LCD_CURSOROFF = 0x00;
const LCD_BLINKON = 0x01;
const LCD_BLINKOFF = 0x00;

// Flags for display entry mode
const LCD_ENTRYRIGHT = 0x00;
const LCD_ENTRYLEFT = 0x02;
const LCD_ENTRYSHIFTINCREMENT = 0x01;
const LCD_ENTRYSHIFTDECREMENT = 0x00;

// Flags for display/cursor shift
const LCD_DISPLAYMOVE = 0x08;
const LCD_CURSORMOVE = 0x00;
const LCD_MOVERIGHT = 0x04;
const LCD_MOVELEFT = 0x00;

const flip = [
  0x00,
  0x10,
  0x08,
  0x18,
  0x04,
  0x14,
  0x0c,
  0x1c,
  0x02,
  0x12,
  0x0a,
  0x1a,
  0x06,
  0x16,
  0x0e,
  0x1e,
];

const pollables = [LCD_CLEARDISPLAY, LCD_RETURNHOME];

const EventEmitter = require("events").EventEmitter;

const WireAdapter = require("./adapter");

const Plate = (function (superClass) {
  extend(Plate, superClass);

  function Plate(device, address, pollInterval) {
    this.ADDRESS = address;
    this.PORTA = 0;
    this.PORTB = 0;
    this.DDRB = 0x10;
    this.WIRE = new WireAdapter(device, address);
    if (pollInterval == null) {
      pollInterval = 200;
    }
    this.init();
    this.BSTATE = 0;
    if (pollInterval > 0) {
      this.poll = setInterval(
        (function (_this) {
          return function () {
            var cur, key;
            cur = _this.buttonState();
            if (cur !== _this.BSTATE) {
              key = _this.BSTATE ^ cur;
              _this.emit("button_change", key);
              if (cur < _this.BSTATE) {
                _this.emit("button_up", key);
              } else {
                _this.emit("button_down", key);
              }
              return (_this.BSTATE = cur);
            }
          };
        })(this),
        pollInterval
      );
    }
  }

  Plate.prototype.colors = {
    OFF: 0x00,
    RED: 0x01,
    GREEN: 0x02,
    BLUE: 0x04,
    YELLOW: 0x03,
    TEAL: 0x06,
    VIOLET: 0x05,
    WHITE: 0x07,
    ON: 0x07,
  };

  Plate.prototype.buttons = {
    SELECT: 0x01,
    RIGHT: 0x02,
    DOWN: 0x04,
    UP: 0x08,
    LEFT: 0x10,
  };

  Plate.prototype.clear = function () {
    return this.writeByte(LCD_CLEARDISPLAY);
  };

  Plate.prototype.home = function () {
    return this.writeByte(LCD_RETURNHOME);
  };

  Plate.prototype.close = function () {
    if (this.poll != null) {
      return clearInterval(this.poll);
    }
  };

  Plate.prototype.backlight = function (color) {
    var c;
    c = ~color;
    this.PORTA = (this.PORTA & 0x3f) | ((c & 0x3) << 6);
    this.PORTB = (this.PORTB & 0xfe) | ((c & 0x4) >> 2);
    // Has to be done as two writes because sequential operation is off.
    this.sendBytes(MCP23017_GPIOA, this.PORTA);
    return this.sendBytes(MCP23017_GPIOB, this.PORTB);
  };

  Plate.prototype.message = function (text, clear) {
    var i, j, len, line, lines, results;
    if (clear) {
      this.clear();
    }
    lines = text.split("\n");
    results = [];
    for (i = j = 0, len = lines.length; j < len; i = ++j) {
      line = lines[i];
      if (i === 1) {
        this.writeByte(0xc0);
      }
      if (i < 2) {
        results.push(this.writeByte(line, true));
      } else {
        results.push(void 0);
      }
    }
    return results;
  };

  Plate.prototype.buttonState = function () {
    var ret;
    ret = this.WIRE.readByte(MCP23017_GPIOA);
    return ret & 0x1f;
  };

  Plate.prototype.buttonName = function (val) {
    switch (val) {
      case this.buttons.SELECT:
        return "SELECT";
      case this.buttons.RIGHT:
        return "RIGHT";
      case this.buttons.UP:
        return "UP";
      case this.buttons.DOWN:
        return "DOWN";
      case this.buttons.LEFT:
        return "LEFT";
      default:
        return void 0;
    }
  };

  // Fill one of the first 8 CGRAM locations with custom characters.
  // The location parameter should be between 0 and 7 and pattern should
  // provide an array of 8 bytes containing the pattern. E.g. you can easyly
  // design your custom character at http://www.quinapalus.com/hd44780udg.html
  // To show your custom character use eg. lcd.message('\x01')

  Plate.prototype.createChar = function (location, pattern) {
    var data, j, len;
    location = location & 0x7;
    this.writeByte(LCD_SETCGRAMADDR | (location << 3));
    for (j = 0, len = pattern.length; j < len; j++) {
      data = pattern[j];
      this.writeByte(data, true);
    }
    return this.clear();
  };

  Plate.prototype.init = function () {
    var displaycontrol, displaymode, displayshift;
    this.sendBytes(MCP23017_IOCON_BANK1, 0);
    this.sendBytes(0, [
      0x3f, //      IODIRA      R+G LEDs=outputs, buttons=inputs
      this.DDRB, // IODIRB      LCD D7=input, Blue LED=output
      0x3f, //      IPOLA       Invert polarity on button inputs
      0x0, //       IPOLB
      0x0, //       GPINTENA    Disable interrupt-on-change
      0x0, //       GPINTENB
      0x0, //       DEFVALA
      0x0, //       DEFVALB
      0x0, //       INTCONA
      0x0, //       INTCONB
      0x0, //       IOCON
      0x0, //       IOCON
      0x3f, //      GPPUA       Enable pull-ups on buttons
      0x0, //       GPPUB
      0x0, //       INTFA
      0x0, //       INTFB
      0x0, //       INTCAPA
      0x0, //       INTCAPB
      this.PORTA, // GPIOA
      this.PORTB, // GPIOB
      this.PORTA, // OLATA      0 on all outputs; side effect of
      this.PORTB, // OLATB      turning on R+G+B backlight LEDs.
    ]);
    this.sendBytes(MCP23017_IOCON_BANK0, 0xa0);
    displayshift = LCD_CURSORMOVE | LCD_MOVERIGHT;
    displaymode = LCD_ENTRYLEFT | LCD_ENTRYSHIFTDECREMENT;
    displaycontrol = LCD_DISPLAYON | LCD_CURSOROFF | LCD_BLINKOFF;
    this.writeByte(0x33);
    this.writeByte(0x32);
    this.writeByte(0x28);
    this.writeByte(LCD_CLEARDISPLAY);
    this.writeByte(LCD_CURSORSHIFT | displayshift);
    this.writeByte(LCD_ENTRYMODESET | displaymode);
    this.writeByte(LCD_DISPLAYCONTROL | displaycontrol);
    this.writeByte(LCD_RETURNHOME);
    this.clear;
    return this.backlight(0x0);
  };

  Plate.prototype.sendBytes = function (cmd, values) {
    var data, reg;
    reg = cmd;
    if (typeof values === "number") {
      data = [];
      data.push(values);
      values = data;
    }
    return this.WIRE.writeBytes(cmd, values);
  };

  Plate.prototype.sendByte = function (value) {
    return this.WIRE.writeByte(value);
  };

  Plate.prototype.maskOut = function (bitmask, value) {
    var hi, lo;
    hi = bitmask | flip[value >> 4];
    lo = bitmask | flip[value & 0x0f];
    return [hi | 0x20, hi, lo | 0x20, lo];
  };

  // The speed of LCD accesses is inherently limited by I2C through the
  // port expander.  A 'well behaved program' is expected to poll the
  // LCD to know that a prior instruction completed.  But the timing of
  // most instructions is a known uniform 37 mS.  The enable strobe
  // can't even be twiddled that fast through I2C, so it's a safe bet
  // with these instructions to not waste time polling (which requires
  // several I2C transfers for reconfiguring the port direction).
  // The D7 pin is set as input when a potentially time-consuming
  // instruction has been issued (e.g. screen clear), as well as on
  // startup, and polling will then occur before more commands or data
  // are issued.

  Plate.prototype.writeByte = function (value, char_mode) {
    var bitmask, bits, data, hi, j, k, last, lo, ref;
    char_mode = char_mode || false;
    // If pin D7 is in input state, poll LCD busy flag until clear.
    if (this.DDRB & 0x10) {
      lo = (this.PORTB & 0x01) | 0x40;
      hi = lo | 0x20;
      this.sendBytes(MCP23017_GPIOB, lo);
      while (true) {
        // Strobe high (enable)
        this.sendByte(hi);
        // First nybble contains busy state
        bits = this.readByte();
        // Strobe low, high, low.  Second nybble (A3) is ignored.
        this.sendBytes(MCP23017_GPIOB, [lo, hi, lo]);
        if ((bits & 0x2) === 0) {
          // D7=0, not busy
          break;
        }
      }
      this.PORTB = lo;
      // Polling complete, change D7 pin to output
      this.DDRB &= 0xef;
      this.sendBytes(MCP23017_IODIRB, this.DDRB);
    }
    // Mask out PORTB LCD control bits
    bitmask = this.PORTB & 0x01;
    if (char_mode) {
      // Set data bit if not a command
      bitmask |= 0x80;
    }
    // If string iterate through multiple write ops
    if (typeof value === "string") {
      last = value.length - 1;
      data = [];
      for (
        k = j = 0, ref = last;
        0 <= ref ? j <= ref : j >= ref;
        k = 0 <= ref ? ++j : --j
      ) {
        // Append 4 bytes to list representing PORTB over time.
        // First the high 4 data bits with strobe (enable) set
        // and unset, then same with low 4 data bits (strobe 1/0).
        if (value[k] != null) {
          data = data.concat(this.maskOut(bitmask, value[k].charCodeAt(0)));
          if (data.length >= 32 || k === last) {
            this.sendBytes(MCP23017_GPIOB, data);
            this.PORTB = data[data.length - 1];
            data = [];
          }
        }
      }
    } else {
      // Single byte
      data = this.maskOut(bitmask, value);
      this.sendBytes(MCP23017_GPIOB, data);
      this.PORTB = data[data.length - 1];
    }
    // If a poll-worthy instruction was issued, reconfigure D7
    // pin as input to indicate need for polling on next call.
    if (!char_mode && pollables.indexOf(value) !== -1) {
      this.DDRB |= 0x10;
      return this.sendBytes(MCP23017_IODIRB, this.DDRB);
    }
  };

  Plate.prototype.readByte = function () {
    return this.WIRE.readByte();
  };

  return Plate;
})(EventEmitter);

module.exports = Plate;
