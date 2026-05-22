#include <Wire.h>
#include <LiquidCrystal_I2C.h>

LiquidCrystal_I2C lcd(0x27, 16, 2);

int buzzerPin = 8;

// Datos esclavo 1 - Sala Servidores
int humo = 0;
int tempServidores = 0;
int humedadServidores = 0;
int fanState = 0;
int alerta = 0;

// Datos esclavo 2 - Puertas/Acceso
int btn1 = 0;
int btn2 = 0;
int pir = 0;
int tempPuertas = 0;
int puerta1 = 0;
int puerta2 = 0;
int alertaPuertas = 0;
int prevAlertaPuertas = 0;

// Datos esclavo 3 - Jardin
int humedadSuelo = 0;
int tempJardin = 0;
int humedadAire = 0;

int pantalla = 0;
unsigned long lastCambio = 0;
String cmdBuffer = "";

// Buzzer persistent 5s
unsigned long buzzerStart = 0;
bool buzzerOn = false;

// Estado de lock de puertas (solo por PIR)
bool puertasLocked = false;

void setup() {
  Wire.begin();
  Serial1.begin(9600);
  Serial.begin(9600);

  lcd.init();
  lcd.backlight();

  pinMode(buzzerPin, OUTPUT);

  Serial.println("Mega iniciado - DataCenter v3.0");

  lcd.setCursor(0, 0);
  lcd.print("DataCenter v3.0");
  lcd.setCursor(0, 1);
  lcd.print("Iniciando...");
  delay(2000);
  lcd.clear();
}

void loop() {
  // ===== LECTURA DE COMANDOS DESDE ESP32 =====
  while (Serial1.available()) {
    char c = Serial1.read();
    if (c == '\n') {
      cmdBuffer.trim();
      if (cmdBuffer.startsWith("CMD,")) {
        String comando = cmdBuffer.substring(4);
        comando.trim();
        Serial.print("Comando recibido: ");
        Serial.println(comando);

        if (comando == "OPEN_DOOR_1") {
          Wire.beginTransmission(9);
          Wire.write('O');
          Wire.write('1');
          Wire.endTransmission();
          Serial.println(" -> Abriendo puerta 1 via I2C");
        } else if (comando == "OPEN_DOOR_2") {
          Wire.beginTransmission(9);
          Wire.write('O');
          Wire.write('2');
          Wire.endTransmission();
          Serial.println(" -> Abriendo puerta 2 via I2C");
        }
      }
      cmdBuffer = "";
    } else {
      cmdBuffer += c;
    }
  }

  // ===== 1. LEER ESCLAVO 1 (Sala Servidores, addr 8) =====
  Wire.requestFrom(8, 20);
  String resp1 = "";
  while (Wire.available()) {
    char c = Wire.read();
    if (c >= 32 && c <= 126) resp1 += c;
  }

  if (resp1.length() > 0) {
    int coma1 = resp1.indexOf(',');
    int coma2 = resp1.indexOf(',', coma1 + 1);
    int coma3 = resp1.indexOf(',', coma2 + 1);
    if (coma1 > 0) {
      humo = resp1.substring(1, coma1).toInt();
      tempServidores = resp1.substring(coma1 + 1, coma2).toInt();
      humedadServidores = resp1.substring(coma2 + 1, coma3).toInt();
      fanState = (coma3 > 0) ? resp1.substring(coma3 + 1).toInt() : 0;
      Serial.print("E1: "); Serial.println(resp1);
    }
  }

  // ===== 2. LEER ESCLAVO 2 (Puertas/Acceso, addr 9) =====
  Wire.requestFrom(9, 20);
  String resp2 = "";
  while (Wire.available()) {
    char c = Wire.read();
    if (c >= 32 && c <= 126) resp2 += c;
  }

  if (resp2.length() > 0) {
    int p1 = resp2.indexOf(',');
    int p2 = resp2.indexOf(',', p1 + 1);
    int p3 = resp2.indexOf(',', p2 + 1);
    int p4 = resp2.indexOf(',', p3 + 1);
    int p5 = resp2.indexOf(',', p4 + 1);
    if (p1 > 0 && p5 > 0) {
      btn1 = resp2.substring(1, p1).toInt();
      btn2 = resp2.substring(p1 + 1, p2).toInt();
      pir = resp2.substring(p2 + 1, p3).toInt();
      tempPuertas = resp2.substring(p3 + 1, p4).toInt();
      puerta1 = resp2.substring(p4 + 1, p5).toInt();
      puerta2 = resp2.substring(p5 + 1).toInt();
      alertaPuertas = (pir == 1 && puerta1 == 0 && puerta2 == 0) ? 1 : 0;
      Serial.print("E2: "); Serial.println(resp2);
    }
  }

  // ===== 3. LEER ESCLAVO 3 (Jardin, addr 10) =====
  Wire.requestFrom(10, 20);
  String resp3 = "";
  while (Wire.available()) {
    char c = Wire.read();
    if (c >= 32 && c <= 126) resp3 += c;
  }

  if (resp3.length() > 0) {
    int p1 = resp3.indexOf(',');
    int p2 = resp3.indexOf(',', p1 + 1);
    if (p1 > 0 && p2 > 0) {
      humedadSuelo = resp3.substring(1, p1).toInt();
      tempJardin = resp3.substring(p1 + 1, p2).toInt();
      humedadAire = resp3.substring(p2 + 1).toInt();
      Serial.print("E3: "); Serial.println(resp3);
    }
  }

  // ===== 4. CALCULAR ALERTA GLOBAL =====
  alerta = (humo == 1 || tempServidores > 30 || tempJardin > 45 || alertaPuertas == 1) ? 1 : 0;

  // ===== 5. CONTROL DE LOCK DE PUERTAS (solo por PIR, no por gas/temp) =====
  if (alertaPuertas == 1 && !puertasLocked) {
    puertasLocked = true;
    Wire.beginTransmission(9);
    Wire.write('L');
    Wire.endTransmission();
    Serial.println(" -> Puertas LOCKED por PIR");
  } else if (alertaPuertas == 0 && puertasLocked) {
    puertasLocked = false;
    Wire.beginTransmission(9);
    Wire.write('U');
    Wire.endTransmission();
    Serial.println(" -> Puertas UNLOCKED");
  }
  prevAlertaPuertas = alertaPuertas;

  // ===== 6. BUZZER PERSISTENTE 5s =====
  if (alerta == 1 && !buzzerOn) {
    buzzerOn = true;
    buzzerStart = millis();
    digitalWrite(buzzerPin, HIGH);
  }
  if (buzzerOn && millis() - buzzerStart >= 5000) {
    buzzerOn = false;
    digitalWrite(buzzerPin, LOW);
  }
  if (alerta == 0) {
    buzzerOn = false;
    digitalWrite(buzzerPin, LOW);
  }

  // ===== 7. ENVIAR AL ESP32 =====
  delayMicroseconds(500);
  Serial1.print("1,");
  Serial1.print(humo);
  Serial1.print(",");
  Serial1.print(tempServidores);
  Serial1.print(",");
  Serial1.print(humedadServidores);
  Serial1.print(",");
  Serial1.print(alerta);
  Serial1.print(",");
  Serial1.print(fanState);
  Serial1.print("|2,");
  Serial1.print(btn1);
  Serial1.print(",");
  Serial1.print(btn2);
  Serial1.print(",");
  Serial1.print(pir);
  Serial1.print(",");
  Serial1.print(puerta1);
  Serial1.print(",");
  Serial1.print(puerta2);
  Serial1.print(",");
  Serial1.print(alertaPuertas);
  Serial1.print("|3,");
  Serial1.print(humedadSuelo);
  Serial1.print(",");
  Serial1.print(tempJardin);
  Serial1.print(",");
  Serial1.print(humedadAire);
  Serial1.println();

  Serial.print("ESP32 -> 1,");
  Serial.print(humo);
  Serial.print(",");
  Serial.print(tempServidores);
  Serial.print(",");
  Serial.print(humedadServidores);
  Serial.print(",");
  Serial.print(alerta);
  Serial.print(",");
  Serial.print(fanState);
  Serial.print(" | 2,");
  Serial.print(btn1);
  Serial.print(",");
  Serial.print(btn2);
  Serial.print(",");
  Serial.print(pir);
  Serial.print(",");
  Serial.print(puerta1);
  Serial.print(",");
  Serial.print(puerta2);
  Serial.print(",");
  Serial.print(alertaPuertas);
  Serial.print(" | 3,");
  Serial.print(humedadSuelo);
  Serial.print(",");
  Serial.print(tempJardin);
  Serial.print(",");
  Serial.print(humedadAire);
  Serial.println();

  // ===== 8. LCD 16x2 (solo Servidores y Jardin) =====
  if (millis() - lastCambio > 3000) {
    pantalla++;
    if (pantalla > 1) pantalla = 0;
    lastCambio = millis();
    lcd.clear();
  }

  switch (pantalla) {
    case 0:
      lcd.setCursor(0, 0);
      lcd.print("Sala Servidores");
      lcd.setCursor(0, 1);
      lcd.print(humo); lcd.print(" ");
      lcd.print(tempServidores); lcd.print("C");
      if (fanState > 0) { lcd.print(" F"); lcd.print(fanState); }
      else lcd.print("    ");
      lcd.print(humedadServidores); lcd.print("%");
      if (alerta) {
        lcd.setCursor(13, 1); lcd.print("ALAR");
      } else {
        lcd.setCursor(13, 1); lcd.print("    ");
      }
      if (puertasLocked) { lcd.setCursor(0, 1); lcd.print("L"); }
      break;
    case 1:
      lcd.setCursor(0, 0);
      lcd.print("Jardin");
      lcd.setCursor(0, 1);
      lcd.print("SH:"); lcd.print(humedadSuelo);
      lcd.print(" T:"); lcd.print(tempJardin);
      lcd.print(" H:"); lcd.print(humedadAire);
      break;
  }

  // ===== 7. LCD 16x2 =====
  if (millis() - lastCambio > 3000) {
    pantalla++;
    if (pantalla > 2) pantalla = 0;
    lastCambio = millis();
    lcd.clear();
  }

  switch (pantalla) {
    case 0:
      lcd.setCursor(0, 0);
      lcd.print("Sala Servidores");
      lcd.setCursor(0, 1);
      lcd.print(humo); lcd.print(" ");
      lcd.print(tempServidores); lcd.print("C");
      if (fanState > 0) { lcd.print(" F"); lcd.print(fanState); }
      else lcd.print("    ");
      lcd.print(humedadServidores); lcd.print("%");
      if (alerta) {
        lcd.setCursor(13, 1); lcd.print("ALAR");
      } else {
        lcd.setCursor(13, 1); lcd.print("    ");
      }
      break;
    case 1:
      lcd.setCursor(0, 0);
      lcd.print("Puertas/Acceso");
      lcd.setCursor(0, 1);
      lcd.print(btn1); lcd.print("/"); lcd.print(btn2); lcd.print(" ");
      lcd.print("P"); lcd.print(pir); lcd.print(" ");
      if (alertaPuertas) {
        lcd.print("INTRUSO");
      } else {
        lcd.print(puerta1); lcd.print(puerta2);
        lcd.print("      ");
      }
      break;
    case 2:
      lcd.setCursor(0, 0);
      lcd.print("Jardin");
      lcd.setCursor(0, 1);
      lcd.print("SH:"); lcd.print(humedadSuelo);
      lcd.print(" T:"); lcd.print(tempJardin);
      lcd.print(" H:"); lcd.print(humedadAire);
      break;
  }

  delay(2000);
}
