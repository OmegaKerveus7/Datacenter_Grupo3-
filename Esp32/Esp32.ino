#include <WiFi.h>
#include <HTTPClient.h>

// Configuración WiFi
const char* ssid = "Omega";
const char* password = "d5adc4a32689";
const char* serverName = "http://192.168.1.49:3000/sensores";

// Pines para comunicación con Mega (TXS0108E)
#define RX2_PIN 16
#define TX2_PIN 17

// Variables para evitar enviar datos repetidos
int ultimoHumo = -1;
int ultimaTemp = -1;

void setup() {
  // IMPORTANTE: Serial para debug (USB) a 115200
  Serial.begin(115200);
  
  // Serial2 para comunicación con Mega a 9600 baudios
  Serial2.begin(9600, SERIAL_8N1, RX2_PIN, TX2_PIN);
  
  Serial.println("ESP32 iniciado");
  Serial.println("Esperando datos del Mega...");
  
  // Conectar WiFi
  WiFi.begin(ssid, password);
  Serial.print("Conectando WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi conectado!");
}

void loop() {
  // Leer datos del Mega (formato: "1,1,25,1" o "1,0,22,0")
  if (Serial2.available()) {
    String datos = Serial2.readStringUntil('\n');
    datos.trim();
    
    if (datos.length() > 0) {
      // Mostrar en monitor serie (debug)
      Serial.print("Recibido: ");
      Serial.println(datos);
      
      // Buscar las comas en el formato "ID,HUMO,TEMP,ALERTA"
      int pos1 = datos.indexOf(',');
      int pos2 = datos.indexOf(',', pos1 + 1);
      int pos3 = datos.indexOf(',', pos2 + 1);
      
      if (pos1 > 0 && pos2 > 0 && pos3 > 0) {
        int id = datos.substring(0, pos1).toInt();
        int humo = datos.substring(pos1 + 1, pos2).toInt();
        int temp = datos.substring(pos2 + 1, pos3).toInt();
        int alerta = datos.substring(pos3 + 1).toInt();
        
        Serial.print("→ Humo: ");
        Serial.print(humo);
        Serial.print(" | Temp: ");
        Serial.print(temp);
        Serial.print(" | Alerta: ");
        Serial.println(alerta);
        
        // Enviar a la BD solo si hay cambio
        if (humo != ultimoHumo || temp != ultimaTemp) {
          if (WiFi.status() == WL_CONNECTED) {
            HTTPClient http;
            http.begin(serverName);
            http.addHeader("Content-Type", "application/json");
            
            String json = "{\"temperatura\":" + String(temp) + ",\"humo\":" + String(humo) + "}";
            
            Serial.print("Enviando a API: ");
            Serial.println(json);
            
            int codigo = http.POST(json);
            
            if (codigo == 200 || codigo == 201) {
              Serial.println(" Guardado en BD");
            } else {
              Serial.print(" Error HTTP: ");
              Serial.println(codigo);
            }
            
            http.end();
          }
          
          ultimoHumo = humo;
          ultimaTemp = temp;
        }
      } else {
        Serial.println("Formato incorrecto");
      }
    }
  }
  
  delay(50);
}