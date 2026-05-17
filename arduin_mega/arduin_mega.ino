#include <Wire.h>

int buzzerPin = 8;
int humo = 0;
int temperatura = 0;
int alerta = 0;

void setup() {
  Wire.begin();           // Maestro I2C
  Serial1.begin(9600);    // Comunicación con ESP32 (pines 18/19)
  Serial.begin(9600);     // Debug por USB
  pinMode(buzzerPin, OUTPUT);
  
  Serial.println("Mega iniciado");
}

void loop() {
  // 1. SOLICITAR DATOS AL ESCLAVO (dirección 8)
  Wire.requestFrom(8, 20);
  
  String respuesta = "";
  while (Wire.available()) {
    char c = Wire.read();
    if (c >= 32 && c <= 126) {
      respuesta += c;
    }
  }
  
  // 2. PROCESAR DATOS DEL ESCLAVO (formato: "|humo,temperatura")
  if (respuesta.length() > 0) {
    int posComa = respuesta.indexOf(',');
    
    if (posComa > 0) {
      // Extraer valores (saltando el caracter '|')
      humo = respuesta.substring(1, posComa).toInt();
      temperatura = respuesta.substring(posComa + 1).toInt();
      alerta = (humo == 1 || temperatura >= 35) ? 1 : 0;
      
      // Mostrar en monitor serie (debug)
      Serial.print("Recibido del Uno: ");
      Serial.println(respuesta);
      Serial.print("  Humo: ");
      Serial.print(humo);
      Serial.print(" | Temp: ");
      Serial.print(temperatura);
      Serial.print(" | Alerta: ");
      Serial.println(alerta);
      
      // 3. ENVIAR DATOS AL ESP32 (formato: "ID,HUMO,TEMP,ALERTA")
      Serial1.print("1,");
      Serial1.print(humo);
      Serial1.print(",");
      Serial1.print(temperatura);
      Serial1.print(",");
      Serial1.println(alerta);
      
      Serial.print("Enviado al ESP32: 1,");
      Serial.print(humo);
      Serial.print(",");
      Serial.print(temperatura);
      Serial.print(",");
      Serial.println(alerta);
    }
  }
  
  // 4. CONTROL DEL BUZZER (solo si hay alerta)
  if (alerta == 1) {
    digitalWrite(buzzerPin, HIGH);
    delay(200);
    digitalWrite(buzzerPin, LOW);
  } else {
    digitalWrite(buzzerPin, LOW);
  }
  
  delay(2000);
}