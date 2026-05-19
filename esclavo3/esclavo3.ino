#include <Wire.h>
#include <DHT.h>

#define DHTPIN 2
#define DHTTYPE DHT11

DHT dht(DHTPIN, DHTTYPE);

int fc28Pin = A0;
int fc28PowerPin = 3;
int bombaPin = 7;

#define RELAY_ON LOW
#define RELAY_OFF HIGH

float temperatura = 0;
float humedadAire = 0;
int humedadSuelo = 0;

bool bombaEncendida = false;
bool modoManual = false;

char datos_esclavo3[32];

void setup() {
  Serial.begin(9600);

  Wire.begin(10);
  Wire.onRequest(enviarDatos);
  Wire.onReceive(recibirComando);

  dht.begin();
  pinMode(bombaPin, OUTPUT);
  pinMode(fc28PowerPin, OUTPUT);
  digitalWrite(bombaPin, RELAY_OFF);
  digitalWrite(fc28PowerPin, LOW);

  snprintf(datos_esclavo3, sizeof(datos_esclavo3), "|0,0,0");
}

unsigned long lastDHTRead = 0;

void loop() {
  if (millis() - lastDHTRead >= 2000) {
    lastDHTRead = millis();
    float t = dht.readTemperature();
    float h = dht.readHumidity();
    if (!isnan(t)) temperatura = t;
    if (!isnan(h)) humedadAire = h;
  }

  digitalWrite(fc28PowerPin, HIGH);
  delay(100);
  int rawFC28 = analogRead(fc28Pin);
  digitalWrite(fc28PowerPin, LOW);

  humedadSuelo = constrain(map(rawFC28, 950, 320, 0, 100), 0, 100);

  if (!modoManual) {
    controlarBomba();
  }

  snprintf(datos_esclavo3, sizeof(datos_esclavo3),
           "|%d,%d,%d",
           humedadSuelo,
           (int)temperatura,
           (int)humedadAire);

  Serial.print("FC28 raw=");
  Serial.print(rawFC28);
  Serial.print(" humedad=");
  Serial.print(humedadSuelo);
  Serial.print(" temp=");
  Serial.print(temperatura);
  Serial.print(" humedadAire=");
  Serial.print(humedadAire);
  Serial.print(" bomba=");
  Serial.println(bombaEncendida ? 1 : 0);

  delay(1000);
}

void controlarBomba() {
  unsigned long ahora = millis();

  if (humedadSuelo < 20) {
    if (!bombaEncendida) {
      bombaEncendida = true;
      digitalWrite(bombaPin, RELAY_ON);
    }
  }
  else if (humedadSuelo >= 20 && humedadSuelo < 30) {
    if ((ahora / 1000) % 15 < 10) {
      if (!bombaEncendida) {
        bombaEncendida = true;
        digitalWrite(bombaPin, RELAY_ON);
      }
    } else {
      if (bombaEncendida) {
        bombaEncendida = false;
        digitalWrite(bombaPin, RELAY_OFF);
      }
    }
  }
  else if (humedadSuelo >= 30 && humedadSuelo < 40) {
    if ((ahora / 1000) % 12 < 5) {
      if (!bombaEncendida) {
        bombaEncendida = true;
        digitalWrite(bombaPin, RELAY_ON);
      }
    } else {
      if (bombaEncendida) {
        bombaEncendida = false;
        digitalWrite(bombaPin, RELAY_OFF);
      }
    }
  }
  else if (humedadSuelo >= 40 && humedadSuelo < 55) {
    if ((ahora / 1000) % 20 < 3) {
      if (!bombaEncendida) {
        bombaEncendida = true;
        digitalWrite(bombaPin, RELAY_ON);
      }
    } else {
      if (bombaEncendida) {
        bombaEncendida = false;
        digitalWrite(bombaPin, RELAY_OFF);
      }
    }
  }
  else {
    if (bombaEncendida) {
      bombaEncendida = false;
      digitalWrite(bombaPin, RELAY_OFF);
    }
  }
}

void recibirComando(int bytes) {
  char cmd[8];
  int i = 0;
  while (Wire.available() && i < 7) {
    cmd[i++] = Wire.read();
  }
  cmd[i] = '\0';

  if (strcmp(cmd, "ON") == 0) {
    modoManual = true;
    bombaEncendida = true;
    digitalWrite(bombaPin, RELAY_ON);
  } else if (strcmp(cmd, "OFF") == 0) {
    modoManual = true;
    bombaEncendida = false;
    digitalWrite(bombaPin, RELAY_OFF);
  } else if (strcmp(cmd, "AUTO") == 0) {
    modoManual = false;
  }
}

void enviarDatos() {
  Wire.write(datos_esclavo3);
}
