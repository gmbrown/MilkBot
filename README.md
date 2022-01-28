# MilkBot
Poker Bot For Donkhouse

## Using MilkBot
When you're on the donkhouse.com website, paste this code snippet into your console to load MilkBot and let it play for you:
```
fetch("https://raw.githubusercontent.com/gmbrown/MilkBot/main/playhand.js")
    .then(r => r.text())
    .then(t => eval(t))
```
