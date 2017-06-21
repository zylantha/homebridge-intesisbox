#include <RCSwitch.h>
RCSwitch mySwitch = RCSwitch();

const int POS_ALT_PIN = 11;
const int NEG_ALT_PIN = 12;

void setup() {
  mySwitch.enableReceive(0);  // Receiver on interrupt 0 => that is pin #2
  pinMode(13, OUTPUT);
  pinMode(POS_ALT_PIN, OUTPUT);
  pinMode(NEG_ALT_PIN, OUTPUT);

  //setOff();
  setNoFrost();
}

void loop() {
    if (mySwitch.available()) {
    
      int value = mySwitch.getReceivedValue();
      
      if (value == 0) {
        //Serial.print("Unknown encoding");
      } else {
        int receivedValue = mySwitch.getReceivedValue();
        int receivedBitlength = mySwitch.getReceivedBitlength();
        int receivedProtocol = mySwitch.getReceivedProtocol();

        if (receivedValue%2 == 0) {
          //setOff();
          setNoFrost();
        } else {
          setComfort();
        }
      }
      mySwitch.resetAvailable();
  }

}

void setComfort() {
    //SWITCH OFF LED
    digitalWrite(13, LOW);
    //SET COMFORT
    digitalWrite(POS_ALT_PIN, LOW);
    digitalWrite(NEG_ALT_PIN, LOW);
}

void setOff() {
    //SWITCH ON LED
    digitalWrite(13, HIGH);
    //SET OFF
    digitalWrite(POS_ALT_PIN, HIGH);
    digitalWrite(NEG_ALT_PIN, LOW);
}

void setNoFrost() {
    //SWITCH ON LED
    digitalWrite(13, HIGH);
    //SET OFF
    digitalWrite(POS_ALT_PIN, LOW);
    digitalWrite(NEG_ALT_PIN, HIGH);
}
