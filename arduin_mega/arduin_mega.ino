#include <Wire.h>
#include <LiquidCrystal_I2C.h>

LiquidCrystal_I2C lcd(0x27, 16, 2);

int buzzerPin = 8;

// Datos esclavo 1 - Sala Servidores
int humo = 0;
int tempServidores = 0;
int alerta = 0;

// Datos esclavo 2 - Puertas/Acceso
int btn1 = 0;
int btn2 = 0;
int pir = 0;
int distancia = 0;

// Datos esclavo 3 - Jardin
int humedadSuelo = 0;
int tempJardin = 0;
int humedadAire = 0;

// Control menu LCD
int pantalla = 0;
unsigned long lastCambio = 0;

void setup() {
  Wire.begin();
  Serial1.begin(9600);  // ESP32 (pines 18/19)
  Serial.begin(9600);   // Debug USB

  lcd.init();
  lcd.backlight();

  pinMode(buzzerPin, OUTPUT);

  Serial.println("Mega iniciado - DataCenter v2.0");

  lcd.setCursor(0, 0);
  lcd.print("DataCenter v2.0");
  lcd.setCursor(0, 1);
  lcd.print("Iniciando...");
  delay(2000);
  lcd.clear();
}

void loop() {
  // ===== 1. LEER ESCLAVO 1 (Sala Servidores, addr 8) =====
  Wire.requestFrom(8, 20);
  String resp1 = "";
  while (Wire.available()) {
    char c = Wire.read();
    if (c >= 32 && c <= 126) resp1 += c;
  }

  if (resp1.length() > 0) {
    int coma = resp1.indexOf(',');
    if (coma > 0) {
      humo = resp1.substring(1, coma).toInt();
      tempServidores = resp1.substring(coma + 1).toInt();
      alerta = (humo == 1 || tempServidores >= 35) ? 1 : 0;
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
    if (p1 > 0 && p2 > 0 && p3 > 0) {
      btn1 = resp2.substring(1, p1).toInt();
      btn2 = resp2.substring(p1 + 1, p2).toInt();
      pir = resp2.substring(p2 + 1, p3).toInt();
      distancia = resp2.substring(p3 + 1).toInt();
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

  // ===== 4. ENVIAR AL ESP32 (formato: "ID,...|ID,...|ID,...") =====
  Serial1.print("1,");
  Serial1.print(humo);
  Serial1.print(",");
  Serial1.print(tempServidores);
  Serial1.print(",");
  Serial1.print(alerta);
  Serial1.print("|2,");
  Serial1.print(btn1);
  Serial1.print(",");
  Serial1.print(btn2);
  Serial1.print(",");
  Serial1.print(pir);
  Serial1.print(",");
  Serial1.print(distancia);
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
  Serial.print(alerta);
  Serial.print(" | 2,");
  Serial.print(btn1);
  Serial.print(",");
  Serial.print(btn2);
  Serial.print(",");
  Serial.print(pir);
  Serial.print(",");
  Serial.print(distancia);
  Serial.print(" | 3,");
  Serial.print(humedadSuelo);
  Serial.print(",");
  Serial.print(tempJardin);
  Serial.print(",");
  Serial.println(humedadAire);

  // ===== 5. BUZZER (alarma) =====
  if (alerta == 1) {
    digitalWrite(buzzerPin, HIGH);
    delay(200);
    digitalWrite(buzzerPin, LOW);
  } else {
    digitalWrite(buzzerPin, LOW);
  }

  // ===== 6. LCD 16x2 (cada 3s cambia pantalla) =====
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
      lcd.print("H:");
      lcd.print(humo);
      lcd.print(" T:");
      lcd.print(tempServidores);
      lcd.print("C");
      if (alerta) {
        lcd.setCursor(13, 1);
        lcd.print("ALARMA");
      }
      break;
    case 1:
      lcd.setCursor(0, 0);
      lcd.print("Puertas/Acceso");
      lcd.setCursor(0, 1);
      lcd.print("B:");
      lcd.print(btn1);
      lcd.print("/");
      lcd.print(btn2);
      lcd.print(" P:");
      lcd.print(pir);
      lcd.print(" D:");
      lcd.print(distancia);
      break;
    case 2:
      lcd.setCursor(0, 0);
      lcd.print("Jardin");
      lcd.setCursor(0, 1);
      lcd.print("SH:");
      lcd.print(humedadSuelo);
      lcd.print(" T:");
      lcd.print(tempJardin);
      lcd.print(" H:");
      lcd.print(humedadAire);
      break;
  }

  delay(2000);
}
