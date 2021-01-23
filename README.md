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
