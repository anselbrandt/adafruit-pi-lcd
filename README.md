# Adafruit I2C LCD and Keypad Pi Plate for Raspberry Pi

This module allows controlling the [Adafruit 16x2 Character LCD + Keypad for Raspberry Pi](https://learn.adafruit.com/adafruit-16x2-character-lcd-plus-keypad-for-raspberry-pi) in Node.js.

It is the Javascript output of the CoffeeScript source files of [adafruit-i2c-lcd](https://github.com/fehmer/adafruit-i2c-lcd) by [Christian Fehmer](https://github.com/fehmer).

I wanted to add some extra functionality and work purely in Javascript.

This is currently a work in progress. See [adafruit-i2c-lcd](https://github.com/fehmer/adafruit-i2c-lcd) for documentation.

### Install

```bash
yarn add https://github.com/anselbrandt/adafruit-pi-lcd
```

### Example

```javascript
const LCDPLATE = require("adafruit-pi-lcd");
const lcd = new LCDPLATE(1, 0x20);

lcd.backlight(lcd.colors.ON);
lcd.message("Hello World!");

lcd.on("button_change", function (button) {
  lcd.clear();
  lcd.message("Button changed:\n" + lcd.buttonName(button));
});
```

### API

- const lcd = new LCDPLATE(device:String,address:Number,[pollInterval:Number])
- lcd.clear()
- lcd.home()
- lcd.close()
- lcd.backlight(lcd.colors.ON) or lcd.backlight(lcd.colors.OFF)
- lcd.message(test:String, [clear:boolean])
- lcd.createChar(index:Number, pattern:byte[])
- lcd.buttonState():Number
- lcd.buttonName(val:Number):String

### Custom Characters

The LCD supports up to 8 custom characters at a time.

[LCD Custom Character Generator](https://maxpromer.github.io/LCD-Character-Creator/)

```javascript
const LCDPLATE = require("adafruit-pi-lcd");
const lcd = new LCDPLATE(1, 0x20);

lcd.backlight(lcd.colors.ON);
lcd.createChar(0, [0x0a, 0x0a, 0x1f, 0x11, 0x0a, 0x04, 0x04, 0x04]); // power plug
lcd.createChar(1, [0x03, 0x06, 0x0c, 0x1f, 0x06, 0x0c, 0x18, 0x10]); // lightning
lcd.createChar(2, [0x04, 0x1b, 0x11, 0x15, 0x15, 0x15, 0x11, 0x1f]); // full batt
lcd.createChar(3, [0x04, 0x1b, 0x11, 0x11, 0x15, 0x15, 0x11, 0x1f]); // 2/3 batt
lcd.createChar(4, [0x04, 0x1b, 0x11, 0x11, 0x11, 0x15, 0x11, 0x1f]); // 1/3 batt
lcd.createChar(5, [0x0e, 0x0a, 0x0e, 0x0a, 0x1f, 0x11, 0x11, 0x11]); // usb plug
lcd.createChar(6, [0x0f, 0x19, 0x11, 0x11, 0x11, 0x11, 0x11, 0x1f]); // sd card
lcd.createChar(7, [0x0e, 0x11, 0x11, 0x11, 0x1f, 0x1b, 0x1b, 0x1f]); // lock
// lcd.createChar(7, [0x04, 0x16, 0x0d, 0x06, 0x06, 0x0d, 0x16, 0x04]); // bluetooth
// lcd.createChar(7, [0x00, 0x0e, 0x11, 0x04, 0x0a, 0x00, 0x04, 0x00]); // wifi

lcd.message("\x00\x01\x02\x03\x04\x05\x06\x07");

process.exit();
```

#### Sample Animation

```javascript
const LCDPLATE = require("adafruit-pi-lcd");
const lcd = new LCDPLATE(1, 0x20);

lcd.backlight(lcd.colors.ON);
lcd.createChar(0, [0x10, 0x10, 0x10, 0x10, 0x10, 0x10, 0x10, 0x10]);
lcd.createChar(1, [0x10, 0x10, 0x10, 0x10, 0x10, 0x10, 0x10, 0x10]);
lcd.createChar(2, [0x1c, 0x1c, 0x1c, 0x1c, 0x1c, 0x1c, 0x1c, 0x1c]);
lcd.createChar(3, [0x1e, 0x1e, 0x1e, 0x1e, 0x1e, 0x1e, 0x1e, 0x1e]);

const numToBlocks = (number) => {
  const num = parseInt(number);
  const block = "\xff";
  const partial = ["\x00", "\x01", "\x02", "\x03"];
  const quot = parseInt(num / 5);
  const remain = num % 5;
  let string = "";

  if (remain !== 0) {
    string = block.repeat(quot) + partial[remain - 1];
  } else {
    string = block.repeat(quot);
  }
  return string;
};

let i = (3 * Math.PI) / 2;

setInterval(() => {
  const sine = Math.sin(i);
  const value = (sine + 1) * 37.5;
  const message = numToBlocks(value).padEnd(15, " ");
  const topLine = "L" + message;
  const bottomLine = "R" + message;
  lcd.home();
  lcd.message(topLine + "\n" + bottomLine);
  i = i + 0.1;
}, 10);
```
